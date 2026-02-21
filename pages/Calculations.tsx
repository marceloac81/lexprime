import React, { useState } from 'react';
import { Calculator, RotateCcw, Printer, Info, Briefcase, Calendar, DollarSign, Percent, Plus } from 'lucide-react';
import { getUfirValue, getDaysDiff360, calculateInterest } from '../utils/calculationUtils';

interface BatchResultItem {
    id: string;
    startDate: string;
    initialValue: number;
    correctedValue: number;
    interestValue: number;
    factor: number;
}

interface CalculationResult {
    initialValue: number;
    correctedValue: number;
    interestRate: number;
    interestValue: number;
    daysDiffCorrection: number;
    daysDiffInterest: number;
    feesRate: number;
    feesValue: number;
    fine523: number;
    fees523: number;
    total: number;
    subtotal: number;
    correctionFactor: number;
    startDate: string;
    endDate: string;
    interestStartDate: string;
    isBatch?: boolean;
    batchDetails?: BatchResultItem[];
}

interface BatchItem {
    id: string;
    startDate: string;
    value: string;
    interestStartDate?: string;
}

const Calculations: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'civic' | 'batch'>('civic');

    // States for Natureza Cível (Original)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [value, setValue] = useState('');
    const [interestType, setInterestType] = useState('0'); // 0: None, 6: 6%, 12: 12%
    const [interestStartDate, setInterestStartDate] = useState('');
    const [fees, setFees] = useState('');
    const [hasFine523, setHasFine523] = useState(false);
    const [hasFees523, setHasFees523] = useState(false);

    // States for Múltiplos Valores (Batch)
    const [batchEndDate, setBatchEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [batchItems, setBatchItems] = useState<BatchItem[]>([
        { id: crypto.randomUUID(), startDate: '', value: '' }
    ]);
    const [batchInterestType, setBatchInterestType] = useState('0');
    const [interestMode, setInterestMode] = useState<'fixed' | 'individual' | 'same-as-start'>('fixed');
    const [batchInterestStartDate, setBatchInterestStartDate] = useState('');
    const [batchFees, setBatchFees] = useState('');
    const [batchHasFine523, setBatchHasFine523] = useState(false);
    const [batchHasFees523, setBatchHasFees523] = useState(false);

    // States for Batch Generator
    const [generatorStart, setGeneratorStart] = useState(''); // YYYY-MM
    const [generatorEnd, setGeneratorEnd] = useState('');   // YYYY-MM
    const [generatorValue, setGeneratorValue] = useState('');

    const [result, setResult] = useState<CalculationResult | null>(null);

    // Helper functions
    const parseDateSafe = (str: string) => {
        if (!str) return new Date();
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const handleCalculateCivic = () => {
        if (!startDate || !endDate || !value) {
            alert('Favor preencher os campos obrigatórios (*)');
            return;
        }

        const start = parseDateSafe(startDate);
        const end = parseDateSafe(endDate);
        const val = parseFloat(value.replace(',', '.'));

        const ufirStart = getUfirValue(start);
        const ufirEnd = getUfirValue(end);

        if (!ufirStart || !ufirEnd) {
            alert('UFIR não encontrada para o período selecionado (Tabela disponível de 1995 a 2026)');
            return;
        }

        const factor = ufirEnd / ufirStart;
        const corrected = val * factor;
        const daysCorrection = getDaysDiff360(start, end);

        const intRate = parseFloat(interestType);
        let intVal = 0;
        let daysInterest = 0;

        if (intRate > 0 && interestStartDate) {
            const intStart = parseDateSafe(interestStartDate);
            daysInterest = getDaysDiff360(intStart, end);
            intVal = calculateInterest(corrected, intRate, daysInterest);
        }

        const feesRate = fees ? parseFloat(fees.replace(',', '.')) : 0;
        const correctedPlusInterest = corrected + intVal;
        const feesVal = correctedPlusInterest * (feesRate / 100);
        const subtotal = correctedPlusInterest + feesVal;

        const fineValue = hasFine523 ? subtotal * 0.1 : 0;
        const fees523Value = hasFees523 ? subtotal * 0.1 : 0;
        const total = subtotal + fineValue + fees523Value;

        setResult({
            initialValue: val,
            correctedValue: corrected,
            interestRate: intRate,
            interestValue: intVal,
            daysDiffCorrection: daysCorrection,
            daysDiffInterest: daysInterest,
            feesRate,
            feesValue: feesVal,
            fine523: fineValue,
            fees523: fees523Value,
            subtotal,
            total,
            correctionFactor: factor,
            startDate,
            endDate,
            interestStartDate,
            isBatch: false
        });
    };

    const handleGenerateRows = () => {
        if (!generatorStart || !generatorEnd || !generatorValue) {
            alert('Preencha os campos do gerador (Mês Inicial, Final e Valor).');
            return;
        }

        const [startYear, startMonth] = generatorStart.split('-').map(Number);
        const [endYear, endMonth] = generatorEnd.split('-').map(Number);

        let currentMonth = startMonth;
        let currentYear = startYear;
        const newItems: BatchItem[] = [];

        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            newItems.push({
                id: crypto.randomUUID(),
                startDate: dateStr,
                value: generatorValue,
                interestStartDate: interestMode === 'same-as-start' ? dateStr : undefined
            });

            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }

        setBatchItems(newItems);
    };

    const handleCalculateBatch = () => {
        const validItems = batchItems.filter(item => item.startDate && item.value);
        if (validItems.length === 0) {
            alert('Adicione ao menos um valor com data inicial.');
            return;
        }

        const end = parseDateSafe(batchEndDate);
        const ufirEnd = getUfirValue(end);

        if (!ufirEnd) {
            alert('UFIR não encontrada para a data final selecionada.');
            return;
        }

        const intRate = parseFloat(batchInterestType);
        let totalInitial = 0;
        let totalCorrected = 0;
        let totalInterest = 0;
        let batchDetails: BatchResultItem[] = [];

        for (const item of validItems) {
            const start = parseDateSafe(item.startDate);
            const val = parseFloat(item.value.replace(',', '.'));
            const ufirStart = getUfirValue(start);

            if (!ufirStart) continue;

            const factor = ufirEnd / ufirStart;
            const corrected = val * factor;

            let intVal = 0;
            if (intRate > 0) {
                let currentIntStartStr = '';
                if (interestMode === 'fixed') {
                    currentIntStartStr = batchInterestStartDate;
                } else if (interestMode === 'same-as-start') {
                    currentIntStartStr = item.startDate;
                } else if (interestMode === 'individual') {
                    currentIntStartStr = item.interestStartDate || '';
                }

                if (currentIntStartStr) {
                    const intStart = parseDateSafe(currentIntStartStr);
                    const daysInt = getDaysDiff360(intStart, end);
                    intVal = calculateInterest(corrected, intRate, daysInt);
                }
            }

            totalInitial += val;
            totalCorrected += corrected;
            totalInterest += intVal;

            batchDetails.push({
                id: item.id,
                startDate: item.startDate,
                initialValue: val,
                correctedValue: corrected,
                interestValue: intVal,
                factor: factor
            });
        }

        const feesRate = batchFees ? parseFloat(batchFees.replace(',', '.')) : 0;
        const correctedPlusInterest = totalCorrected + totalInterest;
        const feesVal = correctedPlusInterest * (feesRate / 100);
        const subtotal = correctedPlusInterest + feesVal;
        const fineValue = batchHasFine523 ? subtotal * 0.1 : 0;
        const fees523Value = batchHasFees523 ? subtotal * 0.1 : 0;
        const total = subtotal + fineValue + fees523Value;

        setResult({
            initialValue: totalInitial,
            correctedValue: totalCorrected,
            interestRate: intRate,
            interestValue: totalInterest,
            daysDiffCorrection: 0,
            daysDiffInterest: (interestMode === 'fixed' && batchInterestStartDate) ? getDaysDiff360(parseDateSafe(batchInterestStartDate), end) : 0,
            feesRate,
            feesValue: feesVal,
            fine523: fineValue,
            fees523: fees523Value,
            subtotal,
            total,
            correctionFactor: 1, // Not used in batch
            startDate: '', // Not used in batch
            endDate: batchEndDate,
            interestStartDate: interestMode === 'fixed' ? batchInterestStartDate : 'Variável',
            isBatch: true,
            batchDetails
        });
    };

    const handleClear = () => {
        if (activeTab === 'civic') {
            setStartDate('');
            setEndDate(new Date().toISOString().split('T')[0]);
            setValue('');
            setInterestType('0');
            setInterestStartDate('');
            setFees('');
            setHasFine523(false);
            setHasFees523(false);
        } else {
            setBatchEndDate(new Date().toISOString().split('T')[0]);
            setBatchItems([{ id: crypto.randomUUID(), startDate: '', value: '' }]);
            setBatchInterestType('0');
            setBatchInterestStartDate('');
            setBatchFees('');
            setBatchHasFine523(false);
            setBatchHasFees523(false);
        }
        setResult(null);
    };

    return (
        <div className="animate-fade-in pb-20 relative">
            {/* Header - Sticky */}
            <div className="sticky top-0 z-50 bg-slate-50 dark:bg-dark-950 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cálculos</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Cálculo de débitos judiciais de natureza cível (TJRJ).
                        </p>
                    </div>

                    {/* Modern Segmented Control */}
                    <div className="flex-1 flex justify-center">
                        <div className="relative bg-slate-100 dark:bg-dark-800 p-1 rounded-xl flex items-center w-full max-w-[400px] border border-slate-200 dark:border-slate-700 shadow-sm">
                            {/* Animated Background Pill */}
                            <div
                                className="absolute h-[calc(100%-8px)] rounded-lg bg-blue-600 shadow-md transition-all duration-300 ease-out"
                                style={{
                                    width: 'calc(50% - 4px)',
                                    left: activeTab === 'civic' ? '4px' : 'calc(50%)'
                                }}
                            />

                            <button
                                onClick={() => { setActiveTab('civic'); setResult(null); }}
                                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-300 ${activeTab === 'civic' ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Natureza Cível
                            </button>
                            <button
                                onClick={() => { setActiveTab('batch'); setResult(null); }}
                                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-300 ${activeTab === 'batch' ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Múltiplos Valores
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {result && (
                            <button
                                onClick={() => window.print()}
                                className="bg-white dark:bg-dark-700 hover:bg-slate-50 dark:hover:bg-dark-600 text-slate-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all border border-slate-200 dark:border-slate-600 shadow-sm active:scale-95"
                            >
                                <Printer size={18} /> Imprimir
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 md:px-8 pt-6">

                <div className="max-w-4xl mx-auto w-full px-0">

                    {/* Form Container */}
                    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                        {activeTab === 'civic' ? (
                            <>
                                <h2 className="text-center text-xl font-bold text-slate-800 dark:text-white mb-8">Cálculo de Natureza Cível</h2>
                                <div className="space-y-4 max-w-lg mx-auto print:hidden">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right">Data Inicial*:</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="col-span-2 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right">Data Final:</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="col-span-2 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right">Valor em R$:</label>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            className="col-span-2 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right">Tipo de Juros:</label>
                                        <select
                                            value={interestType}
                                            onChange={(e) => setInterestType(e.target.value)}
                                            className="col-span-2 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            <option value="0">Sem juros (somente correção monetária)</option>
                                            <option value="6">Juros Simples 6% a.a</option>
                                            <option value="12">Juros Simples 12% a.a</option>
                                        </select>
                                    </div>

                                    {interestType !== '0' && (
                                        <div className="grid grid-cols-3 items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right">Data de Incidência:</label>
                                            <input
                                                type="date"
                                                value={interestStartDate}
                                                onChange={(e) => setInterestStartDate(e.target.value)}
                                                className="col-span-2 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right">Honorários (%):</label>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={fees}
                                            onChange={(e) => setFees(e.target.value)}
                                            className="col-span-2 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 text-right truncate">Art. 523 § 1º CPC:</label>
                                        <div className="col-span-2 flex gap-4">
                                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                                <input type="checkbox" checked={hasFine523} onChange={(e) => setHasFine523(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 text-primary-500" />
                                                10% Multa
                                            </label>
                                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                                <input type="checkbox" checked={hasFees523} onChange={(e) => setHasFees523(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 text-primary-500" />
                                                10% Honorários
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-6 justify-center">
                                        <button onClick={handleCalculateCivic} className="bg-[#2d3a4f] hover:bg-[#3d4c63] text-white px-8 py-2.5 rounded shadow-lg hover:shadow-[#2d3a4f]/20 transition-all flex items-center gap-2 font-bold active:scale-95">
                                            <Calculator size={18} /> CALCULAR
                                        </button>
                                        <button onClick={handleClear} className="bg-white dark:bg-dark-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700 px-8 py-2.5 rounded transition-all flex items-center gap-2 active:scale-95">
                                            <RotateCcw size={18} /> LIMPAR
                                        </button>
                                        {result && !result.isBatch && (
                                            <button onClick={() => window.print()} className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-2.5 rounded shadow-lg transition-all flex items-center gap-2 font-bold">
                                                <Printer size={18} /> IMPRIMIR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-center text-xl font-bold text-slate-800 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">Cálculo em Lote / Múltiplos Valores</h2>

                                <div className="space-y-6 animate-fade-in">
                                    {/* Batch Generator Tool */}
                                    {/* Modern Batch Generator Tool */}
                                    <div className="bg-slate-50 dark:bg-dark-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group/gen no-print">
                                        <div className="absolute top-0 right-0 p-8 bg-primary-500/5 rounded-full -mr-4 -mt-4 blur-2xl group-hover/gen:bg-primary-500/10 transition-colors" />

                                        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                                            <div className="p-1.5 bg-primary-600 text-white rounded-lg shadow-md shadow-primary-500/20">
                                                <Plus size={14} />
                                            </div>
                                            Gerador de Parcelas em Lote
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end relative z-10">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Calendar size={12} /> Mês/Ano Inicial
                                                </label>
                                                <div className="relative">
                                                    <input type="month" value={generatorStart} onChange={(e) => setGeneratorStart(e.target.value)} className="w-full p-2.5 pl-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Calendar size={12} /> Mês/Ano Final
                                                </label>
                                                <div className="relative">
                                                    <input type="month" value={generatorEnd} onChange={(e) => setGeneratorEnd(e.target.value)} className="w-full p-2.5 pl-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <DollarSign size={12} /> Valor Base (R$)
                                                </label>
                                                <div className="relative">
                                                    <input type="text" placeholder="0,00" value={generatorValue} onChange={(e) => setGeneratorValue(e.target.value)} className="w-full p-2.5 pl-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium" />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleGenerateRows}
                                                className="bg-primary-600 hover:bg-primary-700 text-white h-[42px] px-4 text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw size={14} className="group-hover/gen:rotate-180 transition-transform duration-500" />
                                                GERAR PARCELAS
                                            </button>
                                        </div>
                                    </div>

                                    {/* General Settings Grid - Optimized for Vertical Density */}
                                    <div className="p-5 bg-slate-50/50 dark:bg-dark-900/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-primary-500" /> Data Final de Atualização
                                                </label>
                                                <input
                                                    type="date"
                                                    value={batchEndDate}
                                                    onChange={(e) => setBatchEndDate(e.target.value)}
                                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Percent size={12} className="text-primary-500" /> Honorários (%)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="0,00"
                                                    value={batchFees}
                                                    onChange={(e) => setBatchFees(e.target.value)}
                                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Percent size={12} className="text-primary-500" /> Tipo de Juros
                                                </label>
                                                <select
                                                    value={batchInterestType}
                                                    onChange={(e) => setBatchInterestType(e.target.value)}
                                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                                >
                                                    <option value="0">Sem juros</option>
                                                    <option value="6">Juros Simples 6% a.a</option>
                                                    <option value="12">Juros Simples 12% a.a</option>
                                                </select>
                                            </div>

                                            {/* Penalties & Interest Mode - Spans 3 columns or stacks */}
                                            <div className={`col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-1`}>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Penalidades (Art. 523 § 1º CPC)</label>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer group">
                                                            <input type="checkbox" checked={batchHasFine523} onChange={(e) => setBatchHasFine523(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all" />
                                                            <span className="group-hover:text-primary-600 transition-colors">10% Multa</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer group">
                                                            <input type="checkbox" checked={batchHasFees523} onChange={(e) => setBatchHasFees523(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all" />
                                                            <span className="group-hover:text-primary-600 transition-colors">10% Honorários</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {batchInterestType !== '0' && (
                                                    <div className="space-y-3 animate-fade-in">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Modo de Incidência de Juros</label>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer group">
                                                                <input type="radio" name="intMode" checked={interestMode === 'fixed'} onChange={() => setInterestMode('fixed')} className="text-primary-600" />
                                                                <span className="group-hover:text-slate-900 dark:group-hover:text-white">Fixa</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer group">
                                                                <input type="radio" name="intMode" checked={interestMode === 'individual'} onChange={() => setInterestMode('individual')} className="text-primary-600" />
                                                                <span className="group-hover:text-slate-900 dark:group-hover:text-white">Individual</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer group">
                                                                <input type="radio" name="intMode" checked={interestMode === 'same-as-start'} onChange={() => setInterestMode('same-as-start')} className="text-primary-600" />
                                                                <span className="group-hover:text-slate-900 dark:group-hover:text-white">Pela Parcela</span>
                                                            </label>
                                                        </div>
                                                        {interestMode === 'fixed' && (
                                                            <input
                                                                type="date"
                                                                value={batchInterestStartDate}
                                                                onChange={(e) => setBatchInterestStartDate(e.target.value)}
                                                                className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 outline-none animate-in fade-in slide-in-from-top-1"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compact Items Table */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-dark-950">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-dark-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                                    <th className="p-2 pl-4">#</th>
                                                    <th className="p-2">Data Inicial*</th>
                                                    <th className="p-2">Valor Principal*</th>
                                                    {batchInterestType !== '0' && interestMode === 'individual' && (
                                                        <th className="p-2">Data Juros</th>
                                                    )}
                                                    <th className="p-2 pr-4 text-right">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {batchItems.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-900/30 transition-colors">
                                                        <td className="p-2 pl-4 text-xs font-medium text-slate-400">{index + 1}</td>
                                                        <td className="p-2">
                                                            <input
                                                                type="date"
                                                                value={item.startDate}
                                                                onChange={(e) => {
                                                                    const newItems = [...batchItems];
                                                                    newItems[index].startDate = e.target.value;
                                                                    if (interestMode === 'same-as-start') {
                                                                        newItems[index].interestStartDate = e.target.value;
                                                                    }
                                                                    setBatchItems(newItems);
                                                                }}
                                                                className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-transparent focus:ring-1 focus:ring-primary-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                placeholder="0,00"
                                                                value={item.value}
                                                                onChange={(e) => {
                                                                    const newItems = [...batchItems];
                                                                    newItems[index].value = e.target.value;
                                                                    setBatchItems(newItems);
                                                                }}
                                                                className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-transparent focus:ring-1 focus:ring-primary-500 outline-none"
                                                            />
                                                        </td>
                                                        {batchInterestType !== '0' && interestMode === 'individual' && (
                                                            <td className="p-2">
                                                                <input
                                                                    type="date"
                                                                    value={item.interestStartDate || ''}
                                                                    onChange={(e) => {
                                                                        const newItems = [...batchItems];
                                                                        newItems[index].interestStartDate = e.target.value;
                                                                        setBatchItems(newItems);
                                                                    }}
                                                                    className="w-full p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-transparent focus:ring-1 focus:ring-primary-500 outline-none"
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="p-2 pr-4 text-right">
                                                            <button
                                                                onClick={() => setBatchItems(batchItems.filter(i => i.id !== item.id))}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                disabled={batchItems.length === 1}
                                                            >
                                                                <RotateCcw size={14} className="rotate-45" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="p-4 bg-slate-50/50 dark:bg-dark-900/50 flex justify-between items-center no-print border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{batchItems.length} parcelas listadas</span>
                                            </div>
                                            <button
                                                onClick={() => setBatchItems([...batchItems, { id: crypto.randomUUID(), startDate: '', value: '' }])}
                                                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-2 transition-all hover:gap-3 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-95"
                                            >
                                                <Plus size={16} /> ADICIONAR NOVA LINHA
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-8 justify-center no-print">
                                        <button onClick={handleCalculateBatch} className="bg-[#2d3a4f] hover:bg-[#324158] text-white px-10 py-3.5 rounded-xl shadow-xl shadow-[#2d3a4f]/20 hover:shadow-[#2d3a4f]/40 transition-all flex items-center gap-3 font-bold active:scale-95">
                                            <Calculator size={18} /> CALCULAR TUDO
                                        </button>
                                        <button onClick={handleClear} className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700 px-10 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold active:scale-95 border-b-4 border-b-slate-100 dark:border-b-dark-900 active:border-b-0">
                                            <RotateCcw size={18} /> LIMPAR
                                        </button>
                                        {result && result.isBatch && (
                                            <button onClick={() => window.print()} className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-3.5 rounded-xl shadow-xl shadow-primary-500/20 transition-all flex items-center gap-3 font-bold active:scale-95">
                                                <Printer size={18} /> IMPRIMIR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mt-10 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-700 pt-4 print:hidden">
                            <p>* Campos de preenchimento obrigatório</p>
                            <p>O cálculo acima não possui valor legal. Trata-se apenas de uma ferramenta de auxílio na elaboração de contas.</p>
                            <p>Datas devem ser informadas no formato dd/mm/aaaa.</p>
                            <p>Os Cálculos são realizados considerando o ano comercial (360 dias) e juros simples, quando aplicados.</p>
                            <p>Os honorários serão calculados sobre o valor corrigido somado aos juros.</p>
                        </div>

                        {/* Results Display */}
                        {result && (
                            <div className="mt-12 overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg animate-in fade-in duration-500 shadow-xl no-print-break">
                                <div className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-slate-700 p-6">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Briefcase className="text-primary-500" size={20} /> Memória de Cálculo
                                    </h3>
                                </div>

                                <div className="p-0 bg-white dark:bg-dark-950 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {!result.isBatch ? (
                                                <>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Valor a ser atualizado:</td>
                                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.initialValue)}</td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Período de atualização monetária:</td>
                                                        <td className="p-4 text-right text-slate-700 dark:text-slate-300">
                                                            de {formatDate(result.startDate)} até {formatDate(result.endDate)} ({result.daysDiffCorrection} dias)
                                                        </td>
                                                    </tr>
                                                    {result.interestRate > 0 && (
                                                        <>
                                                            <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                                <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Tipo de juros:</td>
                                                                <td className="p-4 text-right text-slate-700 dark:text-slate-300">Juros Simples (360 dias no ano)</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                                <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Taxa de juros:</td>
                                                                <td className="p-4 text-right text-slate-700 dark:text-slate-300">{result.interestRate}% a.a</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                                <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Período dos juros:</td>
                                                                <td className="p-4 text-right text-slate-700 dark:text-slate-300">
                                                                    de {formatDate(result.interestStartDate)} até {formatDate(result.endDate)} ({result.daysDiffInterest} dias)
                                                                </td>
                                                            </tr>
                                                        </>
                                                    )}
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Honorários (%):</td>
                                                        <td className="p-4 text-right text-slate-700 dark:text-slate-300">{result.feesRate.toFixed(2)}%</td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">UFIR Data Inicial:</td>
                                                        <td className="p-4 text-right text-slate-700 dark:text-slate-300">
                                                            {getUfirValue(new Date(result.startDate + 'T12:00:00'))?.toFixed(4)}
                                                        </td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">UFIR Data Final (Ano {new Date(result.endDate + 'T12:00:00').getFullYear()}):</td>
                                                        <td className="p-4 text-right text-slate-700 dark:text-slate-300">
                                                            {getUfirValue(new Date(result.endDate + 'T12:00:00'))?.toFixed(4)}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-dark-900/50">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Índice de correção monetária:</td>
                                                        <td className="p-4 text-right font-mono font-medium text-slate-900 dark:text-white">{result.correctionFactor.toFixed(6)}</td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Valor Principal Corrigido:</td>
                                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.correctedValue)}</td>
                                                    </tr>
                                                    {result.interestRate > 0 && (
                                                        <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                            <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Valor dos juros:</td>
                                                            <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.interestValue)}</td>
                                                        </tr>
                                                    )}
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Valor corrigido + juros:</td>
                                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.correctedValue + result.interestValue)}</td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Total de honorários:</td>
                                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.feesValue)}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr className="bg-slate-50/50 dark:bg-dark-900/50">
                                                    <td colSpan={2} className="p-0">
                                                        <table className="w-full text-xs border-b border-slate-100 dark:border-slate-800">
                                                            <thead className="bg-slate-100/50 dark:bg-dark-800/50 text-slate-500 dark:text-slate-400">
                                                                <tr>
                                                                    <th className="p-3 text-left font-bold uppercase tracking-wider">Data Inicial</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Valor Principal</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Fator</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Corrigido</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Juros</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                                {result.batchDetails?.map((item) => (
                                                                    <tr key={item.id} className="hover:bg-white dark:hover:bg-dark-900">
                                                                        <td className="p-3 text-slate-700 dark:text-slate-300">{formatDate(item.startDate)}</td>
                                                                        <td className="p-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(item.initialValue)}</td>
                                                                        <td className="p-3 text-right text-slate-500 font-mono">{item.factor.toFixed(6)}</td>
                                                                        <td className="p-3 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(item.correctedValue)}</td>
                                                                        <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-medium">+{formatCurrency(item.interestValue)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="bg-slate-50 dark:bg-dark-900">
                                                                <tr>
                                                                    <td className="p-3 font-bold text-slate-900 dark:text-white">TOTAIS:</td>
                                                                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.initialValue)}</td>
                                                                    <td></td>
                                                                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.correctedValue)}</td>
                                                                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.interestValue)}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}

                                            <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Taxa de juros:</td>
                                                <td className="p-4 text-right text-slate-700 dark:text-slate-300">{result.interestRate > 0 ? `${result.interestRate}% a.a` : 'Sem juros'}</td>
                                            </tr>

                                            {result.isBatch && result.interestRate > 0 && (
                                                <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">Incidência dos juros:</td>
                                                    <td className="p-4 text-right text-slate-700 dark:text-slate-300">
                                                        desde {formatDate(result.interestStartDate)} ({result.daysDiffInterest} dias)
                                                    </td>
                                                </tr>
                                            )}

                                            {result.isBatch && (
                                                <>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Honorários (%):</td>
                                                        <td className="p-4 text-right text-slate-700 dark:text-slate-300">{result.feesRate.toFixed(2)}%</td>
                                                    </tr>

                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Atualizado até:</td>
                                                        <td className="p-4 text-right text-slate-700 dark:text-slate-300">{formatDate(result.endDate)}</td>
                                                    </tr>
                                                </>
                                            )}

                                            <tr className="bg-slate-50 dark:bg-dark-900 border-t border-slate-200 dark:border-slate-700">
                                                <td className="p-4 text-slate-900 dark:text-white font-bold uppercase">Subtotal:</td>
                                                <td className="p-4 text-right font-bold text-lg text-primary-600 dark:text-primary-400">{formatCurrency(result.subtotal)}</td>
                                            </tr>

                                            {(result.fine523 > 0 || result.fees523 > 0) && (
                                                <>
                                                    <tr className="bg-slate-50 dark:bg-dark-900 font-medium">
                                                        <td colSpan={2} className="p-4 text-slate-800 dark:text-white uppercase tracking-wider text-xs">Art. 523 § 1º CPC</td>
                                                    </tr>
                                                    {result.fine523 > 0 && (
                                                        <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                            <td className="p-4 text-slate-600 dark:text-slate-400 pl-8 font-medium">Multa - 10%:</td>
                                                            <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.fine523)}</td>
                                                        </tr>
                                                    )}
                                                    {result.fees523 > 0 && (
                                                        <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                            <td className="p-4 text-slate-600 dark:text-slate-400 pl-8 font-medium">Honorários - 10%:</td>
                                                            <td className="p-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(result.fees523)}</td>
                                                        </tr>
                                                    )}
                                                </>
                                            )}
                                            <tr className="bg-primary-50 dark:bg-primary-900/20 border-t-2 border-primary-500">
                                                <td className="p-6 text-primary-900 dark:text-primary-400 font-black text-lg uppercase">Total Geral:</td>
                                                <td className="p-6 text-right font-black text-2xl text-primary-600 dark:text-primary-400">{formatCurrency(result.total)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
        @media print {
          .flex-col { background: white !important; }
          .max-w-4xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
          .bg-white { box-shadow: none !important; border: none !important; }
          .print\\\\:hidden { display: none !important; }
          nav, aside, button { display: none !important; }
          .h-full { height: auto !important; overflow: visible !important; }
          .mt-6 { margin-top: 0 !important; }
          .p-8 { padding: 0 !important; }
          .text-slate-500 { color: black !important; }
          .bg-slate-50 { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .animate-in { animation: none !important; }
          .rounded-xl { border-radius: 0 !important; }
          .no-print-break { break-inside: avoid; }
        }
      `}</style>
            </div>
        </div>
    );
};

export default Calculations;

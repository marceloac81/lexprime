import React, { useState } from 'react';
import { Calculator, RotateCcw, Printer, Info, Briefcase, Calendar, DollarSign, Percent, Plus } from 'lucide-react';
import { useStore } from '../context/Store';
import { getUfirValue, getDaysDiff360, calculateInterest } from '../utils/calculationUtils';

interface BatchResultItem {
    id: string;
    startDate: string;
    description?: string;
    type: 'principal' | 'cost';
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
    principalSubtotal?: number;
    costsSubtotal?: number;
}

interface BatchItem {
    id: string;
    startDate: string;
    description?: string;
    type: 'principal' | 'cost';
    value: string;
    interestStartDate?: string;
}

const Calculations: React.FC = () => {
    const { theme } = useStore();
    const [activeTab, setActiveTab] = useState<'civic' | 'batch'>('civic');
    
    const isHybrid = theme === 'hybrid';
    const isSober = theme === 'sober';
    const classes = {
        container: `animate-fade-in pb-20 relative min-h-full ${isHybrid ? 'bg-[#222e35]' : ''}`,
        header: `sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${isHybrid ? 'bg-[#202c33] border-[#354751] shadow-none' : (isSober ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800')}`,
        pageTitle: `text-2xl md:text-3xl font-bold tracking-tight ${isHybrid ? 'text-[#e9edef]' : (isSober ? 'text-slate-900' : 'text-slate-900 dark:text-white')}`,
        pageSubtitle: `text-sm mt-1 ${isHybrid ? 'text-[#aebac1]' : (isSober ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400')}`,
        
        mainPanel: `rounded-xl shadow-lg border p-8 ${isHybrid ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`,
        genPanel: `p-5 rounded-2xl border relative overflow-hidden group/gen no-print ${isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-slate-50 dark:bg-dark-900/40 border-slate-200 dark:border-slate-700'}`,
        settingsPanel: `p-5 rounded-xl border ${isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-slate-50/50 dark:bg-dark-900/30 border-slate-100 dark:border-slate-700/50'}`,
        resultPanel: `rounded-xl p-8 mb-8 border relative overflow-hidden shadow-lg ${isHybrid ? 'bg-[#202c33] border-[#354751] shadow-[#202c33]/50' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 shadow-slate-200/50'}`,
        batchResultPanel: `p-8 rounded-xl border relative shadow-lg ${isHybrid ? 'bg-[#202c33] border-[#354751] shadow-[#202c33]/50' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`,
        
        textPrimary: isHybrid ? 'text-[#e9edef]' : 'text-slate-800 dark:text-white',
        textSecondary: isHybrid ? 'text-[#aebac1]' : 'text-slate-600 dark:text-slate-400',
        textMuted: isHybrid ? 'text-[#8696a0]' : 'text-slate-400',
        
        inputBasic: `col-span-2 p-2 border rounded outline-none w-full ${isHybrid ? 'bg-[#202c33] border-[#354751] text-[#e9edef] focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884]' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500'}`,
        inputModern: `w-full p-2.5 pl-3 text-sm border rounded-xl outline-none transition-all ${isHybrid ? 'bg-[#202c33] border-[#354751] text-[#e9edef] focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884] placeholder:text-[#aebac1]/50' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`,
        inputSelect: `w-full p-2.5 border rounded-lg outline-none transition-all ${isHybrid ? 'bg-[#202c33] border-[#354751] text-[#e9edef] focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884]' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`,
        
        btnCalc: `px-8 py-2.5 rounded shadow-lg transition-all flex items-center gap-2 font-bold active:scale-95 ${isHybrid ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20' : 'bg-[#2d3a4f] hover:bg-[#3d4c63] text-white hover:shadow-[#2d3a4f]/20'}`,
        btnClear: `px-8 py-2.5 rounded transition-all flex items-center gap-2 active:scale-95 border ${isHybrid ? 'bg-[#202c33] text-[#e9edef] border-[#354751] hover:bg-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700'}`,
        btnPrint: `px-8 py-2.5 rounded shadow-lg transition-all flex items-center gap-2 font-bold ${isHybrid ? 'bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-[#354751]' : 'bg-primary-500 hover:bg-primary-600 text-white'}`,
        btnGen: `h-[42px] px-4 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isHybrid ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'}`,
        btnAddRow: `py-3 px-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-dashed hover:border-solid ${isHybrid ? 'bg-[#202c33] text-[#00a884] border-[#00a884] hover:bg-[#00a884] hover:text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white'}`,
        
        tabContainer: `relative p-1 rounded-xl flex items-center w-full max-w-[400px] border shadow-sm ${isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-slate-100 dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`,
        tabPill: `absolute h-[calc(100%-8px)] rounded-lg shadow-md transition-all duration-300 ease-out ${isHybrid ? 'bg-[#00a884]' : 'bg-blue-600'}`,
        tabTextActive: `relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-300 text-white`,
        tabTextInactive: `relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-300 ${isHybrid ? 'text-[#aebac1] hover:text-[#e9edef]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`,
        
        tableWrapper: `rounded-xl overflow-hidden border shadow-sm ${isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`,
        tableHeaderRow: `border-b ${isHybrid ? 'bg-[#202c33]/50 border-[#354751]' : 'bg-slate-50 dark:bg-dark-900/50 border-slate-200 dark:border-slate-700'}`,
        tableCell: `p-3 text-sm border-b transition-all ${isHybrid ? 'border-[#354751] text-[#aebac1]' : 'border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300'}`,
        tableHeaderCell: `p-3 text-xs font-semibold uppercase tracking-wider ${isHybrid ? 'text-[#aebac1] bg-[#2a3942]' : 'text-slate-500 bg-slate-50 dark:bg-dark-900'}`,
        tableRowHover: `transition-all ${isHybrid ? 'hover:bg-[#354751]' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`,
    };


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
        { id: crypto.randomUUID(), startDate: '', value: '', type: 'principal' }
    ]);
    const [batchInterestType, setBatchInterestType] = useState('0');
    const [interestMode, setInterestMode] = useState<'fixed' | 'individual' | 'same-as-start'>('fixed');
    const [batchInterestStartDate, setBatchInterestStartDate] = useState('');
    const [batchFees, setBatchFees] = useState('');
    const [batchHasFine523, setBatchHasFine523] = useState(false);
    const [batchHasFees523, setBatchHasFees523] = useState(false);
    const [batchIgnoreCostInterest, setBatchIgnoreCostInterest] = useState(true);


    // States for Batch Generator
    const [generatorStart, setGeneratorStart] = useState(''); // YYYY-MM-DD
    const [generatorEnd, setGeneratorEnd] = useState('');   // YYYY-MM-DD
    const [generatorValue, setGeneratorValue] = useState('');
    const [generatorDescription, setGeneratorDescription] = useState('');
    const [generatorType, setGeneratorType] = useState<'principal' | 'cost'>('principal');

    // States for table sorting
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
            alert('Preencha os campos do gerador (Data Inicial, Final e Valor).');
            return;
        }

        const start = parseDateSafe(generatorStart);
        const end = parseDateSafe(generatorEnd);
        const day = start.getDate();

        let current = new Date(start);
        const newItems: BatchItem[] = [];

        while (current <= end) {
            const y = current.getFullYear();
            const m = current.getMonth() + 1;
            const d = current.getDate();
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            newItems.push({
                id: crypto.randomUUID(),
                startDate: dateStr,
                description: generatorDescription,
                type: generatorType,
                value: generatorValue,
                interestStartDate: interestMode === 'same-as-start' ? dateStr : undefined
            });

            // Avana para o próximo mês mantendo o dia
            const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
            const daysInNextMonth = new Date(current.getFullYear(), current.getMonth() + 2, 0).getDate();
            const actualDay = Math.min(day, daysInNextMonth);
            current = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), actualDay);
        }

        // Smart append: if there is only one empty row, replace it; otherwise append
        setBatchItems(prev => {
            const isOnlyEmptyRow = prev.length === 1 && !prev[0].startDate && !prev[0].value;
            return isOnlyEmptyRow ? newItems : [...prev, ...newItems];
        });
    };

    const handleExport = () => {
        const data = {
            batchEndDate,
            batchItems,
            batchInterestType,
            interestMode,
            batchInterestStartDate,
            batchFees,
            batchHasFine523,
            batchHasFees523
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculo_lexprime_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event: any) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.batchEndDate) setBatchEndDate(data.batchEndDate);
                    if (data.batchItems) setBatchItems(data.batchItems);
                    if (data.batchInterestType) setBatchInterestType(data.batchInterestType);
                    if (data.interestMode) setInterestMode(data.interestMode);
                    if (data.batchInterestStartDate) setBatchInterestStartDate(data.batchInterestStartDate);
                    if (data.batchFees) setBatchFees(data.batchFees);
                    if (data.batchHasFine523 !== undefined) setBatchHasFine523(data.batchHasFine523);
                    if (data.batchHasFees523 !== undefined) setBatchHasFees523(data.batchHasFees523);
                    setResult(null);
                } catch (err) {
                    alert('Erro ao importar arquivo: Formato inválido.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
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
        let principalSubtotal = 0;
        let costsSubtotal = 0;
        let batchDetails: BatchResultItem[] = [];

        for (const item of validItems) {
            const start = parseDateSafe(item.startDate);
            const val = parseFloat(item.value.replace(',', '.'));
            const ufirStart = getUfirValue(start);

            if (!ufirStart) continue;

            const factor = ufirEnd / ufirStart;
            const corrected = val * factor;

            let intVal = 0;
            const applyInterest = item.type === 'principal' || !batchIgnoreCostInterest;

            if (intRate > 0 && applyInterest) {
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

            if (item.type === 'principal') {
                principalSubtotal += (corrected + intVal);
            } else {
                costsSubtotal += (corrected + intVal);
            }

            batchDetails.push({
                id: item.id,
                startDate: item.startDate,
                description: item.description,
                type: item.type,
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
            batchDetails,
            principalSubtotal,
            costsSubtotal
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
            setBatchItems([{ id: crypto.randomUUID(), startDate: '', value: '', type: 'principal' }]);
            setBatchInterestType('0');
            setBatchInterestStartDate('');
            setBatchFees('');
            setBatchHasFine523(false);
            setBatchHasFees523(false);
        }
        setResult(null);
    };

    return (
        <div className={classes.container}>
            {/* Header - Sticky */}
            <div className={classes.header}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={classes.pageTitle}>Cálculos</h1>
                        <p className={classes.pageSubtitle}>
                            Cálculo de débitos judiciais de natureza cível (TJRJ).
                        </p>
                    </div>

                    {/* Modern Segmented Control */}
                    <div className="flex-1 flex justify-center mt-4 md:mt-0 w-full md:w-auto">
                        <div className={classes.tabContainer}>
                            {/* Animated Background Pill */}
                            <div
                                className={classes.tabPill}
                                style={{
                                    width: 'calc(50% - 4px)',
                                    left: activeTab === 'civic' ? '4px' : 'calc(50%)'
                                }}
                            />

                            <button
                                onClick={() => { setActiveTab('civic'); setResult(null); }}
                                className={activeTab === 'civic' ? classes.tabTextActive : classes.tabTextInactive}
                            >
                                Natureza Cível
                            </button>
                            <button
                                onClick={() => { setActiveTab('batch'); setResult(null); }}
                                className={activeTab === 'batch' ? classes.tabTextActive : classes.tabTextInactive}
                            >
                                Múltiplos Valores
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {result && (
                            <button
                                onClick={() => window.print()}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all border shadow-sm active:scale-95 ${theme === 'hybrid'
                                    ? 'bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border-[#202c33]'
                                    : 'bg-white dark:bg-dark-700 hover:bg-slate-50 dark:hover:bg-dark-600 text-slate-700 dark:text-white border-slate-200 dark:border-slate-600'
                                    }`}
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
                    <div className={classes.mainPanel}>
                        {activeTab === 'civic' ? (
                            <>
                                <h2 className={`text-center text-xl font-bold mb-8 ${classes.textPrimary}`}>Cálculo de Natureza Cível</h2>
                                <div className="space-y-4 max-w-lg mx-auto print:hidden">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className={`text-sm font-medium text-right ${classes.textSecondary}`}>Data Inicial*:</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className={classes.inputBasic}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className={`text-sm font-medium text-right ${classes.textSecondary}`}>Data Final:</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className={classes.inputBasic}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className={`text-sm font-medium text-right ${classes.textSecondary}`}>Valor em R$:</label>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            className={classes.inputBasic}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className={`text-sm font-medium text-right ${classes.textSecondary}`}>Tipo de Juros:</label>
                                        <select
                                            value={interestType}
                                            onChange={(e) => setInterestType(e.target.value)}
                                            className={classes.inputBasic}
                                        >
                                            <option value="0">Sem juros (somente correção monetária)</option>
                                            <option value="6">Juros Simples 6% a.a</option>
                                            <option value="12">Juros Simples 12% a.a</option>
                                        </select>
                                    </div>

                                    {interestType !== '0' && (
                                        <div className="grid grid-cols-3 items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                            <label className={`text-sm font-medium text-right ${classes.textSecondary}`}>Data de Incidência:</label>
                                            <input
                                                type="date"
                                                value={interestStartDate}
                                                onChange={(e) => setInterestStartDate(e.target.value)}
                                                className={classes.inputBasic}
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className={`text-sm font-medium text-right ${classes.textSecondary}`}>Honorários (%):</label>
                                        <input
                                            type="text"
                                            placeholder="0,00"
                                            value={fees}
                                            onChange={(e) => setFees(e.target.value)}
                                            className={classes.inputBasic}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <label className={`text-sm font-medium text-right truncate ${classes.textSecondary}`}>Art. 523 § 1º CPC:</label>
                                        <div className="col-span-2 flex gap-4">
                                            <label className={`flex items-center gap-2 text-sm cursor-pointer ${classes.textSecondary}`}>
                                                <input type="checkbox" checked={hasFine523} onChange={(e) => setHasFine523(e.target.checked)} className={`rounded transition-colors ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "border-slate-300 dark:border-slate-600 text-primary-500"}`} />
                                                10% Multa
                                            </label>
                                            <label className={`flex items-center gap-2 text-sm cursor-pointer ${classes.textSecondary}`}>
                                                <input type="checkbox" checked={hasFees523} onChange={(e) => setHasFees523(e.target.checked)} className={`rounded transition-colors ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "border-slate-300 dark:border-slate-600 text-primary-500"}`} />
                                                10% Honorários
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-6 justify-center">
                                        <button onClick={handleCalculateCivic} className={classes.btnCalc}>
                                            <Calculator size={18} /> CALCULAR
                                        </button>
                                        <button onClick={handleClear} className={classes.btnClear}>
                                            <RotateCcw size={18} /> LIMPAR
                                        </button>
                                        {result && !result.isBatch && (
                                            <button onClick={() => window.print()} className={classes.btnPrint}>
                                                <Printer size={18} /> IMPRIMIR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className={`text-center text-xl font-bold mb-8 border-b border-slate-100 dark:border-slate-700 pb-4 ${classes.textPrimary}`}>Cálculo em Lote / Múltiplos Valores</h2>

                                <div className="space-y-6 animate-fade-in">
                                    {/* Batch Generator Tool */}
                                    {/* Modern Batch Generator Tool */}
                                    <div className={classes.genPanel}>
                                        <div className="absolute top-0 right-0 p-8 bg-primary-500/5 rounded-full -mr-4 -mt-4 blur-2xl group-hover/gen:bg-primary-500/10 transition-colors" />

                                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2 ${classes.textPrimary}`}>
                                            <div className={`p-1.5 rounded-lg shadow-md transition-colors ${isHybrid ? "bg-[#00a884] text-white shadow-[#00a884]/20" : "bg-primary-600 text-white shadow-primary-500/20"}`}>
                                                <Plus size={14} />
                                            </div>
                                            Gerador de Parcelas em Lote
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end relative z-10">
                                            <div className="flex flex-col gap-2">
                                                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${classes.textMuted}`}>
                                                    <Calendar size={12} /> Data Inicial
                                                </label>
                                                <div className="relative">
                                                    <input type="date" value={generatorStart} onChange={(e) => setGeneratorStart(e.target.value)} className={classes.inputModern} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${classes.textMuted}`}>
                                                    <Calendar size={12} /> Data Final
                                                </label>
                                                <div className="relative">
                                                    <input type="date" value={generatorEnd} onChange={(e) => setGeneratorEnd(e.target.value)} className={classes.inputModern} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${classes.textMuted}`}>
                                                    <DollarSign size={12} /> Valor Base (R$)
                                                </label>
                                                <div className="relative">
                                                    <input type="text" placeholder="0,00" value={generatorValue} onChange={(e) => setGeneratorValue(e.target.value)} className={`font-medium ${classes.inputModern}`} />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleGenerateRows}
                                                className={classes.btnGen}
                                            >
                                                <RotateCcw size={14} className="group-hover/gen:rotate-180 transition-transform duration-500" />
                                                GERAR PARCELAS
                                            </button>
                                        </div>

                                        {/* Row 2: Descrição Padrão + Tipo de Lote + interest toggle */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                                            <div className="flex flex-col gap-2 md:col-span-1">
                                                <label className={`text-[10px] font-bold uppercase tracking-wider ${classes.textMuted}`}>Descrição Padrão</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Parcela do mês de..."
                                                    value={generatorDescription}
                                                    onChange={(e) => setGeneratorDescription(e.target.value)}
                                                    className={classes.inputModern}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className={`text-[10px] font-bold uppercase tracking-wider ${classes.textMuted}`}>Tipo de Lote</label>
                                                <div className={`flex rounded-xl overflow-hidden border h-[42px] transition-colors ${isHybrid ? "border-[#354751] bg-[#202c33]" : "border-slate-200 dark:border-slate-700"}`}>
                                                    <button
                                                        onClick={() => setGeneratorType('principal')}
                                                        className={`flex-1 text-xs font-bold transition-all ${generatorType === 'principal' ? (isHybrid ? 'bg-[#00a884] text-white' : 'bg-blue-600 text-white') : (isHybrid ? 'bg-[#202c33] text-[#aebac1] hover:bg-[#354751]' : 'bg-white dark:bg-dark-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800')}`}
                                                    >Principal</button>
                                                    <button
                                                        onClick={() => setGeneratorType('cost')}
                                                        className={`flex-1 text-xs font-bold transition-all ${generatorType === 'cost' ? (isHybrid ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white') : (isHybrid ? 'bg-[#202c33] text-[#aebac1] hover:bg-[#354751]' : 'bg-white dark:bg-dark-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-800')}`}
                                                    >Custas/Despesas</button>
                                                </div>
                                            </div>
                                            {generatorType === 'cost' && (
                                                <div className="flex flex-col gap-2 justify-end">
                                                    <label className={`flex items-center gap-2 text-xs cursor-pointer group p-2.5 h-[42px] border border-dashed rounded-xl transition-all ${isHybrid ? "bg-[#1d272e] border-[#5a481c] text-[#aebac1]" : "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700/50 text-slate-600 dark:text-slate-300"}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={batchIgnoreCostInterest}
                                                            onChange={(e) => setBatchIgnoreCostInterest(e.target.checked)}
                                                            className={`w-4 h-4 rounded transition-all ${isHybrid ? "text-amber-500 focus:ring-amber-500 bg-[#2a3942] border-[#354751]" : "text-amber-600 border-amber-300"}`}
                                                        />
                                                        <span className={`font-medium ${isHybrid ? "text-[#aebac1]" : "text-amber-700 dark:text-amber-400"}`}>Não incidir juros sobre Custas</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* General Settings Grid - Optimized for Vertical Density */}
                                    <div className={classes.settingsPanel}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div className="flex flex-col gap-1.5">
                                                <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${classes.textMuted}`}>
                                                    <Calendar size={12} className="text-primary-500" /> Data Final de Atualização
                                                </label>
                                                <input
                                                    type="date"
                                                    value={batchEndDate}
                                                    onChange={(e) => setBatchEndDate(e.target.value)}
                                                    className={classes.inputSelect}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${classes.textMuted}`}>
                                                    <Percent size={12} className="text-primary-500" /> Honorários (%)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="0,00"
                                                    value={batchFees}
                                                    onChange={(e) => setBatchFees(e.target.value)}
                                                    className={classes.inputSelect}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${classes.textMuted}`}>
                                                    <Percent size={12} className="text-primary-500" /> Tipo de Juros
                                                </label>
                                                <select
                                                    value={batchInterestType}
                                                    onChange={(e) => setBatchInterestType(e.target.value)}
                                                    className={classes.inputSelect}
                                                >
                                                    <option value="0">Sem juros</option>
                                                    <option value="6">Juros Simples 6% a.a</option>
                                                    <option value="12">Juros Simples 12% a.a</option>
                                                </select>
                                            </div>

                                            {/* Penalties & Interest Mode - Spans 3 columns or stacks */}
                                            <div className={`col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-1`}>
                                                <div className="space-y-3">
                                                    <label className={`text-[10px] font-bold uppercase tracking-widest block ${classes.textMuted}`}>Penalidades (Art. 523 § 1º CPC)</label>
                                                    <div className="flex gap-4">
                                                        <label className={`flex items-center gap-2 text-sm cursor-pointer group ${classes.textSecondary}`}>
                                                            <input type="checkbox" checked={batchHasFine523} onChange={(e) => setBatchHasFine523(e.target.checked)} className={`w-4 h-4 rounded transition-all ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "border-slate-300 text-primary-600 focus:ring-primary-500"}`} />
                                                            <span className="group-hover:text-primary-600 transition-colors">10% Multa</span>
                                                        </label>
                                                        <label className={`flex items-center gap-2 text-sm cursor-pointer group ${classes.textSecondary}`}>
                                                            <input type="checkbox" checked={batchHasFees523} onChange={(e) => setBatchHasFees523(e.target.checked)} className={`w-4 h-4 rounded transition-all ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "border-slate-300 text-primary-600 focus:ring-primary-500"}`} />
                                                            <span className="group-hover:text-primary-600 transition-colors">10% Honorários</span>
                                                        </label>
                                                    </div>
                                                    {batchInterestType !== '0' && (
                                                        <label className={`flex items-center gap-2 text-xs cursor-pointer mt-1 ${isHybrid ? "text-[#aebac1]" : "text-amber-700 dark:text-amber-400"}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={batchIgnoreCostInterest}
                                                                onChange={(e) => setBatchIgnoreCostInterest(e.target.checked)}
                                                                className={`w-3.5 h-3.5 rounded transition-all ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "text-amber-600 border-amber-300 focus:ring-amber-500"}`}
                                                            />
                                                            <span className="font-medium">Não incidir juros sobre itens de Custas/Despesas</span>
                                                        </label>
                                                    )}
                                                </div>

                                                {batchInterestType !== '0' && (
                                                    <div className="space-y-3 animate-fade-in">
                                                        <label className={`text-[10px] font-bold uppercase tracking-widest block ${classes.textMuted}`}>Modo de Incidência de Juros</label>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                            <label className={`flex items-center gap-2 text-xs cursor-pointer group ${classes.textSecondary}`}>
                                                                <input type="radio" name="intMode" checked={interestMode === 'fixed'} onChange={() => setInterestMode('fixed')} className={`transition-colors ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "text-primary-600"}`} />
                                                                <span className={`transition-colors ${isHybrid ? "group-hover:text-[#e9edef]" : "group-hover:text-slate-900 dark:group-hover:text-white"}`}>Fixa</span>
                                                            </label>
                                                            <label className={`flex items-center gap-2 text-xs cursor-pointer group ${classes.textSecondary}`}>
                                                                <input type="radio" name="intMode" checked={interestMode === 'individual'} onChange={() => setInterestMode('individual')} className={`transition-colors ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "text-primary-600"}`} />
                                                                <span className={`transition-colors ${isHybrid ? "group-hover:text-[#e9edef]" : "group-hover:text-slate-900 dark:group-hover:text-white"}`}>Individual</span>
                                                            </label>
                                                            <label className={`flex items-center gap-2 text-xs cursor-pointer group ${classes.textSecondary}`}>
                                                                <input type="radio" name="intMode" checked={interestMode === 'same-as-start'} onChange={() => setInterestMode('same-as-start')} className={`transition-colors ${isHybrid ? "text-[#00a884] focus:ring-[#00a884] bg-[#2a3942] border-[#354751]" : "text-primary-600"}`} />
                                                                <span className={`transition-colors ${isHybrid ? "group-hover:text-[#e9edef]" : "group-hover:text-slate-900 dark:group-hover:text-white"}`}>Pela Parcela</span>
                                                            </label>
                                                        </div>
                                                        {interestMode === 'fixed' && (
                                                            <input
                                                                type="date"
                                                                value={batchInterestStartDate}
                                                                onChange={(e) => setBatchInterestStartDate(e.target.value)}
                                                                className={`w-full p-2 text-xs border rounded-lg outline-none animate-in fade-in slide-in-from-top-1 ${isHybrid ? "bg-[#202c33] border-[#354751] text-[#e9edef] focus:ring-1 focus:ring-[#00a884]" : "bg-white dark:bg-dark-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20"}`}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compact Items Table */}
                                    <div className={`rounded-xl overflow-hidden shadow-sm border ${isHybrid ? "bg-[#202c33] border-[#354751]" : "bg-white dark:bg-dark-950 border-slate-200 dark:border-slate-700"}`}>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                {(() => {
                                                    const handleSort = (col: string) => {
                                                        if (sortColumn === col) {
                                                            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                                                        } else {
                                                            setSortColumn(col);
                                                            setSortDirection('asc');
                                                        }
                                                    };
                                                    const SortIcon = ({ col }: { col: string }) => (
                                                        <span className="ml-1 inline-block">
                                                            {sortColumn === col
                                                                ? (sortDirection === 'asc' ? '↑' : '↓')
                                                                : <span className="opacity-30">↕</span>}
                                                        </span>
                                                    );
                                                    return (
                                                        <tr className={`text-[10px] font-bold uppercase tracking-wider border-b ${isHybrid ? "bg-[#2a3942] text-[#8696a0] border-[#354751]" : "bg-slate-50 dark:bg-dark-900/80 text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                                                            <th className="p-2 pl-4">#</th>
                                                            <th className={`p-2 cursor-pointer select-none transition-colors ${isHybrid ? "hover:text-[#e9edef]" : "hover:text-slate-600 dark:hover:text-slate-200"}`} onClick={() => handleSort('type')}>Tipo<SortIcon col="type" /></th>
                                                            <th className={`p-2 cursor-pointer select-none transition-colors ${isHybrid ? "hover:text-[#e9edef]" : "hover:text-slate-600 dark:hover:text-slate-200"}`} onClick={() => handleSort('description')}>Descrição / Observação<SortIcon col="description" /></th>
                                                            <th className={`p-2 cursor-pointer select-none transition-colors ${isHybrid ? "hover:text-[#e9edef]" : "hover:text-slate-600 dark:hover:text-slate-200"}`} onClick={() => handleSort('startDate')}>Data Inicial*<SortIcon col="startDate" /></th>
                                                            <th className={`p-2 cursor-pointer select-none transition-colors ${isHybrid ? "hover:text-[#e9edef]" : "hover:text-slate-600 dark:hover:text-slate-200"}`} onClick={() => handleSort('value')}>Valor Principal*<SortIcon col="value" /></th>
                                                            {batchInterestType !== '0' && interestMode === 'individual' && (
                                                                <th className="p-2">Data Juros</th>
                                                            )}
                                                            <th className="p-2 pr-4 text-right">Ação</th>
                                                        </tr>
                                                    );
                                                })()}
                                            </thead>
                                            <tbody className={`divide-y ${isHybrid ? "divide-[#354751]" : "divide-slate-100 dark:divide-slate-800"}`}>
                                                {(() => {
                                                    let displayItems = [...batchItems];
                                                    if (sortColumn) {
                                                        displayItems.sort((a, b) => {
                                                            let aVal = (a as any)[sortColumn] || '';
                                                            let bVal = (b as any)[sortColumn] || '';
                                                            if (sortColumn === 'value') {
                                                                aVal = parseFloat(String(aVal).replace(',', '.')) || 0;
                                                                bVal = parseFloat(String(bVal).replace(',', '.')) || 0;
                                                                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                                                            }
                                                            return sortDirection === 'asc'
                                                                ? String(aVal).localeCompare(String(bVal))
                                                                : String(bVal).localeCompare(String(aVal));
                                                        });
                                                    }
                                                    return displayItems.map((item, index) => (
                                                        <tr key={item.id} className={`transition-colors border-l-2 ${item.type === 'cost' ? (isHybrid ? 'bg-amber-900/10 border-amber-600' : 'bg-amber-50/50 dark:bg-amber-900/10 border-l-amber-400') : (isHybrid ? 'border-transparent hover:bg-[#354751]/50' : 'border-transparent hover:bg-slate-50/50 dark:hover:bg-dark-900/30')}`}>
                                                            <td className={`p-2 pl-4 text-xs font-medium ${isHybrid ? "text-[#8696a0]" : "text-slate-400"}`}>{index + 1}</td>
                                                            <td className="p-2">
                                                                <select
                                                                    value={item.type}
                                                                    onChange={(e) => {
                                                                        const newItems = [...batchItems];
                                                                        newItems[index].type = e.target.value as 'principal' | 'cost';
                                                                        setBatchItems(newItems);
                                                                    }}
                                                                    className={`w-full p-1.5 text-xs border rounded font-bold outline-none ${item.type === 'cost' ? (isHybrid ? 'bg-amber-900/20 border-amber-800 text-amber-500 focus:ring-amber-500' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 focus:ring-1 focus:ring-primary-500') : (isHybrid ? 'bg-[#354751] border-[#354751] text-[#e9edef] focus:ring-[#00a884]' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 focus:ring-1 focus:ring-primary-500')}`}
                                                                >
                                                                    <option value="principal">Principal</option>
                                                                    <option value="cost">Custa/Despesa</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: Custas Judiciais"
                                                                    value={item.description || ''}
                                                                    onChange={(e) => {
                                                                        const newItems = [...batchItems];
                                                                        newItems[index].description = e.target.value;
                                                                        setBatchItems(newItems);
                                                                    }}
                                                                    className={`w-full p-1.5 text-xs border rounded bg-transparent outline-none ${isHybrid ? "border-[#354751] text-[#e9edef] focus:ring-[#00a884] focus:border-[#00a884]" : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"}`}
                                                                />
                                                            </td>
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
                                                                    className={`w-full p-1.5 text-xs border rounded bg-transparent outline-none ${isHybrid ? "border-[#354751] text-[#e9edef] focus:ring-[#00a884] focus:border-[#00a884]" : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"}`}
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
                                                                    className={`w-full p-1.5 text-xs border rounded bg-transparent outline-none ${isHybrid ? "border-[#354751] text-[#e9edef] focus:ring-[#00a884] focus:border-[#00a884]" : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"}`}
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
                                                                        className={`w-full p-1.5 text-xs border rounded bg-transparent outline-none ${isHybrid ? "border-[#354751] text-[#e9edef] focus:ring-[#00a884] focus:border-[#00a884]" : "border-slate-200 dark:border-slate-700 focus:ring-primary-500"}`}
                                                                    />
                                                                </td>
                                                            )}
                                                            <td className="p-2 pr-4 text-right">
                                                                <button
                                                                    onClick={() => setBatchItems(batchItems.filter(i => i.id !== item.id))}
                                                                    className={`p-1.5 rounded transition-colors ${isHybrid ? "text-red-500 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
                                                                    disabled={batchItems.length === 1}
                                                                >
                                                                    <RotateCcw size={14} className="rotate-45" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                        <div className={`p-4 flex justify-between items-center no-print border-t ${isHybrid ? "bg-[#202c33]/50 border-[#354751]" : "bg-slate-50/50 dark:bg-dark-900/50 border-slate-100 dark:border-slate-800"}`}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                                <span className={`text-[10px] font-medium uppercase tracking-wider ${classes.textSecondary}`}>{batchItems.length} parcelas listadas</span>
                                            </div>
                                            <button
                                                onClick={() => setBatchItems([...batchItems, { id: crypto.randomUUID(), startDate: '', value: '', type: 'principal' }])}
                                                className={`text-xs font-bold flex items-center gap-2 transition-all hover:gap-3 px-3 py-1.5 rounded-lg active:scale-95 ${isHybrid ? "text-[#00a884] hover:bg-[#00a884]/10" : "text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"}`}
                                            >
                                                <Plus size={16} /> ADICIONAR NOVA LINHA
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pt-8 justify-center no-print">
                                        <button onClick={handleCalculateBatch} className={`px-10 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-3 font-bold active:scale-95 ${isHybrid ? "bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20" : "bg-[#2d3a4f] hover:bg-[#324158] text-white shadow-[#2d3a4f]/20"}`}>
                                            <Calculator size={18} /> CALCULAR TUDO
                                        </button>
                                        <button onClick={handleExport} className={`px-6 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-3 font-bold active:scale-95 ${isHybrid ? "bg-[#202c33] border border-[#354751] hover:bg-[#354751] text-[#e9edef]" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"}`}>
                                            EXPORTAR CÁLCULO
                                        </button>
                                        <button onClick={handleImport} className={`px-6 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-3 font-bold active:scale-95 ${isHybrid ? "bg-[#202c33] border border-[#354751] hover:bg-[#354751] text-[#e9edef]" : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"}`}>
                                            IMPORTAR CÁLCULO
                                        </button>
                                        <button onClick={handleClear} className={`px-10 py-3.5 rounded-xl transition-all flex items-center gap-3 font-bold active:scale-95 border-b-4 active:border-b-0 ${isHybrid ? "bg-[#202c33] border-[#354751] border-b-[#2a3942] text-[#aebac1] hover:bg-[#354751] hover:text-[#e9edef]" : "bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700 border-b-slate-100 dark:border-b-dark-900"}`}>
                                            <RotateCcw size={18} /> LIMPAR
                                        </button>
                                        {result && result.isBatch && (
                                            <button onClick={() => window.print()} className={`px-10 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-3 font-bold active:scale-95 ${isHybrid ? "bg-[#2a3942] border border-[#354751] hover:bg-[#354751] text-[#e9edef]" : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"}`}>
                                                <Printer size={18} /> IMPRIMIR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className={`mt-10 text-[12px] space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-5 print:hidden ${classes.textSecondary}`}>
                            <p>* Campos de preenchimento obrigatório</p>
                            <p>O cálculo acima não possui valor legal. Trata-se apenas de uma ferramenta de auxílio na elaboração de contas.</p>
                            <p>Datas devem ser informadas no formato dd/mm/aaaa.</p>
                            <p>Os Cálculos são realizados considerando o ano comercial (360 dias) e juros simples, quando aplicados.</p>
                            <p>Os honorários serão calculados sobre o valor corrigido somado aos juros.</p>
                        </div>

                        {/* Results Display */}
                        {result && (
                            <div className={`mt-12 overflow-hidden rounded-lg animate-in fade-in duration-500 shadow-xl no-print-break ${classes.tableWrapper}`}>
                                <div className={`p-6 border-b ${classes.tableHeaderRow}`}>
                                    <h3 className={`text-xl font-bold flex items-center gap-2 ${classes.textPrimary}`}>
                                        <Briefcase className="text-primary-500" size={20} /> Memória de Cálculo
                                    </h3>
                                </div>

                                <div className={`p-0 overflow-x-auto ${isHybrid ? "bg-[#2a3942]" : "bg-white dark:bg-dark-950"}`}>
                                    <table className="w-full text-sm">
                                        <tbody className={`divide-y ${isHybrid ? "divide-[#354751]" : "divide-slate-100 dark:divide-slate-800"}`}>
                                            {!result.isBatch ? (
                                                <>
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>Valor a ser atualizado:</td>
                                                        <td className={`p-4 text-right font-bold ${classes.textPrimary}`}>{formatCurrency(result.initialValue)}</td>
                                                    </tr>
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>Período de atualização monetária:</td>
                                                        <td className={`p-4 text-right ${classes.textSecondary}`}>
                                                            de {formatDate(result.startDate)} até {formatDate(result.endDate)} ({result.daysDiffCorrection} dias)
                                                        </td>
                                                    </tr>
                                                    {result.interestRate > 0 && (
                                                        <>
                                                            <tr className={classes.tableRowHover}>
                                                                <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>Tipo de juros:</td>
                                                                <td className={`p-4 text-right ${classes.textSecondary}`}>Juros Simples (360 dias no ano)</td>
                                                            </tr>
                                                            <tr className={classes.tableRowHover}>
                                                                <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>Taxa de juros:</td>
                                                                <td className={`p-4 text-right ${classes.textSecondary}`}>{result.interestRate}% a.a</td>
                                                            </tr>
                                                            <tr className={classes.tableRowHover}>
                                                                <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>Período dos juros:</td>
                                                                <td className={`p-4 text-right ${classes.textSecondary}`}>
                                                                    de {formatDate(result.interestStartDate)} até {formatDate(result.endDate)} ({result.daysDiffInterest} dias)
                                                                </td>
                                                            </tr>
                                                        </>
                                                    )}
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>Honorários (%):</td>
                                                        <td className={`p-4 text-right ${classes.textSecondary}`}>{result.feesRate.toFixed(2)}%</td>
                                                    </tr>
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>UFIR Data Inicial:</td>
                                                        <td className={`p-4 text-right ${classes.textSecondary}`}>
                                                            {getUfirValue(new Date(result.startDate + 'T12:00:00'))?.toFixed(4)}
                                                        </td>
                                                    </tr>
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>UFIR Data Final (Ano {new Date(result.endDate + 'T12:00:00').getFullYear()}):</td>
                                                        <td className={`p-4 text-right ${classes.textSecondary}`}>
                                                            {getUfirValue(new Date(result.endDate + 'T12:00:00'))?.toFixed(4)}
                                                        </td>
                                                    </tr>
                                                    <tr className={`border-t-2 ${isHybrid ? "bg-[#2a3942] border-[#354751]" : "bg-slate-50/50 dark:bg-dark-900/50 border-slate-100 dark:border-slate-800"}`}>
                                                        <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Índice de correção monetária:</td>
                                                        <td className={`p-4 text-right font-mono font-medium ${classes.textPrimary}`}>{result.correctionFactor.toFixed(6)}</td>
                                                    </tr>
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Valor Principal Corrigido:</td>
                                                        <td className={`p-4 text-right font-bold ${classes.textPrimary}`}>{formatCurrency(result.correctedValue)}</td>
                                                    </tr>
                                                    {result.interestRate > 0 && (
                                                        <tr className={classes.tableRowHover}>
                                                            <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Valor dos juros:</td>
                                                            <td className={`p-4 text-right font-bold ${classes.textPrimary}`}>{formatCurrency(result.interestValue)}</td>
                                                        </tr>
                                                    )}
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Valor corrigido + juros:</td>
                                                        <td className={`p-4 text-right font-bold ${classes.textPrimary}`}>{formatCurrency(result.correctedValue + result.interestValue)}</td>
                                                    </tr>
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Total de honorários:</td>
                                                        <td className={`p-4 text-right font-bold ${classes.textPrimary}`}>{formatCurrency(result.feesValue)}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr className="bg-slate-50/50 dark:bg-dark-900/50">
                                                    <td colSpan={2} className="p-0">
                                                        {(() => {
                                                            const principalItems = result.batchDetails?.filter(i => i.type === 'principal') || [];
                                                            const costItems = result.batchDetails?.filter(i => i.type === 'cost') || [];
                                                            const colHeaders = (
                                                                <tr>
                                                                    <th className="p-3 text-left font-bold uppercase tracking-wider">Descrição</th>
                                                                    <th className="p-3 text-left font-bold uppercase tracking-wider">Data Inicial</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Valor Principal</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Fator</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Corrigido</th>
                                                                    <th className="p-3 text-right font-bold uppercase tracking-wider">Juros</th>
                                                                </tr>
                                                            );
                                                            return (
                                                                <>
                                                                    {/* Principal Block */}
                                                                    {principalItems.length > 0 && (
                                                                        <table className={`w-full text-xs border-b ${isHybrid ? "border-[#354751]" : "border-slate-100 dark:border-slate-800"}`}>
                                                                            <thead className={`${isHybrid ? "bg-[#1d272e] text-[#00a884]" : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"}`}>
                                                                                <tr>
                                                                                    <td colSpan={6} className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest">⬤ Principal</td>
                                                                                </tr>
                                                                                {colHeaders}
                                                                            </thead>
                                                                            <tbody className={`divide-y ${isHybrid ? "divide-[#354751]" : "divide-slate-50 dark:divide-slate-800/50"}`}>
                                                                                {principalItems.map((item) => (
                                                                                    <tr key={item.id} className={`${isHybrid ? "hover:bg-[#354751]" : "hover:bg-white dark:hover:bg-dark-900"}`}>
                                                                                        <td className={`p-3 ${isHybrid ? "text-[#e9edef]" : "text-slate-700 dark:text-slate-300"}`}>{item.description || '-'}</td>
                                                                                        <td className={`p-3 ${isHybrid ? "text-[#e9edef]" : "text-slate-700 dark:text-slate-300"}`}>{formatDate(item.startDate)}</td>
                                                                                        <td className={`p-3 text-right ${isHybrid ? "text-[#e9edef]" : "text-slate-700 dark:text-slate-300"}`}>{formatCurrency(item.initialValue)}</td>
                                                                                        <td className={`p-3 text-right font-mono ${isHybrid ? "text-[#8696a0]" : "text-slate-500"}`}>{item.factor.toFixed(6)}</td>
                                                                                        <td className={`p-3 text-right font-medium ${isHybrid ? "text-[#e9edef]" : "text-slate-900 dark:text-white"}`}>{formatCurrency(item.correctedValue)}</td>
                                                                                        <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-medium">+{formatCurrency(item.interestValue)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                            <tfoot className={`font-semibold ${isHybrid ? "bg-[#1d272e] border-t border-[#354751]" : "bg-blue-50/80 dark:bg-blue-900/20"}`}>
                                                                                <tr>
                                                                                    <td colSpan={4} className={`p-3 ${isHybrid ? "text-[#00a884]" : "text-blue-700 dark:text-blue-300"}`}>Subtotal Principal:</td>
                                                                                    <td colSpan={2} className="p-3 text-right text-blue-700 dark:text-blue-300">{formatCurrency(result.principalSubtotal || 0)}</td>
                                                                                </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    )}

                                                                    {/* Costs Block */}
                                                                    {costItems.length > 0 && (
                                                                        <table className={`w-full text-xs border-b ${isHybrid ? "border-[#354751]" : "border-slate-100 dark:border-slate-800"}`}>
                                                                            <thead className={`${isHybrid ? "bg-[#1d272e] text-[#ffbc2c]" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"}`}>
                                                                                <tr>
                                                                                    <td colSpan={6} className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest">⬤ Custas / Despesas Processuais</td>
                                                                                </tr>
                                                                                {colHeaders}
                                                                            </thead>
                                                                            <tbody className={`divide-y ${isHybrid ? "divide-[#354751]" : "divide-amber-50 dark:divide-amber-800/20"}`}>
                                                                                {costItems.map((item) => (
                                                                                    <tr key={item.id} className={`${isHybrid ? "hover:bg-[#354751]" : "hover:bg-amber-50/30 dark:hover:bg-amber-900/10"}`}>
                                                                                        <td className={`p-3 ${isHybrid ? "text-[#e9edef]" : "text-slate-700 dark:text-slate-300"}`}>{item.description || '-'}</td>
                                                                                        <td className={`p-3 ${isHybrid ? "text-[#e9edef]" : "text-slate-700 dark:text-slate-300"}`}>{formatDate(item.startDate)}</td>
                                                                                        <td className={`p-3 text-right ${isHybrid ? "text-[#e9edef]" : "text-slate-700 dark:text-slate-300"}`}>{formatCurrency(item.initialValue)}</td>
                                                                                        <td className={`p-3 text-right font-mono ${isHybrid ? "text-[#8696a0]" : "text-slate-500"}`}>{item.factor.toFixed(6)}</td>
                                                                                        <td className={`p-3 text-right font-medium ${isHybrid ? "text-[#e9edef]" : "text-slate-900 dark:text-white"}`}>{formatCurrency(item.correctedValue)}</td>
                                                                                        <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-medium">{item.interestValue > 0 ? '+' + formatCurrency(item.interestValue) : '-'}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                            <tfoot className={`font-semibold ${isHybrid ? "bg-[#1d272e] border-t border-[#354751]" : "bg-amber-50/80 dark:bg-amber-900/20"}`}>
                                                                                <tr>
                                                                                    <td colSpan={4} className={`p-3 ${isHybrid ? "text-[#ffbc2c]" : "text-amber-700 dark:text-amber-300"}`}>Subtotal Custas:</td>
                                                                                    <td colSpan={2} className="p-3 text-right text-amber-700 dark:text-amber-300">{formatCurrency(result.costsSubtotal || 0)}</td>
                                                                                </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            )}

                                            <tr className={classes.tableRowHover}>
                                                <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Taxa de juros:</td>
                                                <td className={`p-4 text-right ${classes.textSecondary}`}>{result.interestRate > 0 ? `${result.interestRate}% a.a` : 'Sem juros'}</td>
                                            </tr>

                                            {result.isBatch && result.interestRate > 0 && (
                                                <tr className={classes.tableRowHover}>
                                                    <td className={`p-4 font-medium whitespace-nowrap ${classes.textSecondary}`}>Incidência dos juros:</td>
                                                    <td className={`p-4 text-right ${classes.textSecondary}`}>
                                                        desde {formatDate(result.interestStartDate)} ({result.daysDiffInterest} dias)
                                                    </td>
                                                </tr>
                                            )}

                                            {result.isBatch && (
                                                <>
                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Honorários (%):</td>
                                                        <td className={`p-4 text-right ${classes.textSecondary}`}>{result.feesRate.toFixed(2)}%</td>
                                                    </tr>

                                                    <tr className={classes.tableRowHover}>
                                                        <td className={`p-4 font-medium ${isHybrid ? "text-[#aebac1]" : "text-slate-600 dark:text-slate-400"}`}>Atualizado até:</td>
                                                        <td className={`p-4 text-right ${classes.textSecondary}`}>{formatDate(result.endDate)}</td>
                                                    </tr>
                                                </>
                                            )}

                                            <tr className={`border-t ${isHybrid ? "bg-[#2a3942] border-[#354751]" : "bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700"}`}>
                                                <td className={`p-4 font-bold uppercase ${isHybrid ? "text-[#e9edef]" : "text-slate-900 dark:text-white"}`}>Subtotal:</td>
                                                <td className={`p-4 text-right font-bold text-lg ${isHybrid ? "text-[#00a884]" : "text-primary-600 dark:text-primary-400"}`}>{formatCurrency(result.subtotal)}</td>
                                            </tr>

                                            {(result.fine523 > 0 || result.fees523 > 0) && (
                                                <>
                                                    <tr className={`font-medium ${isHybrid ? "bg-[#2a3942]" : "bg-slate-50 dark:bg-dark-900"}`}>
                                                        <td colSpan={2} className={`p-4 uppercase tracking-wider text-xs ${isHybrid ? "text-[#aebac1]" : "text-slate-800 dark:text-white"}`}>Art. 523 § 1º CPC</td>
                                                    </tr>
                                                    {result.fine523 > 0 && (
                                                        <tr className={classes.tableRowHover}>
                                                            <td className="p-4 text-slate-600 dark:text-slate-400 pl-8 font-medium">Multa - 10%:</td>
                                                            <td className={`p-4 text-right font-bold ${classes.textPrimary}`}>{formatCurrency(result.fine523)}</td>
                                                        </tr>
                                                    )}
                                                    {result.fees523 > 0 && (
                                                        <tr className={classes.tableRowHover}>
                                                            <td className="p-4 text-slate-600 dark:text-slate-400 pl-8 font-medium">Honorários - 10%:</td>
                                                            <td className={`p-4 text-right font-bold ${classes.textPrimary}`}>{formatCurrency(result.fees523)}</td>
                                                        </tr>
                                                    )}
                                                </>
                                            )}
                                            <tr className={`border-t-2 ${isHybrid ? "bg-[#1d272e] border-[#00a884]" : "bg-primary-50 dark:bg-primary-900/20 border-primary-500"}`}>
                                                <td className={`p-6 font-black text-lg uppercase ${isHybrid ? "text-[#00a884]" : "text-primary-900 dark:text-primary-400"}`}>Total Geral:</td>
                                                <td className={`p-6 text-right font-black text-2xl ${isHybrid ? "text-[#00a884]" : "text-primary-600 dark:text-primary-400"}`}>{formatCurrency(result.total)}</td>
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

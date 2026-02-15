import React, { useState } from 'react';
import { Calculator, RotateCcw, Printer, Info, Briefcase, Calendar, DollarSign, Percent } from 'lucide-react';
import { getUfirValue, getDaysDiff360, calculateInterest } from '../utils/calculationUtils';

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
}

const Calculations: React.FC = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [value, setValue] = useState('');
    const [interestType, setInterestType] = useState('0'); // 0: None, 6: 6%, 12: 12%
    const [interestStartDate, setInterestStartDate] = useState('');
    const [fees, setFees] = useState('');
    const [hasFine523, setHasFine523] = useState(false);
    const [hasFees523, setHasFees523] = useState(false);
    const [result, setResult] = useState<CalculationResult | null>(null);

    const handleCalculate = () => {
        if (!startDate || !endDate || !value) {
            alert('Favor preencher os campos obrigatórios (*)');
            return;
        }

        // Função para parsear data ignorando timezone (YYYY-MM-DD -> Local Date)
        const parseDateSafe = (str: string) => {
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const start = parseDateSafe(startDate);
        const end = parseDateSafe(endDate);
        const val = parseFloat(value.replace(',', '.'));

        // Correction
        const ufirStart = getUfirValue(start);
        const ufirEnd = getUfirValue(end);

        if (!ufirStart || !ufirEnd) {
            alert('UFIR não encontrada para o período selecionado (Tabela disponível de 1995 a 2026)');
            return;
        }

        const factor = ufirEnd / ufirStart;
        const corrected = val * factor;
        const daysCorrection = getDaysDiff360(start, end);

        // Interest
        const intRate = parseFloat(interestType);
        let intVal = 0;
        let daysInterest = 0;

        if (intRate > 0 && interestStartDate) {
            const intStart = parseDateSafe(interestStartDate);
            daysInterest = getDaysDiff360(intStart, end);
            intVal = calculateInterest(corrected, intRate, daysInterest);
        }

        // Fees
        const feesRate = fees ? parseFloat(fees.replace(',', '.')) : 0;
        const correctedPlusInterest = corrected + intVal;
        const feesVal = correctedPlusInterest * (feesRate / 100);

        const subtotal = correctedPlusInterest + feesVal;

        // CPC 523
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
            interestStartDate
        });
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate(new Date().toISOString().split('T')[0]);
        setValue('');
        setInterestType('0');
        setInterestStartDate('');
        setFees('');
        setHasFine523(false);
        setHasFees523(false);
        setResult(null);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="p-4 md:pt-6 md:px-8 animate-fade-in pb-20">
            {/* Standard App Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-2 md:gap-4 no-print">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cálculos</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Cálculo de débitos judiciais de natureza cível (TJRJ).
                    </p>
                </div>
                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                    {result && (
                        <button
                            onClick={() => window.print()}
                            className="flex-1 md:flex-none bg-white dark:bg-dark-700 hover:bg-slate-50 dark:hover:bg-dark-600 text-slate-700 dark:text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all border border-slate-200 dark:border-slate-600 shadow-sm active:scale-95 no-print"
                        >
                            <Printer size={20} /> Imprimir
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full px-0">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 bg-white dark:bg-dark-800 rounded-xl overflow-hidden shadow-sm no-print">
                    <button className="flex-1 md:flex-none px-6 py-3 bg-primary-600 text-white text-sm font-semibold">
                        Natureza Cível
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors cursor-not-allowed opacity-50">
                        Fazenda Pública
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-3 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors cursor-not-allowed opacity-50">
                        ITD
                    </button>
                </div>

                {/* Form Container */}
                <div className="bg-white dark:bg-dark-800 rounded-b-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
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
                            <button
                                onClick={handleCalculate}
                                className="bg-[#2d3a4f] hover:bg-[#3d4c63] text-white px-8 py-2.5 rounded shadow-lg transition-all flex items-center gap-2 font-bold"
                            >
                                <Calculator size={18} /> CALCULAR
                            </button>
                            <button
                                onClick={handleClear}
                                className="bg-white dark:bg-dark-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-700 px-8 py-2.5 rounded transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={18} /> LIMPAR
                            </button>
                            {result && (
                                <button
                                    onClick={() => window.print()}
                                    className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-2.5 rounded shadow-lg transition-all flex items-center gap-2 font-bold"
                                >
                                    <Printer size={18} /> IMPRIMIR
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-10 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-700 pt-4 print:hidden">
                        <p>* Campos de preenchimento obrigatório</p>
                        <p>O cálculo acima não possui valor legal. Trata-se apenas de uma ferramenta de auxílio na elaboração de contas.</p>
                        <p>Datas devem ser informadas no formato dd/mm/aaaa.</p>
                        <p>Os Cálculos são realizados considerando o ano comercial (360 dias) e juros simples, quando aplicados.</p>
                        <p>Os honorários serão calculados sobre o valor corrigido somado aos juros.</p>
                    </div>

                    {/* Results Display */}
                    {result && (
                        <div className="mt-12 overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg animate-in fade-in duration-500 shadow-xl">
                            <div className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-slate-700 p-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Briefcase className="text-primary-500" size={20} /> Memória de Cálculo
                                </h3>
                            </div>

                            <div className="p-0 bg-white dark:bg-dark-950">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                            <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Valor a ser atualizado:</td>
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
                                                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Tipo de juros:</td>
                                                    <td className="p-4 text-right text-slate-700 dark:text-slate-300">Juros Simples (360 dias no ano)</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Taxa de juros:</td>
                                                    <td className="p-4 text-right text-slate-700 dark:text-slate-300">{result.interestRate}% a.a</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Período dos juros:</td>
                                                    <td className="p-4 text-right text-slate-700 dark:text-slate-300">
                                                        de {formatDate(result.interestStartDate)} até {formatDate(result.endDate)} ({result.daysDiffInterest} dias)
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                        <tr className="hover:bg-slate-50 dark:hover:bg-dark-900 transition-colors">
                                            <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">Honorários (%):</td>
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
        }
      `}</style>
        </div>
    );
};

export default Calculations;

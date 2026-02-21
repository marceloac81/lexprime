import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, FileText, Calendar as CalendarIcon, ExternalLink, ChevronLeft, ChevronRight, User, Briefcase, Plus, X, ChevronDown, Check, Printer } from 'lucide-react';
import { fetchPublications } from '../utils/djen';
import { DJENItem } from '../types';
import { useStore } from '../context/Store';
import { CalculatorModal } from '../components/CalculatorModal';
import { CaseModal } from '../components/CaseModal';
import { sanitizeCNJ } from '../utils/cnjUtils';

interface PublicationsProps {
    setPage: (page: string) => void;
}

export const Publications: React.FC<PublicationsProps> = ({ setPage }) => {
    const { teamMembers, cases, addDeadline, holidays, addCase, clients } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<DJENItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [selectedOabs, setSelectedOabs] = useState<string[]>(['5173']);
    const [uf, setUf] = useState('RJ');
    const [processo, setProcesso] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [pageNumber, setPageNumber] = useState(1);
    const itemsPerPage = 10;

    // Modal State
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [showCaseModal, setShowCaseModal] = useState(false);
    const [pendingProcessNumber, setPendingProcessNumber] = useState('');

    // Dropdown State
    const [isOabDropdownOpen, setIsOabDropdownOpen] = useState(false);
    const [manualOab, setManualOab] = useState('');
    // Selection State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const oabDropdownRef = useRef<HTMLDivElement>(null);

    // Sanitization Helper
    const cleanOab = (val: string) => {
        if (!val) return '';
        const trimmed = val.trim();
        const upper = trimmed.toUpperCase();
        if (upper === '5173D') return '5173D';
        return trimmed.replace(/\D/g, '');
    };

    // Load from LocalStorage
    useEffect(() => {
        const savedData = localStorage.getItem('lexprime_publications_state');
        if (savedData) {
            try {
                const { filters, results: savedResults, totalCount: savedTotal, page: savedPage } = JSON.parse(savedData);
                if (filters.selectedOabs) setSelectedOabs(filters.selectedOabs);
                if (filters.uf) setUf(filters.uf);
                if (filters.processo) setProcesso(filters.processo);
                if (filters.startDate) setStartDate(filters.startDate);
                if (filters.endDate) setEndDate(filters.endDate);
                if (savedResults) setResults(savedResults);
                if (savedTotal) setTotalCount(savedTotal);
                if (savedPage) setPageNumber(savedPage);
            } catch (e) {
                console.error("Error loading publications state", e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        const stateToSave = {
            filters: { selectedOabs, uf, processo, startDate, endDate },
            results,
            totalCount,
            page: pageNumber
        };
        localStorage.setItem('lexprime_publications_state', JSON.stringify(stateToSave));
    }, [selectedOabs, uf, processo, startDate, endDate, results, totalCount, pageNumber]);

    // OAB Options from team, cleaned
    const oabOptions = Array.from(new Set([
        '5173',
        '5173D',
        ...teamMembers.map(m => {
            const raw = m.oab?.split('/')[0] || '';
            return cleanOab(raw);
        }).filter(Boolean) as string[],
        ...selectedOabs // Ensure manually added ones currently selected also appear
    ])).sort();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (oabDropdownRef.current && !oabDropdownRef.current.contains(event.target as Node)) {
                setIsOabDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (targetPage = 1) => {
        if (selectedOabs.length === 0 && !processo && (!startDate || !endDate)) {
            setError('Preencha pelo menos um critério de busca (OAB, Processo ou Período).');
            return;
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 30) {
                setError('O intervalo de datas não pode ser superior a 30 dias.');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            let allItems: DJENItem[] = [];
            let combinedCount = 0;

            if (selectedOabs.length > 0) {
                const searchPromises = selectedOabs.map(oabVal =>
                    fetchPublications({
                        numeroOab: oabVal,
                        ufOab: uf,
                        numeroProcesso: processo || undefined,
                        dataDisponibilizacaoInicio: startDate || undefined,
                        dataDisponibilizacaoFim: endDate || undefined,
                        pagina: targetPage,
                        itensPorPagina: itemsPerPage
                    })
                );

                const responses = await Promise.all(searchPromises);

                const seenIds = new Set();
                responses.forEach(resp => {
                    (resp.items || []).forEach(item => {
                        if (!seenIds.has(item.id)) {
                            allItems.push(item);
                            seenIds.add(item.id);
                        }
                    });
                    combinedCount += resp.count || 0;
                });

                allItems.sort((a, b) => new Date(b.data_disponibilizacao).getTime() - new Date(a.data_disponibilizacao).getTime());
            } else if (processo) {
                const response = await fetchPublications({
                    numeroProcesso: processo.replace(/\D/g, ''),
                    dataDisponibilizacaoInicio: startDate || undefined,
                    dataDisponibilizacaoFim: endDate || undefined,
                    pagina: targetPage,
                    itensPorPagina: itemsPerPage
                });
                allItems = response.items || [];
                combinedCount = response.count || 0;
            }

            setResults(allItems);
            setTotalCount(combinedCount);
            setPageNumber(targetPage);
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar publicações.');
        } finally {
            setLoading(false);
        }
    };

    const toggleOab = (val: string) => {
        const cleaned = cleanOab(val);
        if (!cleaned) return;
        setSelectedOabs(prev =>
            prev.includes(cleaned) ? prev.filter(o => o !== cleaned) : [...prev, cleaned]
        );
    };

    const handleAddManualOab = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && manualOab.trim()) {
            const cleaned = cleanOab(manualOab);
            if (cleaned && !selectedOabs.includes(cleaned)) {
                setSelectedOabs(prev => [...prev, cleaned]);
            }
            setManualOab('');
        }
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedItems(newSelection);
    };

    const handlePrint = () => {
        if (selectedItems.size === 0) {
            alert('Por favor, selecione pelo menos uma publicação para imprimir.');
            return;
        }
        window.print();
    };

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return '';
        // Date comes as YYYY-MM-DD from API
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const sanitizeText = (html: string) => {
        if (!html) return '';

        // 1. Decode entities using a temporary element (browser-safe)
        const doc = new DOMParser().parseFromString(html, 'text/html');
        let decoded = doc.body.textContent || "";

        // 2. Remove remaining HTML tags (regex fallback)
        decoded = decoded.replace(/<[^>]*>/g, '');

        // 3. Clean up extra newlines and spaces
        return decoded.trim();
    };

    const handleToggleAll = () => {
        if (selectedItems.size === results.length && results.length > 0) {
            setSelectedItems(new Set());
        } else {
            const allIds = new Set(results.map(r => r.id));
            setSelectedItems(allIds);
        }
    };

    const handleCreateDeadline = (processNumber: string) => {
        setPendingProcessNumber(processNumber);
        setShowDeadlineModal(true);
    };

    const isTeamLawyer = (name: string) => {
        if (!name) return false;
        const cleanName = name.toUpperCase().replace(/\./g, '');
        return teamMembers.some(member => {
            const memberCleanName = member.name.toUpperCase();
            return cleanName.includes(memberCleanName) || memberCleanName.includes(cleanName);
        });
    };

    const findProcessInDatabase = (processNumber: string) => {
        if (!processNumber) return null;
        const sanitized = sanitizeCNJ(processNumber);
        return cases.find(c => sanitizeCNJ(c.number) === sanitized);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="animate-fade-in pb-20 relative">
            <style>
                {`
                @media print {
                    @page { margin: 20mm; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    
                    html, body, #root, .animate-fade-in { 
                        display: block !important;
                        height: auto !important; 
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .space-y-8 > * + * { margin-top: 0 !important; }
                    .space-y-4 > * + * { margin-top: 0 !important; }

                    .print-card { 
                        display: block !important;
                        box-shadow: none !important; 
                        border: 1px solid #e2e8f0 !important; 
                        margin-bottom: 3rem !important;
                        page-break-inside: avoid !important;
                        padding: 2rem !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-card-selected {
                        display: block !important;
                    }
                    .print-card-not-selected {
                        display: none !important;
                    }
                    body { background: white !important; }
                }
                `}
            </style>

            {/* Header - Sticky */}
            <div className="sticky top-0 z-50 bg-slate-50 dark:bg-dark-950 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Publicações DJEN</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Consulte publicações do Diário de Justiça Eletrônico Nacional.</p>
                    </div>

                    <button
                        onClick={() => handleSearch(1)}
                        disabled={loading}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        Buscar Publicações
                    </button>
                </div>
            </div>

            <div className="p-4 md:px-8 pt-2">

                {/* Filters Card */}
                <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 no-print">
                    <div className="flex flex-wrap lg:flex-nowrap gap-6">

                        {/* Multi-select OAB Dropdown with Manual Entry */}
                        <div className="flex-1 min-w-[300px] flex flex-col gap-1.5" ref={oabDropdownRef}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">OABs da Equipe</span>
                            <div className="relative">
                                <div className="w-full flex items-center pl-4 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all min-h-[46px]">
                                    <User className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                                    <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
                                        {selectedOabs.map(o => (
                                            <span key={o} className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                                                {o}
                                                <X size={10} className="cursor-pointer hover:text-blue-600" onClick={() => toggleOab(o)} />
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder={selectedOabs.length === 0 ? "Digitar OAB ou selecionar..." : ""}
                                            value={manualOab}
                                            onChange={(e) => setManualOab(e.target.value)}
                                            onKeyDown={handleAddManualOab}
                                            onFocus={() => setIsOabDropdownOpen(true)}
                                            className="bg-transparent border-none outline-none text-sm placeholder:text-slate-400 flex-1 min-w-[80px]"
                                        />
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-slate-400 cursor-pointer transition-transform ${isOabDropdownOpen ? 'rotate-180' : ''}`}
                                        onClick={() => setIsOabDropdownOpen(!isOabDropdownOpen)}
                                    />
                                </div>

                                {isOabDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl shadow-2xl z-50 p-2 py-2 animate-scale-in max-h-60 overflow-y-auto custom-scrollbar">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase px-3 py-1.5 mb-1 border-b border-slate-100 dark:border-dark-700 pb-1">Sugestões e Equipe</p>
                                        {oabOptions.map(o => (
                                            <label key={o} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-dark-700 rounded-lg cursor-pointer transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOabs.includes(o)}
                                                    onChange={() => toggleOab(o)}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedOabs.includes(o) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'}`}>
                                                    {selectedOabs.includes(o) && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{o}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* UF Selection - Narrowed */}
                        <div className="w-24 shrink-0 flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">UF</span>
                            <select
                                value={uf}
                                onChange={(e) => setUf(e.target.value)}
                                className="w-full px-2 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium h-[46px]"
                            >
                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>

                        {/* Processo - Expanded */}
                        <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Processo</span>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Número CNJ"
                                    value={processo}
                                    onChange={(e) => setProcesso(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-[46px] font-mono"
                                />
                            </div>
                        </div>

                        {/* Datas */}
                        <div className="w-40 shrink-0 flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Disp. Início</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-[46px]"
                            />
                        </div>
                        <div className="w-40 shrink-0 flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Disp. Fim</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-[46px]"
                            />
                        </div>
                    </div>


                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/50">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                </div>

                {/* Results List */}
                <div className="space-y-4">
                    {results.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center px-2 no-print">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Total de {totalCount} resultado(s) encontrados
                                </span>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleToggleAll}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-dark-750 transition-all active:scale-95"
                                    >
                                        {selectedItems.size === results.length && results.length > 0 ? (
                                            <>
                                                <X size={16} className="text-red-500" />
                                                Desmarcar Todas
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} className="text-green-500" />
                                                Selecionar Todas
                                            </>
                                        )}
                                    </button>

                                    {selectedItems.size > 0 && (
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg active:scale-95"
                                        >
                                            <Printer size={16} />
                                            Imprimir Selecionadas ({selectedItems.size})
                                        </button>
                                    )}
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSearch(pageNumber - 1)}
                                                disabled={pageNumber === 1 || loading}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className="text-sm font-bold w-12 text-center text-slate-700 dark:text-slate-300">{pageNumber} / {totalPages}</span>
                                            <button
                                                onClick={() => handleSearch(pageNumber + 1)}
                                                disabled={pageNumber === totalPages || loading}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {results.map((item) => (
                                <div
                                    key={item.id}
                                    className={`group bg-white dark:bg-dark-900 rounded-2xl p-6 border transition-all duration-300 relative print-card ${selectedItems.has(item.id)
                                        ? 'border-blue-500 shadow-xl bg-blue-50/10 dark:bg-blue-900/5 print-card-selected'
                                        : 'border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-dark-700 print-card-not-selected'
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    <div className="absolute top-4 left-4 no-print">
                                        <div
                                            onClick={() => toggleSelection(item.id)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${selectedItems.has(item.id)
                                                ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30'
                                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-800 hover:border-blue-400'
                                                }`}
                                        >
                                            {selectedItems.has(item.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4 pl-8 no-print:pl-8">
                                        <div className="pl-6 no-print:pl-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                                    {item.siglaTribunal}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    Disp: {formatDateForDisplay(item.data_disponibilizacao)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                                {item.nomeOrgao}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1.5">
                                                {item.numero_processo}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 no-print">
                                            {(() => {
                                                const existingCase = findProcessInDatabase(item.numero_processo);
                                                if (existingCase) {
                                                    return (
                                                        <button
                                                            onClick={() => handleCreateDeadline(item.numero_processo)}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-500 hover:text-white transition-all active:scale-95"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            Criar Prazo
                                                        </button>
                                                    );
                                                } else {
                                                    return (
                                                        <button
                                                            onClick={() => {
                                                                setPendingProcessNumber(item.numero_processo);
                                                                setShowCaseModal(true);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            Cadastrar Processo
                                                        </button>
                                                    );
                                                }
                                            })()}

                                            {item.link && (
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-900 hover:text-white transition-all"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Ver Original
                                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-dark-950/40 p-5 rounded-2xl border border-slate-100 dark:border-dark-800 mb-4 transition-colors group-hover:bg-white dark:group-hover:bg-dark-950/70 border-dashed print:bg-white print:p-0 print:border-none">
                                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed transition-all text-justify">
                                            {sanitizeText(item.texto)}
                                        </p>
                                    </div>

                                    {item.destinatarioadvogados && item.destinatarioadvogados.length > 0 && (
                                        <div className="border-t border-slate-100 dark:border-dark-800 pt-4 no-print">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Advogados Intimados</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.destinatarioadvogados.map((adv) => {
                                                    const isTeam = isTeamLawyer(adv.advogado.nome);
                                                    return (
                                                        <span
                                                            key={adv.id}
                                                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${isTeam
                                                                ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-lg shadow-blue-500/30 scale-105 z-10'
                                                                : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-dark-750'
                                                                }`}
                                                        >
                                                            {adv.advogado.nome} ({adv.advogado.numero_oab}/{adv.advogado.uf_oab})
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    ) : (
                        !loading && <div className="text-center py-24 text-slate-400 animate-fade-in no-print">
                            <Search className="h-16 w-16 mx-auto mb-6 opacity-10" />
                            <h4 className="text-xl font-bold text-slate-300 dark:text-slate-700 mb-2">Pronto para pesquisar</h4>
                            <p className="text-sm max-w-xs mx-auto">Utilize os filtros acima para consultar publicações e criar prazos sem sair da página.</p>
                        </div>
                    )}
                </div>

                {/* In-page Deadline Modal */}
                {showDeadlineModal && (
                    <CalculatorModal
                        onClose={() => setShowDeadlineModal(false)}
                        cases={cases}
                        onSave={(d) => {
                            addDeadline(d);
                            setShowDeadlineModal(false);
                        }}
                        initialCaseSearch={pendingProcessNumber}
                        holidays={holidays}
                    />
                )}
                {/* Case Registration Modal */}
                {showCaseModal && (
                    <CaseModal
                        onClose={() => setShowCaseModal(false)}
                        onSave={(caseData) => {
                            addCase(caseData);
                            setShowCaseModal(false);
                        }}
                        clients={clients}
                        cases={cases}
                        initialNumber={pendingProcessNumber}
                    />
                )}
            </div>
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, FileText, ExternalLink, ChevronLeft, ChevronRight, User, Briefcase, Plus, X, ChevronDown, Check, Eye, CalendarPlus, FolderPlus, Copy } from 'lucide-react';
import { fetchPublications } from '../utils/djen';
import { DJENItem } from '../types';
import { useStore } from '../context/Store';
import { CalculatorModal } from '../components/CalculatorModal';
import { CaseModal } from '../components/CaseModal';
import { sanitizeCNJ, formatCNJ } from '../utils/cnjUtils';
import { DateRangePicker } from '../components/DateRangePicker';

const AnimatedCounter: React.FC<{ target: number, duration?: number }> = ({ target, duration = 800 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const runtime = currentTime - startTime;
            const progress = Math.min(runtime / duration, 1);

            // Ease out quint
            const easedProgress = 1 - Math.pow(1 - progress, 5);

            setCount(Math.floor(easedProgress * target));

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [target, duration]);

    return <span>{count}</span>;
};

interface PublicationsProps {
    setPage: (page: string) => void;
}

export const Publications: React.FC<PublicationsProps> = ({ setPage }) => {
    const { theme, teamMembers, cases, addDeadline, holidays, addCase, clients } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<DJENItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [selectedOabs, setSelectedOabs] = useState<string[]>(['5173']);
    const [uf, setUf] = useState('RJ');
    const [processo, setProcesso] = useState('');
    const todayYMD = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(todayYMD);
    const [endDate, setEndDate] = useState(todayYMD);

    // Pagination
    const [pageNumber, setPageNumber] = useState(1);
    const itemsPerPage = 30;

    // Modal State
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const [showCaseModal, setShowCaseModal] = useState(false);
    const [showMultiModal, setShowMultiModal] = useState(false);
    const [pendingProcessNumber, setPendingProcessNumber] = useState('');

    // Dropdown State
    const [isOabDropdownOpen, setIsOabDropdownOpen] = useState(false);
    const [manualOab, setManualOab] = useState('');
    // Selection State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [readItems, setReadItems] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [detailItem, setDetailItem] = useState<DJENItem | null>(null);
    const oabDropdownRef = useRef<HTMLDivElement>(null);

    const markAsRead = (id: string) => {
        setReadItems(prev => {
            if (prev.has(id)) return prev;
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

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
                const { filters, results: savedResults, totalCount: savedTotal, page: savedPage, readItems: savedRead } = JSON.parse(savedData);
                if (filters.selectedOabs) setSelectedOabs(filters.selectedOabs);
                if (filters.uf) setUf(filters.uf);
                if (filters.processo) setProcesso(filters.processo);
                if (filters.startDate) setStartDate(filters.startDate);
                if (filters.endDate) setEndDate(filters.endDate);
                if (savedResults) setResults(savedResults);
                if (savedTotal) setTotalCount(savedTotal);
                if (savedPage) setPageNumber(savedPage);
                if (savedRead) setReadItems(new Set(savedRead));
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
            page: pageNumber,
            readItems: Array.from(readItems)
        };
        localStorage.setItem('lexprime_publications_state', JSON.stringify(stateToSave));
    }, [selectedOabs, uf, processo, startDate, endDate, results, totalCount, pageNumber, readItems]);

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

    const handleSearch = async (e?: React.MouseEvent) => {
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

            if (selectedOabs.length > 0) {
                const fetchAllForOab = async (oabVal: string) => {
                    let items: DJENItem[] = [];
                    let page = 1;
                    let hasMore = true;
                    while (hasMore) {
                        const resp = await fetchPublications({
                            numeroOab: oabVal,
                            ufOab: uf,
                            numeroProcesso: processo || undefined,
                            dataDisponibilizacaoInicio: startDate || undefined,
                            dataDisponibilizacaoFim: endDate || undefined,
                            pagina: page,
                            itensPorPagina: 100
                        });
                        items.push(...(resp.items || []));
                        if (!resp.items || resp.items.length < 100 || items.length >= 1000) {
                            hasMore = false;
                        } else {
                            page++;
                        }
                    }
                    return items;
                };

                const responses = await Promise.all(selectedOabs.map(oabVal => fetchAllForOab(oabVal)));

                const seenIds = new Set();
                responses.forEach(items => {
                    items.forEach(item => {
                        if (!seenIds.has(item.id)) {
                            allItems.push(item);
                            seenIds.add(item.id);
                        }
                    });
                });

                allItems.sort((a, b) => new Date(b.data_disponibilizacao).getTime() - new Date(a.data_disponibilizacao).getTime());
            } else if (processo) {
                let page = 1;
                let hasMore = true;
                while (hasMore) {
                     const response = await fetchPublications({
                        numeroProcesso: processo.replace(/\D/g, ''),
                        dataDisponibilizacaoInicio: startDate || undefined,
                        dataDisponibilizacaoFim: endDate || undefined,
                        pagina: page,
                        itensPorPagina: 100
                    });
                    allItems.push(...(response.items || []));
                    if (!response.items || response.items.length < 100 || allItems.length >= 1000) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                }
            }

            setResults(allItems);
            setTotalCount(allItems.length);
            setPageNumber(1);
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

    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
    const displayedResults = results.slice((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage);

    return (
        <div className={`animate-fade-in pb-20 relative min-h-full ${theme === 'hybrid' ? 'bg-[#222e35]' : ''}`}>
            <style>
                {`
                @media print {
                    @page { margin: 15mm; size: A4; }

                    /* CRITICAL: Force natural document flow for printing */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                    }

                    /* Hide sidebar, navbar and anything we don't need */
                    nav, aside, header, .no-print, .publications-main-view {
                        display: none !important;
                    }

                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .publications-print-view {
                        display: block !important;
                        visibility: visible !important;
                        position: static !important;
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    /* Flow normally for pagination */
                    .print-modal-wrapper, 
                    .print-modal-content,
                    #print-section {
                        position: static !important;
                        display: block !important;
                        visibility: visible !important;
                        height: auto !important;
                        max-height: none !important;
                        width: 100% !important;
                        transform: none !important;
                        overflow: visible !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    #print-section * {
                        visibility: visible !important;
                        color: #000 !important; /* Force black text */
                    }

                    /* --- Typography & Spacing --- */
                    
                    .print-pub-text {
                        font-size: 11pt !important;
                        line-height: 1.5 !important;
                        text-align: justify !important;
                        white-space: pre-wrap !important;
                        margin-top: 15px !important;
                    }

                    .print-meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                        /* Try to keep metadata together */
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    .print-meta-label {
                        font-weight: 800;
                        font-size: 8pt;
                        text-transform: uppercase;
                        color: #555 !important;
                        margin-bottom: 2px;
                    }

                    .print-title {
                        font-family: monospace;
                        font-size: 15pt;
                        font-weight: 800;
                        margin-bottom: 10px;
                        /* Never break right after title */
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }

                    /* Publication Container - Allow natural breaks to save paper */
                    .print-item-container {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                        border-bottom: 2px dashed #999 !important;
                        padding-bottom: 25px !important;
                        margin-bottom: 25px !important;
                        display: block !important;
                        width: 100% !important;
                    }

                    .print-item-container:last-child {
                        border-bottom: none !important;
                        margin-bottom: 0 !important;
                        padding-bottom: 0 !important;
                    }
                }
                `}
            </style>

            <div className="publications-main-view">
                {/* Header - Sticky */}
                <div className={`sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${theme === 'hybrid'
                ? 'bg-[#202c33] border-emerald-500/20'
                : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800'
                }`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>Publicações DJEN</h1>

                            {/* Animated Results Badge */}
                            {totalCount > 0 && (
                                <div key={totalCount} className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm animate-scale-in group border ${theme === 'hybrid' 
                                    ? 'bg-[#00a884]/10 border-[#00a884]/20' 
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
                                    <FileText size={14} className={theme === 'hybrid' ? 'text-[#00a884]' : 'text-blue-600 dark:text-blue-400'} />
                                    <span className={`text-xs font-bold whitespace-nowrap ${theme === 'hybrid' ? 'text-[#00a884]' : 'text-blue-700 dark:text-blue-300'}`}>
                                        <AnimatedCounter target={totalCount} /> Encontradas
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className={`text-sm mt-1 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500 dark:text-slate-400'}`}>Consulte publicações do Diário de Justiça Eletrá´nico Nacional.</p>
                    </div>

                    <button
                        onClick={(e) => handleSearch(e)}
                        disabled={loading}
                        className={`w-full md:w-auto mt-3 md:mt-0 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${theme === 'hybrid' 
                            ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'}`}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        Buscar Publicações
                    </button>
                </div>
            </div>

            <div className="p-4 md:px-8 pt-2">

                {/* Filters Card */}
                <div className={`rounded-2xl p-6 border space-y-6 no-print transition-all ${theme === 'hybrid' 
                    ? 'bg-[#2a3942] border-[#354751] shadow-md shadow-black/10' 
                    : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 shadow-xl shadow-slate-200/50 dark:shadow-none'}`}>
                    <div className="flex flex-wrap lg:flex-nowrap gap-6">

                        {/* Multi-select OAB Dropdown with Manual Entry */}
                        <div className="flex-1 min-w-[480px] flex flex-col gap-1.5" ref={oabDropdownRef}>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>OABs da Equipe</span>
                            <div className="relative">
                                <div className={`w-full flex items-center pl-4 pr-3 py-1.5 rounded-xl border transition-all min-h-[46px] ${theme === 'hybrid' 
                                    ? 'bg-transparent border-[#354751] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500' 
                                    : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'}`}>
                                    <User className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                                    <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
                                        {selectedOabs.map(o => (
                                            <span key={o} className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300`}>
                                                {o}
                                                <X size={10} className="cursor-pointer hover:opacity-70" onClick={(e) => { e.stopPropagation(); toggleOab(o); }} />
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder={selectedOabs.length === 0 ? "Digitar OAB ou selecionar..." : ""}
                                            value={manualOab}
                                            onChange={(e) => setManualOab(e.target.value)}
                                            onKeyDown={handleAddManualOab}
                                            onFocus={() => setIsOabDropdownOpen(true)}
                                            className={`bg-transparent border-none outline-none text-sm flex-1 ${selectedOabs.length >= 5 ? 'min-w-[10px]' : 'min-w-[80px]'} ${theme === 'hybrid' ? 'text-[#e9edef] placeholder:text-[#aebac1]/50' : 'placeholder:text-slate-400'}`}
                                        />
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-slate-400 cursor-pointer transition-transform ${isOabDropdownOpen ? 'rotate-180' : ''}`}
                                        onClick={() => setIsOabDropdownOpen(!isOabDropdownOpen)}
                                    />
                                </div>

                                {isOabDropdownOpen && (
                                    <div className={`absolute top-full left-0 w-full mt-1 border rounded-xl shadow-2xl z-50 p-2 py-2 animate-scale-in max-h-60 overflow-y-auto custom-scrollbar ${theme === 'hybrid' 
                                        ? 'bg-[#2a3942] border-[#354751] shadow-black/40' 
                                        : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 shadow-2xl'}`}>
                                        <p className={`text-[9px] font-bold uppercase px-3 py-1.5 mb-1 border-b pb-1 ${theme === 'hybrid' 
                                            ? 'text-[#8696a0] border-[#354751]' 
                                            : 'text-slate-400 border-slate-100 dark:border-dark-700'}`}>Sugestões e Equipe</p>
                                        {oabOptions.map(o => (
                                            <label key={o} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors group ${theme === 'hybrid' 
                                                ? 'hover:bg-[#354751]' 
                                                : 'hover:bg-slate-50 dark:hover:bg-dark-700'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOabs.includes(o)}
                                                    onChange={() => toggleOab(o)}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedOabs.includes(o) 
                                                    ? 'bg-blue-600 border-blue-600' 
                                                    : (theme === 'hybrid' ? 'border-[#354751] group-hover:border-blue-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400')}`}>
                                                    {selectedOabs.includes(o) && <Check size={12} className="text-white" />}
                                                </div>
                                                <span className={`text-sm font-medium ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-700 dark:text-slate-300'}`}>{o}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* UF Selection - Narrowed */}
                        <div className="w-24 shrink-0 flex flex-col gap-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>UF</span>
                            <select
                                value={uf}
                                onChange={(e) => setUf(e.target.value)}
                                className={`w-full px-2 py-2.5 rounded-xl border outline-none transition-all font-medium h-[46px] ${theme === 'hybrid' 
                                    ? 'bg-transparent border-[#354751] text-[#e9edef] focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]' 
                                    : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
                            >
                                {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>

                        {/* Processo - Expanded */}
                        <div className="flex-1 min-w-[130px] flex flex-col gap-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Processo</span>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Número CNJ"
                                    value={processo}
                                    onChange={(e) => setProcesso(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all h-[46px] font-mono ${theme === 'hybrid' 
                                        ? 'bg-transparent border-[#354751] text-[#e9edef] focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] placeholder:text-[#aebac1]/50' 
                                        : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                />
                            </div>
                        </div>

                        {/* Date Range Picker */}
                        <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Período de Disponibilização</span>
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
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


                {/* Results Table */}
                {results.length > 0 ? (
                    <div className="mt-2">
                        {/* Toolbar */}
                        <div className={`flex items-center justify-between px-1 mb-2 no-print`}>
                            <span className={`text-xs font-medium ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>
                                {selectedItems.size > 0 ? `${selectedItems.size} selecionada(s)` : `${results.length} publicações`}
                            </span>
                            <div className="flex items-center gap-3">
                                {selectedItems.size > 0 && (
                                    <button
                                        onClick={() => setShowMultiModal(true)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow active:scale-95 ${theme === 'hybrid'
                                            ? 'bg-[#00a884] text-white hover:bg-[#008f6f]'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        <Eye size={13} /> Ver Selecionadas ({selectedItems.size})
                                    </button>
                                )}
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber === 1 || loading}
                                            className={`p-1 rounded disabled:opacity-30 ${theme === 'hybrid' ? 'hover:bg-[#354751] text-[#aebac1]' : 'hover:bg-slate-100 text-slate-600'}`}>
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className={`text-xs font-bold ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-700'}`}>{pageNumber}/{totalPages}</span>
                                        <button onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))} disabled={pageNumber === totalPages || loading}
                                            className={`p-1 rounded disabled:opacity-30 ${theme === 'hybrid' ? 'hover:bg-[#354751] text-[#aebac1]' : 'hover:bg-slate-100 text-slate-600'}`}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className={`rounded-xl border overflow-hidden ${theme === 'hybrid' ? 'border-[#354751]' : 'border-slate-200'}`}>
                            <table className="w-full table-fixed text-sm">
                                <colgroup>
                                    <col style={{ width: '3%' }} />
                                    <col style={{ width: '3%' }} />
                                    <col style={{ width: '20%' }} />
                                    <col style={{ width: '34%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                </colgroup>
                                <thead>
                                    <tr className={`text-xs font-bold uppercase tracking-widest border-b ${theme === 'hybrid' ? 'bg-[#202c33] text-[#8696a0] border-[#354751]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                        <th className="pl-3 py-3 text-center">#</th>
                                        <th className="pl-1 py-3 text-center">
                                            <div
                                                onClick={handleToggleAll}
                                                className={`w-4 h-4 mx-auto rounded border flex items-center justify-center cursor-pointer transition-all ${selectedItems.size === results.length && results.length > 0
                                                    ? (theme === 'hybrid' ? 'bg-[#00a884] border-[#00a884]' : 'bg-blue-600 border-blue-600')
                                                    : (theme === 'hybrid' ? 'border-[#8696a0]/40' : 'border-slate-300')}`}
                                            >
                                                {selectedItems.size === results.length && results.length > 0 && <Check size={10} className="text-white" strokeWidth={3} />}
                                            </div>
                                        </th>
                                        <th className="pl-3 py-3 text-left">Processo</th>
                                        <th className="pl-3 py-3 text-left">Partes</th>
                                        <th className="pl-3 py-3 text-left">Tribunal</th>
                                        <th className="pl-3 py-3 text-left">Classe</th>
                                        <th className="pl-3 py-3 text-left">Data de Disp.</th>
                                        <th className="pr-4 py-3 text-center w-[100px]">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedResults.map((item, idx) => {
                                        const seqNum = ((pageNumber - 1) * itemsPerPage) + idx + 1;
                                        const existingCase = findProcessInDatabase(item.numero_processo);
                                        const isSelected = selectedItems.has(item.id);
                                        const isRead = readItems.has(item.id);
                                        const parties = (item.destinatarios || []).map(d => d.nome).join(' X ');
                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() => toggleSelection(item.id)}
                                                className={`border-b last:border-b-0 cursor-pointer transition-colors group print-card ${isSelected ? 'print-card-selected' : 'print-card-not-selected'} ${theme === 'hybrid'
                                                    ? (isSelected ? 'bg-[#00a884]/10 border-[#354751]' : idx % 2 === 0 ? 'bg-[#2a3942] border-[#354751] hover:bg-[#354751]/60' : 'bg-[#222e35] border-[#354751] hover:bg-[#354751]/60')
                                                    : (isSelected ? 'bg-blue-50 border-slate-200' : idx % 2 === 0 ? 'bg-white border-slate-100 hover:bg-slate-50' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/70')}`}
                                            >
                                                {/* Seq Num */}
                                                <td className="pl-3 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {isRead && (
                                                            <Check 
                                                                size={12} 
                                                                strokeWidth={4} 
                                                                className={theme === 'hybrid' ? 'text-[#00a884]' : 'text-green-600'} 
                                                                title="Lida"
                                                            />
                                                        )}
                                                        <span className={`text-[11px] font-bold ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'} ${isRead ? (theme === 'hybrid' ? 'text-[#00a884]' : 'text-green-600') : ''}`}>
                                                            {seqNum}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Checkbox */}
                                                <td className="pl-1 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                                    <div
                                                        onClick={() => toggleSelection(item.id)}
                                                        className={`w-4 h-4 mx-auto rounded border flex items-center justify-center cursor-pointer transition-all ${isSelected
                                                            ? (theme === 'hybrid' ? 'bg-[#00a884] border-[#00a884]' : 'bg-blue-600 border-blue-600')
                                                            : (theme === 'hybrid' ? 'border-[#8696a0]/40 group-hover:border-[#00a884]' : 'border-slate-300 group-hover:border-blue-500')}`}
                                                    >
                                                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                </td>

                                                {/* Processo */}
                                                <td className="pl-3 py-3.5" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-sm font-semibold truncate ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-800'}`}>
                                                            {formatCNJ(item.numero_processo)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleCopy(e, formatCNJ(item.numero_processo), item.id + '-proc')}
                                                            className={`shrink-0 flex items-center justify-center gap-1 px-1 py-0.5 rounded transition-all min-w-[20px] ${copiedId === item.id + '-proc' ? 'text-green-500 opacity-100 bg-green-500/10' : theme === 'hybrid' ? 'text-[#aebac1] opacity-40 hover:opacity-100 hover:text-[#e9edef]' : 'text-slate-400 opacity-40 hover:opacity-100 hover:text-slate-700'}`}
                                                            title={copiedId === item.id + '-proc' ? "Processo copiado!" : "Copiar número"}
                                                        >
                                                            {copiedId === item.id + '-proc' ? (
                                                                <>
                                                                    <Check size={11} strokeWidth={3} />
                                                                    <span className="text-[9px] font-bold">Copiado</span>
                                                                </>
                                                            ) : (
                                                                <Copy size={11} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Partes */}
                                                <td className="pl-3 py-3.5 pr-3">
                                                    <span
                                                        className={`text-sm line-clamp-2 leading-snug uppercase ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700'}`}
                                                        title={parties}
                                                    >
                                                        {parties || '—'}
                                                    </span>
                                                </td>

                                                {/* Tribunal */}
                                                <td className="pl-3 py-3.5">
                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block ${theme === 'hybrid' ? 'bg-[#354751] text-[#00a884]' : 'bg-blue-50 text-blue-700'}`}>
                                                        {item.siglaTribunal || '—'}
                                                    </span>
                                                </td>

                                                {/* Classe */}
                                                <td className="pl-3 py-3.5 pr-2">
                                                    <span
                                                        className={`text-xs uppercase line-clamp-2 leading-snug font-medium ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-500'}`}
                                                        title={item.nomeClasse || ''}
                                                    >
                                                        {item.nomeClasse || '—'}
                                                    </span>
                                                </td>

                                                {/* Data */}
                                                <td className="pl-3 py-3.5">
                                                    <span className={`text-sm tabular-nums whitespace-nowrap ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-600'}`}>
                                                        {formatDateForDisplay(item.data_disponibilizacao)}
                                                    </span>
                                                </td>

                                                {/* Ações */}
                                                <td className="pr-4 py-3.5 no-print" onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1 w-[84px] mx-auto">
                                                        {/* Ação Inteligente (Slot 1) */}
                                                        <div className="flex-[0_0_24px] flex justify-center">
                                                            {existingCase ? (
                                                                <button
                                                                    onClick={() => handleCreateDeadline(item.numero_processo)}
                                                                    title="Criar Prazo"
                                                                    className={`p-1.5 rounded-lg transition-colors ${theme === 'hybrid'
                                                                        ? 'text-amber-400 hover:bg-amber-500/10'
                                                                        : 'text-amber-500 hover:bg-amber-50'}`}
                                                                >
                                                                    <CalendarPlus size={15} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        setPendingProcessNumber(formatCNJ(item.numero_processo));
                                                                        setShowCaseModal(true);
                                                                    }}
                                                                    title="Cadastrar Processo"
                                                                    className={`p-1.5 rounded-lg transition-colors ${theme === 'hybrid'
                                                                        ? 'text-[#00a884] hover:bg-[#00a884]/10'
                                                                        : 'text-blue-500 hover:bg-blue-50'}`}
                                                                >
                                                                    <FolderPlus size={15} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {/* Ver Detalhes (Slot 2) */}
                                                        <div className="flex-[0_0_24px] flex justify-center">
                                                            <button
                                                                onClick={() => { setDetailItem(item); markAsRead(item.id); }}
                                                                title="Ver Publicação"
                                                                className={`p-1.5 rounded-lg transition-colors ${theme === 'hybrid'
                                                                    ? 'text-[#aebac1] hover:bg-[#354751] hover:text-[#e9edef]'
                                                                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                                            >
                                                                <Eye size={15} />
                                                            </button>
                                                        </div>
                                                        {/* Link Original (Slot 3) */}
                                                        <div className="flex-[0_0_24px] flex justify-center">
                                                            {item.link ? (
                                                                <a
                                                                    href={item.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={() => markAsRead(item.id)}
                                                                    title="Ver Original (DJEN)"
                                                                    className={`p-1.5 rounded-lg transition-colors ${theme === 'hybrid'
                                                                        ? 'text-[#aebac1] hover:bg-[#354751] hover:text-[#e9edef]'
                                                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                                                >
                                                                    <ExternalLink size={15} />
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    !loading && (
                        <div className={`text-center py-24 animate-fade-in no-print ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>
                            <Search className={`h-16 w-16 mx-auto mb-6 opacity-10 ${theme === 'hybrid' ? 'text-[#e9edef]' : ''}`} />
                            <h4 className={`text-xl font-bold mb-2 ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-300 dark:text-slate-700'}`}>Pronto para pesquisar</h4>
                            <p className="text-sm max-w-xs mx-auto">Utilize os filtros acima para consultar publicações e criar prazos sem sair da página.</p>
                        </div>
                    )
                )}
                </div>
            </div>

            <div className="publications-print-view">
                {/* Detail Modal (Eye) */}
                {detailItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setDetailItem(null)}>
                        <div
                            className={`relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-scale-in ${theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751]' : 'bg-white border-slate-200'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className={`flex items-start justify-between px-6 py-4 border-b shrink-0 ${theme === 'hybrid' ? 'bg-[#202c33]/60 border-[#354751]' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Publicação DJEN</p>
                                    <h3 className={`font-mono text-base font-bold ${theme === 'hybrid' ? 'text-[#00a884]' : 'text-blue-700'}`}>{formatCNJ(detailItem.numero_processo)}</h3>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        {detailItem.siglaTribunal && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${theme === 'hybrid' ? 'bg-[#354751] text-[#00a884]' : 'bg-blue-50 text-blue-700'}`}>{detailItem.siglaTribunal}</span>
                                        )}
                                        {detailItem.tipoComunicacao && (
                                            <span className={`text-xs ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500'}`}>{detailItem.tipoComunicacao}</span>
                                        )}
                                        <span className={`text-xs tabular-nums ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500'}`}>{formatDateForDisplay(detailItem.data_disponibilizacao)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    {detailItem.link && (
                                        <a href={detailItem.link} target="_blank" rel="noopener noreferrer"
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${theme === 'hybrid' ? 'bg-[#354751] text-[#e9edef] border-[#425866] hover:bg-[#425866]' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}>
                                            <ExternalLink size={13} /> Ver Original
                                        </a>
                                    )}
                                    <button onClick={() => setDetailItem(null)} className={`p-1.5 rounded-lg transition-colors ${theme === 'hybrid' ? 'text-[#aebac1] hover:bg-[#354751]' : 'text-slate-400 hover:bg-slate-100'}`}>
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Meta Info */}
                            {(detailItem.destinatarios?.length > 0 || detailItem.destinatarioadvogados?.length > 0 || detailItem.nomeOrgao || detailItem.nomeClasse) && (
                                <div className={`px-6 py-3 border-b shrink-0 grid grid-cols-2 gap-x-6 gap-y-2 ${theme === 'hybrid' ? 'border-[#354751] bg-[#202c33]/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                    {detailItem.nomeOrgao && (
                                        <div>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Órgão</p>
                                            <p className={`text-xs font-medium mt-0.5 ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700'}`}>{detailItem.nomeOrgao}</p>
                                        </div>
                                    )}
                                    {detailItem.nomeClasse && (
                                        <div>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Classe</p>
                                            <p className={`text-xs font-medium mt-0.5 ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700'}`}>{detailItem.nomeClasse}</p>
                                        </div>
                                    )}
                                    {detailItem.destinatarios && detailItem.destinatarios.length > 0 && (
                                        <div>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Partes</p>
                                            <p className={`text-xs mt-0.5 ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700'}`}>{detailItem.destinatarios.map(d => d.nome).join(' á— ')}</p>
                                        </div>
                                    )}
                                    {detailItem.destinatarioadvogados && detailItem.destinatarioadvogados.length > 0 && (
                                        <div>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Advogado(s)</p>
                                            <div className="mt-0.5 space-y-0.5">
                                                {detailItem.destinatarioadvogados.map(adv => {
                                                    const isTeam = isTeamLawyer(adv.advogado.nome);
                                                    return (
                                                        <p key={adv.id} className={`text-xs ${isTeam ? (theme === 'hybrid' ? 'text-[#00a884] font-bold' : 'text-blue-700 font-bold') : (theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500')}`}>
                                                            {adv.advogado.nome} – OAB {adv.advogado.uf_oab}/{adv.advogado.numero_oab}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Publication Text */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
                                <p className={`text-sm whitespace-pre-wrap leading-relaxed text-justify ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700'}`}>
                                    {sanitizeText(detailItem.texto)}
                                </p>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className={`flex items-center justify-end gap-2 px-6 py-3 border-t shrink-0 ${theme === 'hybrid' ? 'border-[#354751] bg-[#202c33]/40' : 'border-slate-100 bg-slate-50'}`}>
                                {findProcessInDatabase(detailItem.numero_processo) ? (
                                    <button
                                        onClick={() => { handleCreateDeadline(detailItem.numero_processo); setDetailItem(null); }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${theme === 'hybrid' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-white' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white'}`}
                                    >
                                        <CalendarPlus size={14} /> Criar Prazo
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setPendingProcessNumber(formatCNJ(detailItem.numero_processo)); setShowCaseModal(true); setDetailItem(null); }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${theme === 'hybrid' ? 'bg-[#00a884]/10 text-[#00a884] border-[#00a884]/30 hover:bg-[#00a884] hover:text-white' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white'}`}
                                    >
                                        <FolderPlus size={14} /> Cadastrar Processo
                                    </button>
                                )}
                                <button onClick={() => setDetailItem(null)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'hybrid' ? 'bg-[#354751] text-[#e9edef] hover:bg-[#425866]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                        teamMembers={teamMembers}
                    />
                )}
                {/* Multi Detail Modal for Selected Items */}
                {showMultiModal && (
                    <div className="print-modal-wrapper fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowMultiModal(false)}>
                        <div
                            className={`print-modal-content relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden animate-scale-in ${theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751]' : 'bg-white border-slate-200'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`no-print flex items-center justify-between px-6 py-4 border-b shrink-0 ${theme === 'hybrid' ? 'bg-[#202c33]/60 border-[#354751]' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <h3 className={`font-bold text-lg ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-800'}`}>Publicações Selecionadas</h3>
                                    <p className={`text-sm ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-500'}`}>{selectedItems.size} publicação(ões)</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setShowMultiModal(false)} className={`p-2 rounded-xl transition-colors ${theme === 'hybrid' ? 'text-[#aebac1] hover:bg-[#354751]' : 'text-slate-400 hover:bg-slate-100'}`}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-0 bg-white" id="print-section">
                                {Array.from(selectedItems).map(id => results.find(r => r.id === id)).filter(Boolean).map((item, index, array) => (
                                    <div key={item!.id} className={`print-item-container p-8 ${index !== array.length - 1 ? 'border-b border-dashed border-slate-300' : ''}`}>
                                        <div className="print-title text-slate-800">
                                            {formatCNJ(item!.numero_processo)}
                                        </div>
                                        
                                        <div className="print-meta-grid text-slate-700">
                                            {item!.nomeOrgao && (
                                                <div>
                                                    <p className="print-meta-label">Órgão / Tribunal</p>
                                                    <p className="text-sm font-medium">{item!.siglaTribunal} - {item!.nomeOrgao}</p>
                                                </div>
                                            )}
                                            {item!.nomeClasse && (
                                                <div>
                                                    <p className="print-meta-label">Classe</p>
                                                    <p className="text-sm font-medium">{item!.nomeClasse}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="print-meta-label">Data Disp.</p>
                                                <p className="text-sm font-medium">{formatDateForDisplay(item!.data_disponibilizacao)}</p>
                                            </div>
                                            {item!.tipoComunicacao && (
                                                <div>
                                                    <p className="print-meta-label">Tipo da Comunicação</p>
                                                    <p className="text-sm font-medium">{item!.tipoComunicacao}</p>
                                                </div>
                                            )}
                                            {item!.destinatarios && item!.destinatarios.length > 0 && (
                                                <div className="col-span-2">
                                                    <p className="print-meta-label">Partes</p>
                                                    <p className="text-sm">{item!.destinatarios.map(d => d.nome).join(' X ')}</p>
                                                </div>
                                            )}
                                            {item!.destinatarioadvogados && item!.destinatarioadvogados.length > 0 && (
                                                <div className="col-span-2">
                                                    <p className="print-meta-label">Advogados Citados</p>
                                                    <div className="text-sm space-y-0.5">
                                                        {item!.destinatarioadvogados.map(adv => (
                                                            <p key={adv.id}>{adv.advogado.nome} – OAB {adv.advogado.uf_oab}/{adv.advogado.numero_oab}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="print-pub-text text-slate-800">
                                            {sanitizeText(item!.texto)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, FileText, ExternalLink, ChevronLeft, ChevronRight, User, Briefcase, Plus, X, ChevronDown, Check, Printer } from 'lucide-react';
import { fetchPublications } from '../utils/djen';
import { DJENItem } from '../types';
import { useStore } from '../context/Store';
import { CalculatorModal } from '../components/CalculatorModal';
import { CaseModal } from '../components/CaseModal';
import { sanitizeCNJ, formatCNJ } from '../utils/cnjUtils';

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

        // Temporarily change title to remove "LexPrime" from print header
        const originalTitle = document.title;
        document.title = "Publicações";

        window.print();

        // Restore original title
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
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
        <div className={`animate-fade-in pb-20 relative min-h-full ${theme === 'hybrid' ? 'bg-[#222e35]' : ''}`}>
            <style>
                {`
                @media print {
                    @page {
                        margin: 10mm 10mm;
                        size: A4;
                    }

                    /* ===== 1. HIDE ALL UI / BRANDING ===== */
                    aside,
                    nav,
                    [class*="Navbar"],
                    header,
                    .no-print {
                        display: none !important;
                    }

                    /* ===== 2. RESET GLOBAL LAYOUT ===== */
                    html, body, #root {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        position: relative !important;
                        background: white !important;
                        color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .animate-fade-in,
                    [class*="animate-"] {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        position: relative !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        animation: none !important;
                    }

                    main, [role="main"], .flex-1 {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        position: relative !important;
                    }

                    /* Remove gap heights between items in lists */
                    .space-y-4 > * + * { margin-top: 5px !important; }

                    /* ===== 3. PUBLICATION CARD ===== */
                    .print-card {
                        display: block !important;
                        width: 100% !important;
                        margin-bottom: 12px !important;
                        padding: 0 !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        background: white !important;
                        border: 1px solid #000 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        ring: none !important;
                        outline: none !important;
                    }

                    /* Show ONLY selected cards */
                    .print-card-selected {
                        display: block !important;
                    }
                    .print-card-not-selected {
                        display: none !important;
                    }

                    /* ===== 4. PROCESS HEADER BAR (AASP Style) ===== */
                    .print-card-header {
                        background: #f3f4f6 !important;
                        border-bottom: 1px solid #000 !important;
                        padding: 6px 10px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                    }
                    .print-card-header span {
                        color: #000 !important;
                        font-weight: 700 !important;
                        font-size: 11pt !important;
                        background: transparent !important;
                        border: none !important;
                    }

                    /* ===== 5. TWO-COLUMN GRID ===== */
                    .pub-card-grid {
                        display: flex !important;
                        flex-direction: row !important;
                        width: 100% !important;
                    }

                    /* Left column: Metadata (35%) */
                    .pub-card-meta {
                        width: 35% !important;
                        min-width: 35% !important;
                        max-width: 35% !important;
                        border-right: 1px solid #000 !important;
                        padding: 8px !important;
                        box-sizing: border-box !important;
                        display: block !important;
                    }

                    /* Right column: Text (65%) */
                    .pub-card-content {
                        width: 65% !important;
                        min-width: 65% !important;
                        max-width: 65% !important;
                        padding: 8px 10px !important;
                        box-sizing: border-box !important;
                        display: block !important;
                    }

                    /* ===== 6. TYPOGRAPHY & COLORS ===== */
                    .pub-card-meta *, .pub-card-content * {
                        color: #000 !important;
                        background: transparent !important;
                    }

                    /* Metadata structure */
                    .meta-block {
                        margin-bottom: 6px !important;
                    }
                    .meta-label {
                        font-weight: 700 !important;
                        font-size: 10pt !important;
                        text-transform: uppercase !important;
                        display: inline !important;
                        margin-right: 4px !important;
                    }
                    .meta-text {
                        font-size: 11pt !important;
                        display: inline !important;
                    }
                    
                    .meta-list {
                        margin: 0 !important;
                        padding-left: 0 !important;
                        list-style-type: none !important;
                    }
                    .meta-list li {
                        font-size: 11pt !important;
                        margin-bottom: 2px !important;
                        display: block !important;
                    }

                    .meta-lawyer-highlight {
                        font-weight: 700 !important;
                    }

                    /* Hide icons in print */
                    .pub-card-meta svg, .pub-card-content svg {
                        display: none !important;
                    }

                    /* Publication text body */
                    .pub-card-text-container p {
                        font-size: 11pt !important;
                        line-height: 1.3 !important;
                        text-align: justify !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* ===== 8. MISC CLEANUP ===== */
                    [class*="shadow"] { box-shadow: none !important; }
                    [class*="rounded"] { border-radius: 0 !important; }
                    .desktop-only-bg { background: none !important; }
                }
                `}
            </style>

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
                        <p className={`text-sm mt-1 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500 dark:text-slate-400'}`}>Consulte publicações do Diário de Justiça Eletrônico Nacional.</p>
                    </div>

                    <button
                        onClick={() => handleSearch(1)}
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
                        <div className="flex-1 min-w-[300px] flex flex-col gap-1.5" ref={oabDropdownRef}>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>OABs da Equipe</span>
                            <div className="relative">
                                <div className={`w-full flex items-center pl-4 pr-3 py-1.5 rounded-xl border transition-all min-h-[46px] ${theme === 'hybrid' 
                                    ? 'bg-transparent border-[#354751] focus-within:ring-2 focus-within:ring-[#00a884]/20 focus-within:border-[#00a884]' 
                                    : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'}`}>
                                    <User className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                                    <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
                                        {selectedOabs.map(o => (
                                            <span key={o} className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${theme === 'hybrid' 
                                                ? 'bg-[#00a884]/20 text-[#00a884]' 
                                                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>
                                                {o}
                                                <X size={10} className="cursor-pointer hover:opacity-70" onClick={() => toggleOab(o)} />
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder={selectedOabs.length === 0 ? "Digitar OAB ou selecionar..." : ""}
                                            value={manualOab}
                                            onChange={(e) => setManualOab(e.target.value)}
                                            onKeyDown={handleAddManualOab}
                                            onFocus={() => setIsOabDropdownOpen(true)}
                                            className={`bg-transparent border-none outline-none text-sm flex-1 min-w-[80px] ${theme === 'hybrid' ? 'text-[#e9edef] placeholder:text-[#aebac1]/50' : 'placeholder:text-slate-400'}`}
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
                                                    ? (theme === 'hybrid' ? 'bg-[#00a884] border-[#00a884]' : 'bg-blue-600 border-blue-600') 
                                                    : (theme === 'hybrid' ? 'border-[#354751] group-hover:border-[#00a884]' : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400')}`}>
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
                        <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
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

                        {/* Datas */}
                        <div className="w-40 shrink-0 flex flex-col gap-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Disp. Início</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all h-[46px] ${theme === 'hybrid' 
                                    ? 'bg-transparent border-[#354751] text-[#e9edef] focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]' 
                                    : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
                            />
                        </div>
                        <div className="w-40 shrink-0 flex flex-col gap-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Disp. Fim</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all h-[46px] ${theme === 'hybrid' 
                                    ? 'bg-transparent border-[#354751] text-[#e9edef] focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884]' 
                                    : 'bg-slate-50 dark:bg-dark-800 border-slate-200 dark:border-dark-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
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
                                <div className="flex items-center gap-4 ml-auto">
                                    <button
                                        onClick={handleToggleAll}
                                        className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all active:scale-95 ${theme === 'hybrid'
                                            ? 'bg-[#2a3942] border-[#354751] text-[#e9edef] hover:bg-[#354751]'
                                            : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-750'}`}
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
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${theme === 'hybrid'
                                                ? 'bg-[#00a884] text-white hover:bg-[#008f6f] shadow-[#00a884]/20'
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all shadow-lg active:scale-95'}`}
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
                                                className={`p-1.5 rounded-lg disabled:opacity-30 transition-colors ${theme === 'hybrid' ? 'hover:bg-[#202c33] text-[#aebac1]' : 'hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300'}`}
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <span className={`text-sm font-bold w-12 text-center ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-700 dark:text-slate-300'}`}>{pageNumber} / {totalPages}</span>
                                            <button
                                                onClick={() => handleSearch(pageNumber + 1)}
                                                disabled={pageNumber === totalPages || loading}
                                                className={`p-1.5 rounded-lg disabled:opacity-30 transition-colors ${theme === 'hybrid' ? 'hover:bg-[#202c33] text-[#aebac1]' : 'hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300'}`}
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
                                    className={`group rounded-2xl border transition-all duration-300 relative print-card overflow-hidden shadow-md hover:shadow-xl ${theme === 'hybrid'
                                        ? (selectedItems.has(item.id) ? 'bg-[#2a3942] border-[#00a884] ring-2 ring-[#00a884]/20' : 'bg-[#2a3942] border-[#354751] hover:border-[#00a884]/50')
                                        : (selectedItems.has(item.id)
                                            ? 'bg-blue-50/10 dark:bg-blue-900/5 border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 bg-blue-50/10 dark:bg-blue-900/5 print-card-selected'
                                            : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 hover:border-blue-200 dark:hover:border-dark-700 print-card-not-selected')
                                        }`}
                                >
                                    {/* Process Number Header Bar */}
                                    <div className="print-card-header flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-dark-800 dark:to-dark-900 border-b border-slate-300 dark:border-dark-700">
                                        <div className="flex items-center gap-3">
                                            {/* Selection Checkbox */}
                                            <div className="no-print">
                                                <div
                                                    onClick={() => toggleSelection(item.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${selectedItems.has(item.id)
                                                        ? (theme === 'hybrid' ? 'bg-[#00a884] border-[#00a884] shadow-lg shadow-[#00a884]/30' : 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30')
                                                        : (theme === 'hybrid' ? 'border-[#aebac1]/30 bg-white/5 hover:border-[#00a884]' : 'border-slate-400 bg-white/10 hover:border-blue-400')
                                                        }`}
                                                >
                                                    {selectedItems.has(item.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                                                Processo {formatCNJ(item.numero_processo)}
                                            </span>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-white/15 text-white border border-white/20 tracking-wider">
                                            {item.siglaTribunal}
                                        </span>
                                    </div>

                                    {/* Two-column body */}
                                    <div className="pub-card-grid flex flex-col md:flex-row">
                                        {/* LEFT COLUMN — Metadata */}
                                        <div className={`pub-card-meta w-full md:w-[35%] border-b md:border-b-0 md:border-r px-5 py-5 space-y-4 text-sm desktop-only-bg ${theme === 'hybrid'
                                            ? 'bg-[#202c33]/40 border-[#354751]'
                                            : 'bg-slate-50/60 dark:bg-dark-950/40 border-slate-200 dark:border-dark-700'}`}>

                                            {/* Órgão */}
                                            {item.nomeOrgao && (
                                                <div className="meta-block">
                                                    <p className={`meta-label text-[10px] font-bold uppercase tracking-widest mb-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400 dark:text-slate-500'}`}>Órgão:</p>
                                                    <p className={`meta-text font-semibold leading-snug ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-800 dark:text-slate-200'}`}>{item.nomeOrgao}</p>
                                                </div>
                                            )}

                                            {/* Data de Disponibilização */}
                                            <div className="meta-block">
                                                <p className={`meta-label text-[10px] font-bold uppercase tracking-widest mb-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400 dark:text-slate-500'}`}>Data de disponibilização:</p>
                                                <p className={`meta-text font-medium ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700 dark:text-slate-300'}`}>{formatDateForDisplay(item.data_disponibilizacao)}</p>
                                            </div>

                                            {/* Tipo de Comunicação */}
                                            {item.tipoComunicacao && (
                                                <div className="meta-block">
                                                    <p className={`meta-label text-[10px] font-bold uppercase tracking-widest mb-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400 dark:text-slate-500'}`}>Tipo de comunicação:</p>
                                                    <p className={`meta-text font-medium ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700 dark:text-slate-300'}`}>{item.tipoComunicacao}</p>
                                                </div>
                                            )}

                                            {/* Meio */}
                                            {item.meiocompleto && (
                                                <div className="meta-block">
                                                    <p className={`meta-label text-[10px] font-bold uppercase tracking-widest mb-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400 dark:text-slate-500'}`}>Meio:</p>
                                                    <p className={`meta-text font-medium text-xs ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-700 dark:text-slate-300'}`}>{item.meiocompleto}</p>
                                                </div>
                                            )}

                                            {/* Partes */}
                                            {item.destinatarios && item.destinatarios.length > 0 && (
                                                <div className="meta-block">
                                                    <p className={`meta-label text-[10px] font-bold uppercase tracking-widest mb-1.5 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400 dark:text-slate-500'}`}>Parte(s):</p>
                                                    <ul className="meta-list space-y-1.5 inline">
                                                        {item.destinatarios.map((dest, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <span className={`no-print mt-0.5 shrink-0 ${theme === 'hybrid' ? 'text-[#00a884]' : 'text-blue-500 dark:text-blue-400'}`}>
                                                                    <User size={12} />
                                                                </span>
                                                                <span className={`meta-text text-xs leading-snug ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                    {dest.nome}
                                                                    {dest.polo && (
                                                                        <span className={`ml-1 text-[9px] uppercase font-semibold ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400 dark:text-slate-500'}`}>({dest.polo})</span>
                                                                    )}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Advogados */}
                                            {item.destinatarioadvogados && item.destinatarioadvogados.length > 0 && (
                                                <div className="meta-block">
                                                    <p className={`meta-label text-[10px] font-bold uppercase tracking-widest mb-1.5 ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400 dark:text-slate-500'}`}>Advogado(s):</p>
                                                    <ul className="meta-list space-y-1.5 inline">
                                                        {item.destinatarioadvogados.map((adv) => {
                                                            const isTeam = isTeamLawyer(adv.advogado.nome);
                                                            return (
                                                                <li key={adv.id} className="flex items-start gap-2">
                                                                    <span className={`no-print mt-0.5 shrink-0 ${isTeam ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                        <Briefcase size={12} />
                                                                    </span>
                                                                    <span className={`meta-text text-xs leading-snug ${isTeam
                                                                        ? (theme === 'hybrid' ? 'text-[#00a884] font-bold meta-lawyer-highlight' : 'text-blue-700 dark:text-blue-300 font-bold meta-lawyer-highlight')
                                                                        : (theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-600 dark:text-slate-400')
                                                                        }`}>
                                                                        {adv.advogado.nome} – OAB {adv.advogado.uf_oab}/{adv.advogado.numero_oab}
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* RIGHT COLUMN — Actions + Text */}
                                        <div className="pub-card-content w-full md:w-[70%] flex flex-col">
                                            {/* Action Bar */}
                                            <div className={`flex items-center justify-end gap-2 px-5 py-3 border-b no-print ${theme === 'hybrid' ? 'border-[#354751]/50' : 'border-slate-100 dark:border-dark-800'}`}>
                                                {item.link && (
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${theme === 'hybrid' 
                                                            ? 'bg-[#202c33] text-[#e9edef] border-[#354751] hover:bg-[#354751]' 
                                                            : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-600'}`}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Ver Original
                                                    </a>
                                                )}
                                                {(() => {
                                                    const existingCase = findProcessInDatabase(item.numero_processo);
                                                    if (existingCase) {
                                                        return (
                                                            <button
                                                                onClick={() => handleCreateDeadline(item.numero_processo)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${theme === 'hybrid' 
                                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500 hover:text-white' 
                                                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-500 hover:text-white'}`}
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                Criar Prazo
                                                            </button>
                                                        );
                                                    } else {
                                                        return (
                                                            <button
                                                                onClick={() => {
                                                                    setPendingProcessNumber(formatCNJ(item.numero_processo));
                                                                    setShowCaseModal(true);
                                                                }}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${theme === 'hybrid' 
                                                                    ? 'bg-[#00a884]/10 text-[#00a884] border-[#00a884]/30 hover:bg-[#00a884] hover:text-white' 
                                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-600 hover:text-white'}`}
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                Cadastrar Processo
                                                            </button>
                                                        );
                                                    }
                                                })()}
                                            </div>

                                            {/* Publication Text */}
                                            <div className="pub-card-text-container flex-1 px-6 py-5">
                                                <p className={`text-sm whitespace-pre-wrap leading-relaxed text-justify ${theme === 'hybrid' ? 'text-[#d1d7db]' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {sanitizeText(item.texto)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        !loading && <div className={`text-center py-24 animate-fade-in no-print ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>
                            <Search className={`h-16 w-16 mx-auto mb-6 opacity-10 ${theme === 'hybrid' ? 'text-[#e9edef]' : ''}`} />
                            <h4 className={`text-xl font-bold mb-2 ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-300 dark:text-slate-700'}`}>Pronto para pesquisar</h4>
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
                        teamMembers={teamMembers}
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

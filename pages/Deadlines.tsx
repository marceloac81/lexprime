
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/Store';
import { Clock, Check, X, Printer, CalendarIcon, Edit, ChevronLeft, ChevronRight, User as UserIcon, Users, Search, Plus, Trash2, Copy } from '../components/Icons';
import { formatDate } from '../utils/dateUtils';
import { normalizeText, getInitials } from '../utils/textUtils';
import { getAvatarColorStyles } from '../utils/styleUtils';
import { Deadline } from '../types';
import { CalculatorModal } from '../components/CalculatorModal';
import { StatusDropdown, Status } from '../components/StatusDropdown';
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



export const Deadlines: React.FC = () => {
    const { deadlines, cases, addDeadline, updateDeadline, updateDeadlineStatus, deleteDeadline, clearDeadlines, holidays, resetHolidays, pendingAction, setPendingAction, addNotification, theme, isDarkMode, currentUser, teamMembers } = useStore();

    // State
    const [showCalculator, setShowCalculator] = useState(false);
    const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
    const [pendingProcessNumber, setPendingProcessNumber] = useState<string | null>(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const getFutureDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };


    // Filters State
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterResponsible, setFilterResponsible] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Dropdown States
    const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const responsibleFilterRef = useRef<HTMLDivElement>(null);
    const [printRange, setPrintRange] = useState({ start: todayStr, end: getFutureDate(30) });

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Click Outside to close Dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close Responsible Dropdown
            if (showResponsibleDropdown && responsibleFilterRef.current && !responsibleFilterRef.current.contains(event.target as Node)) {
                setShowResponsibleDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showResponsibleDropdown]);

    // Helper to get case details inside filter
    const getCaseDetails = (caseId?: string) => {
        return cases.find(c => c.id === caseId);
    };

    const getStatus = (d: Deadline): Status => (d.status || (d.isDone ? 'Done' : 'Pending')) as Status;



    // Handle Quick Action
    useEffect(() => {
        if (pendingAction === 'newDeadline' || pendingAction?.startsWith('newDeadline:')) {
            if (pendingAction.startsWith('newDeadline:')) {
                const processNumber = pendingAction.split(':')[1];
                // I need to trigger the calculator with this process number.
                // Looking at CalculatorModal, I should probably pass initialData or something.
                // But for now, let's just show the calculator. 
                // Wait, if I want to pre-fill the process number, I should probably use the same logic as editDeadline.
                // Or modify Deadlines state to pass it to CalculatorModal.
                setPendingProcessNumber(processNumber);
            }
            setShowCalculator(true);
            setPendingAction(null);
        } else if (pendingAction?.startsWith('editDeadline:')) {
            const id = pendingAction.split(':')[1];
            const deadline = deadlines.find(d => d.id === id);
            if (deadline) {
                setEditingDeadline(deadline);
            }
            setPendingAction(null);
        }
    }, [pendingAction, setPendingAction, deadlines]);

    const filteredDeadlines = deadlines.filter(d => {
        const status = getStatus(d);
        const relatedCase = getCaseDetails(d.caseId);

        // Date filter and audit logic
        if (filterStartDate && filterEndDate) {
            // Filter by selected range
            if (d.dueDate < filterStartDate || d.dueDate > filterEndDate) return false;
            
            // Audit view: if the range includes past dates, WE DO NOT HIDE completed/canceled.
            const includesPastDates = filterStartDate < todayStr;
            if (!includesPastDates) {
                // Not an audit view of the past, so if it's a past deadline keep default rule
                if (d.dueDate < todayStr && status !== 'Pending') {
                    return false;
                }
            }
        } else {
            // Default rule when no date filter
            if (d.dueDate < todayStr && status !== 'Pending') {
                return false;
            }
        }

        if (filterResponsible) {
            const assignedIds = d.assignedIds || (d.assignedTo ? [d.assignedTo] : []);
            if (!assignedIds.includes(filterResponsible)) return false;
        }

        if (searchTerm) {
            const normalizedTerm = normalizeText(searchTerm);
            const matches =
                normalizeText(d.title).includes(normalizedTerm) ||
                normalizeText(d.customerName || '').includes(normalizedTerm) ||
                normalizeText(d.court || '').includes(normalizedTerm) ||
                normalizeText(d.city || '').includes(normalizedTerm) ||
                normalizeText(relatedCase?.number || '').includes(normalizedTerm) ||
                normalizeText(relatedCase?.clientName || '').includes(normalizedTerm) ||
                normalizeText(relatedCase?.court || '').includes(normalizedTerm) ||
                normalizeText(relatedCase?.city || '').includes(normalizedTerm);

            if (!matches) return false;
        }

        return true;
    });

    filteredDeadlines.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        return 0;
    });

    const groupedDeadlines: { [date: string]: Deadline[] } = {};
    filteredDeadlines.forEach(d => {
        if (d.dueDate) {
            if (!groupedDeadlines[d.dueDate]) groupedDeadlines[d.dueDate] = [];
            groupedDeadlines[d.dueDate].push(d);
        }
    });

    const dates = Object.keys(groupedDeadlines).sort();

    // Helper to get color based on day of week for Light Mode
    const getDayColor = (dateStr: string) => {
        if (!dateStr || isDarkMode) return "transparent";
        if (dateStr === todayStr) return "#FEF3C7"; // Subtle Amber 100

        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts.map(Number);
            const dateObj = new Date(y, m - 1, d);
            const day = dateObj.getDay();

            switch (day) {
                case 1: return "#D6DCE4"; // Segunda-feira
                case 2: return "#D9E1F2"; // Terça-feira
                case 3: return "#FCE4D6"; // Quarta-feira
                case 4: return "#EDEDED"; // Quinta-feira
                case 5: return "#F0FDF4"; // Sexta-feira (Light Green)
                default: return "transparent";
            }
        }
        return "transparent";
    };

    // Helper to get color for Headers in Light Mode (now matches row colors)
    const getHeaderColor = (dateStr: string) => {
        if (!dateStr || isDarkMode) return "transparent";
        return getDayColor(dateStr);
    };

    // Styles - Updated for Better Dark Mode Contrast
    const getDateStyle = (dateStr: string) => {
        if (!dateStr) return "";
        // Today Style
        if (dateStr === todayStr) return "text-slate-900 dark:text-amber-400 font-bold border-gray-300 dark:border-slate-700";

        // Everything else
        return "text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700";
    };

    const getRowStyle = (dateStr: string) => {
        if (!dateStr) return "";
        // Today Row
        if (dateStr === todayStr) return "hover:bg-amber-200/80 hover:brightness-95 text-slate-900 font-bold border-gray-300 dark:text-white dark:hover:bg-slate-800/30 dark:border-slate-700";

        // For other days, we'll use inline style for background in light mode
        // Added hover:brightness-95 for light mode effect on top of inline bg
        return "hover:brightness-95 dark:hover:brightness-110 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600";
    };

    const handleEditClick = (d: Deadline) => {
        setEditingDeadline(d);
    };



    const handleSaveDeadline = (d: Deadline) => {
        if (editingDeadline) {
            updateDeadline(d);
        } else {
            addDeadline(d);
        }
        setEditingDeadline(null);
        setShowCalculator(false);
    };

    // --- Date Picker Logic removed ---

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const filtered = deadlines.filter(d => d.dueDate >= printRange.start && d.dueDate <= printRange.end)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        // Group by date for the list layout
        const grouped: Record<string, Deadline[]> = {};
        filtered.forEach(d => {
            if (!grouped[d.dueDate]) grouped[d.dueDate] = [];
            grouped[d.dueDate].push(d);
        });

        const sortedDates = Object.keys(grouped).sort();

        printWindow.document.write(`
            <html>
                <head>
                    <title>&nbsp;</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            padding: 40px; 
                            color: #000; 
                            line-height: 1.4;
                        }
                        .header { margin-bottom: 30px; }
                        .office-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        
                        .date-section { margin-top: 25px; page-break-inside: avoid; }
                        .date-header { 
                            border-bottom: 2px solid #000; 
                            padding-bottom: 5px; 
                            margin-bottom: 15px;
                            display: flex;
                            align-items: baseline;
                            gap: 15px;
                        }
                        .date-text { font-size: 16px; font-weight: bold; }
                        .weekday-text { font-size: 14px; text-transform: capitalize; }
                        
                        .deadline-row { 
                            display: grid;
                            grid-template-columns: 80px 1fr 220px;
                            gap: 20px;
                            padding-bottom: 12px;
                            margin-bottom: 12px;
                            border-bottom: 0.5px solid #eee;
                            page-break-inside: avoid;
                        }
                        .deadline-row:last-child {
                            border-bottom: none;
                        }
                        .time { font-size: 13px; font-weight: bold; font-style: italic; }
                        .description { font-size: 13px; }
                        .desc-title { font-weight: bold; }
                        .desc-location { font-size: 12px; color: #333; margin-top: 2px; }
                        
                        .process-info { text-align: right; font-size: 13px; }
                        .process-number { font-weight: bold; }
                        .folder-info { font-size: 12px; color: #333; margin-top: 2px; }

                        @media print {
                            body { padding: 0; }
                            @page { margin: 1.5cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="office-name">Escritório de Advocacia</div>
                    </div>

                    ${sortedDates.map(dateStr => {
            const items = grouped[dateStr];
            const dateObj = new Date(dateStr + 'T12:00:00');
            const formattedDate = dateObj.toLocaleDateString('pt-BR');
            const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

            return `
                            <div class="date-section">
                                <div class="date-header">
                                    <span class="date-text">${formattedDate}</span>
                                    <span class="weekday-text">${weekday}</span>
                                </div>
                                ${items.map(d => {
                const relCase = getCaseDetails(d.caseId);
                const customer = relCase?.clientName || d.customerName || '';
                const court = relCase?.court || d.court || '';
                const city = relCase ? `${relCase.city}-${relCase.uf}` : (d.city ? `${d.city}-${d.uf || ''}` : '');
                const process = relCase?.number || '';
                const folder = relCase?.folderNumber ? `(Pasta nº ${relCase.folderNumber})` : (relCase ? '(Pasta nº sem pasta)' : '');

                return `
                                        <div class="deadline-row">
                                            <div class="time">${(d.startTime || '09:00').substring(0, 5)}</div>
                                            <div class="description">
                                                <div class="desc-title">${d.title}${customer ? `: ${customer}` : ''}</div>
                                                <div class="desc-location">${court}${city ? ` de ${city}` : ''}</div>
                                            </div>
                                            <div class="process-info">
                                                <div class="process-number">${process}</div>
                                                <div class="folder-info">${folder}</div>
                                            </div>
                                        </div>
                                    `;
            }).join('')}
                            </div>
                        `;
        }).join('')}

                    <div style="margin-top: 50px; font-size: 10px; border-top: 1px solid #000; padding-top: 10px;">
                        Impresso em: ${new Date().toLocaleDateString('pt-BR')}
                    </div>

                    <script>
                        window.onload = () => {
                            window.print();
                            // Optional: window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        setShowPrintModal(false);
    };

    return (
        <div className={`animate-fade-in pb-20 relative min-h-full ${theme === 'hybrid' ? 'bg-[#222e35]' : ''}`}>
            {/* Header - Sticky */}
            <div className={`sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${theme === 'hybrid'
                ? 'bg-[#202c33] border-emerald-500/20'
                : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800'
                }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Title & Badge */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 shrink-0">
                            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>Prazos</h1>

                            {/* Animated Pending Badge */}
                            {deadlines.filter(d => getStatus(d) === 'Pending').length > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 backdrop-blur-md shadow-sm animate-badge-entrance origin-left group">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </div>
                                    <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                        <AnimatedCounter target={deadlines.filter(d => getStatus(d) === 'Pending').length} /> Prazos Pendentes
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className={`text-sm mt-1 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500 dark:text-slate-400'}`}>Gerencie e acompanhe todos os seus prazos processuais.</p>
                    </div>

                    {/* Consolidated Filters and Search */}
                    <div className="flex flex-1 flex-col md:flex-row gap-3">
                        {/* Search bar - Standardized to match Clients.tsx */}
                        <div className={`${theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751] text-[#e9edef]' : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-slate-700'} relative flex-1 group rounded-lg border flex items-center transition-all`}>
                            <Search className={`${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'} ml-3 shrink-0`} size={18} />
                            <input
                                type="text"
                                placeholder="Pesquisar prazos, processos ou clientes..."
                                className={`w-full pl-2 pr-10 py-2 bg-transparent outline-none text-sm transition-all ${theme === 'hybrid' ? 'text-[#e9edef] placeholder:text-[#aebac1]/50' : 'text-slate-700 dark:text-slate-200'}`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        
                        {/* Date Filter Component */}
                        <div className="relative shrink-0 w-full md:w-[260px]">
                            <DateRangePicker 
                                startDate={filterStartDate}
                                endDate={filterEndDate}
                                onChange={(start, end) => { setFilterStartDate(start); setFilterEndDate(end); }}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                        {/* Responsible Filter */}
                        <div className="relative" ref={responsibleFilterRef}>
                            <button
                                onClick={() => setShowResponsibleDropdown(!showResponsibleDropdown)}
                                className={`p-2 rounded-lg border transition-all shadow-sm active:scale-95 no-print flex items-center justify-center h-full ${theme === 'hybrid'
                                    ? 'bg-[#2a3942] border-[#354751] text-[#e9edef] hover:bg-[#354751]'
                                    : filterResponsible
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-600 font-bold'
                                        : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700'
                                    }`}
                                title="Filtrar por Responsável"
                            >
                                <Users size={20} />
                                {filterResponsible && (
                                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${theme === 'hybrid' ? 'bg-[#00a884] border-[#202c33]' : 'bg-primary-500 border-white dark:border-dark-950'}`}></div>
                                )}
                            </button>

                            {showResponsibleDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-fade-in no-print">
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-dark-900/50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Responsáveis</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto pt-1 pb-1 custom-scrollbar">
                                        <button
                                            onClick={() => { setFilterResponsible(''); setShowResponsibleDropdown(false); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${!filterResponsible ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-900 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                <Users size={12} />
                                            </div>
                                            Todos
                                        </button>
                                        {teamMembers.map(member => (
                                            <button
                                                key={member.id}
                                                onClick={() => { setFilterResponsible(member.id); setShowResponsibleDropdown(false); }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${filterResponsible === member.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border overflow-hidden ${getAvatarColorStyles(member.avatarColor || 'blue')}`}>
                                                    {member.photo ? (
                                                        <img src={member.photo} className="w-full h-full object-cover" />
                                                    ) : (
                                                        getInitials(member.name, member.initials)
                                                    )}
                                                </div>
                                                <span className="truncate">{member.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowPrintModal(true)}
                            className={`p-2 rounded-lg flex items-center justify-center transition-all border shadow-sm active:scale-95 no-print ${theme === 'hybrid'
                                ? 'bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border-[#202c33]'
                                : 'bg-white dark:bg-dark-800 hover:bg-slate-50 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                }`}
                            title="Imprimir Prazos"
                        >
                            <Printer size={20} />
                        </button>
                        <button
                            onClick={() => setShowCalculator(true)}
                            className={`px-5 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg transform active:scale-95 no-print ${theme === 'hybrid'
                                ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                                }`}
                        >
                            <Plus size={20} /> Novo Prazo
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8 pt-4">
                <div className="hidden md:block bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-800 dark:bg-dark-950 text-white transition-all">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-24">Prazo</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-1/4">Atividade</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-48">Processo</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Nome</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Local</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Município-UF</th>
                                <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider w-16 text-center" title="Responsável">Resp.</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-40 text-center status-col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dates.map((dateStr, idx) => {
                                const groupItems = groupedDeadlines[dateStr];
                                const isAltGroup = idx % 2 !== 0;
                                const parts = dateStr.split('-');
                                let formattedDate = dateStr;
                                let weekday = '';
                                let isToday = dateStr === todayStr;

                                if (parts.length === 3) {
                                    const [y, m, d] = parts.map(Number);
                                    const dateObj = new Date(y, m - 1, d);
                                    if (!isNaN(dateObj.getTime())) {
                                        weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                                        formattedDate = dateObj.toLocaleDateString('pt-BR');
                                    }
                                }

                                return (
                                    <React.Fragment key={dateStr}>
                                        <tr
                                            className={`${getDateStyle(dateStr)} border-b-[2.5px] border-t-[3px] border-t-slate-800 dark:border-t-slate-500 ${isDarkMode ? (isAltGroup ? 'dark:bg-dark-800/60' : 'dark:bg-dark-900') : ''}`}
                                            style={!isDarkMode ? { backgroundColor: getHeaderColor(dateStr) } : {}}
                                        >
                                            <td colSpan={8} className="py-2 px-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xl ${isToday ? 'font-extrabold' : 'font-bold'}`}>{formattedDate}</span>
                                                    <span className={`capitalize opacity-80 font-medium text-xs ${isToday ? 'text-black dark:text-white' : ''}`}>{weekday}</span>
                                                    {isToday && <span className="bg-slate-900 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm animate-pulse">HOJE</span>}
                                                </div>
                                            </td>
                                        </tr>

                                        {groupItems.map(d => {
                                            const relatedCase = getCaseDetails(d.caseId);
                                            const status = getStatus(d);
                                            const isFinished = status === 'Done' || status === 'Canceled';
                                            // Fix Contrast: remove explicit dark:text-white when active to allow row style to dictate color
                                            const textStyle = isFinished ? 'line-through text-slate-500 dark:text-slate-500 opacity-80' : '';
                                            const displayCustomer = relatedCase?.clientName || d.customerName || 'Sem Cliente';
                                            const displayCourt = relatedCase?.court || d.court || '-';
                                            const displayCity = relatedCase ? `${relatedCase.city}-${relatedCase.uf}` : d.city && d.uf ? `${d.city}-${d.uf}` : '-';

                                            return (
                                                <tr
                                                    key={d.id}
                                                    onDoubleClick={() => handleEditClick(d)}
                                                    className={`${getRowStyle(dateStr)} border-b transition-colors cursor-pointer group ${isDarkMode ? (isAltGroup ? 'dark:bg-dark-800/60' : 'dark:bg-dark-900') : ''}`}
                                                    style={!isDarkMode ? { backgroundColor: getDayColor(dateStr) } : {}}
                                                    title="Clique duplo para editar"
                                                >
                                                    <td className={`py-2 px-4 text-sm font-bold ${textStyle}`}>
                                                        {(d.startTime || '09:00').substring(0, 5)}
                                                    </td>
                                                    <td className={`py-2 px-4 text-sm font-bold leading-snug ${textStyle}`}>
                                                        {d.title}
                                                    </td>
                                                    <td className={`py-2 px-4 whitespace-nowrap ${textStyle}`} title={relatedCase?.number}>
                                                        <div className="text-sm font-bold flex items-center gap-1.5">
                                                            <span>{relatedCase?.number || '-'}</span>
                                                            {relatedCase?.number && (
                                                                <button
                                                                    onClick={(e) => handleCopy(e, relatedCase.number, d.id + '-desktop')}
                                                                    className={`shrink-0 flex items-center justify-center gap-1 px-1 py-0.5 rounded transition-all min-w-[20px] ${copiedId === d.id + '-desktop' ? 'text-green-500 opacity-100 bg-green-500/10' : theme === 'hybrid' ? 'text-[#aebac1] opacity-40 hover:opacity-100 hover:text-[#e9edef]' : 'text-slate-400 opacity-40 hover:opacity-100 hover:text-slate-700'}`}
                                                                    title={copiedId === d.id + '-desktop' ? "Processo copiado!" : "Copiar número"}
                                                                >
                                                                    {copiedId === d.id + '-desktop' ? (
                                                                        <>
                                                                            <Check size={11} strokeWidth={3} />
                                                                            <span className="text-[9px] font-bold">Copiado</span>
                                                                        </>
                                                                    ) : (
                                                                        <Copy size={11} />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {(relatedCase?.tribunal || relatedCase?.area) && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                                                                {relatedCase?.tribunal && <span>{relatedCase.tribunal} {relatedCase.area && '- '}</span>}
                                                                {relatedCase?.area}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                                                            <div className={`inline-block px-2.5 py-1 rounded-lg border text-sm font-medium truncate ${isFinished
                                                                ? 'bg-slate-50/50 border-slate-200 text-slate-500 line-through dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500 opacity-80'
                                                                : 'bg-white/80 border-slate-200 text-slate-700 shadow-sm dark:bg-dark-800/80 dark:border-slate-600 dark:text-slate-200'
                                                                }`}>
                                                                {displayCustomer}
                                                            </div>
                                                            {relatedCase?.opposingParty && (
                                                                <div className={`text-xs text-slate-500 dark:text-slate-400 pl-1 flex items-center gap-1 leading-none ${isFinished ? 'line-through opacity-70' : ''}`}>
                                                                    <span className="opacity-75">vs</span>
                                                                    <span className="truncate" title={relatedCase.opposingParty}>{relatedCase.opposingParty}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className={`py-2 px-4 text-sm font-medium leading-tight max-w-[200px] ${textStyle}`} title={displayCourt}>
                                                        {displayCourt}
                                                    </td>
                                                    <td className={`py-2 px-4 text-sm font-medium truncate max-w-[150px] ${textStyle}`}>
                                                        {displayCity}
                                                    </td>
                                                    <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="avatar-container flex -space-x-2 justify-center items-center">
                                                            {(d.assignedIds || (d.assignedTo ? [d.assignedTo] : [])).length > 0 ? (() => {
                                                                const ids = d.assignedIds || (d.assignedTo ? [d.assignedTo] : []);
                                                                const displayIds = ids.slice(0, ids.length > 3 ? 2 : 3);
                                                                const remainingCount = ids.length - displayIds.length;

                                                                return (
                                                                    <>
                                                                        {displayIds.map((id, index) => {
                                                                            const member = teamMembers.find(t => t.id === id);
                                                                            if (!member) return <div key={id} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><UserIcon size={12} className="text-slate-300" /></div>;
                                                                            const avatarStyle = isFinished
                                                                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300'
                                                                                : `${getAvatarColorStyles(member.avatarColor || 'blue')} border-opacity-30`;

                                                                            return (
                                                                                <div
                                                                                    key={id}
                                                                                    className={`w-7 h-7 rounded-full ${avatarStyle} border flex items-center justify-center text-[10px] font-bold ${isFinished ? 'opacity-50 grayscale' : 'shadow-sm'} relative overflow-hidden z-[${10 - index}]`}
                                                                                    title={member.name}
                                                                                >
                                                                                    {member.photo ? (
                                                                                        <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
                                                                                    ) : (
                                                                                        getInitials(member.name, member.initials)
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {remainingCount > 0 && (
                                                                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 z-0">
                                                                                +{remainingCount}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })() : (
                                                                <UserIcon size={16} className={`mx-auto text-slate-300 dark:text-slate-600 ${isFinished ? 'opacity-30' : ''}`} title="Sem Responsável" />
                                                            )}
                                                        </div>
                                                        <div className="hidden print-initials text-xs">
                                                            {(d.assignedIds || (d.assignedTo ? [d.assignedTo] : [])).map(id => {
                                                                const member = teamMembers.find(t => t.id === id);
                                                                return member ? getInitials(member.name, member.initials) : '';
                                                            }).filter(Boolean).join(', ')}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 text-center status-col" onClick={(e) => e.stopPropagation()}>
                                                        <StatusDropdown
                                                            id={d.id}
                                                            currentStatus={status}
                                                            onUpdate={(id, s) => updateDeadlineStatus(id, s)}
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </React.Fragment>
                                );
                            })}
                            {dates.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400 bg-white dark:bg-dark-900 text-lg">
                                        {searchTerm || filterStartDate ? 'Nenhum prazo encontrado para os filtros atuais.' : 'Nenhum prazo pendente.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden flex flex-col gap-6 pb-20 no-print">
                    {dates.map(dateStr => {
                        const groupItems = groupedDeadlines[dateStr];
                        let formattedDate = dateStr;
                        let weekday = '';
                        let isToday = dateStr === todayStr;

                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                            const [y, m, d] = parts.map(Number);
                            const dateObj = new Date(y, m - 1, d);
                            if (!isNaN(dateObj.getTime())) {
                                weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                                formattedDate = dateObj.toLocaleDateString('pt-BR');
                            }
                        }

                        return (
                            <div key={dateStr} className={`${!isToday ? 'border-t-4 border-slate-800 dark:border-slate-500 pt-4 mt-4' : ''}`}>
                                <div className={`px-4 py-2 mb-2 rounded-lg shadow-sm flex items-center justify-between
                                    ${isToday ? 'bg-amber-400 text-slate-900 border-b-2 border-amber-500' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}
                                `}>
                                    <div className={`font-bold ${isToday ? 'text-lg' : ''}`}>{formattedDate} <span className="text-sm font-normal opacity-80 capitalize ml-1">{weekday}</span></div>
                                    {isToday && <span className="bg-slate-900 text-amber-400 text-xs px-2 py-0.5 rounded font-bold uppercase animate-pulse">HOJE</span>}
                                </div>

                                <div className="space-y-3">
                                    {groupItems.map(d => {
                                        const relatedCase = getCaseDetails(d.caseId);
                                        const status = getStatus(d);
                                        const isFinished = status === 'Done' || status === 'Canceled';
                                        const textStyle = isFinished ? 'line-through text-slate-500 dark:text-slate-500 opacity-80' : '';
                                        const displayCustomer = relatedCase?.clientName || d.customerName || 'Sem Cliente';
                                        const displayCourt = relatedCase?.court || d.court || '-';
                                        const displayCity = relatedCase ? `${relatedCase.city}-${relatedCase.uf}` : d.city && d.uf ? `${d.city}-${d.uf}` : '';

                                        return (
                                            <div key={d.id} onDoubleClick={() => handleEditClick(d)} className={`bg-white dark:bg-dark-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative active:scale-[0.99] transition-transform ${isToday ? 'border-amber-200 bg-amber-50/50' : ''}`} title="Clique duplo para editar">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className={`bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono font-bold text-slate-600 dark:text-slate-300 ${textStyle}`}>
                                                        {(d.startTime || '09:00').substring(0, 5)}
                                                    </div>
                                                    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                                                        <StatusDropdown
                                                            id={d.id}
                                                            currentStatus={status}
                                                            onUpdate={(id, s) => updateDeadlineStatus(id, s)}
                                                        />
                                                    </div>
                                                </div>
                                                <h3 className={`font-bold mb-2 text-lg leading-tight text-slate-900 dark:text-white ${textStyle}`}>{d.title}</h3>
                                                {relatedCase && (
                                                    <div className="flex flex-col gap-1 mb-3">
                                                        <div className="bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-slate-700 rounded-lg px-2 py-1 w-fit">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className={`text-xs font-bold text-slate-700 dark:text-slate-300 ${textStyle}`}>{relatedCase.number}</p>
                                                                <button
                                                                    onClick={(e) => handleCopy(e, relatedCase.number, d.id + '-mobile')}
                                                                    className={`shrink-0 flex items-center justify-center gap-1 px-1 py-0.5 rounded transition-all min-w-[20px] ${copiedId === d.id + '-mobile' ? 'text-green-500 opacity-100 bg-green-500/10' : theme === 'hybrid' ? 'text-[#aebac1] opacity-40 hover:opacity-100 hover:text-[#e9edef]' : 'text-slate-400 opacity-40 hover:opacity-100 hover:text-slate-700'}`}
                                                                    title={copiedId === d.id + '-mobile' ? "Processo copiado!" : "Copiar número"}
                                                                >
                                                                    {copiedId === d.id + '-mobile' ? (
                                                                        <>
                                                                            <Check size={11} strokeWidth={3} />
                                                                            <span className="text-[9px] font-bold">Copiado</span>
                                                                        </>
                                                                    ) : (
                                                                        <Copy size={11} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {(relatedCase.tribunal || relatedCase.area) && (
                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-1">
                                                                {relatedCase.tribunal && <span>{relatedCase.tribunal} {relatedCase.area && '- '}</span>}
                                                                {relatedCase.area}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-1">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className={`font-medium bg-slate-50 dark:bg-dark-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700 inline-block w-fit ${textStyle}`}>{displayCustomer}</div>
                                                        {relatedCase?.opposingParty && (
                                                            <div className={`text-xs text-slate-500 dark:text-slate-400 pl-1 flex items-center gap-1 ${isFinished ? 'line-through opacity-70' : ''}`}>
                                                                <span className="opacity-75">vs</span>
                                                                <span className="truncate">{relatedCase.opposingParty}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`${textStyle}`}>{displayCourt} {displayCity && `• ${displayCity}`}</span>
                                                </div>

                                                {/* Assigned User - Mobile */}
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Resps:</span>
                                                    <div className="flex -space-x-1.5 items-center">
                                                        {(d.assignedIds || (d.assignedTo ? [d.assignedTo] : [])).length > 0 ? (() => {
                                                            const ids = d.assignedIds || (d.assignedTo ? [d.assignedTo] : []);
                                                            const displayIds = ids.slice(0, 3);
                                                            const remainingCount = ids.length - displayIds.length;

                                                            return (
                                                                <>
                                                                    {displayIds.map((id, index) => {
                                                                        const member = teamMembers.find(t => t.id === id);
                                                                        if (!member) return <div key={id} className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><UserIcon size={10} className="text-slate-300" /></div>;
                                                                        return (
                                                                            <div
                                                                                key={id}
                                                                                className={`w-5 h-5 rounded-full ${getAvatarColorStyles(member.avatarColor || 'blue')} border-opacity-30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-[7px] font-bold ring-1 ring-primary-200 dark:ring-primary-800 ${isFinished ? 'opacity-50 grayscale' : ''} relative overflow-hidden z-[${10 - index}]`}
                                                                                title={member.name}
                                                                            >
                                                                                {member.photo ? (
                                                                                    <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
                                                                                ) : (
                                                                                    getInitials(member.name, member.initials)
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {remainingCount > 0 && (
                                                                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[7px] font-bold text-slate-500 dark:text-slate-400 z-0">
                                                                            +{remainingCount}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })() : (
                                                            <div className="flex items-center gap-1.5 opacity-50">
                                                                <UserIcon size={14} className="text-slate-400" />
                                                                <span className="text-[10px] text-slate-400 font-medium italic">Não Atribuído</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* New/Edit Deadline Modal */}
                {(editingDeadline || showCalculator) && (
                    <CalculatorModal
                        onClose={() => {
                            setEditingDeadline(null);
                            setShowCalculator(false);
                            setPendingProcessNumber(null);
                        }}
                        onSave={handleSaveDeadline}
                        holidays={holidays}
                        initialData={editingDeadline || (pendingProcessNumber ? { processNumber: pendingProcessNumber } : undefined)}
                        isEditing={!!editingDeadline}
                        cases={cases}
                        onDelete={deleteDeadline}
                        currentUser={currentUser}
                        teamMembers={teamMembers}
                    />
                )}

                {/* Print Modal */}
                {showPrintModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in p-4">
                        <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                                    <Printer size={24} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Imprimir Relatório</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Data Inicial</label>
                                    <input
                                        type="date"
                                        value={printRange.start}
                                        onChange={e => setPrintRange({ ...printRange, start: e.target.value })}
                                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Data Final</label>
                                    <input
                                        type="date"
                                        value={printRange.end}
                                        onChange={e => setPrintRange({ ...printRange, end: e.target.value })}
                                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowPrintModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg shadow-primary-500/20 transition-all"
                                >
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    @page {
                        margin: 1cm 1.5cm;
                        size: A4 portrait;
                        @bottom-right {
                            content: "Página " counter(page) " de " counter(pages);
                            font-size: 8pt;
                        }
                    }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; color: #000 !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; }
                    .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }

                    /* List Style Print */
                    .print-report-container { width: 100%; color: #000; }
                    .print-date-section { margin-top: 20px; page-break-inside: avoid; }
                    .print-date-header {
                        border-bottom: 2px solid #000;
                        padding-bottom: 4px;
                        margin-bottom: 15px;
                        display: flex;
                        gap: 15px;
                        align-items: baseline;
                    }
                    .print-date-text { font-size: 14pt; font-weight: bold; }
                    .print-weekday-text { font-size: 11pt; color: #000; text-transform: capitalize; }

                    .print-deadline-row {
                        display: grid;
                        grid-template-columns: 80px 1fr 200px;
                        gap: 20px;
                        padding-bottom: 12px;
                        margin-bottom: 12px;
                        border-bottom: 0.5px solid #eee;
                        page-break-inside: avoid;
                        align-items: start;
                    }
                    .print-deadline-row:last-child {
                        border-bottom: none;
                    }
                    .print-time { font-size: 10pt; font-style: italic; font-weight: bold; }
                    .print-description-col { display: flex; flex-col; gap: 2px; }
                    .print-title { font-size: 10pt; font-weight: bold; line-height: 1.2; }
                    .print-location { font-size: 9pt; line-height: 1.2; }
                    .print-process-col { text-align: right; display: flex; flex-direction: column; gap: 2px; }
                    .print-process-number { font-size: 10pt; font-weight: bold; }
                    .print-folder-number { font-size: 9pt; }

                    * { color: #000 !important; text-shadow: none !important; box-shadow: none !important; }
                }
                .print-only { display: none; }
            `}} />

                {/* Print Only Header */}
                <div className="print-only mb-6">
                    <h1 className="text-3xl font-bold">Escritório de Advocacia</h1>

                    <div className="print-report-container mt-8">
                        {dates.map((dateStr) => {
                            const groupItems = groupedDeadlines[dateStr];
                            const parts = dateStr.split('-');
                            let formattedDate = dateStr;
                            let weekday = '';

                            if (parts.length === 3) {
                                const [y, m, d] = parts.map(Number);
                                const dateObj = new Date(y, m - 1, d);
                                if (!isNaN(dateObj.getTime())) {
                                    weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                                    formattedDate = dateObj.toLocaleDateString('pt-BR');
                                }
                            }

                            return (
                                <div key={dateStr} className="print-date-section">
                                    <div className="print-date-header">
                                        <span className="print-date-text">{formattedDate}</span>
                                        <span className="print-weekday-text capitalize">{weekday}</span>
                                    </div>

                                    {groupItems.map(d => {
                                        const relatedCase = getCaseDetails(d.caseId);
                                        const displayTitle = d.title;
                                        const displayCustomer = relatedCase?.clientName || d.customerName || '';
                                        const displayCourt = relatedCase?.court || d.court || '';
                                        const displayCity = relatedCase ? `${relatedCase.city}-${relatedCase.uf}` : d.city && d.uf ? `${d.city}-${d.uf}` : '';
                                        const displayProcess = relatedCase?.number || '';
                                        const displayFolder = relatedCase?.folderNumber ? `(Pasta nº ${relatedCase.folderNumber})` : (relatedCase ? '(Pasta nº sem pasta)' : '');

                                        return (
                                            <div key={d.id} className="print-deadline-row">
                                                <div className="print-time">{(d.startTime || '09:00').substring(0, 5)}</div>

                                                <div className="print-description-col">
                                                    <div className="print-title">{displayTitle}{displayCustomer ? `: ${displayCustomer}` : ''}</div>
                                                    <div className="print-location">{displayCourt}{displayCity ? ` de ${displayCity}` : ''}</div>
                                                </div>

                                                <div className="print-process-col">
                                                    <div className="print-process-number">{displayProcess}</div>
                                                    <div className="print-folder-number">{displayFolder}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 pt-4 border-t border-black text-[10px]">
                        Impresso em: {new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>
        </div>
    );
};

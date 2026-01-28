
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/Store';
import { Plus, X, Search, CalendarIcon, ChevronLeft, ChevronRight, Edit, Trash2, Printer } from '../components/Icons';
import { formatDate } from '../utils/dateUtils';
import { Deadline } from '../types';
import { CalculatorModal } from '../components/CalculatorModal';
import { StatusDropdown, Status } from '../components/StatusDropdown';

export const Deadlines: React.FC = () => {
    const { deadlines, cases, addDeadline, updateDeadline, updateDeadlineStatus, deleteDeadline, clearDeadlines, holidays, resetHolidays, pendingAction, setPendingAction, addNotification, isDarkMode } = useStore();

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
    const [filterDate, setFilterDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerViewDate, setPickerViewDate] = useState(new Date()); // Controls the month currently viewed in picker
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printRange, setPrintRange] = useState({ start: todayStr, end: getFutureDate(30) });

    // Click Outside to close DatePicker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close Date Picker
            if (showDatePicker && datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDatePicker]);

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

        if (d.dueDate < todayStr && status !== 'Pending') {
            return false;
        }

        if (filterDate && d.dueDate !== filterDate) return false;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            const matches =
                d.title.toLowerCase().includes(lowerTerm) ||
                (d.customerName || '').toLowerCase().includes(lowerTerm) ||
                (d.court || '').toLowerCase().includes(lowerTerm) ||
                (d.city || '').toLowerCase().includes(lowerTerm) ||
                (relatedCase?.number || '').toLowerCase().includes(lowerTerm) ||
                (relatedCase?.clientName || '').toLowerCase().includes(lowerTerm) ||
                (relatedCase?.court || '').toLowerCase().includes(lowerTerm) ||
                (relatedCase?.city || '').toLowerCase().includes(lowerTerm);

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
                case 5: return "#FFF2CC"; // Sexta-feira
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

    // --- Date Picker Logic ---
    const changePickerMonth = (offset: number) => {
        setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() + offset, 1));
    };

    const selectDate = (day: number) => {
        const newDateStr = `${pickerViewDate.getFullYear()}-${String(pickerViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setFilterDate(newDateStr);
        setShowDatePicker(false);
    };

    const getPickerDays = () => {
        const year = pickerViewDate.getFullYear();
        const month = pickerViewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const days = [];
        for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const pickerDays = getPickerDays();
    const pickerMonthName = pickerViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });


    const handlePrint = () => {

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const filtered = deadlines.filter(d => d.dueDate >= printRange.start && d.dueDate <= printRange.end)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Prazos - LexPrime</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #333; }
                        h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
                        th { bg-color: #f8fafc; font-weight: bold; }
                        .footer { margin-top: 30px; font-size: 10px; color: #64748b; text-align: center; }
                        .status { font-weight: bold; text-transform: uppercase; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Prazos: ${formatDate(printRange.start)} - ${formatDate(printRange.end)}</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Hora</th>
                                <th>Atividade</th>
                                <th>Processo / Cliente</th>
                                <th>Local</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(d => {
            const relCase = getCaseDetails(d.caseId);
            return `
                                    <tr>
                                        <td>${formatDate(d.dueDate)}</td>
                                        <td>${(d.startTime || '09:00').substring(0, 5)}</td>
                                        <td><strong>${d.title}</strong></td>
                                        <td>${relCase?.number || '-'}<br/><small>${relCase?.clientName || d.customerName || '-'}</small></td>
                                        <td>${relCase?.court || d.court || '-'}<br/><small>${relCase?.city || d.city || '-'} - ${relCase?.uf || d.uf || '-'}</small></td>
                                        <td class="status">${getStatus(d)}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                    <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} por LexPrime</div>
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
        setShowPrintModal(false);
    };

    return (
        <div className="p-2 md:p-8 h-full flex flex-col animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-3 md:mb-6 gap-2 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Controle de Prazos</h1>
                </div>
                {/* CONTAINER GERAL DE AÇÕES: Coluna no mobile, Linha no desktop */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto md:items-center">

                    {/* Search bar - width full mobile, auto desktop */}
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            className="pl-9 pr-4 py-1.5 md:py-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-64 transition-all text-slate-700 dark:text-slate-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* GRUPO DE FILTROS E AÇÕES SECUNDÁRIAS */}
                    {/* Mobile: Row (Data + Icons) | Desktop: Items soltos na row principal (usando fragment ou div contents se necessário, mas aqui vamos manter div para agrupar) */}
                    <div className="flex flex-row gap-2 w-full md:w-auto">

                        {/* Custom Date Picker - Flex 1 no mobile, auto no desktop */}
                        <div className="relative flex-1 md:flex-none" ref={datePickerRef}>
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={`w-full md:w-auto flex items-center justify-center gap-2 px-3 py-1.5 md:py-2 rounded-lg border text-sm transition-all ${filterDate
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 font-bold'
                                    : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-700'
                                    }`}
                            >
                                <CalendarIcon size={16} />
                                <span className="hidden md:inline">{filterDate ? formatDate(filterDate) : 'Filtrar Data'}</span>
                                <span className="md:hidden">{filterDate ? formatDate(filterDate) : 'Data'}</span>
                                {filterDate && (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); setFilterDate(''); }}
                                        className="ml-1 p-0.5 rounded-full hover:bg-rose-100 text-rose-500"
                                    >
                                        <X size={12} />
                                    </div>
                                )}
                            </button>

                            {showDatePicker && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4 animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <button onClick={() => changePickerMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg text-slate-600 dark:text-slate-300"><ChevronLeft size={18} /></button>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{pickerMonthName}</span>
                                        <button onClick={() => changePickerMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg text-slate-600 dark:text-slate-300"><ChevronRight size={18} /></button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                            <div key={i} className="text-center text-[10px] font-bold text-slate-400">{d}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {pickerDays.map((d, i) => {
                                            if (d === null) return <div key={i} />;
                                            const dateStr = `${pickerViewDate.getFullYear()}-${String(pickerViewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                            const isSelected = dateStr === filterDate;
                                            const isToday = dateStr === todayStr;

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => selectDate(d)}
                                                    className={`
                                            h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all
                                            ${isSelected
                                                            ? 'bg-primary-600 text-white shadow-md'
                                                            : isToday
                                                                ? 'bg-amber-100 text-amber-700 font-bold border border-amber-300'
                                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700'
                                                        }
                                        `}
                                                >
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ícones de Ação */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPrintModal(true)}
                                className="p-2 md:p-2.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 shadow-sm"
                                title="Imprimir Prazos"
                            >
                                <Printer size={18} md:size={20} />
                            </button>
                            <button
                                onClick={clearDeadlines}
                                className="p-2 md:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 shadow-sm"
                                title="Limpar Base"
                            >
                                <Trash2 size={18} md:size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Botão Novo Prazo - Full mobile, Auto desktop */}
                    <button
                        onClick={() => setShowCalculator(true)}
                        className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all whitespace-nowrap"
                    >
                        <Plus size={20} /> Novo Prazo
                    </button>
                </div>
            </div>

            <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-dark-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-slate-800 dark:bg-dark-950 text-white shadow-md">
                        <tr>
                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-24">Prazo</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-1/4">Atividade</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-48">Processo</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Nome</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Local</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Município-UF</th>
                            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider w-40 text-center">Status</th>
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
                                        className={`${getDateStyle(dateStr)} border-b-2 border-t-2 border-t-slate-800 dark:border-t-slate-400 ${isDarkMode ? (isAltGroup ? 'dark:bg-dark-800/60' : 'dark:bg-dark-900') : ''}`}
                                        style={!isDarkMode ? { backgroundColor: getHeaderColor(dateStr) } : {}}
                                    >
                                        <td colSpan={7} className="py-2 px-4">
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
                                                onClick={() => handleEditClick(d)}
                                                className={`${getRowStyle(dateStr)} border-b transition-colors cursor-pointer group ${isDarkMode ? (isAltGroup ? 'dark:bg-dark-800/60' : 'dark:bg-dark-900') : ''}`}
                                                style={!isDarkMode ? { backgroundColor: getDayColor(dateStr) } : {}}
                                                title="Clique para editar"
                                            >
                                                <td className={`py-2 px-4 text-sm font-bold ${textStyle}`}>
                                                    {(d.startTime || '09:00').substring(0, 5)}
                                                </td>
                                                <td className={`py-2 px-4 text-sm font-bold leading-snug ${textStyle}`}>
                                                    {d.title}
                                                </td>
                                                <td className={`py-2 px-4 whitespace-nowrap ${textStyle}`} title={relatedCase?.number}>
                                                    <div className="text-sm font-bold">{relatedCase?.number || '-'}</div>
                                                    {relatedCase?.area && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">{relatedCase.area}</div>}
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
                                                <td className="py-2 px-4 text-center">
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
                                <td colSpan={7} className="p-8 text-center text-slate-400 bg-white dark:bg-dark-900 text-lg">
                                    {searchTerm || filterDate ? 'Nenhum prazo encontrado para os filtros atuais.' : 'Nenhum prazo pendente.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MOBILE LIST VIEW */}
            <div className="md:hidden flex flex-col gap-6 overflow-y-auto pb-20 custom-scrollbar">
                {dates.map(dateStr => {
                    const groupItems = groupedDeadlines[dateStr];
                    let formattedDate = dateStr;
                    let weekday = '';
                    let isToday = dateStr === todayStr;
                    let isPast = dateStr < todayStr;

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
                            <div className={`sticky top-0 z-10 px-4 py-2 mb-2 rounded-lg shadow-sm flex items-center justify-between
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
                                        <div key={d.id} onClick={() => handleEditClick(d)} className={`bg-white dark:bg-dark-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative active:scale-[0.99] transition-transform ${isToday ? 'border-amber-200 bg-amber-50/50' : ''}`}>
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
                                                        <p className={`text-xs font-bold text-slate-700 dark:text-slate-300 ${textStyle}`}>{relatedCase.number}</p>
                                                    </div>
                                                    {relatedCase.area && <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-1">{relatedCase.area}</p>}
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
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Unified Calculator/Edit Modal */}
            {(showCalculator || editingDeadline) && (
                <CalculatorModal
                    onClose={() => {
                        setShowCalculator(false);
                        setEditingDeadline(null);
                    }}
                    cases={cases}
                    onSave={handleSaveDeadline}
                    initialData={editingDeadline}
                    initialCaseSearch={pendingProcessNumber || undefined}
                    holidays={holidays}
                    onDelete={deleteDeadline}
                />
            )}
            {/* Print Range Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-scale-in">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Printer size={24} className="text-primary-500" /> Imprimir Prazos
                            </h2>
                            <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Selecione o período para o relatório de prazos:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data Início</label>
                                    <input
                                        type="date"
                                        value={printRange.start}
                                        onChange={e => setPrintRange({ ...printRange, start: e.target.value })}
                                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data Fim</label>
                                    <input
                                        type="date"
                                        value={printRange.end}
                                        onChange={e => setPrintRange({ ...printRange, end: e.target.value })}
                                        className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-dark-900/50 rounded-b-2xl border-t border-slate-100 dark:border-slate-700 flex gap-3">
                            <button
                                onClick={() => setShowPrintModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Printer size={18} /> Gerar PDF / Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

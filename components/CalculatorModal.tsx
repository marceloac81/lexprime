import React, { useState, useEffect } from 'react';
import { calculateDeadline, formatDate } from '../utils/dateUtils';
import { Deadline, Case, Holiday } from '../types';
import { Clock, Edit, AlertCircle, Search, X, User, MapPin, Trash2, FileText, Check, CalendarIcon, BookOpen, ChevronDown, RotateCcw, Plus } from './Icons';
import { TempestividadeModal } from './TempestividadeModal';
import { CpcReferenceCatalog } from './CpcReferenceCatalog';
import { sanitizeCNJ, formatCNJ } from '../utils/cnjUtils';
import { normalizeText, getInitials, isSuspiciouslyAllCaps, toTitleCase } from '../utils/textUtils';
import { getAvatarColorStyles } from '../utils/styleUtils';

interface CalculatorModalProps {
    onClose: () => void;
    cases: Case[];
    onSave: (d: Deadline) => void;
    initialDate?: string;
    initialData?: Deadline | null;
    initialCaseSearch?: string;
    holidays: Holiday[];
    onDelete?: (id: string) => void;
    currentUser?: any;
    teamMembers: import('../types').TeamMember[];
}

const COMMON_ACTIVITIES: { label: string; days?: number }[] = [
    { label: 'Contestação', days: 15 },
    { label: 'Réplica à Contestação', days: 15 },
    { label: 'Manifestação', days: 5 },
    { label: 'Manifestação sobre Laudo / Documentos', days: 15 },
    { label: 'Embargos de Declaração', days: 5 },
    { label: 'Recurso de Apelação', days: 15 },
    { label: 'Recurso Inominado', days: 10 },
    { label: 'Contrarrazões de Apelação', days: 15 },
    { label: 'Contrarrazões de Recurso Inominado', days: 10 },
    { label: 'Agravo de Instrumento', days: 15 },
    { label: 'Recurso Ordinário', days: 8 },
    { label: 'Contrarrazões de Recurso Ordinário', days: 8 },
    { label: 'Recurso Especial / Extraordinário', days: 15 },
    { label: 'Emenda à Inicial', days: 15 },
    { label: 'Especificação de Provas', days: 5 },
    { label: 'Alegações Finais / Memoriais', days: 15 },
    { label: 'Cumprimento de Sentença', days: 15 },
    { label: 'Impugnação ao Cumprimento de Sentença', days: 15 },
    { label: 'Apresentação de Rol de Testemunhas', days: 15 },
    { label: 'Recolhimento de Custas / Preparo', days: 5 },
    { label: 'Juntada de Documentos / Procuração', days: 5 },
];

const QUICK_DAYS = [5, 8, 10, 15];

const MiniCalendar: React.FC<{ date: Date }> = ({ date }) => {
    const month = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const day = date.getUTCDate();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="bg-white dark:bg-dark-900 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl p-2.5 shadow-md w-[135px] shrink-0 animate-fade-in">
            <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 text-center">
                {monthNames[month]} {year}
            </div>
            <div className="grid grid-cols-7 gap-1 text-[8px] font-bold text-slate-400 mb-1 text-center">
                {weekDays.map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => (
                    <div key={i} className={`h-4 flex items-center justify-center text-[9px] font-medium rounded-sm
                        ${d === day
                            ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-500/30'
                            : 'text-slate-500 dark:text-slate-400'}
                    `}>
                        {d}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ onClose, cases, onSave, initialDate, initialData, initialCaseSearch, holidays, onDelete, currentUser, teamMembers = [] }) => {
    // Default Initialization
    const [startDate, setStartDate] = useState(initialData?.startDate || initialDate || new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(initialData?.startTime || '18:00');
    const [days, setDays] = useState(initialData?.days !== undefined ? initialData.days : 5);
    const [type, setType] = useState<'business' | 'calendar'>(initialData?.countType || 'business');

    const [title, setTitle] = useState(initialData?.title || '');
    const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);
    const activityDropdownRef = React.useRef<HTMLDivElement>(null);

    const [status, setStatus] = useState<'Pending' | 'Done' | 'Canceled'>(initialData?.status || 'Pending');
    const [assignedIds, setAssignedIds] = useState<string[]>(() => {
        if (Array.isArray(initialData?.assignedIds)) return initialData.assignedIds;
        if (initialData?.assignedTo) return [initialData.assignedTo];
        return [];
    });
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const assigneeDropdownRef = React.useRef<HTMLDivElement>(null);

    // Case & Customer & Location
    const [selectedCaseId, setSelectedCaseId] = useState(initialData?.caseId || '');
    const [customerName, setCustomerName] = useState(initialData?.customerName || '');
    const [court, setCourt] = useState(initialData?.court || '');
    const [city, setCity] = useState(initialData?.city || '');
    const [uf, setUf] = useState(initialData?.uf || '');

    // Auto-fill Case search if editing or passed from publications
    const initialCase = initialData?.caseId ? cases.find(c => c.id === initialData.caseId) : null;
    const [caseSearch, setCaseSearch] = useState(initialCase ? initialCase.number : (initialCaseSearch || ''));
    const [info, setInfo] = useState('');

    // Effect to open dropdown if initialCaseSearch is provided but not yet selected
    useEffect(() => {
        if (initialCaseSearch && !selectedCaseId) {
            setIsCaseDropdownOpen(true);
        }
    }, [initialCaseSearch, selectedCaseId]);

    const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
    const [result, setResult] = useState<{ date: Date, logs: string[], simulation: import('../types').SimulationStep[] } | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [showTempestividade, setShowTempestividade] = useState(false);
    const [showCpcCatalog, setShowCpcCatalog] = useState(false);

    // Custom suspensions
    const [customSuspensions, setCustomSuspensions] = useState<{date: string, description: string}[]>([]);
    const [suspensionDate, setSuspensionDate] = useState('');
    const [suspensionDesc, setSuspensionDesc] = useState('');
    const [showSuspensionForm, setShowSuspensionForm] = useState(false);

    const mergedHolidays = React.useMemo(() => {
        return [
            ...holidays,
            ...customSuspensions.map(s => ({
                id: `custom-${s.date}`,
                date: s.date,
                name: s.description || 'Suspensão Específica'
            }))
        ];
    }, [holidays, customSuspensions]);

    // Dropdown container ref for click-outside detection
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCaseDropdownOpen(false);
            }
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
                setIsAssigneeDropdownOpen(false);
            }
            if (activityDropdownRef.current && !activityDropdownRef.current.contains(event.target as Node)) {
                setIsActivityDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const BR_STATES = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    const filteredCases = cases.filter(c => {
        if (!caseSearch) return true;
        const normalizedTerm = normalizeText(caseSearch);
        const searchSanitized = sanitizeCNJ(caseSearch);
        const caseNumberSanitized = sanitizeCNJ(c.number);

        return (
            (searchSanitized && caseNumberSanitized.includes(searchSanitized)) ||
            normalizeText(c.number).includes(normalizedTerm) ||
            normalizeText(c.title).includes(normalizedTerm) ||
            normalizeText(c.clientName).includes(normalizedTerm)
        );
    });

    const filteredMembers = (teamMembers || [])
        .filter(t => t.active && normalizeText(t.name).includes(normalizeText(assigneeSearch)))
        .sort((a, b) => {
            const getMemberPriority = (name: string): number => {
                const norm = name.toLowerCase();
                if (norm.includes('abrahao') || norm.includes('abrahão') || norm.includes('cassini')) return 1;
                if (norm.includes('damaris') || norm.includes('dâmaris')) return 2;
                if (norm.includes('luiz geraldo') || norm.includes('liz geraldo') || norm.includes('motta')) return 3;
                if (norm.includes('monteiro')) return 4;
                if (norm.includes('rose') || norm.includes('maria rose')) return 5;
                return 100;
            };
            return getMemberPriority(a.name) - getMemberPriority(b.name);
        });

    const filteredActivities = COMMON_ACTIVITIES.filter(a => {
        if (!title.trim()) return true;
        return normalizeText(a.label).includes(normalizeText(title));
    });

    // Auto-fill effect when search matches exactly one case (sanitized)
    useEffect(() => {
        if (!initialData?.caseId && !selectedCaseId && caseSearch) {
            const searchSanitized = sanitizeCNJ(caseSearch);
            if (searchSanitized.length >= 10) { // Only auto-fill if we have a significant portion of CNJ
                const exactMatches = cases.filter(c => sanitizeCNJ(c.number) === searchSanitized);
                if (exactMatches.length === 1) {
                    handleSelectCase(exactMatches[0]);
                }
            }
        }
    }, [caseSearch, cases, initialData, selectedCaseId]);

    const handleSelectCase = (c: Case) => {
        setSelectedCaseId(c.id);
        setCaseSearch(c.number);
        setCustomerName(c.clientName);
        setCourt(c.court);
        setCity(c.city);
        setUf(c.uf);
        setIsCaseDropdownOpen(false);
    };

    const handleClearCase = () => {
        setSelectedCaseId('');
        setCaseSearch('');
        setCustomerName('');
        setCourt('');
        setCity('');
        setUf('');
        setInfo('');
    };

    // Auto-calculate effect
    useEffect(() => {
        const calc = calculateDeadline(startDate, days, type, mergedHolidays);
        setResult(calc);
    }, [startDate, days, type, mergedHolidays]);

    // Auto-fill info when case selected
    useEffect(() => {
        if (selectedCaseId) {
            const c = cases.find(x => x.id === selectedCaseId);
            if (c) {
                setInfo(`Processo: ${c.number}\nCliente: ${c.clientName}\nVara: ${c.court}`);
                // Ensure fields are populated if they were empty
                if (!customerName) setCustomerName(c.clientName);
                if (!court) setCourt(c.court);
                if (!city) setCity(c.city);
                if (!uf) setUf(c.uf);
            }
        } else {
            setInfo('');
        }
    }, [selectedCaseId, cases]);

    const handleSave = () => {
        const validationErrors = [];
        if (!title) validationErrors.push("Campo 'Atividade' é obrigatório.");
        if (days < 0) validationErrors.push("Quantidade de dias não pode ser negativa.");
        if (!selectedCaseId && !customerName) validationErrors.push("Para prazos avulsos, informe o Nome do Cliente/Interessado.");
        if (!selectedCaseId && (!court || !city || !uf)) validationErrors.push("Para prazos avulsos, informe os dados de localização (Vara, Cidade, UF).");
        if (assignedIds.length === 0) validationErrors.push("Campo 'Responsáveis' é obrigatório.");

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        if (!result) return;

        const caseTitle = selectedCaseId ? cases.find(c => c.id === selectedCaseId)?.title : undefined;
        const isDone = status === 'Done';

        onSave({
            id: initialData ? initialData.id : Date.now().toString(),
            title,
            dueDate: result.date.toISOString().split('T')[0],
            isDone: isDone,
            status: status,
            priority: initialData?.priority || 'Medium',
            type: initialData?.type || 'Prazo Processual',
            caseId: selectedCaseId || undefined,
            caseTitle,

            // Only save manual fields if no case linked, or keep them for reference
            customerName: selectedCaseId ? undefined : customerName,
            court: selectedCaseId ? undefined : court,
            city: selectedCaseId ? undefined : city,
            uf: selectedCaseId ? undefined : uf,

            countType: type,
            days,
            startDate,
            startTime,
            assignedIds: assignedIds.length > 0 ? assignedIds : undefined
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 md:p-4 animate-fade-in text-slate-900 dark:text-slate-100">
            <div className="bg-white dark:bg-dark-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[96vh] ring-1 ring-slate-200 dark:ring-slate-700">
                {/* Form */}
                <div className="p-4 md:p-5 w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {initialData?.id ? <Edit className="text-primary-500" size={20} /> : <Clock className="text-primary-500" size={20} />}
                            {initialData?.id ? 'Editar Prazo' : 'Novo Prazo'}
                        </h2>
                        {result && (
                            <button
                                onClick={() => setShowTempestividade(true)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all flex items-center gap-1.5 text-[10px] md:text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95"
                                title="Gerar Tópico de Tempestividade"
                            >
                                <FileText size={14} />
                                <span className="hidden sm:inline">Gerar Tempestividade</span>
                                <span className="sm:hidden">Gerar</span>
                            </button>
                        )}
                    </div>

                    {errors.length > 0 && (
                        <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg space-y-1">
                            {errors.map((e, i) => <p key={i} className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5"><AlertCircle size={13} /> {e}</p>)}
                        </div>
                    )}

                    <div className="space-y-2.5">
                        {/* Custom Case Search Autocomplete */}
                        <div className="relative">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Vincular Processo</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    className={`w-full pl-9 pr-9 py-2 px-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 font-mono text-sm ${initialData?.caseId ? 'cursor-not-allowed bg-slate-100 dark:bg-dark-900/50' : ''}`}
                                    placeholder="Buscar por número ou cliente..."
                                    value={caseSearch}
                                    onChange={e => {
                                        const val = formatCNJ(e.target.value);
                                        setCaseSearch(val);
                                        setIsCaseDropdownOpen(true);
                                        if (selectedCaseId) handleClearCase();
                                    }}
                                    onFocus={() => !initialData?.caseId && setIsCaseDropdownOpen(true)}
                                    disabled={!!initialData?.caseId} // Disable search if case ID is fixed/passed
                                />
                                {selectedCaseId && !initialData?.caseId && (
                                    <button onClick={handleClearCase} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-600">
                                        <X size={15} />
                                    </button>
                                )}
                                {!selectedCaseId && caseSearch && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs italic">Avulso</div>
                                )}
                            </div>

                            {isCaseDropdownOpen && !selectedCaseId && (
                                <div ref={dropdownRef} className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto z-50 custom-scrollbar">
                                    {filteredCases.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleSelectCase(c)}
                                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                                        >
                                            <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">{c.number}</div>
                                            <div className="text-xs text-slate-500 truncate">{c.clientName}</div>
                                        </div>
                                    ))}
                                    {filteredCases.length === 0 && (
                                        <div className="p-2.5 text-center text-xs text-slate-400">Nenhum processo encontrado.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manual Customer Name Input (Conditionally ReadOnly) */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                                Nome do Cliente / Interessado {selectedCaseId ? <span className="text-slate-400 font-normal">(Via Processo)</span> : <span className="text-rose-500">*</span>}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    className={`w-full pl-9 py-2 px-3 text-sm rounded-lg border outline-none transition-colors
                                        ${selectedCaseId
                                            ? 'bg-slate-100 dark:bg-dark-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500'
                                        }`}
                                    placeholder="Ex: João da Silva (Consultoria)"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    disabled={!!selectedCaseId}
                                />
                                {!selectedCaseId && isSuspiciouslyAllCaps(customerName || '') && (
                                    <div className="absolute top-full left-0 mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-2 z-10 bg-amber-50 dark:bg-amber-900/20 py-1 px-2 rounded border border-amber-200 dark:border-amber-800/50 shadow-sm w-fit">
                                        <AlertCircle size={12} className="shrink-0" />
                                        <span>Dica: Evite usar apenas CAIXA ALTA, exceto para Pessoas Jurídicas.</span>
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.preventDefault(); setCustomerName(toTitleCase(customerName || '')); }}
                                            className="ml-2 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold transition-colors border border-amber-200 dark:border-amber-700/50"
                                        >
                                            <RotateCcw size={10} /> Corrigir
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Fields (Row) */}
                        <div className="grid grid-cols-12 gap-2.5">
                            <div className="col-span-12">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                                    Local / Vara {selectedCaseId ? <span className="text-slate-400 font-normal">(Via Processo)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        className={`w-full pl-9 py-2 px-3 text-sm rounded-lg border outline-none transition-colors
                                            ${selectedCaseId
                                                ? 'bg-slate-100 dark:bg-dark-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500'
                                            }`}
                                        placeholder="Ex: 5ª Vara Cível"
                                        value={court}
                                        onChange={e => setCourt(e.target.value)}
                                        disabled={!!selectedCaseId}
                                    />
                                </div>
                            </div>
                            <div className="col-span-8">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                                    Cidade {selectedCaseId ? <span className="text-slate-400 font-normal">(Via Processo)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    className={`w-full py-2 px-3 text-sm rounded-lg border outline-none transition-colors
                                        ${selectedCaseId
                                            ? 'bg-slate-100 dark:bg-dark-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500'
                                        }`}
                                    placeholder="Ex: São Paulo"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    disabled={!!selectedCaseId}
                                />
                            </div>
                            <div className="col-span-4">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                                    UF {selectedCaseId ? <span className="text-slate-400 font-normal">(*)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                {selectedCaseId ? (
                                    <input
                                        className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-dark-900/50 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                                        value={uf}
                                        disabled
                                    />
                                ) : (
                                    <select
                                        className="w-full py-2 px-3 text-sm rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        value={uf}
                                        onChange={e => setUf(e.target.value)}
                                    >
                                        <option value="">--</option>
                                        {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Multi-assignee Combobox */}
                        <div className="relative" ref={assigneeDropdownRef}>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Responsáveis <span className="text-rose-500">*</span></label>
                            <div
                                className="w-full flex flex-wrap items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none transition-all focus-within:ring-2 focus-within:ring-primary-500 min-h-[38px] cursor-text"
                                onClick={() => setIsAssigneeDropdownOpen(true)}
                            >
                                {(assignedIds || []).map(id => {
                                    const member = (teamMembers || []).find(m => m.id === id);
                                    if (!member) return null;
                                    const avatarStyle = getAvatarColorStyles(member.avatarColor || 'blue');
                                    const firstName = member.name.trim().split(' ')[0];
                                    return (
                                        <span key={id} className={`flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold animate-scale-in shadow-sm`}>
                                            <div className={`w-5 h-5 rounded-full ${avatarStyle} flex items-center justify-center text-[8px] font-bold border border-opacity-20 overflow-hidden`}>
                                                {member.photo ? (
                                                    <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
                                                ) : (
                                                    getInitials(member.name, member.initials)
                                                )}
                                            </div>
                                            {firstName}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAssignedIds(prev => prev.filter(mid => mid !== id));
                                                }}
                                                className="ml-0.5 hover:text-red-500 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })}
                                <input
                                    className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white placeholder:text-slate-400 min-w-[120px]"
                                    placeholder={assignedIds.length === 0 ? "Selecionar responsáveis..." : ""}
                                    value={assigneeSearch}
                                    onChange={e => {
                                        setAssigneeSearch(e.target.value);
                                        setIsAssigneeDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsAssigneeDropdownOpen(true)}
                                />
                                <ChevronDown className={`shrink-0 text-slate-400 transition-transform ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                            </div>

                            {isAssigneeDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-scale-in flex flex-col">
                                    <div className="px-2.5 py-1 bg-slate-50 dark:bg-dark-900/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center shrink-0">
                                        <span>Selecione os responsáveis</span>
                                        {filteredMembers.length > 5 && (
                                            <span className="animate-pulse flex items-center gap-1 text-primary-600 dark:text-primary-400">↓ Role para ver mais</span>
                                        )}
                                    </div>
                                    <div className="overflow-y-auto max-h-[195px] custom-scrollbar">
                                        {filteredMembers.map(member => (
                                            <div
                                                key={member.id}
                                                onClick={() => {
                                                    setAssignedIds(prev =>
                                                        prev.includes(member.id)
                                                            ? prev.filter(id => id !== member.id)
                                                            : [...prev, member.id]
                                                    );
                                                    setAssigneeSearch('');
                                                }}
                                                className="py-1.5 px-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full ${getAvatarColorStyles(member.avatarColor || 'blue')} flex items-center justify-center text-[9px] font-bold border border-opacity-20 shadow-sm overflow-hidden shrink-0`}>
                                                        {member.photo ? (
                                                            <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
                                                        ) : (
                                                            getInitials(member.name, member.initials)
                                                        )}
                                                    </div>
                                                    <span className={`text-xs md:text-sm leading-tight ${assignedIds.includes(member.id) ? 'font-bold text-primary-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {member.name}
                                                    </span>
                                                </div>
                                                {assignedIds.includes(member.id) && <Check size={14} className="text-primary-500 shrink-0" />}
                                            </div>
                                        ))}
                                        {filteredMembers.length === 0 && (
                                            <div className="p-2.5 text-center text-xs text-slate-400 italic">Nenhum membro encontrado.</div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-dark-800 px-2 py-1 border-t border-slate-100 dark:border-slate-700 flex justify-end shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsAssigneeDropdownOpen(false);
                                            }}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                        >
                                            <Check size={12} />
                                            Concluir
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Activity / Deadline Name with Quick Autocomplete */}
                        <div className="relative" ref={activityDropdownRef}>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Atividade / Nome do Prazo <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <input
                                    className="w-full py-2 pl-3 pr-8 text-sm rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                    placeholder="Digite ou selecione (Ex: Contestação, Recurso...)"
                                    value={title}
                                    onFocus={() => setIsActivityDropdownOpen(true)}
                                    onChange={e => {
                                        setTitle(e.target.value);
                                        setIsActivityDropdownOpen(true);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') setIsActivityDropdownOpen(false);
                                    }}
                                />
                                {title ? (
                                    <button
                                        type="button"
                                        onClick={() => { setTitle(''); setIsActivityDropdownOpen(true); }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        title="Limpar atividade"
                                    >
                                        <X size={14} />
                                    </button>
                                ) : (
                                    <ChevronDown
                                        size={15}
                                        onClick={() => setIsActivityDropdownOpen(prev => !prev)}
                                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer transition-transform ${isActivityDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                )}
                            </div>

                            {isActivityDropdownOpen && filteredActivities.length > 0 && !(filteredActivities.length === 1 && normalizeText(filteredActivities[0].label) === normalizeText(title)) && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 custom-scrollbar animate-scale-in">
                                    <div className="px-2.5 py-1 bg-slate-50 dark:bg-dark-900/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                                        <span>Sugestões rápidas</span>
                                        <span className="font-normal normal-case italic">ou digite livremente</span>
                                    </div>
                                    {filteredActivities.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setTitle(item.label);
                                                if (item.days !== undefined) setDays(item.days);
                                                setIsActivityDropdownOpen(false);
                                            }}
                                            className="py-1.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex items-center justify-between text-xs md:text-sm text-slate-700 dark:text-slate-200"
                                        >
                                            <span className="truncate pr-2">{item.label}</span>
                                            {item.days !== undefined && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                                    {item.days}d
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isSuspiciouslyAllCaps(title || '') && (
                                <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 py-1 px-2 rounded border border-amber-200 dark:border-amber-800/50 shadow-sm w-fit">
                                    <AlertCircle size={12} className="shrink-0" />
                                    <span>Dica: Evite usar apenas CAIXA ALTA, exceto se estritamente necessário.</span>
                                    <button 
                                        type="button" 
                                        onClick={(e) => { e.preventDefault(); setTitle(toTitleCase(title || '')); }}
                                        className="ml-2 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold transition-colors border border-amber-200 dark:border-amber-700/50"
                                    >
                                        <RotateCcw size={10} /> Corrigir
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1.5"></div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Data Inicial</label>
                                <input type="date" className="w-full py-2 px-3 text-sm rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Hora</label>
                                <input type="time" className="w-full py-2 px-3 text-sm rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2.5">
                            <div className="col-span-7">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Dias</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCpcCatalog(true)}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 transition-all active:scale-95"
                                        title="Consultar tabela de prazos do CPC/2015"
                                    >
                                        <BookOpen size={11} />
                                        <span>Consultar CPC</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-16 sm:w-20 py-2 px-2.5 text-sm font-semibold rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        value={days}
                                        onChange={e => setDays(Number(e.target.value))}
                                    />
                                    <div className="flex items-center gap-1 flex-1">
                                        {QUICK_DAYS.map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setDays(d)}
                                                className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                                                    days === d
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                                                        : 'bg-slate-50 dark:bg-dark-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                                title={`Definir prazo de ${d} dias`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-5">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Contagem</label>
                                <select className="w-full py-2 px-2.5 text-sm rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={type} onChange={e => setType(e.target.value as any)}>
                                    <option value="business">Dias Úteis (CPC)</option>
                                    <option value="calendar">Dias Corridos</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-1">
                            {!showSuspensionForm && customSuspensions.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setShowSuspensionForm(true)}
                                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-dark-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 transition-colors"
                                >
                                    <Plus size={14} className="text-primary-500" />
                                    Adicionar suspensão local / feriado municipal
                                </button>
                            ) : (
                                <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-dark-900/40 border border-slate-200/80 dark:border-slate-700/80 animate-fade-in">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Suspensão Local / Feriado Municipal
                                        </label>
                                        {customSuspensions.length === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowSuspensionForm(false)}
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                                                title="Recolher"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="date" className="w-[125px] py-1.5 px-2 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-xs shrink-0"
                                            value={suspensionDate} onChange={e => setSuspensionDate(e.target.value)} />
                                        <input type="text" placeholder="Ex: Feriado municipal..." className="flex-1 min-w-0 py-1.5 px-2.5 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-xs"
                                            value={suspensionDesc} onChange={e => setSuspensionDesc(e.target.value)} />
                                        <button type="button" 
                                            title="Adicionar Feriado/Suspensão"
                                            onClick={() => { 
                                                if(suspensionDate) { 
                                                    setCustomSuspensions(prev => [...prev, {date: suspensionDate, description: suspensionDesc}]); 
                                                    setSuspensionDate(''); 
                                                    setSuspensionDesc(''); 
                                                } 
                                            }} 
                                            className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg transition-colors flex items-center justify-center shrink-0 aspect-square"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {customSuspensions.length > 0 && (
                                        <div className="space-y-1 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                            {customSuspensions.map((s, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-rose-500">{formatDate(s.date)}</span> 
                                                        <span className="text-slate-600 dark:text-slate-400">{s.description || 'Suspensão Específica'}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setCustomSuspensions(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 rounded hover:bg-rose-50"><X size={13} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {initialData && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Status</label>
                                <select className="w-full py-2 px-3 text-sm rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={status} onChange={e => setStatus(e.target.value as any)}>
                                    <option value="Pending">Pendente</option>
                                    <option value="Done">Concluído</option>
                                    <option value="Canceled">Cancelado</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results - SIMULATION LIST REFACTOR */}
                <div className="p-4 md:p-5 w-full md:w-1/2 bg-slate-50 dark:bg-dark-900/50 flex flex-col max-h-full overflow-hidden">
                    {result ? (
                        <div className="flex flex-col h-full animate-slide-in overflow-hidden">
                            <div className="mb-3 flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vencimento Final</h3>
                                    <div className="flex items-center gap-4 bg-white dark:bg-dark-800 p-3.5 rounded-2xl ring-1 ring-blue-100 dark:ring-blue-900/30 shadow-lg shadow-blue-500/5">
                                        <MiniCalendar date={result.date} />
                                        <div>
                                            <p className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight leading-none mb-1">
                                                {formatDate(result.date.toISOString().split('T')[0])}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                <Check size={14} className="text-blue-500" />
                                                <span>DATA CALCULADA (CPC)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1.5 custom-scrollbar">
                                {result.simulation.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                                        <div className="shrink-0">
                                            {step.isCounted ? (
                                                <div className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-xs font-bold shadow-sm shadow-green-500/20">
                                                    {step.count}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 bg-rose-500 text-white rounded flex items-center justify-center shadow-sm shadow-rose-500/20">
                                                    <X size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-1 border-b border-slate-100 dark:border-slate-800 group-last:border-0">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                    {step.date}
                                                </span>
                                                <span className={`text-xs font-bold whitespace-nowrap px-2 py-0.5 rounded ${step.isCounted
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : step.reason === 'start' ? 'text-slate-400' : 'text-rose-500 dark:text-rose-400'
                                                    }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Legend */}
                                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 pb-2">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Legenda</h4>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-3.5 h-3.5 bg-green-500 rounded shadow-sm shrink-0"></div>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Dia considerado na simulação.</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-3.5 h-3.5 bg-rose-500 rounded shadow-sm shrink-0"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">Dia desconsiderado na simulação.</span>
                                            <span className="text-[9px] text-slate-400 italic">Por suspensão, prorrogação, dia inicial, não útil ou feriado.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-2 pt-2 shrink-0">
                                {initialData && onDelete && (currentUser?.isAdmin || initialData.createdBy === currentUser?.id) && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Deseja realmente excluir este prazo?")) {
                                                onDelete(initialData.id);
                                                onClose();
                                            }
                                        }}
                                        className="px-3.5 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                        title="Excluir Prazo"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white font-medium transition-colors">Cancelar</button>
                                <button onClick={handleSave} className="flex-1 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-500/20">
                                    {initialData ? 'Salvar Alterações' : 'Criar Prazo'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Clock size={64} className="mb-4 opacity-20" />
                            <p>Calculando...</p>
                        </div>
                    )}
                </div>
            </div>

            {showCpcCatalog && (
                <CpcReferenceCatalog
                    onClose={() => setShowCpcCatalog(false)}
                    onSelect={(dias, descricao) => {
                        setDays(dias);
                        setTitle(descricao);
                        setShowCpcCatalog(false);
                    }}
                />
            )}

            {showTempestividade && result && (
                <TempestividadeModal
                    onClose={() => setShowTempestividade(false)}
                    startDate={result.logs[2]?.includes('Dia de início') ? result.logs[2].split(': ')[1].split('/').reverse().join('-') : startDate} // Extract from logs if available to match calc
                    notificationDate={startDate}
                    days={days}
                    countType={type}
                    deadlineDate={result.date.toISOString().split('T')[0]}
                    holidays={mergedHolidays}
                    title={title}
                />
            )}
        </div>
    )
}

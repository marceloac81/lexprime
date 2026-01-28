
import React, { useState, useEffect } from 'react';
import { calculateDeadline, formatDate } from '../utils/dateUtils';
import { Deadline, Case, Holiday } from '../types';
import { Clock, Edit, AlertCircle, Search, X, User, MapPin, Trash2, FileText, Check } from './Icons';
import { TempestividadeModal } from './TempestividadeModal';

interface CalculatorModalProps {
    onClose: () => void;
    cases: Case[];
    onSave: (d: Deadline) => void;
    initialDate?: string;
    initialData?: Deadline | null;
    initialCaseSearch?: string;
    holidays: Holiday[];
    onDelete?: (id: string) => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ onClose, cases, onSave, initialDate, initialData, initialCaseSearch, holidays, onDelete }) => {
    // Default Initialization
    const [startDate, setStartDate] = useState(initialData?.startDate || initialDate || new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(initialData?.startTime || '18:00');
    const [days, setDays] = useState(initialData?.days !== undefined ? initialData.days : 5);
    const [type, setType] = useState<'business' | 'calendar'>(initialData?.countType || 'business');

    const [title, setTitle] = useState(initialData?.title || '');
    const [status, setStatus] = useState<'Pending' | 'Done' | 'Canceled'>(initialData?.status || 'Pending');

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
    const [result, setResult] = useState<{ date: Date, logs: string[] } | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [showTempestividade, setShowTempestividade] = useState(false);

    // Dropdown container ref for click-outside detection
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCaseDropdownOpen(false);
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
        const searchLower = caseSearch.toLowerCase();
        return c.number.includes(searchLower) || c.title.toLowerCase().includes(searchLower) || c.clientName.toLowerCase().includes(searchLower);
    });

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
        const calc = calculateDeadline(startDate, days, type, holidays);
        setResult(calc);
    }, [startDate, days, type, holidays]);

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
            startTime
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-auto">
                {/* Form */}
                <div className="p-6 md:p-8 w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {initialData?.id ? <Edit className="text-primary-500" /> : <Clock className="text-primary-500" />}
                            {initialData?.id ? 'Editar Prazo' : 'Novo Prazo'}
                        </h2>
                        {result && (
                            <button
                                onClick={() => setShowTempestividade(true)}
                                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all flex items-center gap-2 text-[10px] md:text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95"
                                title="Gerar Tópico de Tempestividade"
                            >
                                <FileText size={16} />
                                <span className="hidden sm:inline">Gerar Tempestividade</span>
                                <span className="sm:hidden">Gerar</span>
                            </button>
                        )}
                    </div>

                    {errors.length > 0 && (
                        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                            {errors.map((e, i) => <p key={i} className="text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2"><AlertCircle size={14} /> {e}</p>)}
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Custom Case Search Autocomplete */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vincular Processo</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className={`w-full pl-10 pr-10 p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 font-mono text-sm ${initialData?.caseId ? 'cursor-not-allowed bg-slate-100 dark:bg-dark-900/50' : ''}`}
                                    placeholder="Buscar por número ou cliente..."
                                    value={caseSearch}
                                    onChange={e => { setCaseSearch(e.target.value); setIsCaseDropdownOpen(true); if (selectedCaseId) handleClearCase(); }}
                                    onFocus={() => !initialData?.caseId && setIsCaseDropdownOpen(true)}
                                    disabled={!!initialData?.caseId} // Disable search if case ID is fixed/passed
                                />
                                {selectedCaseId && !initialData?.caseId && (
                                    <button onClick={handleClearCase} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-600">
                                        <X size={16} />
                                    </button>
                                )}
                                {!selectedCaseId && caseSearch && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs italic">Avulso</div>
                                )}
                            </div>

                            {isCaseDropdownOpen && !selectedCaseId && (
                                <div ref={dropdownRef} className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                                    {filteredCases.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleSelectCase(c)}
                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                                        >
                                            <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">{c.number}</div>
                                            <div className="text-xs text-slate-500 truncate">{c.clientName}</div>
                                        </div>
                                    ))}
                                    {filteredCases.length === 0 && (
                                        <div className="p-3 text-center text-xs text-slate-400">Nenhum processo encontrado.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manual Customer Name Input (Conditionally ReadOnly) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nome do Cliente / Interessado {selectedCaseId ? <span className="text-slate-400 font-normal">(Via Processo)</span> : <span className="text-rose-500">*</span>}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className={`w-full pl-10 p-3 rounded-lg border outline-none transition-colors
                                        ${selectedCaseId
                                            ? 'bg-slate-100 dark:bg-dark-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500'
                                        }`}
                                    placeholder="Ex: João da Silva (Consultoria)"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    disabled={!!selectedCaseId}
                                />
                            </div>
                        </div>

                        {/* Location Fields (Row) */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-12">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Local / Vara {selectedCaseId ? <span className="text-slate-400 font-normal">(Via Processo)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        className={`w-full pl-10 p-3 rounded-lg border outline-none transition-colors
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Cidade {selectedCaseId ? <span className="text-slate-400 font-normal">(Via Processo)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    className={`w-full p-3 rounded-lg border outline-none transition-colors
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    UF {selectedCaseId ? <span className="text-slate-400 font-normal">(*)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                {selectedCaseId ? (
                                    <input
                                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-dark-900/50 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                                        value={uf}
                                        disabled
                                    />
                                ) : (
                                    <select
                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        value={uf}
                                        onChange={e => setUf(e.target.value)}
                                    >
                                        <option value="">--</option>
                                        {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Atividade / Nome do Prazo <span className="text-rose-500">*</span></label>
                            <input className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                placeholder="Ex: Contestação, Recurso..." value={title} onChange={e => setTitle(e.target.value)} />
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-4"></div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Inicial</label>
                                <input type="date" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                                <input type="time" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dias</label>
                                <input type="number" min="0" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={days} onChange={e => setDays(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contagem</label>
                                <select className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={type} onChange={e => setType(e.target.value as any)}>
                                    <option value="business">Dias Úteis (CPC)</option>
                                    <option value="calendar">Dias Corridos</option>
                                </select>
                            </div>
                        </div>

                        {initialData && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <select className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    value={status} onChange={e => setStatus(e.target.value as any)}>
                                    <option value="Pending">Pendente</option>
                                    <option value="Done">Concluído</option>
                                    <option value="Canceled">Cancelado</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="p-6 md:p-8 w-full md:w-1/2 bg-slate-50 dark:bg-dark-900/50 flex flex-col h-[400px] md:h-auto">
                    {result ? (
                        <div className="flex flex-col h-full animate-slide-in">
                            <div className="mb-6">
                                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Prazo Final (Calculado)</p>
                                <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-primary-200 dark:border-primary-900/50 shadow-sm">
                                    <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">{formatDate(result.date.toISOString().split('T')[0])}</p>
                                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><AlertCircle size={14} /> Regra CPC aplicada</p>
                                </div>
                            </div>

                            <div className="flex-1 bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto text-sm space-y-2 mb-4 shadow-inner custom-scrollbar">
                                {result.logs.map((l, i) => (
                                    <div key={i} className={`py-1 border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${l.includes('Feriado') || l.includes('Final de semana') ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {l}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-auto shrink-0">
                                {initialData && onDelete && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm("Deseja realmente excluir este prazo?")) {
                                                onDelete(initialData.id);
                                                onClose();
                                            }
                                        }}
                                        className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                        title="Excluir Prazo"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white font-medium transition-colors">Cancelar</button>
                                <button onClick={handleSave} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-500/20">
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

            {showTempestividade && result && (
                <TempestividadeModal
                    onClose={() => setShowTempestividade(false)}
                    startDate={result.logs[2]?.includes('Dia de início') ? result.logs[2].split(': ')[1].split('/').reverse().join('-') : startDate} // Extract from logs if available to match calc
                    notificationDate={startDate}
                    days={days}
                    countType={type}
                    deadlineDate={result.date.toISOString().split('T')[0]}
                    holidays={holidays}
                    title={title}
                />
            )}
        </div>
    )
}

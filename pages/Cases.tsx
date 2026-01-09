
import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Search, Filter, Plus, ChevronRight, X, Briefcase, Clock, FileText, CalendarIcon, User as UserIcon, AlertCircle, Shield, Edit, Trash2, CheckCircle2, GitBranch, ChevronDown } from '../components/Icons';
import { CaseStatus, Case, Deadline } from '../types';
import { CalculatorModal } from '../components/CalculatorModal';
import { formatCurrency, maskCurrency, parseCurrency } from '../utils/currencyUtils';

export const Cases: React.FC = () => {
    const { cases, addCase, updateCase, deleteCase, clearCases, clients, deadlines, pendingAction, setPendingAction, addNotification, setIsLoading, isLoading } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showNewCaseModal, setShowNewCaseModal] = useState(false);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Case | 'clientName'; direction: 'asc' | 'desc' } | null>(null);

    // New Case Form State
    const [newCase, setNewCase] = useState<Partial<Case>>({
        number: '',
        title: '',
        clientName: '',
        clientPosition: 'Ativo',
        opposingParty: '',
        court: '',
        uf: '',
        city: '',
        area: '',
        folderNumber: '',
        value: undefined,
        valueDate: '',
        status: CaseStatus.Active,
    });

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [parentSearch, setParentSearch] = useState('');
    const [showParentDropdown, setShowParentDropdown] = useState(false);
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);

    // List of common legal areas
    const DEFAULT_AREAS = [
        'Civil', 'Trabalhista', 'Criminal', 'Tributário', 'Família', 'Previdenciário',
        'Administrativo', 'Sucessões', 'Empresarial', 'Ambiental'
    ];

    // Simple Brazil States list
    const BR_STATES = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.number.includes(searchTerm) || c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = a[key as keyof Case];
        let bValue: any = b[key as keyof Case];

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof Case | 'clientName') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };


    const validateForm = (): boolean => {
        const errors: string[] = [];
        if (!newCase.number) errors.push("Número do Processo é obrigatório.");
        if (!newCase.clientName) errors.push("Cliente é obrigatório.");
        if (!newCase.opposingParty) errors.push("Parte Contrária é obrigatória.");
        if (!newCase.uf) errors.push("Estado (UF) é obrigatório.");
        if (!newCase.city) errors.push("Município é obrigatório.");
        if (!newCase.court) errors.push("Vara/Local é obrigatório.");
        if (!newCase.area) errors.push("Área é obrigatória.");

        setFormErrors(errors);
        return errors.length === 0;
    };

    // Handle Quick Action
    React.useEffect(() => {
        if (pendingAction === 'newCase') {
            handleOpenNew();
            setPendingAction(null);
        } else if (pendingAction?.startsWith('editCase:')) {
            const id = pendingAction.split(':')[1];
            const c = cases.find(item => item.id === id);
            if (c) {
                setSelectedCase(c);
            }
            setPendingAction(null);
        }
    }, [pendingAction, setPendingAction, cases]);

    const handleOpenNew = () => {
        setIsEditing(false);
        setNewCase({
            number: '', title: '', clientName: '', clientPosition: 'Ativo', opposingParty: '',
            court: '', uf: '', city: '', area: '', folderNumber: '', value: undefined, valueDate: '',
            status: CaseStatus.Active, parentId: '', relatedType: ''
        });
        setFormErrors([]);
        setShowNewCaseModal(true);
    };

    const handleOpenEdit = (c: Case) => {
        setIsEditing(true);
        setNewCase({ ...c });
        setSelectedCase(null); // Close detail modal
        setFormErrors([]);
        setShowNewCaseModal(true);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (window.confirm("Tem certeza que deseja excluir este processo permanentemente? Todos os prazos associados também podem ser afetados.")) {
            deleteCase(id);
            setShowNewCaseModal(false);
            setSelectedCase(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        // Simulation of network latency for Supabase preparation
        setTimeout(() => {
            // Auto-generate title based on Parties (internal use)
            const generatedTitle = `${newCase.clientName?.split(' ')[0]} vs ${newCase.opposingParty?.split(' ')[0]}`;

            const caseData: Case = {
                ...newCase as Case,
                title: generatedTitle,
                lastUpdate: new Date().toISOString(),
            };

            if (isEditing && newCase.id) {
                updateCase(caseData);
            } else {
                addCase({
                    ...caseData,
                    id: Date.now().toString(),
                    tags: ['Novo', newCase.area || 'Geral'],
                    documents: [],
                    history: [{
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        description: 'Processo cadastrado no sistema',
                        user: 'Dr. Admin'
                    }]
                });
            }

            setIsLoading(false);
            setShowNewCaseModal(false);
            setFormErrors([]);
        }, 600);
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide
      ${status === CaseStatus.Active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
      ${status === CaseStatus.Archived ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' : ''}
    `}>
            {status}
        </span>
    );

    return (
        <div className="p-2 md:p-8 h-full flex flex-col animate-fade-in relative max-w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-8 gap-2 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Processos</h1>
                    <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 mt-1">
                        {cases.length === 0 ? "Nenhum processo cadastrado." :
                            filteredCases.length === cases.length ?
                                `Total de ${cases.length} ${cases.length === 1 ? 'processo' : 'processos'}.` :
                                `Exibindo ${filteredCases.length} de ${cases.length} processos.`
                        }
                    </p>
                </div>
                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                    <button
                        onClick={handleOpenNew}
                        className="flex-1 md:flex-none bg-primary-600 hover:bg-primary-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-primary-500/20 transform active:scale-95"
                    >
                        <Plus size={20} /> Novo Processo
                    </button>
                    <button
                        onClick={clearCases}
                        className="p-2 md:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 shadow-sm"
                        title="Limpar Base"
                    >
                        <Trash2 size={20} md:size={22} />
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-dark-800 p-2 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 md:mb-6 flex flex-col md:flex-row gap-2 md:gap-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} md:size={20} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all text-sm"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1 md:pb-0">
                    <Filter size={16} md:size={20} className="text-slate-400 mr-2 shrink-0" />
                    {['all', CaseStatus.Active, CaseStatus.Archived].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors border ${statusFilter === status
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                                : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700 dark:text-slate-400 dark:border-slate-700'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Responsive List Container */}
            <div className="bg-transparent md:bg-white md:dark:bg-dark-800 md:rounded-xl md:shadow-sm md:border md:border-slate-200 md:dark:border-slate-700 flex-1 overflow-hidden flex flex-col">

                {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50">
                                <th onClick={() => handleSort('number')} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[30%] cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                                    <div className="flex items-center gap-1">Processo nº {sortConfig?.key === 'number' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th onClick={() => handleSort('clientName')} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                                    <div className="flex items-center gap-1">Partes {sortConfig?.key === 'clientName' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th onClick={() => handleSort('court')} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                                    <div className="flex items-center gap-1">Local {sortConfig?.key === 'court' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th onClick={() => handleSort('status')} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                                    <div className="flex items-center gap-1">Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th onClick={() => handleSort('folderNumber')} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors">
                                    <div className="flex items-center gap-1">Pasta {sortConfig?.key === 'folderNumber' && (sortConfig.direction === 'asc' ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />)}</div>
                                </th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredCases.map(c => (
                                <tr
                                    key={c.id}
                                    onClick={() => setSelectedCase(c)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                <Briefcase size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{c.number}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{c.area}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${c.clientPosition === 'Ativo' ? 'bg-green-500' : 'bg-rose-500'}`} />
                                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{c.clientName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-xs text-slate-500 truncate max-w-[150px]">vs {c.opposingParty}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-slate-700 dark:text-slate-300">{c.court}</div>
                                        <div className="text-xs text-slate-500">{c.city} - {c.uf}</div>
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={c.status} />
                                    </td>
                                    <td className="p-4 text-sm font-mono text-slate-500">
                                        {c.folderNumber || '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => handleDelete(c.id, e)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Excluir Processo"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARDS VIEW (Hidden on Desktop) */}
                <div className="md:hidden flex flex-col gap-4 overflow-y-auto pb-20 custom-scrollbar">
                    {filteredCases.map(c => (
                        <div
                            key={c.id}
                            onClick={() => setSelectedCase(c)}
                            className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.99] transition-transform"
                        >
                            {/* Header: Number & Status */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                        <Briefcase size={16} />
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">{c.number}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={c.status} />
                                    <button
                                        onClick={(e) => handleDelete(c.id, e)}
                                        className="p-1 text-slate-300 hover:text-rose-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Parties */}
                            <div className="mb-3 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.clientPosition === 'Ativo' ? 'bg-green-500' : 'bg-rose-500'}`} />
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.clientName}</span>
                                </div>
                                <div className="flex items-center gap-2 pl-3.5">
                                    <span className="text-xs text-slate-400">vs</span>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{c.opposingParty}</span>
                                </div>
                            </div>

                            {/* Footer: Location & Folder */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                                <div>
                                    <p className="text-xs font-medium text-slate-900 dark:text-white">{c.court}</p>
                                    <p className="text-xs text-slate-500">{c.city} - {c.uf} • {c.area}</p>
                                </div>
                                {c.folderNumber && (
                                    <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-500">
                                        {c.folderNumber}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedCase && (
                <CaseDetailModal
                    c={selectedCase}
                    onClose={() => setSelectedCase(null)}
                    deadlines={deadlines.filter(d => d.caseId === selectedCase.id)}
                    onEdit={() => handleOpenEdit(selectedCase)}
                    onDelete={() => handleDelete(selectedCase.id)}
                />
            )}

            {/* New/Edit Case Modal */}
            {showNewCaseModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600">
                                    <Briefcase size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Processo' : 'Novo Processo'}</h2>
                                    <p className="hidden md:block text-xs text-slate-500">Preencha os dados obrigatórios.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowNewCaseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <div className="overflow-y-auto p-4 md:p-8 custom-scrollbar">
                            {formErrors.length > 0 && (
                                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                                    <div className="space-y-1">
                                        {formErrors.map((err, idx) => (
                                            <p key={idx} className="text-sm text-rose-700 dark:text-rose-300">{err}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form id="newCaseForm" onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

                                {/* Section 0: Relationship (Desdobramento) */}
                                < div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800" >
                                    <label className="flex items-center gap-3 cursor-pointer" >
                                        <div className="relative" >
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={!!newCase.parentId}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewCase({ ...newCase, parentId: 'selecting', relatedType: 'Agravo de Instrumento' });
                                                    } else {
                                                        setNewCase({ ...newCase, parentId: '', relatedType: '' });
                                                    }
                                                }}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" > </div>
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white" > Este processo é um desdobramento ? </span>
                                    </label>

                                    {
                                        !!newCase.parentId && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" >
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" > Processo Originário </label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                                        <input
                                                            placeholder="Número ou nome do processo..."
                                                            value={parentSearch || (cases.find(c => c.id === newCase.parentId)?.number || '')}
                                                            onChange={(e) => {
                                                                setParentSearch(e.target.value);
                                                                setShowParentDropdown(true);
                                                            }}
                                                            onFocus={() => setShowParentDropdown(true)}
                                                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white transition-all focus:ring-2 focus:ring-primary-500"
                                                        />
                                                        {showParentDropdown && (
                                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                                                                {cases
                                                                    .filter(c => c.id !== newCase.id &&
                                                                        (c.number.toLowerCase().includes(parentSearch.toLowerCase()) ||
                                                                            c.title.toLowerCase().includes(parentSearch.toLowerCase())))
                                                                    .length > 0 ? (
                                                                    cases
                                                                        .filter(c => c.id !== newCase.id &&
                                                                            (c.number.toLowerCase().includes(parentSearch.toLowerCase()) ||
                                                                                c.title.toLowerCase().includes(parentSearch.toLowerCase())))
                                                                        .map(c => (
                                                                            <button
                                                                                key={c.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setNewCase({
                                                                                        ...newCase,
                                                                                        parentId: c.id,
                                                                                        clientName: c.clientName,
                                                                                        clientPosition: c.clientPosition,
                                                                                        opposingParty: c.opposingParty,
                                                                                        area: c.area
                                                                                    });
                                                                                    setParentSearch('');
                                                                                    setShowParentDropdown(false);
                                                                                }}
                                                                                className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 dark:hover:text-white border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                                                                            >
                                                                                <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{c.number}</div>
                                                                                <div className="text-xs text-slate-500 mt-0.5 truncate">{c.title}</div>
                                                                            </button>
                                                                        ))
                                                                ) : (
                                                                    <div className="p-4 text-center text-sm text-slate-400 italic">Nenhum processo encontrado.</div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {showParentDropdown && (
                                                            <div
                                                                className="fixed inset-0 z-[55]"
                                                                onClick={() => setShowParentDropdown(false)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                < div >
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" > Tipo de Desdobramento </label>
                                                    < select
                                                        value={newCase.relatedType || ''}
                                                        onChange={(e) => setNewCase({ ...newCase, relatedType: e.target.value })
                                                        }
                                                        className="w-full p-3 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    >
                                                        <option value="Agravo de Instrumento" > Agravo de Instrumento </option>
                                                        < option value="Carta Precatória" > Carta Precatória </option>
                                                        < option value="Cumprimento de Sentença" > Cumprimento de Sentença </option>
                                                        < option value="Recurso Inominado" > Recurso Inominado </option>
                                                        < option value="Apelação" > Apelação </option>
                                                        < option value="Recurso Especial" > Recurso Especial </option>
                                                        < option value="Embargos à Execução" > Embargos à Execução </option>
                                                        < option value="Outros" > Outros </option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Section 1: Localization & Area */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Shield size={14} /> 1. Localização e Competência
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        {/* UF */}
                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF <span className="text-rose-500">*</span></label>
                                            <select
                                                value={newCase.uf}
                                                onChange={e => setNewCase({ ...newCase, uf: e.target.value, city: '' })} // Reset city on UF change
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            >
                                                <option value="">--</option>
                                                {BR_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </select>
                                        </div>

                                        {/* City */}
                                        <div className="md:col-span-9">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Município <span className="text-rose-500">*</span></label>
                                            <input
                                                placeholder={newCase.uf ? `Digite a cidade de ${newCase.uf}...` : "Selecione a UF primeiro"}
                                                value={newCase.city}
                                                disabled={!newCase.uf}
                                                onChange={e => setNewCase({ ...newCase, city: e.target.value })}
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>

                                        {/* Court */}
                                        <div className="md:col-span-8">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vara / Local <span className="text-rose-500">*</span></label>
                                            <input
                                                placeholder="Ex: 5ª Vara Cível, Procon, Delegacia..."
                                                value={newCase.court}
                                                onChange={e => setNewCase({ ...newCase, court: e.target.value })}
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            />
                                        </div>

                                        {/* Area */}
                                        <div className="md:col-span-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Área <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    placeholder="Selecione ou digite..."
                                                    value={newCase.area || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setNewCase({ ...newCase, area: val });
                                                        setAreaSearch(val);
                                                        setShowAreaDropdown(true);
                                                    }}
                                                    onFocus={() => setShowAreaDropdown(true)}
                                                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white transition-all focus:ring-2 focus:ring-primary-500"
                                                />
                                                {showAreaDropdown && (
                                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                                                        {Array.from(new Set([...DEFAULT_AREAS, ...cases.map(c => c.area).filter(Boolean)]))
                                                            .filter(a => a.toLowerCase().includes(areaSearch.toLowerCase()))
                                                            .sort()
                                                            .map(area => (
                                                                <button
                                                                    key={area}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewCase({ ...newCase, area });
                                                                        setAreaSearch('');
                                                                        setShowAreaDropdown(false);
                                                                    }}
                                                                    className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-dark-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors text-sm text-slate-700 dark:text-slate-300"
                                                                >
                                                                    {area}
                                                                </button>
                                                            ))}
                                                        {areaSearch && !Array.from(new Set([...DEFAULT_AREAS, ...cases.map(c => c.area).filter(Boolean)])).some(a => a.toLowerCase() === areaSearch.toLowerCase()) && (
                                                            <div className="p-3 text-xs text-slate-400 italic border-t border-slate-100 dark:border-slate-700">
                                                                Pressione Tab ou clique fora para usar "{areaSearch}" como nova área.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {showAreaDropdown && (
                                                    <div
                                                        className="fixed inset-0 z-[55]"
                                                        onClick={() => setShowAreaDropdown(false)}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Folder Number */}
                                        <div className="md:col-span-12">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nº Pasta Física / Interna (Opcional)</label>
                                            <input
                                                placeholder="Ex: ARQ-2024-001"
                                                value={newCase.folderNumber}
                                                onChange={e => setNewCase({ ...newCase, folderNumber: e.target.value })}
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Identification */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <FileText size={14} /> 2. Identificação do Processo
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número do Processo (CNJ ou Admin) <span className="text-rose-500">*</span></label>
                                        <input
                                            placeholder="0000000-00.0000.0.00.0000"
                                            value={newCase.number}
                                            onChange={e => setNewCase({ ...newCase, number: e.target.value })}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white font-mono tracking-wide focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </section>

                                {/* Section 3: Parties */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <UserIcon size={14} /> 3. Envolvimento das Partes
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        {/* Client */}
                                        <div className="md:col-span-8">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Cliente <span className="text-rose-500">*</span></label>
                                            <select
                                                value={newCase.clientName}
                                                onChange={e => setNewCase({ ...newCase, clientName: e.target.value })}
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            >
                                                <option value="">Selecione um cliente cadastrado...</option>
                                                {clients.map(cli => <option key={cli.id} value={cli.name}>{cli.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Position */}
                                        <div className="md:col-span-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Polo <span className="text-rose-500">*</span></label>
                                            <div className="flex bg-slate-50 dark:bg-dark-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewCase({ ...newCase, clientPosition: 'Ativo' })}
                                                    className={`flex-1 py-2 rounded text-sm font-medium transition-all ${newCase.clientPosition === 'Ativo' ? 'bg-white dark:bg-dark-700 shadow text-green-600' : 'text-slate-400'}`}
                                                >
                                                    Ativo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewCase({ ...newCase, clientPosition: 'Passivo' })}
                                                    className={`flex-1 py-2 rounded text-sm font-medium transition-all ${newCase.clientPosition === 'Passivo' ? 'bg-white dark:bg-dark-700 shadow text-rose-600' : 'text-slate-400'}`}
                                                >
                                                    Passivo
                                                </button>
                                            </div>
                                        </div>

                                        {/* Opposing Party */}
                                        <div className="md:col-span-12">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parte Contrária <span className="text-rose-500">*</span></label>
                                            <input
                                                placeholder="Nome da parte adversa"
                                                value={newCase.opposingParty}
                                                onChange={e => setNewCase({ ...newCase, opposingParty: e.target.value })}
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 4: Financials */}
                                <section className="pb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="text-base">R$</span> 4. Dados Financeiros (Opcional)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor da Causa</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
                                                <input
                                                    type="text"
                                                    placeholder="0,00"
                                                    value={newCase.value !== undefined ? maskCurrency(newCase.value.toFixed(2).replace('.', '')) : ''}
                                                    onChange={e => {
                                                        const masked = maskCurrency(e.target.value);
                                                        setNewCase({ ...newCase, value: parseCurrency(masked) });
                                                    }}
                                                    className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Valor</label>
                                            <input
                                                type="date"
                                                value={newCase.valueDate}
                                                onChange={e => setNewCase({ ...newCase, valueDate: e.target.value })}
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </section>

                            </form>
                        </div>

                        <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50 dark:bg-dark-900/50 shrink-0">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={(e) => handleDelete(newCase.id!, e)}
                                    className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                    title="Excluir Processo"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowNewCaseModal(false)}
                                className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                form="newCaseForm"
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    isEditing ? 'Salvar' : 'Criar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CaseDetailModal: React.FC<{ c: Case, onClose: () => void, deadlines: Deadline[], onEdit: () => void, onDelete: () => void }> = ({ c, onClose, deadlines, onEdit, onDelete }) => {
    const { addDeadline, holidays, cases, updateCase } = useStore();
    const [activeTab, setActiveTab] = useState<'timeline' | 'occurrences' | 'info'>('timeline');
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);

    // Occurrences form state
    const [newOccDate, setNewOccDate] = useState(new Date().toISOString().split('T')[0]);
    const [newOccText, setNewOccText] = useState('');

    const handleAddOccurrence = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOccText) return;

        const newOccurrence = {
            id: Date.now().toString(),
            date: newOccDate,
            description: newOccText
        };

        const updatedOccurrences = [...(c.occurrences || []), newOccurrence].sort((a, b) => b.date.localeCompare(a.date));

        updateCase({
            ...c,
            occurrences: updatedOccurrences
        });

        setNewOccText('');
    };

    const handleDeleteOccurrence = (occId: string) => {
        if (!window.confirm('Excluir esta ocorrência?')) return;
        updateCase({
            ...c,
            occurrences: (c.occurrences || []).filter(o => o.id !== occId)
        });
    };

    const handleSaveDeadline = (d: Deadline) => {
        addDeadline(d);
        setShowDeadlineModal(false);
    };

    const handleToggleArchive = () => {
        const newStatus = c.status === CaseStatus.Archived ? CaseStatus.Active : CaseStatus.Archived;
        updateCase({ ...c, status: newStatus });
        // Keeping modal open to see change, or close it? Let's keep open and update UI
        // Since 'c' prop is from parent state, it might not update immediately if parent doesn't re-render with new data. 
        // Ideally we should use internal state or rely on parent update. 
        // For now, let's close it to avoid state sync complexity in this simple view.
        onClose();
    };

    const isArchived = c.status === CaseStatus.Archived;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center animate-fade-in">
            <div className="bg-white dark:bg-dark-800 w-full md:w-[90%] md:max-w-4xl h-[90vh] md:h-[85vh] md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-900 flex justify-between items-start shrink-0">
                    <div className="flex gap-4 items-start">
                        <div className="hidden md:block p-3 bg-white dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Briefcase size={24} className="text-primary-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white font-mono truncate max-w-[200px] md:max-w-none">{c.number}</h2>
                                <button onClick={onEdit} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-500 transition-colors" title="Editar Processo">
                                    <Edit size={16} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-wrap">
                                <span className="font-semibold hidden md:inline">{c.title}</span>
                                <span className="hidden md:inline">•</span>
                                <span>{c.uf} - {c.city}</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${c.status === CaseStatus.Active ? 'bg-blue-100 text-blue-700' :
                                    c.status === CaseStatus.Archived ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'
                                    }`}>{c.status}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 px-2 md:px-6 shrink-0 overflow-x-auto">
                    {[
                        { id: 'timeline', label: 'Linha do Tempo', icon: Clock },
                        { id: 'occurrences', label: 'Ocorrências', icon: FileText },
                        { id: 'info', label: 'Informações', icon: Briefcase },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 md:px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-dark-900/50 custom-scrollbar">
                    {activeTab === 'timeline' && (
                        <div className="space-y-8 max-w-3xl mx-auto">
                            {/* Deadlines Integration */}
                            {deadlines.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Prazos Pendentes</h3>
                                    <div className="space-y-3">
                                        {deadlines.map(d => (
                                            <div key={d.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-amber-500">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-900 dark:text-white">{d.title}</h4>
                                                    <p className="text-xs text-slate-500">{d.type}</p>
                                                </div>
                                                <div className="md:text-right flex justify-between md:block">
                                                    <p className="text-sm font-bold text-rose-500">{new Date(d.dueDate).toLocaleDateString()}</p>
                                                    <p className="text-xs text-slate-400">Vencimento</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* History */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Histórico de Movimentações</h3>
                                <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                                    {c.history?.map((h, idx) => (
                                        <div key={h.id} className="relative animate-slide-in">
                                            <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-white dark:bg-dark-800 border-2 border-primary-500 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                            </div>
                                            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <p className="text-sm text-slate-500 mb-1">{new Date(h.date).toLocaleString()}</p>
                                                <p className="text-slate-900 dark:text-white font-medium">{h.description}</p>
                                                <p className="text-xs text-slate-400 mt-2">Por: {h.user}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {!c.history?.length && <p className="text-slate-400 italic">Nenhuma movimentação registrada.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'occurrences' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {/* Form */}
                            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Nova Ocorrência</h3>
                                <form onSubmit={handleAddOccurrence} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
                                            <input
                                                type="date"
                                                value={newOccDate}
                                                onChange={e => setNewOccDate(e.target.value)}
                                                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm"
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ocorrência (Anotação Livre)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Escreva o que aconteceu..."
                                                    value={newOccText}
                                                    onChange={e => setNewOccText(e.target.value)}
                                                    className="flex-1 p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white text-sm"
                                                />
                                                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                                                    Adicionar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* List */}
                            <div className="space-y-3">
                                {(c.occurrences || []).length > 0 ? (
                                    (c.occurrences || []).map(occ => (
                                        <div key={occ.id} className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-4 group">
                                            <div className="shrink-0 flex flex-col items-center">
                                                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                                                <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-700 my-1"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{occ.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteOccurrence(occ.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <FileText size={48} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-400 italic">Nenhuma ocorrência registrada para este processo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Briefcase size={16} /> Dados Principais</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Número</p>
                                        <p className="font-mono font-medium break-all">{c.number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Pasta Física</p>
                                        <p className="font-mono font-medium">{c.folderNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Área</p>
                                        <p className="font-medium">{c.area}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Valor da Causa</p>
                                        <p className="font-medium">{c.value ? formatCurrency(c.value) : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserIcon size={16} /> Partes</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-slate-50 dark:bg-dark-900 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase mb-1">Cliente ({c.clientPosition})</p>
                                        <p className="font-bold text-lg">{c.clientName}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-dark-900 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase mb-1">Parte Contrária</p>
                                        <p className="font-bold text-lg">{c.opposingParty}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Shield size={16} /> Localização</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Vara / Órgão</p>
                                        <p className="font-medium">{c.court}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Cidade / UF</p>
                                        <p className="font-medium">{c.city} - {c.uf}</p>
                                    </div>

                                    {/* Related Cases Section */}
                                    {(c.parentId || cases.some(other => other.parentId === c.id)) && (
                                        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><GitBranch size={16} /> Processos Relacionados</h4>
                                            <div className="space-y-3">
                                                {/* Parent */}
                                                {c.parentId && (() => {
                                                    const parent = cases.find(p => p.id === c.parentId);
                                                    return parent ? (
                                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">Processo Originário</p>
                                                                <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">{parent.number}</p>
                                                                <p className="text-xs text-slate-500">{parent.title}</p>
                                                            </div>
                                                            <button onClick={() => { onClose(); window.setTimeout(() => updateCase(parent), 100); }} className="p-1 hover:bg-white dark:hover:bg-dark-800 rounded transition-colors text-purple-500">
                                                                <Briefcase size={16} />
                                                            </button>
                                                        </div>
                                                    ) : null;
                                                })()}

                                                {/* Children */}
                                                {cases.filter(child => child.parentId === c.id).map(child => (
                                                    <div key={child.id} className="p-3 ml-4 border-l-2 border-slate-200 dark:border-slate-600 pl-4 relative">
                                                        <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-[2px] bg-slate-200 dark:bg-slate-600"></div>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-1 inline-block">
                                                                    {child.relatedType || 'Desdobramento'}
                                                                </span>
                                                                <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">{child.number}</p>
                                                            </div>
                                                            {/* We might need a way to open this child case, but let's keep it simple for now as per instructions */}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white dark:bg-dark-800 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-end gap-3 shrink-0">
                    <button
                        onClick={handleToggleArchive}
                        className={`px-4 py-2 font-medium rounded-lg w-full md:w-auto transition-colors flex items-center justify-center gap-2
                            ${isArchived
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}
                        `}
                    >
                        {isArchived ? <CheckCircle2 size={18} /> : <Briefcase size={18} />}
                        {isArchived ? 'Desarquivar Processo' : 'Arquivar Processo'}
                    </button>

                    <button
                        onClick={onDelete}
                        className="px-4 py-2 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg w-full md:w-auto flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                        <Trash2 size={18} /> Excluir
                    </button>

                    <button
                        onClick={() => setShowDeadlineModal(true)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-lg shadow-primary-500/20 w-full md:w-auto flex items-center justify-center gap-2"
                    >
                        <Clock size={18} /> Novo Prazo
                    </button>
                </div>
            </div>

            {showDeadlineModal && (
                <CalculatorModal
                    onClose={() => setShowDeadlineModal(false)}
                    cases={cases}
                    onSave={handleSaveDeadline}
                    holidays={holidays}
                    initialData={{ caseId: c.id } as any} // Trick to pre-fill case selection
                />
            )}
        </div>
    )
}

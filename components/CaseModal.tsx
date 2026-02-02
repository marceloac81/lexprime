
import React, { useState, useEffect } from 'react';
import { X, Briefcase, Search, FileText, User as UserIcon, AlertCircle, Shield, GitBranch } from '../components/Icons';
import { CaseStatus, Case } from '../types';
import { maskCurrency, parseCurrency } from '../utils/currencyUtils';

interface CaseModalProps {
    onClose: () => void;
    onSave: (caseData: Case) => void;
    clients: any[];
    cases: Case[];
    initialData?: Partial<Case>;
    isEditing?: boolean;
    initialNumber?: string;
}

export const CaseModal: React.FC<CaseModalProps> = ({
    onClose,
    onSave,
    clients,
    cases,
    initialData,
    isEditing = false,
    initialNumber = ''
}) => {
    const [newCase, setNewCase] = useState<Partial<Case>>({
        number: initialNumber || initialData?.number || '',
        title: initialData?.title || '',
        clientName: initialData?.clientName || '',
        clientPosition: initialData?.clientPosition || 'Ativo',
        opposingParty: initialData?.opposingParty || '',
        court: initialData?.court || '',
        uf: initialData?.uf || '',
        city: initialData?.city || '',
        area: initialData?.area || '',
        folderNumber: initialData?.folderNumber || '',
        value: initialData?.value,
        valueDate: initialData?.valueDate || '',
        status: initialData?.status || CaseStatus.Active,
        parentId: initialData?.parentId || '',
        relatedType: initialData?.relatedType || '',
        id: initialData?.id
    });

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [parentSearch, setParentSearch] = useState('');
    const [showParentDropdown, setShowParentDropdown] = useState(false);
    const [areaSearch, setAreaSearch] = useState('');
    const [showAreaDropdown, setShowAreaDropdown] = useState(false);
    const [clientSearch, setClientSearch] = useState(initialData?.clientName || '');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [courtSearch, setCourtSearch] = useState('');
    const [showCourtDropdown, setShowCourtDropdown] = useState(false);

    const DEFAULT_AREAS = [
        'Civil', 'Trabalhista', 'Criminal', 'Tributário', 'Família', 'Previdenciário',
        'Administrativo', 'Sucessões', 'Empresarial', 'Ambiental'
    ];

    const BR_STATES = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const generatedTitle = `${newCase.clientName?.split(' ')[0]} vs ${newCase.opposingParty?.split(' ')[0]}`;

        const caseData: Case = {
            ...newCase as Case,
            title: generatedTitle,
            lastUpdate: new Date().toISOString(),
        };

        if (!isEditing || !newCase.id) {
            caseData.id = Date.now().toString();
            caseData.tags = ['Novo', newCase.area || 'Geral'];
            caseData.documents = [];
            caseData.history = [{
                id: Date.now().toString(),
                date: new Date().toISOString(),
                description: 'Processo cadastrado no sistema',
                user: 'Dr. Admin'
            }];
        }

        onSave(caseData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all scale-100 max-h-[95vh] flex flex-col">
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
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
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
                        {/* Relationship Section */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
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
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">Este processo é um desdobramento?</span>
                            </label>

                            {!!newCase.parentId && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Processo Originário</label>
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
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Desdobramento</label>
                                        <select
                                            value={newCase.relatedType || ''}
                                            onChange={(e) => setNewCase({ ...newCase, relatedType: e.target.value })}
                                            className="w-full p-3 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                        >
                                            <option value="Agravo de Instrumento">Agravo de Instrumento</option>
                                            <option value="Processo Administrativo">Processo Administrativo</option>
                                            <option value="Recurso Extraordinário">Recurso Extraordinário</option>
                                            <option value="Agravo Interno / Agravo Regimental">Agravo Interno / Agravo Regimental</option>
                                            <option value="Carta Precatória">Carta Precatória</option>
                                            <option value="Cumprimento de Sentença">Cumprimento de Sentença</option>
                                            <option value="Recurso Inominado">Recurso Inominado</option>
                                            <option value="Apelação">Apelação</option>
                                            <option value="Recurso Especial">Recurso Especial</option>
                                            <option value="Embargos à Execução">Embargos à Execução</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 1: Identification - MOVED UP */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14} /> 1. Identificação do Processo
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

                        {/* Section 1: Localization */}
                        <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Shield size={14} /> 1. Localização e Competência
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF <span className="text-rose-500">*</span></label>
                                    <select
                                        value={newCase.uf}
                                        onChange={e => setNewCase({ ...newCase, uf: e.target.value, city: '' })}
                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    >
                                        <option value="">--</option>
                                        {BR_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-9">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Município <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            placeholder={newCase.uf ? `Selecione ou digite a cidade...` : "Selecione a UF primeiro"}
                                            value={newCase.city}
                                            disabled={!newCase.uf}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setNewCase({ ...newCase, city: val });
                                                setCitySearch(val);
                                                setShowCityDropdown(true);
                                            }}
                                            onFocus={() => setShowCityDropdown(true)}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-primary-500"
                                        />
                                        {showCityDropdown && newCase.uf && (
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">
                                                {Array.from(new Set(cases.filter(c => c.uf === newCase.uf && c.city).map(c => c.city)))
                                                    .filter(city => city.toLowerCase().includes(citySearch.toLowerCase()))
                                                    .sort()
                                                    .map(city => (
                                                        <button
                                                            key={city}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewCase({ ...newCase, city });
                                                                setCitySearch('');
                                                                setShowCityDropdown(false);
                                                            }}
                                                            className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-dark-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors text-sm text-slate-700 dark:text-slate-300"
                                                        >
                                                            {city}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-8">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vara / Local <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            placeholder="Ex: 5ª Vara Cível, Procon, Delegacia..."
                                            value={newCase.court}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setNewCase({ ...newCase, court: val });
                                                setCourtSearch(val);
                                                setShowCourtDropdown(true);
                                            }}
                                            onFocus={() => setShowCourtDropdown(true)}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white transition-all focus:ring-2 focus:ring-primary-500"
                                        />
                                        {showCourtDropdown && (
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">
                                                {Array.from(new Set(cases.filter(c => (!newCase.city || c.city === newCase.city) && c.court).map(c => c.court)))
                                                    .filter(court => court.toLowerCase().includes(courtSearch.toLowerCase()))
                                                    .sort()
                                                    .map(court => (
                                                        <button
                                                            key={court}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewCase({ ...newCase, court });
                                                                setCourtSearch('');
                                                                setShowCourtDropdown(false);
                                                            }}
                                                            className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-dark-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors text-sm text-slate-700 dark:text-slate-300"
                                                        >
                                                            {court}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-12">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nº Pasta Física / Interna (Opcional)</label>
                                    <input
                                        placeholder="Ex: 1234/001"
                                        value={newCase.folderNumber}
                                        onChange={e => setNewCase({ ...newCase, folderNumber: e.target.value })}
                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Parties (was 3) */}
                        <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <UserIcon size={14} /> 3. Envolvimento das Partes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-8">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Cliente <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            placeholder="Digite o nome para buscar..."
                                            value={clientSearch}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setClientSearch(val);
                                                setShowClientDropdown(true);
                                                setNewCase({ ...newCase, clientName: val });
                                            }}
                                            onFocus={() => setShowClientDropdown(true)}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white transition-all focus:ring-2 focus:ring-primary-500"
                                        />
                                        {showClientDropdown && (
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                                                {clients
                                                    .filter(cli => cli.name.toLowerCase().includes(clientSearch.toLowerCase()))
                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                    .map(cli => (
                                                        <button
                                                            key={cli.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewCase({
                                                                    ...newCase,
                                                                    clientName: cli.name,
                                                                    clientId: cli.id
                                                                });
                                                                setClientSearch(cli.name);
                                                                setShowClientDropdown(false);
                                                            }}
                                                            className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-dark-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors text-sm text-slate-900 dark:text-slate-200 font-medium"
                                                        >
                                                            {cli.name}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                <div className="md:col-span-12">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parte Contrária Principal <span className="text-rose-500">*</span></label>
                                    <input
                                        placeholder="Nome da parte adversa"
                                        value={newCase.opposingParty}
                                        onChange={e => setNewCase({ ...newCase, opposingParty: e.target.value })}
                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 5: Finance (was 4) */}
                        <section className="pb-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="text-base">R$</span> 5. Dados Financeiros (Opcional)
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
                    <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white font-medium transition-colors">Cancelar</button>
                    <button type="submit" form="newCaseForm" className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                        {isEditing ? 'Salvar Alterações' : 'Cadastrar Processo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

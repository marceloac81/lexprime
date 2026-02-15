
import React, { useState, useEffect } from 'react';
import {
    X, Briefcase, Search, FileText, User as UserIcon, AlertCircle, Shield, GitBranch,
    Loader2, Check, Copy, Download, CalendarIcon, ArrowRight, RotateCcw,
    Maximize2, Minimize2
} from '../components/Icons';
import { CaseStatus, Case } from '../types';
import { maskCurrency, parseCurrency } from '../utils/currencyUtils';
import { normalizeText } from '../utils/textUtils';
import { formatCNJ } from '../utils/cnjUtils';
import { fetchProcessData } from '../services/datajudService';
import { DataJudResponse, ProcessSource } from '../types/datajud';

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
    // --- Form State ---
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
        tribunal: initialData?.tribunal || '',
        subject: initialData?.subject || '',
        probability: initialData?.probability || '',
        id: initialData?.id
    });

    const [formErrors, setFormErrors] = useState<string[]>([]);

    // --- Autocomplete States ---
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

    // --- DataJud State ---
    const [loadingDataJud, setLoadingDataJud] = useState(false);
    const [dataJudError, setDataJudError] = useState<string | null>(null);
    const [dataJudResult, setDataJudResult] = useState<ProcessSource | null>(null);
    const [isDataImported, setIsDataImported] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(true);

    const DEFAULT_AREAS = [
        'Civil', 'Trabalhista', 'Criminal', 'Tributário', 'Família', 'Previdenciário',
        'Administrativo', 'Sucessões', 'Empresarial', 'Ambiental'
    ];

    const BR_STATES = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    // --- Effects ---
    // If editing, try to fetch data automatically if number is present (optional, maybe better on manual click only to save API quotas)
    // For now, let's keep it manual.

    // --- Search Handler ---
    const handleSearchDataJud = async () => {
        if (!newCase.number || newCase.number.length < 10) {
            setDataJudError("Digite um número de processo válido para buscar.");
            return;
        }

        setLoadingDataJud(true);
        setDataJudError(null);
        setDataJudResult(null);
        setIsDataImported(false);

        try {
            const response = await fetchProcessData(newCase.number);
            if (response.hits.total.value > 0) {
                const processData = response.hits.hits[0]._source;
                setDataJudResult(processData);
            } else {
                setDataJudError("Processo não encontrado no DataJud. Verifique o número ou tente novamente mais tarde.");
            }
        } catch (error) {
            setDataJudError("Erro ao conectar com DataJud. Verifique sua internet ou tente mais tarde.");
            console.error(error);
        } finally {
            setLoadingDataJud(false);
        }
    };

    // --- Auto-fill Handler ---
    const handleImportData = () => {
        if (!dataJudResult) return;

        const updates: Partial<Case> = {};

        // 1. Tribunal / UF / Cidade
        if (dataJudResult.tribunal) {
            // Tentativa de extrair UF do tribunal (Ex: TJSP -> SP, TRT1 -> RJ?)
            // Simplificação: Se tribunal contem sigla de estado no fim
            const tribunalUpper = dataJudResult.tribunal.toUpperCase();
            const possibleUF = BR_STATES.find(uf => tribunalUpper.endsWith(uf));
            if (possibleUF) updates.uf = possibleUF;
        }

        // 2. Vara / Órgão
        if (dataJudResult.orgaoJulgador?.nome) {
            updates.court = dataJudResult.orgaoJulgador.nome;
            // Tentar extrair cidade do nome da vara se UF estiver preenchido
            if (updates.uf && dataJudResult.orgaoJulgador.nome.includes('-')) {
                const parts = dataJudResult.orgaoJulgador.nome.split('-');
                if (parts.length > 1) {
                    updates.city = parts[parts.length - 1].trim();
                }
            }
        }

        // 2.1 Tribunal (Direct mapping)
        if (dataJudResult.tribunal) {
            updates.tribunal = dataJudResult.tribunal;
        }

        // 2.1.1 Assunto
        if (dataJudResult.assuntos && dataJudResult.assuntos.length > 0) {
            updates.subject = dataJudResult.assuntos[0].nome;
        }

        // 2.2 Data de Ajuizamento -> Data do Valor da Causa
        if (dataJudResult.dataAjuizamento) {
            try {
                // Converte ISO (ou formato DataJud) para YYYY-MM-DD para o campo de data
                // DataJud costuma retornar ISO, mas vamos garantir o split no 'T' ou ' '
                const datePart = dataJudResult.dataAjuizamento.split(/[T ]/)[0];
                if (datePart && !isNaN(Date.parse(datePart))) {
                    updates.valueDate = datePart;
                }
            } catch (err) {
                console.error("Erro ao processar data de ajuizamento:", err);
            }
        }

        // 3. Área / Classe
        if (dataJudResult.classe?.nome) {
            // Mapear classes para Áreas
            const classe = dataJudResult.classe.nome.toLowerCase();
            if (classe.includes('cível') || classe.includes('alimentos') || classe.includes('família')) updates.area = 'Civil';
            else if (classe.includes('trabalho') || classe.includes('trabalhista')) updates.area = 'Trabalhista';
            else if (classe.includes('criminal') || classe.includes('penal')) updates.area = 'Criminal';
            else if (classe.includes('tributário') || classe.includes('fiscal')) updates.area = 'Tributário';
            else updates.area = dataJudResult.classe.nome; // Fallback
        }

        // 4. Partes
        // Precisamos identificar quem é nosso cliente na lista de pólos
        // Como não sabemos quem é o cliente do escritório no DataJud, 
        // podemos apenas sugerir os nomes nos campos correspondentes SE estiverem vazios

        // Ativo (Autor)
        const poloAtivo = dataJudResult.polos.find(p => p.polo === 'AT');
        const autores = poloAtivo?.partes.map(p => p.nome).join(', ') || '';

        // Passivo (Réu)
        const poloPassivo = dataJudResult.polos.find(p => p.polo === 'PA');
        const reus = poloPassivo?.partes.map(p => p.nome).join(', ') || '';

        if (!newCase.clientName) {
            // Se cliente vazio, não preenchemos automaticamente pois não sabemos quem é o cliente.
            // Mas poderíamos colocar num campo temporário ou deixar o usuário copiar.
            // O usuário pediu "Importar Dados", então vamos tentar preencher.
            // Vamos assumir que se o cliente não está preenchido, o usuário vai ajustar.
            // Mas é arriscado substituir. Vamos apenas preencher Parte Contrária se vazia.
        }

        if (!newCase.opposingParty) {
            // Se o cliente já estiver preenchido, tentamos achar ele nos polos para deduzir o oponente
            if (newCase.clientName && autores.toUpperCase().includes(newCase.clientName.toUpperCase())) {
                updates.opposingParty = reus;
                updates.clientPosition = 'Ativo';
            } else if (newCase.clientName && reus.toUpperCase().includes(newCase.clientName.toUpperCase())) {
                updates.opposingParty = autores;
                updates.clientPosition = 'Passivo';
            } else {
                // Se não temos cliente, ou não achamos match, preenchemos Oponente com Réus (suposição comum)
                // updates.opposingParty = reus; 
            }
        }

        // Preenche dados financeiros se disponíveis (DataJud as vezes retorna valor da causa em detalhes, as vezes não)
        // O campo 'valor' não está explícito na interface ProcessSource simplificada, mas pode vir.

        setNewCase(prev => ({ ...prev, ...updates }));
        setIsDataImported(true);
        setTimeout(() => setIsDataImported(false), 3000);
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
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 md:p-4'} animate-fade-in`}>
            {/* Modal Container - Expanded Width for Split View */}
            <div className={`bg-white dark:bg-dark-800 shadow-2xl flex flex-col overflow-hidden transform transition-all scale-100 border border-slate-200 dark:border-slate-700 ${isFullscreen ? 'w-screen h-screen rounded-none border-none' : 'w-full max-w-7xl h-[95vh] rounded-2xl'}`}>

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Processo' : 'Novo Processo'}</h2>
                            <p className="hidden md:block text-xs text-slate-500">
                                {isEditing ? 'Atualize os dados do processo.' : 'Cadastre um novo processo manualmente ou via DataJud.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Split View Content */}
                <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

                    {/* LEFT COLUMN: Form (Scrollable) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-dark-800 relative">
                        {formErrors.length > 0 && (
                            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-3 sticky top-0 z-10">
                                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                                <div className="space-y-1">
                                    {formErrors.map((err, idx) => (
                                        <p key={idx} className="text-sm text-rose-700 dark:text-rose-300">{err}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form id="newCaseForm" onSubmit={handleSubmit} className="space-y-4 pb-20">

                            {/* Section 1: Identification & Search */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} /> 1. Identificação
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Número do Processo (CNJ ou outro) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            placeholder="0000000-00.0000.0.00.0000"
                                            value={newCase.number}
                                            onChange={e => setNewCase({ ...newCase, number: formatCNJ(e.target.value) })}
                                            className="w-full pl-4 pr-12 py-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white font-mono tracking-wide focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSearchDataJud}
                                            disabled={loadingDataJud || !newCase.number}
                                            className="absolute right-2 p-2 rounded-lg bg-white dark:bg-dark-800 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-50 transition-colors shadow-sm border border-slate-100 dark:border-slate-600"
                                            title="Buscar na DataJud"
                                        >
                                            {loadingDataJud ? <Loader2 size={18} className="animate-spin text-primary-600" /> : <Search size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                                        Digite o número CNJ e clique na lupa para buscar dados automáticos.
                                    </p>
                                </div>

                                {/* Section: Relationship (MOVED UP) */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
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
                                                                    (normalizeText(c.number).includes(normalizeText(parentSearch)) ||
                                                                        normalizeText(c.title).includes(normalizeText(parentSearch))))
                                                                .length > 0 ? (
                                                                cases
                                                                    .filter(c => c.id !== newCase.id &&
                                                                        (normalizeText(c.number).includes(normalizeText(parentSearch)) ||
                                                                            normalizeText(c.title).includes(normalizeText(parentSearch))))
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

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assunto (DataJud)</label>
                                    <input
                                        placeholder="Carregado automaticamente ou digite..."
                                        value={newCase.subject || ''}
                                        onChange={e => setNewCase({ ...newCase, subject: e.target.value })}
                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </section>

                            {/* Section 2: Localization */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Shield size={14} /> 2. Localização e Competência
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF <span className="text-rose-500">*</span></label>
                                        <select
                                            value={newCase.uf}
                                            onChange={e => setNewCase({ ...newCase, uf: e.target.value, city: '' })}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">--</option>
                                            {BR_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-9">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Município <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                placeholder={newCase.uf ? `Selecione ou digite...` : "Selecione a UF primeiro"}
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
                                                    {Array.from(new Set(cases.filter(c => c.uf === newCase.uf && c.city).map(c => c.city as string)))
                                                        .filter((city: string) => normalizeText(city).includes(normalizeText(citySearch)))
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
                                    <div className="md:col-span-12">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tribunal (Ex: TJRJ, TRF1)</label>
                                        <input
                                            placeholder="Sigla do Tribunal..."
                                            value={newCase.tribunal || ''}
                                            onChange={e => setNewCase({ ...newCase, tribunal: e.target.value.toUpperCase() })}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 uppercase"
                                        />
                                    </div>
                                    <div className="md:col-span-8">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vara / Local <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                placeholder="Ex: 5ª Vara Cível..."
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
                                                    {Array.from(new Set(cases.filter(c => (!newCase.city || c.city === newCase.city) && c.court).map(c => c.court as string)))
                                                        .filter((court: string) => normalizeText(court).includes(normalizeText(courtSearch)))
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
                                                placeholder="Selecione..."
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
                                                    {Array.from(new Set([...DEFAULT_AREAS, ...cases.map(c => c.area as string).filter(Boolean)]))
                                                        .filter((a: string) => normalizeText(a).includes(normalizeText(areaSearch)))
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
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Parties */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <UserIcon size={14} /> 3. Envolvimento das Partes
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
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
                                                        .filter(cli => normalizeText(cli.name).includes(normalizeText(clientSearch)))
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
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 5: Finance & Probability */}
                            <section className="pb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span className="text-base">R$</span> 4. Dados Financeiros e Probabilidade
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor da Causa</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
                                            <input
                                                type="text"
                                                placeholder="0,00"
                                                value={(newCase.value !== undefined && newCase.value !== null) ? maskCurrency(newCase.value.toFixed(2).replace('.', '')) : ''}
                                                onChange={e => {
                                                    const masked = maskCurrency(e.target.value);
                                                    setNewCase({ ...newCase, value: parseCurrency(masked) });
                                                }}
                                                className="w-full pl-10 pr-3 py-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Valor</label>
                                        <input
                                            type="date"
                                            value={newCase.valueDate}
                                            onChange={e => setNewCase({ ...newCase, valueDate: e.target.value })}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Probabilidade de Êxito/Perda</label>
                                        <select
                                            value={newCase.probability || ''}
                                            onChange={e => setNewCase({ ...newCase, probability: e.target.value })}
                                            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Selecione a probabilidade...</option>
                                            <option value="Perda Provável (75%)">Perda Provável (75%)</option>
                                            <option value="Perda Possível (50%)">Perda Possível (50%)</option>
                                            <option value="Perda Remota (25%)">Perda Remota (25%)</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: DataJud Viewer */}
                    <div className="flex-[0.8] bg-slate-50 dark:bg-dark-900 border-l border-slate-100 dark:border-slate-700 overflow-y-auto custom-scrollbar p-0 relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                        {loadingDataJud ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                                <Loader2 size={40} className="text-primary-600 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Consultando DataJud...</h3>
                                <p className="text-slate-500 max-w-xs mt-2">Estamos buscando os dados no tribunal. Isso pode levar alguns segundos.</p>
                            </div>
                        ) : dataJudResult ? (
                            <div className="p-6 md:p-8 space-y-6 animate-slide-in relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                                                Processo Encontrado
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">CNJ API</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {dataJudResult.numeroProcesso}
                                        </h3>
                                        <p className="text-sm text-slate-500">{dataJudResult.classe?.nome}</p>
                                    </div>
                                </div>

                                {/* Cards Grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Tribunal Card */}
                                    <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <Shield size={14} /> Tribunal e Órgão
                                        </h4>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-slate-500">Tribunal</p>
                                                <p className="font-medium text-slate-900 dark:text-white uppercase">{dataJudResult.tribunal}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Órgão Julgador</p>
                                                <p className="font-medium text-slate-900 dark:text-white">{dataJudResult.orgaoJulgador?.nome}</p>
                                                <p className="text-xs text-slate-400">{dataJudResult.orgaoJulgador?.codigoMunicipioIBGE ? `IBGE: ${dataJudResult.orgaoJulgador.codigoMunicipioIBGE}` : ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates Card */}
                                    <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <CalendarIcon size={14} /> Datas Importantes
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500">Distribuição</p>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {dataJudResult.dataAjuizamento ? new Date(dataJudResult.dataAjuizamento.replace(/\//g, '-')).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Última Atualização</p>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {dataJudResult.dataHoraUltimaAtualizacao ? new Date(dataJudResult.dataHoraUltimaAtualizacao).toLocaleDateString('pt-BR') : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parties Lists */}
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-green-500">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Polo Ativo (Autores)</h4>
                                            <div className="space-y-2">
                                                {dataJudResult.polos?.find(p => p.polo === 'AT')?.partes.map((parte, idx) => (
                                                    <div key={idx} className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-white text-sm">{parte.nome}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">{parte.tipoPessoa}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-rose-500">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Polo Passivo (Réus)</h4>
                                            <div className="space-y-2">
                                                {dataJudResult.polos?.find(p => p.polo === 'PA')?.partes.map((parte, idx) => (
                                                    <div key={idx} className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-white text-sm">{parte.nome}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">{parte.tipoPessoa}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assuntos */}
                                    <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <FileText size={14} /> Assuntos
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {dataJudResult.assuntos?.map((assunto, idx) => (
                                                <span key={idx} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded">
                                                    {assunto.nome}
                                                </span>
                                            ))}
                                            {(!dataJudResult.assuntos || dataJudResult.assuntos.length === 0) && <span className="text-xs text-slate-400 italic">Nenhum assunto listado.</span>}
                                        </div>
                                    </div>

                                    {/* Last Movements */}
                                    <div className="bg-white dark:bg-dark-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            <RotateCcw size={14} /> Últimas Movimentações
                                        </h4>
                                        <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-700/50">
                                            {dataJudResult.movimentos?.slice(0, 5).map((mov, idx) => (
                                                <div key={idx} className="relative pl-6">
                                                    <div className="absolute left-[7px] top-1.5 w-2.5 h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full border-2 border-white dark:border-dark-800"></div>
                                                    <p className="text-[10px] font-bold text-slate-400">{new Date(mov.dataHora).toLocaleDateString('pt-BR')}</p>
                                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{mov.nome}</p>
                                                    {mov.complementosTabelados && mov.complementosTabelados.length > 0 && (
                                                        <p className="text-[10px] text-slate-500 mt-0.5 italic">
                                                            "{mov.complementosTabelados[0].descricao}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : dataJudError ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle size={32} className="text-rose-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ops, algo deu errado.</h3>
                                <p className="text-slate-500 max-w-xs mt-2 text-sm">{dataJudError}</p>
                                <button
                                    onClick={() => setDataJudError(null)}
                                    className="mt-6 text-primary-600 hover:underline text-sm"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-60">
                                <Search size={48} className="text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Visualizador DataJud</h3>
                                <p className="text-sm text-slate-500 max-w-xs mt-2">
                                    Digite o número do processo na esquerda e clique na lupa para visualizar os dados oficiais do tribunal aqui.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Content */}
                <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-dark-900/50 shrink-0 z-20">
                    <button onClick={onClose} className="px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white font-medium transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" form="newCaseForm" className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all flex items-center gap-2">
                        {isEditing ? <Check size={18} /> : <Briefcase size={18} />}
                        {isEditing ? 'Salvar Alterações' : 'Cadastrar Processo'}
                    </button>
                </div>
            </div>
        </div >
    );
};


import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Briefcase, Search, FileText, User as UserIcon, AlertCircle, Shield, GitBranch,
    Loader2, Check, Copy, Download, CalendarIcon, ArrowRight, RotateCcw,
    Maximize2, Minimize2, CheckCircle
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
        number: formatCNJ(initialNumber) || initialData?.number || '',
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

    // --- HUD Validator State ---
    type ValidateState = 'idle' | 'scanning' | 'validated';
    type ValidationResult = 'found_new' | 'found_existing' | 'not_found' | null;
    const [validateState, setValidateState] = useState<ValidateState>('idle');
    const [validationResult, setValidationResult] = useState<ValidationResult>(null);
    const [existingCase, setExistingCase] = useState<Case | null>(null);
    const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            setValidateState('idle');
            return;
        }

        setValidateState('scanning');
        setDataJudError(null);
        setDataJudResult(null);
        setValidationResult(null);
        setExistingCase(null);
        setIsDataImported(false);

        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        setLoadingDataJud(true);

        scanTimerRef.current = setTimeout(async () => {
            try {
                const response = await fetchProcessData(newCase.number!);
                if (response.hits.total.value > 0) {
                    const src = response.hits.hits[0]._source;
                    setDataJudResult(src);
                    // Check if already registered (normalize both numbers)
                    const normalize = (n: string) => n.replace(/\D/g, '');
                    const dup = cases.find(c =>
                        c.id !== newCase.id &&
                        normalize(c.number || '') === normalize(newCase.number || '')
                    );
                    if (dup) {
                        setExistingCase(dup);
                        setValidationResult('found_existing');
                    } else {
                        setValidationResult('found_new');
                    }
                } else {
                    setValidationResult('not_found');
                }
            } catch {
                setValidationResult('not_found');
            } finally {
                setLoadingDataJud(false);
                setValidateState('validated');
            }
        }, 2700);
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
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 md:p-4'} animate-fade-in`}>
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
                                    <div className="relative flex items-center group">
                                        <input
                                            placeholder="0000000-00.0000.0.00.0000"
                                            value={newCase.number}
                                            onChange={e => setNewCase({ ...newCase, number: formatCNJ(e.target.value) })}
                                            className="w-full pl-4 pr-28 py-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white font-mono tracking-wide focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSearchDataJud}
                                            disabled={loadingDataJud || !newCase.number}
                                            className="absolute right-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-dark-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 disabled:opacity-50 transition-all shadow-sm border border-slate-200 dark:border-slate-600 flex items-center gap-2 group-focus-within:border-primary-300"
                                            title="Validar na base DataJud"
                                        >
                                            {loadingDataJud ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Search size={14} className="group-hover:scale-110 transition-transform" />
                                            )}
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Validar</span>
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

                    {/* RIGHT COLUMN: HUD Validator */}
                    <div className="flex-[0.8] border-l border-slate-200 dark:border-slate-700/60 overflow-hidden relative flex flex-col bg-slate-50/50 dark:bg-dark-900/50">
                        {/* Dot-grid background for light theme */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-30"
                            style={{
                                backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.4) 1px, transparent 1px)',
                                backgroundSize: '22px 22px',
                            }}
                        />

                        {/* HUD header bar */}
                        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-dark-800/50">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Validador de Processos</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-wider">CNJ API</span>
                        </div>

                        {/* Main HUD content */}
                        <div className="flex-1 flex flex-col items-center justify-center relative p-6">

                            {/* Status text */}
                            <AnimatePresence mode="wait">
                                {validateState === 'idle' && (
                                    <motion.div
                                        key="idle-text"
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.3 }}
                                        className="mb-6 text-center"
                                    >
                                        <span className="text-xs font-medium tracking-wide uppercase px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 text-slate-500 dark:text-slate-400 shadow-sm">
                                            Aguardando Número CNJ
                                        </span>
                                    </motion.div>
                                )}

                                {validateState === 'scanning' && (
                                    <motion.div
                                        key="scan-text"
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.3 }}
                                        className="mb-6 text-center flex items-center gap-2 px-4 py-2 rounded-full border border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                                    >
                                        <span className="text-xs font-bold tracking-wide uppercase text-primary-600 dark:text-primary-400">
                                            Validando processo...
                                        </span>
                                        <Loader2 size={14} className="animate-spin text-primary-600 dark:text-primary-400" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Document wireframe + laser container */}
                            <div className="relative mb-6" style={{ width: 160, height: 210 }}>
                                {/* Document ghost wireframe */}
                                <motion.div
                                    className="absolute inset-0 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 shadow-md"
                                    animate={
                                        validateState === 'scanning'
                                            ? {
                                                rotateY: [0, 4, -4, 3, -3, 0],
                                                rotateX: [0, 2, -2, 1, -1, 0],
                                                y: [0, -4, 2, -2, 0]
                                            }
                                            : { rotateY: 0, rotateX: 0, y: 0 }
                                    }
                                    transition={
                                        validateState === 'scanning'
                                            ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                                            : { duration: 0.5 }
                                    }
                                    style={{
                                        transformStyle: 'preserve-3d',
                                    }}
                                >
                                    {/* Document lines skeleton */}
                                    <div className="absolute inset-4 flex flex-col gap-2.5 justify-start pt-2">
                                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 w-3/4" />
                                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 w-1/2" />
                                        <div className="h-px my-1 bg-slate-100 dark:bg-slate-700/50" />
                                        {[90, 75, 85, 65, 80].map((w, i) => (
                                            <div
                                                key={i}
                                                className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"
                                                style={{ width: `${w}%` }}
                                            />
                                        ))}
                                    </div>

                                    {/* Validated Icons Overlays */}
                                    <AnimatePresence>
                                        {validateState === 'validated' && validationResult === 'found_new' && (
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-800/80 backdrop-blur-[2px] rounded-lg"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle size={40} strokeWidth={2} />
                                                </div>
                                            </motion.div>
                                        )}
                                        {validateState === 'validated' && validationResult === 'found_existing' && (
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-800/80 backdrop-blur-[2px] rounded-lg"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full text-amber-600 dark:text-amber-400">
                                                    <AlertCircle size={40} strokeWidth={2} />
                                                </div>
                                            </motion.div>
                                        )}
                                        {validateState === 'validated' && validationResult === 'not_found' && (
                                            <motion.div
                                                className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-800/80 backdrop-blur-[2px] rounded-lg"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full text-rose-600 dark:text-rose-400">
                                                    <Search size={40} strokeWidth={2} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* LASER LINE */}
                                <AnimatePresence>
                                    {validateState === 'scanning' && (
                                        <motion.div
                                            key="laser"
                                            className="absolute left-[-10px] right-[-10px] z-20 pointer-events-none"
                                            style={{
                                                height: 2,
                                                borderRadius: 2,
                                                background: 'linear-gradient(90deg, transparent, #3b82f6, #3b82f6, transparent)',
                                                boxShadow: '0 0 8px 2px rgba(59,130,246,0.3)'
                                            }}
                                            initial={{ top: '0%' }}
                                            animate={{ top: ['2%', '95%', '2%'] }}
                                            transition={{
                                                duration: 1.6,
                                                repeat: Infinity,
                                                ease: 'easeInOut'
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Result Messages & Actions */}
                            <AnimatePresence mode="wait">
                                {validateState === 'validated' && (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full max-w-[280px] text-center flex flex-col items-center"
                                    >
                                        {validationResult === 'found_new' && (
                                            <>
                                                <h4 className="text-emerald-600 dark:text-emerald-400 font-bold mb-1">Processo Encontrado</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                                                    O processo foi localizado na base do CNJ e está pronto para ser cadastrado.
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (dataJudResult) {
                                                            setNewCase(prev => ({
                                                                ...prev,
                                                                title: dataJudResult.assuntos?.[0]?.nome || prev.title,
                                                                court: dataJudResult.orgaoJulgador?.nome || prev.court,
                                                                tribunal: dataJudResult.tribunal || prev.tribunal,
                                                                subject: dataJudResult.assuntos?.[0]?.nome || prev.subject,
                                                                value: dataJudResult.valorCausa || prev.value,
                                                                clientName: dataJudResult.polos?.find(p => p.polo === 'AT')?.partes[0]?.nome || prev.clientName,
                                                                opposingParty: dataJudResult.polos?.find(p => p.polo === 'PA')?.partes[0]?.nome || prev.opposingParty
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Download size={14} /> Preencher Formulário
                                                </button>
                                            </>
                                        )}

                                        {validationResult === 'found_existing' && existingCase && (
                                            <>
                                                <h4 className="text-amber-600 dark:text-amber-500 font-bold mb-1">Já Cadastrado</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                                                    Este número de processo já está vinculado a um caso existente na sua base.
                                                </p>
                                                <div className="w-full bg-white dark:bg-dark-800 border border-amber-200 dark:border-amber-900/50 p-3 rounded-lg text-left">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Processo Existente</p>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{existingCase.title || existingCase.number}</p>
                                                    <p className="text-xs text-slate-500 truncate mt-1">{existingCase.clientName} vs {existingCase.opposingParty}</p>
                                                </div>
                                            </>
                                        )}

                                        {validationResult === 'not_found' && (
                                            <>
                                                <h4 className="text-rose-600 dark:text-rose-400 font-bold mb-1">Não Localizado</h4>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                    O processo não foi encontrado no DataJud. Pode estar em <b>segredo de justiça</b> ou a numeração está incorreta.
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                                                    Verifique o número, mas você ainda pode prosseguir preenchendo o formulário manualmente.
                                                </p>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* HUD footer telemetry */}
                        <div className="relative z-10 px-5 py-2.5 border-t border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-dark-800/50 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase">
                                {validateState === 'idle' && 'STATUS: STANDBY'}
                                {validateState === 'scanning' && 'STATUS: SCANNING'}
                                {validateState === 'validated' && 'STATUS: FINALIZADO'}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                            background: validateState === 'validated'
                                                ? (validationResult === 'found_new' ? '#10b981' : validationResult === 'found_existing' ? '#f59e0b' : '#f43f5e')
                                                : validateState === 'scanning' ? '#3b82f6'
                                                    : '#cbd5e1'
                                        }}
                                        animate={validateState === 'scanning' ? { opacity: [0.4, 1, 0.4] } : {}}
                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </div>
                        </div>
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


import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/Store';
import { Search, Plus, Mail, Phone, FileText, X, Edit, Briefcase, CalendarIcon, List, LayoutGrid, MessageCircle, ChevronRight, Filter, MapPin, Tag, User, Globe, Trash2, Shield, DollarSign } from '../components/Icons';
import { Client } from '../types';
import { PowerOfAttorneyModal } from '../components/PowerOfAttorneyModal';
import { FeeContractModal } from '../components/FeeContractModal';

// Helper: Convert to Title Case
const toTitleCase = (str: string) => {
    if (!str) return '';
    const prepositions = ['da', 'de', 'do', 'dos', 'das', 'e'];
    return str.toLowerCase().split(' ').map((word, index) => {
        if (index > 0 && prepositions.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

// Mascaras
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);

    if (v.length > 10) {
        return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 6) {
        return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
        return v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    } else {
        if (v.length === 0) return "";
        return v.replace(/^(\d*)/, "($1");
    }
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

const removeMask = (value: string) => value.replace(/\D/g, '');

export const Clients: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient, clearClients, addNotification, teamMembers, cases, pendingAction, setPendingAction, isLoading, setIsLoading } = useStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [typeFilter, setTypeFilter] = useState<'all' | 'Pessoa Física' | 'Pessoa Jurídica' | 'Espólio'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    // States for Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Qualification Modal
    const [showQualificationModal, setShowQualificationModal] = useState(false);
    const [generatedQualification, setGeneratedQualification] = useState('');
    const [showPoAModal, setShowPoAModal] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [loadingCnpj, setLoadingCnpj] = useState(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);


    const [formData, setFormData] = useState<Partial<Client>>({
        name: '', email: '', phone: '', document: '', type: 'Pessoa Física', notes: '',
        group: '', phoneHome: '', phoneWork: '', phoneWork2: '',
        street: '', addressNumber: '', complement: '', neighborhood: '', city: '', state: '', zip: '', country: 'Brasil',
        nationality: 'Brasileiro(a)', maritalStatus: 'Casado(a)', profession: '', rg: '', birthDate: '', gender: 'Masculino',
        representative: '', representativeGender: 'Masculino', representativeId: '', representativeQualification: '', representativeAddress: ''
    });

    // Handle Quick Action
    useEffect(() => {
        if (pendingAction === 'newClient') {
            handleOpenNew();
            setPendingAction(null);
        }
    }, [pendingAction, setPendingAction]);

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            c.document.includes(searchTerm) ||
            (c.group && c.group.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = typeFilter === 'all' || c.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const sortedClients = [...filteredClients].sort((a, b) => {
        const aValue = a[sortConfig.key]?.toString().toLowerCase() || '';
        const bValue = b[sortConfig.key]?.toString().toLowerCase() || '';

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const validateForm = (): boolean => {
        const errors: string[] = [];
        if (!formData.name) errors.push("O nome do cliente é obrigatório.");
        if (!formData.document) errors.push("O documento (CPF/CNPJ) é obrigatório.");

        if (formData.type === 'Pessoa Jurídica' || formData.type === 'Espólio') {
            if (!formData.representative) {
                errors.push(`O campo ${formData.type === 'Espólio' ? 'Inventariante' : 'Representante'} é obrigatório.`);
            }
        }

        setFormErrors(errors);
        return errors.length === 0;
    };

    const handleSort = (key: keyof Client) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleOpenNew = () => {
        setIsEditing(false);
        setFormData({
            name: '', email: '', phone: '', document: '', type: 'Pessoa Física', notes: '',
            group: '', phoneHome: '', phoneWork: '', phoneWork2: '',
            street: '', addressNumber: '', complement: '', neighborhood: '', city: '', state: '', zip: '', country: 'Brasil',
            nationality: 'Brasileiro(a)', maritalStatus: 'Casado(a)', profession: '', rg: '', birthDate: '', gender: 'Masculino',
            representative: '', representativeGender: 'Masculino', representativeId: '', representativeQualification: '', representativeAddress: ''
        });
        setShowFormModal(true);
    };

    const handleOpenEdit = (client: Client) => {
        setIsEditing(true);
        setFormData({ ...client });
        setShowDetailModal(false);
        setShowFormModal(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este contato?')) {
            deleteClient(id);
            setShowFormModal(false);
            setShowDetailModal(false);
        }
    };

    const handleOpenDetails = (client: Client) => {
        setSelectedClient(client);
        setShowDetailModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        setTimeout(() => {
            // Auto Format Name
            const formattedName = toTitleCase(formData.name!);

            // Auto Format Espólio prefix if needed
            let finalName = formattedName;
            if (formData.type === 'Espólio' && !finalName.toLowerCase().startsWith('espólio')) {
                finalName = 'Espólio de ' + finalName;
            }

            // Capitalize representative name if exists
            const formattedRep = formData.representative ? toTitleCase(formData.representative) : '';

            const clientPayload: Client = {
                ...formData as Client,
                name: finalName,
                representative: formattedRep,
                id: isEditing && formData.id ? formData.id : Date.now().toString(),
                createdAt: isEditing && formData.createdAt ? formData.createdAt : new Date().toISOString()
            };

            if (isEditing) {
                updateClient(clientPayload);
            } else {
                addClient(clientPayload);
            }

            setIsLoading(false);
            setShowFormModal(false);
            setFormErrors([]);
        }, 600);
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Espólio also uses CPF mask
        const masked = formData.type === 'Pessoa Jurídica' ? maskCNPJ(raw) : maskCPF(raw);
        setFormData({ ...formData, document: masked });
    };

    const handleWhatsApp = (phone: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const raw = phone.replace(/\D/g, '');
        if (raw) {
            window.open(`https://wa.me/55${raw}`, '_blank');
        }
    };

    const handleEmail = (email: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (email) {
            window.location.href = `mailto:${email}`;
        }
    };

    const handleGoogleMaps = (client: Client, e: React.MouseEvent) => {
        e.stopPropagation();
        const addressParts = [];
        if (client.street) addressParts.push(`${client.street}, ${client.addressNumber || ''}`);
        if (client.neighborhood) addressParts.push(client.neighborhood);
        if (client.city) addressParts.push(client.city);
        if (client.state) addressParts.push(client.state);
        if (client.country) addressParts.push(client.country);

        const query = addressParts.join(', ');
        if (query) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
        } else {
            addNotification('Endereço insuficiente para gerar mapa.', 'warning');
        }
    };

    // --- CEP LOOKUP ---
    const handleCepSearch = async () => {
        // Only search if country is Brasil
        if (formData.country && formData.country.toLowerCase() !== 'brasil') return;

        const cep = removeMask(formData.zip || '');
        if (cep.length !== 8) {
            addNotification('CEP deve ter 8 dígitos.', 'warning');
            return;
        }

        setLoadingCep(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (data.erro) {
                addNotification('CEP não encontrado. Preencha o endereço manualmente.', 'warning');
                // We don't clear fields to allow manual entry, just warn user
            } else {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                    country: 'Brasil' // Ensure country is set
                }));
                addNotification('Endereço preenchido!', 'success');
            }
        } catch (error) {
            console.error(error);
            addNotification('Erro na busca. Preencha manualmente.', 'warning');
        } finally {
            setLoadingCep(false);
        }
    };

    const handleCnpjSearch = async () => {
        const cnpj = removeMask(formData.document || '');
        if (cnpj.length !== 14) {
            addNotification('CNPJ deve ter 14 dígitos.', 'warning');
            return;
        }

        setLoadingCnpj(true);
        try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (!res.ok) throw new Error('CNPJ não encontrado.');
            const data = await res.json();

            // Auto Format Name - Razão Social
            const formattedName = toTitleCase(data.razao_social);

            // Tag/Grupo - Nome Fantasia
            const tag = data.nome_fantasia ? toTitleCase(data.nome_fantasia) : '';

            // Representative from QSA
            let rep = '';
            let repQual = '';
            if (data.qsa && data.qsa.length > 0) {
                // Find first socio administrador
                const admin = data.qsa.find((s: any) =>
                    s.qualificacao_socio && s.qualificacao_socio.toLowerCase().includes('administrador')
                );
                if (admin) {
                    rep = toTitleCase(admin.nome_socio);
                    repQual = admin.qualificacao_socio;
                }
            }

            // Observations
            const partners = data.qsa && data.qsa.length > 0
                ? '\nSócios:\n' + data.qsa.map((s: any) => `- ${toTitleCase(s.nome_socio)} (${s.qualificacao_socio})`).join('\n')
                : '';

            const capitalSocial = data.capital_social
                ? `\nCapital Social: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.capital_social)}`
                : '';

            const obs = `Situação: ${data.descricao_situacao_cadastral}\nCNAE Principal: ${data.cnae_fiscal_descricao}${capitalSocial}${partners}`;

            setFormData(prev => ({
                ...prev,
                name: formattedName,
                group: tag || prev.group,
                representative: rep || prev.representative,
                representativeQualification: repQual || prev.representativeQualification,
                zip: maskCEP(data.cep),
                street: data.logradouro,
                addressNumber: data.numero,
                complement: data.complemento || '',
                neighborhood: data.bairro,
                city: data.municipio,
                state: data.uf,
                email: data.email || prev.email,
                phoneWork: data.ddd_telefone_1 ? maskPhone(data.ddd_telefone_1) : prev.phoneWork,
                notes: obs + (prev.notes ? `\n\n${prev.notes}` : '')
            }));

            addNotification('Dados do CNPJ preenchidos!', 'success');
        } catch (error) {
            console.error(error);
            addNotification('CNPJ não encontrado ou erro na busca.', 'error');
        } finally {
            setLoadingCnpj(false);
        }
    };

    // --- GENERATE QUALIFICATION ---
    const generateQualification = (c: Client) => {
        let text = '';
        const doc = c.document || '_______';

        // Determine if country should be shown (if not Brasil)
        const isBrazil = !c.country || c.country.toLowerCase() === 'brasil';
        const countryStr = isBrazil ? '' : `, ${c.country}`;
        const zipLabel = isBrazil ? 'CEP' : 'Código Postal';

        // Basic address string (Used for PF and PJ)
        const address = `${c.street || 'Rua...'}, nº ${c.addressNumber || 'S/N'}, ${c.complement ? c.complement + ', ' : ''}${c.neighborhood || 'Bairro...'}, ${c.city || 'Cidade'}, ${c.state || 'UF'}${countryStr}`;
        const zip = c.zip ? ` (${zipLabel} ${c.zip})` : '';
        const email = c.email ? `, endereço eletrônico ${c.email}` : '';

        if (c.type === 'Pessoa Física') {
            // Format Date
            let birth = c.birthDate;
            if (birth) {
                const parts = birth.split('-'); // YYYY-MM-DD
                if (parts.length === 3) birth = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            const isFem = c.gender === 'Feminino';

            // Helper to clean o(a) or (a) patterns
            const formatGenderedTerm = (term: string) => {
                const lower = term.toLowerCase();
                if (lower.includes('o(a)')) {
                    return isFem ? lower.replace('o(a)', 'a') : lower.replace('o(a)', 'o');
                }
                if (lower.includes('(a)')) {
                    return isFem ? lower.replace('(a)', 'a') : lower.replace('(a)', 'o');
                }
                return lower;
            };

            const nat = c.nationality ? formatGenderedTerm(c.nationality) : (isFem ? 'brasileira' : 'brasileiro');
            const civ = c.maritalStatus ? formatGenderedTerm(c.maritalStatus) : (isFem ? 'solteira' : 'solteiro');
            const prof = c.profession ? formatGenderedTerm(c.profession) : (isFem ? 'profissão' : 'profissão');

            const bornStr = isFem ? 'nascida' : 'nascido';
            const portadorStr = isFem ? 'portadora' : 'portador';
            const inscritoStr = isFem ? 'inscrita' : 'inscrito';
            const residenteStr = isFem ? 'residente e domiciliada' : 'residente e domiciliado';

            text = `${c.name.toUpperCase()}, ${nat}, ${civ}, ${prof}, ${birth ? `${bornStr} em ${birth}, ` : ''}${c.rg ? `${portadorStr} da carteira de identidade nº ${c.rg}, ` : ''}${inscritoStr} no CPF sob o nº ${doc}, ${residenteStr} na ${address}${zip}${email}.`;

            // Add Representative info if exists
            if (c.representative) {
                // Determine client gender for agreement (representado/a)
                const isFem = c.gender === 'Feminino';
                // For PF, we just use the name and the manual qualification
                text += ` Neste ato ${isFem ? 'representada' : 'representado'} por ${c.representative.toUpperCase()}${c.representativeQualification ? `, ${c.representativeQualification}` : ''}.`;
            }

        } else if (c.type === 'Espólio') {
            // Espólio Qualification Logic
            // Simplified: "representado por [Nome], [Qualificação]"
            text = `ESPÓLIO DE ${c.name.toUpperCase().replace('ESPÓLIO DE ', '')}, entidade sem personalidade jurídica, neste ato representado por ${c.representative ? c.representative.toUpperCase() : '_______'}, ${c.representativeQualification ? c.representativeQualification : 'qualificação...'}${email}.`;

        } else {
            // Pessoa Jurídica
            // Simplified: "representada por [Nome], [Qualificação]"
            text = `${c.name.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${doc}, com sede na ${address}, neste ato representada por ${c.representative ? c.representative.toUpperCase() : '_______'}, ${c.representativeQualification ? c.representativeQualification : 'qualificação...'}${email ? `, com endereço eletrônico ${c.email}` : ''}.`;
        }

        setGeneratedQualification(text);
        setShowQualificationModal(true);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedQualification);
        addNotification('Qualificação copiada para a área de transferência!', 'success');
        setShowQualificationModal(false);
    };


    // Reset fields when type changes
    useEffect(() => {
        if (showFormModal && !isEditing) {
            setFormData(prev => ({ ...prev, document: '' }));
        }
    }, [formData.type, showFormModal, isEditing]);

    const isBrazilianAddress = !formData.country || formData.country.toLowerCase() === 'brasil';

    return (
        <div className="p-2 md:p-8 h-full flex flex-col animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-8 gap-2 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">Contatos</h1>
                    <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 mt-1">
                        {clients.length === 0 ? (
                            "Nenhum contato cadastrado."
                        ) : filteredClients.length === clients.length ? (
                            `Total de ${clients.length} ${clients.length === 1 ? 'contato' : 'contatos'}.`
                        ) : (
                            `Exibindo ${filteredClients.length} de ${clients.length} contatos.`
                        )}
                    </p>
                </div>
                <div className="flex gap-2 md:gap-3 w-full md:w-auto flex-wrap">
                    <button onClick={handleOpenNew} className="flex-1 md:flex-none justify-center bg-primary-600 hover:bg-primary-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium shadow-lg shadow-primary-500/20 flex items-center gap-2 transform active:scale-95 transition-all">
                        <Plus size={20} /> <span className="hidden md:inline">Novo Contato</span><span className="md:hidden">Novo</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-2 md:gap-4 mb-3 md:mb-6">
                <div className="bg-white dark:bg-dark-800 p-2 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex-1 flex items-center gap-2 md:gap-3">
                    <Search size={16} md:size={20} className="text-slate-400" />
                    <input
                        placeholder="Buscar por nome, documento, email ou grupo..."
                        className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar items-center bg-white dark:bg-dark-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Filter size={18} className="text-slate-400 ml-2 mr-2 shrink-0" />
                    {['all', 'Pessoa Física', 'Pessoa Jurídica', 'Espólio'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap ${typeFilter === t
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-700'
                                }`}
                        >
                            {t === 'all' ? 'Todos' : t === 'Pessoa Física' ? 'PF' : t === 'Pessoa Jurídica' ? 'PJ' : 'Espólio'}
                        </button>
                    ))}
                </div>

                <div className="hidden md:flex bg-white dark:bg-dark-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-dark-700 text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-dark-700 text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 custom-scrollbar">
                    {sortedClients.map(client => (
                        <div key={client.id} className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300">
                                    {client.name.charAt(0)}
                                </div>
                                <div className="flex gap-1">
                                    {client.group && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            {client.group}
                                        </span>
                                    )}
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded 
                                ${client.type === 'Pessoa Física' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                                ${client.type === 'Pessoa Jurídica' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                                ${client.type === 'Espólio' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : ''}
                            `}>
                                        {client.type === 'Pessoa Física' ? 'PF' : client.type === 'Pessoa Jurídica' ? 'PJ' : 'ESP'}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{client.name}</h3>

                            <div className="space-y-2 mt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Mail size={16} />
                                    <span className="truncate flex-1">{client.email || '-'}</span>
                                    {client.email && (
                                        <button onClick={(e) => handleEmail(client.email, e)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors" title="Enviar Email">
                                            <Mail size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Phone size={16} />
                                    <span className="flex-1">{client.phone || '-'}</span>
                                    {client.phone && (
                                        <button onClick={(e) => handleWhatsApp(client.phone, e)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded transition-colors" title="Abrir WhatsApp">
                                            <MessageCircle size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <FileText size={16} /> {client.document || '-'}
                                </div>
                                {client.city && (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <MapPin size={16} />
                                        <span className="flex-1 truncate">{client.city} - {client.state}</span>
                                        <button onClick={(e) => handleGoogleMaps(client, e)} className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-1 rounded transition-colors" title="Abrir no Google Maps">
                                            <Globe size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleOpenDetails(client)}
                                className="w-full mt-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
                            >
                                Ver Detalhes
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50">
                                    <th
                                        className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors select-none"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Nome / Documento
                                            {sortConfig.key === 'name' && (
                                                <span className="text-primary-500">
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contatos</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Grupo</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {sortedClients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group" onDoubleClick={() => handleOpenDetails(client)} title="Clique duplo para ver detalhes">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{client.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{client.document}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-600 dark:text-slate-300 flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {client.email || '-'}
                                                    {client.email && (
                                                        <button onClick={(e) => handleEmail(client.email, e)} className="text-blue-500 hover:text-blue-600" title="Enviar Email">
                                                            <Mail size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {client.phone || '-'}
                                                    {client.phone && (
                                                        <button onClick={(e) => handleWhatsApp(client.phone, e)} className="text-green-500 hover:text-green-600" title="WhatsApp">
                                                            <MessageCircle size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {client.group ? (
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                    {client.group}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded 
                                        ${client.type === 'Pessoa Física' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                                        ${client.type === 'Pessoa Jurídica' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                                        ${client.type === 'Espólio' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : ''}
                                    `}>
                                                {client.type === 'Pessoa Física' ? 'PF' : client.type === 'Pessoa Jurídica' ? 'PJ' : 'ESP'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form Modal (New/Edit) - Updated with Tabs/Sections */}
            {showFormModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Contato' : 'Novo Contato'}</h2>
                            <button onClick={() => setShowFormModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="clientForm" onSubmit={handleSubmit} className="space-y-8">
                                {/* Type Selection */}
                                <div className="flex bg-slate-100 dark:bg-dark-900 rounded-lg p-1">
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'Pessoa Física' })} className={`flex-1 py-2 rounded text-sm font-medium transition-all ${formData.type === 'Pessoa Física' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Pessoa Física</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'Pessoa Jurídica' })} className={`flex-1 py-2 rounded text-sm font-medium transition-all ${formData.type === 'Pessoa Jurídica' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Pessoa Jurídica</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'Espólio' })} className={`flex-1 py-2 rounded text-sm font-medium transition-all ${formData.type === 'Espólio' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Espólio</button>
                                </div>

                                {/* 1. Dados Básicos */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700"><Briefcase size={14} /> Dados Principais</h3>

                                    {formData.type === 'Pessoa Jurídica' ? (
                                        <>
                                            {/* CNPJ First for PJ */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="00.000.000/0000-00"
                                                            className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                            value={formData.document}
                                                            onChange={handleDocumentChange}
                                                            maxLength={18}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleCnpjSearch}
                                                            disabled={loadingCnpj}
                                                            className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors"
                                                            title="Buscar CNPJ"
                                                        >
                                                            {loadingCnpj ? (
                                                                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                                            ) : (
                                                                <Search size={20} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo / Tag</label>
                                                    <input
                                                        placeholder="Ex: Cliente, Parceiro..."
                                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                        value={formData.group}
                                                        onChange={e => setFormData({ ...formData, group: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razão Social <span className="text-rose-500">*</span></label>
                                                <input required placeholder="Nome da empresa" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Standard order for PF/Espolio */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    {formData.type === 'Espólio' ? 'Nome do Falecido' : 'Nome Completo'} <span className="text-rose-500">*</span>
                                                </label>
                                                <input required placeholder="Nome do contato" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        {formData.type === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF'}
                                                    </label>
                                                    <input
                                                        placeholder={formData.type === 'Pessoa Jurídica' ? '00.000.000/0000-00' : '000.000.000-00'}
                                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                        value={formData.document}
                                                        onChange={handleDocumentChange}
                                                        maxLength={formData.type === 'Pessoa Jurídica' ? 18 : 14}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo / Tag</label>
                                                    <input
                                                        placeholder="Ex: Cliente, Réu, Parceiro..."
                                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                        value={formData.group}
                                                        onChange={e => setFormData({ ...formData, group: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Additional Fields for PF */}
                                    {formData.type === 'Pessoa Física' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RG</label>
                                                <input placeholder="00.000.000-0" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Nascimento</label>
                                                <input type="date" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nacionalidade</label>
                                                <input placeholder="Ex: Brasileiro" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado Civil</label>
                                                <select className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                                                    <option value="">Selecione...</option>
                                                    <option value="Solteiro(a)">Solteiro(a)</option>
                                                    <option value="Casado(a)">Casado(a)</option>
                                                    <option value="Divorciado(a)">Divorciado(a)</option>
                                                    <option value="Separado(a) Judicialmente">Separado(a) Judicialmente</option>
                                                    <option value="Viúvo(a)">Viúvo(a)</option>
                                                    <option value="União Estável">União Estável</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Profissão</label>
                                                <input placeholder="Ex: Engenheiro" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gênero</label>
                                                <select className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.gender || 'Masculino'} onChange={e => setFormData({ ...formData, gender: e.target.value as any })}>
                                                    <option value="Masculino">Masculino</option>
                                                    <option value="Feminino">Feminino</option>
                                                    <option value="Outro">Outro</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                </section>

                                {/* Optional Representative for PF */}
                                {formData.type === 'Pessoa Física' && (
                                    <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><User size={14} /> Representante (Opcional)</h3>
                                        <p className="text-xs text-slate-500">Preencha apenas caso o cliente seja menor, incapaz ou representado.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Representante</label>
                                                <input placeholder="Ex: Pai, Mãe ou Curador" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.representative} onChange={e => setFormData({ ...formData, representative: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qualificação do Representante</label>
                                                <textarea placeholder="Ex: brasileiro, casado, empresário, residente em..." className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white min-h-[80px]"
                                                    value={formData.representativeQualification} onChange={e => setFormData({ ...formData, representativeQualification: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Additional Fields for PJ AND Espólio */}
                                {(formData.type === 'Pessoa Jurídica' || formData.type === 'Espólio') && (
                                    <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2"><User size={14} /> {formData.type === 'Espólio' ? 'Dados do Inventariante' : 'Representante Legal'}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    {formData.type === 'Espólio' ? 'Nome do Inventariante' : 'Nome do Representante'} <span className="text-rose-500">*</span>
                                                </label>
                                                <input required placeholder={formData.type === 'Espólio' ? 'Inventariante' : 'Sócio Administrador'} className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.representative} onChange={e => setFormData({ ...formData, representative: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    {formData.type === 'Espólio' ? 'Qualificação do Inventariante' : 'Qualificação do Representante'}
                                                </label>
                                                <textarea placeholder="Ex: brasileiro, casado, empresário, portador da carteira de identidade..." className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white min-h-[80px]"
                                                    value={formData.representativeQualification} onChange={e => setFormData({ ...formData, representativeQualification: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                )}


                                {/* 2. Contatos */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700"><Phone size={14} /> Contatos</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                        <input type="email" placeholder="email@exemplo.com" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Celular (Principal)</label>
                                            <input
                                                placeholder="(00) 90000-0000"
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone Fixo (Casa)</label>
                                            <input
                                                placeholder="(00) 0000-0000"
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                value={formData.phoneHome}
                                                onChange={(e) => setFormData({ ...formData, phoneHome: maskPhone(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trabalho 1</label>
                                            <input
                                                placeholder="(00) 0000-0000"
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                value={formData.phoneWork}
                                                onChange={(e) => setFormData({ ...formData, phoneWork: maskPhone(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trabalho 2</label>
                                            <input
                                                placeholder="(00) 0000-0000"
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                                value={formData.phoneWork2}
                                                onChange={(e) => setFormData({ ...formData, phoneWork2: maskPhone(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Endereço */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700"><MapPin size={14} /> Endereço</h3>
                                    <div className="grid grid-cols-12 gap-4">

                                        {/* Row 0: País */}
                                        <div className="col-span-12">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">País</label>
                                            <input
                                                placeholder="Brasil"
                                                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.country}
                                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                            />
                                        </div>

                                        {/* Row 1: CEP/Postal & Logradouro */}
                                        <div className="col-span-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                {isBrazilianAddress ? 'CEP' : 'Código Postal'}
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder={isBrazilianAddress ? "00000-000" : "Zip Code"}
                                                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                    value={formData.zip}
                                                    onChange={e => setFormData({ ...formData, zip: isBrazilianAddress ? maskCEP(e.target.value) : e.target.value })}
                                                />
                                                {isBrazilianAddress && (
                                                    <button type="button" onClick={handleCepSearch} disabled={loadingCep} className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 disabled:opacity-50">
                                                        {loadingCep ? '...' : <Search size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-span-8">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logradouro</label>
                                            <input placeholder="Rua, Av..." className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                                        </div>

                                        {/* Row 2: Number & Complement */}
                                        <div className="col-span-3">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
                                            <input placeholder="Nº" className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.addressNumber} onChange={e => setFormData({ ...formData, addressNumber: e.target.value })} />
                                        </div>
                                        <div className="col-span-9">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Complemento</label>
                                            <input placeholder="Apto, Bloco..." className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} />
                                        </div>

                                        {/* Row 3: Bairro */}
                                        <div className="col-span-12">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
                                            <input className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                                        </div>

                                        {/* Row 4: City & UF */}
                                        <div className="col-span-9">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                                            <input className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                {isBrazilianAddress ? 'UF' : 'Estado/Prov'}
                                            </label>
                                            <input className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                        </div>
                                    </div>
                                </section>

                                {/* 4. Obs */}
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700"><FileText size={14} /> Observações</h3>
                                    <textarea
                                        placeholder="Anotações gerais..."
                                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
                                        value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </section>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50 dark:bg-dark-900/50 shrink-0">
                            {isEditing && (
                                <button type="button" onClick={() => handleDelete(formData.id!)} className="px-4 py-3 text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white font-medium transition-colors">Cancelar</button>
                            <button
                                type="submit"
                                form="clientForm"
                                disabled={isLoading}
                                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    isEditing ? 'Salvar Alterações' : 'Cadastrar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Details Modal */}
            {
                showDetailModal && selectedClient && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white dark:bg-dark-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <button onClick={() => setShowDetailModal(false)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-dark-700 text-slate-500 z-20"><X size={20} /></button>

                            <div className="p-6 pr-20 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-white dark:bg-dark-800 rounded-full flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                                        {selectedClient.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedClient.name}</h2>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-200 font-medium">{selectedClient.type}</span>
                                            {selectedClient.group && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-600 dark:text-blue-300 font-medium">{selectedClient.group}</span>}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => handleOpenEdit(selectedClient)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm">
                                                <Edit size={14} /> Editar
                                            </button>
                                            {selectedClient.phone && (
                                                <button onClick={(e) => handleWhatsApp(selectedClient.phone, e)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors shadow-sm">
                                                    <MessageCircle size={14} /> WhatsApp
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button onClick={() => generateQualification(selectedClient)} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 dark:border-slate-700 dark:bg-dark-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-dark-700 transform active:scale-95 transition-all text-center h-full">
                                        <FileText size={18} />
                                        <span>Qualificação</span>
                                    </button>
                                    <button onClick={() => setShowPoAModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 dark:border-slate-700 dark:bg-dark-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-dark-700 transform active:scale-95 transition-all text-center h-full">
                                        <Shield size={18} />
                                        <span>Procuração</span>
                                    </button>
                                    <button onClick={() => setShowFeeModal(true)} className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 dark:border-slate-700 dark:bg-dark-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-dark-700 transform active:scale-95 transition-all text-center h-full">
                                        <DollarSign size={18} />
                                        <span>Contrato de Honorários</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Mail size={20} /></div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Email</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-slate-900 dark:text-white break-all">{selectedClient.email || 'Não informado'}</p>
                                                {selectedClient.email && (
                                                    <button onClick={(e) => handleEmail(selectedClient.email, e)} className="text-blue-600 hover:underline text-xs font-bold ml-1">Enviar</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"><Phone size={20} /></div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Celular</p>
                                            <p className="text-slate-900 dark:text-white">{selectedClient.phone || 'Não informado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><FileText size={20} /></div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Documento</p>
                                            <p className="text-slate-900 dark:text-white font-mono">{selectedClient.document || 'Não informado'}</p>
                                        </div>
                                    </div>
                                    {(selectedClient.city || selectedClient.state || selectedClient.country) && (
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg"><MapPin size={20} /></div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold">Local</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-slate-900 dark:text-white">
                                                        {selectedClient.city && selectedClient.state ? `${selectedClient.city}/${selectedClient.state}` : selectedClient.city || selectedClient.state}
                                                        {selectedClient.country && selectedClient.country !== 'Brasil' ? ` - ${selectedClient.country}` : ''}
                                                    </p>
                                                    <button onClick={(e) => handleGoogleMaps(selectedClient, e)} className="text-orange-600 hover:underline text-xs font-bold ml-1 flex items-center gap-1">
                                                        <Globe size={12} /> Mapa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(selectedClient.phoneHome || selectedClient.phoneWork) && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Outros Telefones</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {selectedClient.phoneHome && <p><span className="text-slate-400">Casa:</span> {selectedClient.phoneHome}</p>}
                                            {selectedClient.phoneWork && <p><span className="text-slate-400">Trab 1:</span> {selectedClient.phoneWork}</p>}
                                            {selectedClient.phoneWork2 && <p><span className="text-slate-400">Trab 2:</span> {selectedClient.phoneWork2}</p>}
                                        </div>
                                    </div>
                                )}

                                {(selectedClient.street || selectedClient.zip) && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Endereço Completo</p>
                                        <p className="text-slate-900 dark:text-white text-sm">
                                            {selectedClient.street}, nº {selectedClient.addressNumber || 'S/N'} {selectedClient.complement ? `(${selectedClient.complement})` : ''}<br />
                                            {selectedClient.neighborhood}<br />
                                            {selectedClient.city} - {selectedClient.state}, {selectedClient.country}<br />
                                            {selectedClient.country && selectedClient.country.toLowerCase() !== 'brasil' ? 'Código Postal' : 'CEP'}: {selectedClient.zip}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-start gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg"><Briefcase size={20} /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Observações</p>
                                        <p className="text-slate-900 dark:text-white text-sm whitespace-pre-line mt-1">
                                            {selectedClient.notes || 'Nenhuma observação registrada.'}
                                        </p>
                                    </div>
                                </div>
                                {selectedClient.type === 'PF' && selectedClient.representativeQualification && (
                                    <div className="flex items-start gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><User size={20} /></div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Qualificação do Representante</p>
                                            <p className="text-slate-900 dark:text-white text-sm whitespace-pre-line mt-1">
                                                {selectedClient.representativeQualification}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-8 pb-8 text-xs text-slate-400 flex items-center gap-2">
                                <CalendarIcon size={12} /> Cadastrado em {new Date(selectedClient.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Qualification Modal */}
            {
                showQualificationModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white dark:bg-dark-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><FileText size={20} className="text-primary-500" /> Qualificação Gerada</h3>
                                <button onClick={() => setShowQualificationModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                            </div>
                            <div className="bg-slate-100 dark:bg-dark-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                                <p className="text-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
                                    {generatedQualification}
                                </p>
                            </div>
                            <button onClick={copyToClipboard} className="w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-bold shadow-lg transform active:scale-95 transition-all">
                                Copiar Texto
                            </button>
                        </div>
                    </div>
                )
            }


            <PowerOfAttorneyModal
                isOpen={showPoAModal}
                onClose={() => setShowPoAModal(false)}
                client={selectedClient}
                teamMembers={teamMembers}
                cases={cases}
            />

            <FeeContractModal
                isOpen={showFeeModal}
                onClose={() => setShowFeeModal(false)}
                client={selectedClient}
                teamMembers={teamMembers}
                cases={cases}
            />

        </div >
    );
};

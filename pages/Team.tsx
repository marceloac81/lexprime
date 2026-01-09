
import React, { useState, useRef } from 'react';
import { useStore } from '../context/Store';
import { User, Plus, Mail, MessageCircle, X, Edit, Trash2, Camera, Search, MapPin, FileText, List, AlertCircle } from '../components/Icons';
import { TeamMember } from '../types';

// Mask helpers
const maskPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    else if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    return v;
};

const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
const maskCEP = (value: string) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
const removeMask = (value: string) => value.replace(/\D/g, '');

export const Team: React.FC = () => {
    const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, clearTeamMembers, addNotification, isLoading, setIsLoading } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingCep, setLoadingCep] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof TeamMember; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [formErrors, setFormErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState<Partial<TeamMember>>({
        name: '', role: 'Advogado', email: '', phone: '', active: true, oab: '',
        nationality: 'Brasileiro(a)', maritalStatus: 'Casado(a)', gender: 'Masculino', addressCountry: 'Brasil',
        addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: ''
    } as any);

    const fileRef = useRef<HTMLInputElement>(null);

    // Filter members
    const filteredMembers = teamMembers.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedMembers = [...filteredMembers].sort((a, b) => {
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
        if (!formData.name) errors.push("O nome é obrigatório.");
        if (!formData.email) errors.push("O e-mail é obrigatório.");
        if (!formData.role) errors.push("O cargo é obrigatório.");

        setFormErrors(errors);
        return errors.length === 0;
    };

    const handleSort = (key: keyof TeamMember) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };


    const handleOpenNew = () => {
        setIsEditing(false);
        setFormData({
            name: '', role: 'Advogado', email: '', phone: '', active: true, oab: '',
            joinDate: new Date().toISOString().split('T')[0],
            nationality: 'Brasileiro(a)', maritalStatus: 'Casado(a)', gender: 'Masculino',
            addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: ''
        });
        setFormErrors([]);
        setShowModal(true);
    };

    const handleOpenEdit = (m: TeamMember) => {
        setIsEditing(true);
        setFormData({ ...m });
        setFormErrors([]);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja remover este membro da equipe?')) {
            deleteTeamMember(id);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        setTimeout(() => {
            const member: TeamMember = {
                ...formData as TeamMember,
                id: isEditing && formData.id ? formData.id : Date.now().toString(),
            };

            if (isEditing) {
                updateTeamMember(member);
            } else {
                addTeamMember(member);
            }

            setIsLoading(false);
            setShowModal(false);
            setFormErrors([]);
        }, 600);
    };

    const handleWhatsApp = (phone: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const raw = phone.replace(/\D/g, '');
        if (raw) window.open(`https://wa.me/55${raw}`, '_blank');
    };

    const handleEmail = (email: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        window.location.href = `mailto:${email}`;
    };

    // --- CEP LOOKUP ---
    const handleCepSearch = async () => {
        const cep = removeMask(formData.addressZip || '');
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
            } else {
                setFormData(prev => ({
                    ...prev,
                    addressStreet: data.logradouro,
                    addressNeighborhood: data.bairro,
                    addressCity: data.localidade,
                    addressState: data.uf,
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

    return (
        <div className="p-2 md:p-8 h-full flex flex-col animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-6 gap-2 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">Equipe</h1>
                    <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 mt-1">
                        {teamMembers.length === 0 ? "Nenhum membro cadastrado." :
                            filteredMembers.length === teamMembers.length ?
                                `Total de ${teamMembers.length} ${teamMembers.length === 1 ? 'membro' : 'membros'}.` :
                                `Exibindo ${filteredMembers.length} de ${teamMembers.length} membros.`
                        }
                    </p>
                </div>

                <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                    <button onClick={clearTeamMembers} className="p-2 md:p-2.5 bg-white dark:bg-dark-800 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10" title="Limpar Toda a Equipe">
                        <Trash2 size={18} md:size={20} />
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="flex-1 md:flex-none bg-primary-600 hover:bg-primary-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Plus size={20} /> <span className="hidden md:inline">Novo Membro</span><span className="md:hidden">Novo</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-dark-800 p-2 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 md:mb-6 flex gap-2 md:gap-4 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} md:size={20} />
                    <input
                        placeholder="Buscar por nome, cargo ou email..."
                        className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50">
                                <th
                                    className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors select-none"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Membro
                                        {sortConfig.key === 'name' && (
                                            <span className="text-primary-500">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contato</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">OAB / CPF</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Endereço</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {sortedMembers.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                                {member.photo ? (
                                                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-slate-500 dark:text-slate-300">{member.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="truncate">{member.email}</span>
                                                <button onClick={(e) => handleEmail(member.email, e)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors" title="Enviar Email">
                                                    <Mail size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MessageCircle size={14} className="text-slate-400" />
                                                <span className="truncate">{member.phone}</span>
                                                <button onClick={(e) => handleWhatsApp(member.phone, e)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded transition-colors" title="Abrir WhatsApp">
                                                    <MessageCircle size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                        {member.oab ? `OAB ${member.oab}` : member.cpf || '-'}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                        {member.addressCity ? `${member.addressCity}/${member.addressState}` : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleOpenEdit(member)} className="p-2 hover:bg-slate-100 dark:hover:bg-dark-600 rounded-lg text-slate-400 hover:text-primary-600 transition-colors">
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Expanded Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-dark-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Membro' : 'Novo Membro'}</h2>
                            <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <form id="teamForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            {formErrors.length > 0 && (
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                                    <div className="space-y-1">
                                        {formErrors.map((err, idx) => (
                                            <p key={idx} className="text-sm text-rose-700 dark:text-rose-300">{err}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Avatar Section */}
                            <div className="flex justify-center mb-4">
                                <div className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer overflow-hidden hover:border-primary-500 transition-colors" onClick={() => fileRef.current?.click()}>
                                    {formData.photo ? (
                                        <img src={formData.photo} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400">
                                            <Camera size={24} />
                                            <span className="text-[10px] mt-1">Foto</span>
                                        </div>
                                    )}
                                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700"><User size={14} /> Dados Pessoais</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                    <input required className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Dr. João Silva" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                                        <select className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                            <option>Sócio</option>
                                            <option>Advogado</option>
                                            <option>Estagiário</option>
                                            <option>Secretária</option>
                                            <option>Financeiro</option>
                                            <option>Paralegal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                        <input type="email" className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Celular / WhatsApp</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" />
                                    </div>
                                </div>
                            </div>

                            {/* Qualification & Address */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700"><FileText size={14} /> Qualificação e Endereço Profissional</h3>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nacionalidade</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gênero</label>
                                        <select className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })}>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado Civil</label>
                                        <select className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                                            <option value="Solteiro(a)">Solteiro(a)</option>
                                            <option value="Casado(a)">Casado(a)</option>
                                            <option value="Divorciado(a)">Divorciado(a)</option>
                                            <option value="Viúvo(a)">Viúvo(a)</option>
                                            <option value="União Estável">União Estável</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">OAB (Opcional)</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.oab} onChange={e => setFormData({ ...formData, oab: e.target.value })} placeholder="000.000/UF" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                                value={formData.addressZip}
                                                onChange={e => setFormData({ ...formData, addressZip: maskCEP(e.target.value) })}
                                                placeholder="00000-000"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCepSearch}
                                                disabled={loadingCep}
                                                className="px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50"
                                            >
                                                <Search size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rua / Av.</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.addressStreet} onChange={e => setFormData({ ...formData, addressStreet: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-3">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.addressNumber} onChange={e => setFormData({ ...formData, addressNumber: e.target.value })} />
                                    </div>
                                    <div className="col-span-9">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Complemento</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.addressComplement} onChange={e => setFormData({ ...formData, addressComplement: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.addressNeighborhood} onChange={e => setFormData({ ...formData, addressNeighborhood: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.addressCity} onChange={e => setFormData({ ...formData, addressCity: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
                                        <input className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"
                                            value={formData.addressState} onChange={e => setFormData({ ...formData, addressState: e.target.value })} maxLength={2} />
                                    </div>
                                </div>
                            </div>

                        </form>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50 dark:bg-dark-900/50 shrink-0">
                            {isEditing && (
                                <button type="button" onClick={() => handleDelete(formData.id!)} className="px-4 py-2 text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40">
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white font-medium transition-colors">Cancelar</button>
                            <button
                                type="submit"
                                form="teamForm"
                                disabled={isLoading}
                                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    isEditing ? 'Salvar Alterações' : 'Adicionar Membro'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

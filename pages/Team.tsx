
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/Store';
import { User, Users, Plus, Mail, MessageCircle, X, Edit, Trash2, Camera, Search, MapPin, FileText, List, AlertCircle, Check } from '../components/Icons';
import { TeamMember } from '../types';
import { normalizeText, getInitials } from '../utils/textUtils';
import { AVATAR_COLORS, getAvatarColorStyles } from '../utils/styleUtils';

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

export const Team: React.FC = () => {
    const { theme, teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, clearTeamMembers, addNotification, isLoading, setIsLoading, currentUser } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingCep, setLoadingCep] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof TeamMember; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [formData, setFormData] = useState<Partial<TeamMember>>({
        name: '', role: 'Advogado', email: '', phone: '', active: true, oab: '',
        nationality: 'Brasileiro(a)', maritalStatus: 'Casado(a)', gender: 'Masculino',
        addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
        avatarColor: 'blue', initials: ''
    } as any);

    const fileRef = useRef<HTMLInputElement>(null);

    // Filter members
    const filteredMembers = teamMembers.filter(m => {
        const normalizedTerm = normalizeText(searchTerm);
        return normalizeText(m.name).includes(normalizedTerm) ||
            normalizeText(m.email).includes(normalizedTerm) ||
            normalizeText(m.role).includes(normalizedTerm);
    });

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
            addressStreet: '', addressNumber: '', addressComplement: '', addressNeighborhood: '', addressCity: '', addressState: '', addressZip: '',
            avatarColor: 'blue', initials: ''
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

    const isHybrid = theme === 'hybrid';
    const isSober = theme === 'sober';

    const classes = {
        container: `animate-fade-in pb-20 relative min-h-full flex flex-col ${isHybrid ? 'bg-[#222e35]' : ''}`,
        headerContainer: `sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${isHybrid ? 'bg-[#202c33] border-emerald-500/20' : (isSober ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800')}`,
        pageTitle: `text-2xl md:text-3xl font-bold tracking-tight ${isHybrid ? 'text-[#e9edef]' : (isSober ? 'text-slate-900' : 'text-slate-900 dark:text-white')}`,
        pageSubtitle: `text-sm mt-1 ${isHybrid ? 'text-[#aebac1]' : (isSober ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400')}`,
        panel: isHybrid ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700',
        input: isHybrid ? 'bg-[#202c33] border-[#354751] text-[#e9edef] focus:ring-[#00a884]/50 focus:border-[#00a884]' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 focus:ring-primary-500 text-slate-900 dark:text-white',
        inputIcon: isHybrid ? 'text-[#aebac1]' : 'text-slate-400',
        tableHeader: isHybrid ? 'border-[#354751] bg-[#202c33]/50' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50',
        tableHeaderCell: `p-4 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors select-none ${isHybrid ? 'text-[#aebac1] hover:bg-[#202c33]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-700'}`,
        tableHeaderCellNoHover: `p-4 text-xs font-semibold uppercase tracking-wider ${isHybrid ? 'text-[#aebac1]' : 'text-slate-500'}`,
        tableDivider: isHybrid ? 'divide-[#354751]' : 'divide-slate-100 dark:divide-slate-700',
        tableRow: `transition-colors group ${isHybrid ? 'hover:bg-[#354751] hover:shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`,
        textPrimary: isHybrid ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white',
        textSecondary: isHybrid ? 'text-[#aebac1]' : 'text-slate-600 dark:text-slate-300',
        textMuted: isHybrid ? 'text-[#8696a0]' : 'text-slate-400',
        badge: `px-2 py-1 rounded text-xs font-medium ${isHybrid ? 'bg-[#202c33] text-[#e9edef]' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`,
        iconButton: `p-2 rounded-lg transition-colors ${isHybrid ? 'hover:bg-[#202c33] text-[#8696a0] hover:text-[#00a884]' : 'hover:bg-slate-100 dark:hover:bg-dark-600 text-slate-400 hover:text-primary-600'}`,
        modalOverlay: isHybrid ? 'bg-black/80' : 'bg-black/60',
        modalContent: `w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isHybrid ? 'bg-[#2a3942]' : 'bg-white dark:bg-dark-800'}`,
        modalHeader: `p-6 border-b flex justify-between items-center ${isHybrid ? 'border-[#354751] bg-[#202c33]' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50'}`,
        modalFooter: `p-6 border-t flex gap-3 shrink-0 ${isHybrid ? 'border-[#354751] bg-[#202c33]' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50'}`,
        modalBorder: isHybrid ? 'border-[#354751]' : 'border-slate-100 dark:border-slate-700',
        modalHeaderIcon: isHybrid ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white',
        buttonCancel: `flex-1 py-3 rounded-lg border font-medium transition-colors ${isHybrid ? 'border-[#354751] text-[#e9edef] hover:bg-[#354751]' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white'}`,
        label: `block text-sm font-medium mb-1 ${isHybrid ? 'text-[#aebac1]' : 'text-slate-700 dark:text-slate-300'}`,
        sectionTitle: `text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-2 border-b ${isHybrid ? 'text-[#8696a0] border-[#354751]' : 'text-slate-400 border-slate-100 dark:border-slate-700'}`,
        avatarContainer: `flex flex-col md:flex-row items-center gap-6 mb-8 p-6 rounded-2xl border ${isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-slate-50 dark:bg-dark-900/50 border-slate-100 dark:border-slate-800'}`,
        avatarBase: `relative w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed cursor-pointer overflow-hidden transition-colors shadow-inner ${isHybrid ? 'bg-[#2a3942] border-[#354751] hover:border-[#00a884]' : 'bg-slate-100 dark:bg-dark-700 border-slate-300 dark:border-slate-600 hover:border-primary-500'}`,
        buttonCamera: `p-2 rounded-full shadow-lg border transition-transform ${isHybrid ? 'bg-[#202c33] border-[#354751] text-[#00a884] hover:scale-110' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-primary-600 hover:scale-110'}`,
        buttonTrash: `p-2 rounded-full shadow-lg border transition-all ${isHybrid ? 'bg-[#202c33] border-[#354751] text-rose-500 hover:scale-110 hover:bg-rose-500/20' : 'bg-white dark:bg-dark-800 border-rose-200 dark:border-rose-900/50 text-rose-600 hover:scale-110 hover:bg-rose-50'}`,
        errorBox: `p-4 rounded-lg flex items-start gap-3 border ${isHybrid ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`,
        errorText: `text-sm ${isHybrid ? 'text-rose-400' : 'text-rose-700 dark:text-rose-300'}`,
        btnSearch: `px-3 rounded-lg disabled:opacity-50 ${isHybrid ? 'bg-[#202c33] text-[#00a884] hover:bg-[#2a3942]' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`,
        btnDanger: `px-4 py-2 rounded-lg ${isHybrid ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40'}`,
    };

    return (
        <div className={classes.container}>
            {/* Header - Sticky */}
            <div className={classes.headerContainer}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className={classes.pageTitle}>Equipe</h1>

                            {/* Animated Badge */}
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 px-3 py-1.5 rounded-full animate-badge-entrance">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </div>
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                    <Users size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                        <AnimatedCounter target={teamMembers.length} /> Ativos
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className={classes.pageSubtitle}>
                            {teamMembers.length === 0 ? "Nenhum membro cadastrado." :
                                filteredMembers.length === teamMembers.length ?
                                    `Total de ${teamMembers.length} ${teamMembers.length === 1 ? 'membro' : 'membros'}.` :
                                    `Exibindo ${filteredMembers.length} de ${teamMembers.length} membros.`
                            }
                        </p>
                    </div>

                    <div className="flex gap-2 md:gap-3 w-full md:w-auto mt-3 md:mt-0">
                        <button
                            onClick={handleOpenNew}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap ${isHybrid ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'}`}
                        >
                            <Plus size={20} /> Novo Membro
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:px-8 pt-6 flex-1 flex flex-col">

                {/* Filter Bar */}
                <div className={`p-2 md:p-4 rounded-xl border mb-3 md:mb-6 flex items-center gap-2 md:gap-3 shadow-sm transition-colors ${classes.panel}`}>
                    <Search size={16} md:size={20} className={classes.inputIcon} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, cargo ou email..."
                        className={`flex-1 bg-transparent outline-none text-sm ${isHybrid ? 'text-[#e9edef] placeholder:text-[#aebac1]/50' : 'text-slate-900 dark:text-white'}`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List Content */}
                <div className={`rounded-xl shadow-sm border overflow-hidden flex-1 flex flex-col ${classes.panel}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className={`border-b ${classes.tableHeader}`}>
                                    <th
                                        className={classes.tableHeaderCell}
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
                                    <th className={classes.tableHeaderCellNoHover}>Contato</th>
                                    <th className={classes.tableHeaderCellNoHover}>Cargo</th>
                                    <th className={classes.tableHeaderCellNoHover}>OAB / CPF</th>
                                    <th className={classes.tableHeaderCellNoHover}>Endereço</th>
                                    <th className={classes.tableHeaderCellNoHover}></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${classes.tableDivider}`}>
                                {sortedMembers.map(member => (
                                    <tr key={member.id} className={classes.tableRow}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${getAvatarColorStyles(member.avatarColor || 'blue')}`}>
                                                    {member.photo ? (
                                                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-xs">{getInitials(member.name, member.initials)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-sm ${classes.textPrimary}`}>{member.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`text-sm space-y-1.5 ${classes.textSecondary}`}>
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className={classes.textMuted} />
                                                    <span className="truncate">{member.email}</span>
                                                    <button onClick={(e) => handleEmail(member.email, e)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors" title="Enviar Email">
                                                        <Mail size={12} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MessageCircle size={14} className={classes.textMuted} />
                                                    <span className="truncate">{member.phone}</span>
                                                    <button onClick={(e) => handleWhatsApp(member.phone, e)} className="text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded transition-colors" title="Abrir WhatsApp">
                                                        <MessageCircle size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={classes.badge}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-sm font-mono ${classes.textSecondary}`}>
                                            {member.oab ? `OAB ${member.oab}` : member.cpf || '-'}
                                        </td>
                                        <td className={`p-4 text-sm ${classes.textSecondary}`}>
                                            {member.addressCity ? `${member.addressCity}/${member.addressState}` : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleOpenEdit(member)} className={classes.iconButton}>
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
                    <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in ${classes.modalOverlay}`}>
                        <div className={classes.modalContent}>
                            <div className={classes.modalHeader}>
                                <h2 className={`text-lg font-bold ${classes.modalHeaderIcon}`}>{isEditing ? 'Editar Membro' : 'Novo Membro'}</h2>
                                <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                            </div>

                            <form id="teamForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                {formErrors.length > 0 && (
                                    <div className={classes.errorBox}>
                                        <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                                        <div className="space-y-1">
                                            {formErrors.map((err, idx) => (
                                                <p key={idx} className={classes.errorText}>{err}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Avatar Section - Refactored Side-by-Side */}
                                <div className={classes.avatarContainer}>
                                    <div className="relative group">
                                        <div className={classes.avatarBase} onClick={() => fileRef.current?.click()}>
                                            {formData.photo ? (
                                                <img src={formData.photo} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${getAvatarColorStyles(formData.avatarColor || 'blue')}`}>
                                                    {getInitials(formData.name || '', formData.initials)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 flex gap-1">
                                            {formData.photo && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({ ...formData, photo: null as any });
                                                    }}
                                                    className={classes.buttonTrash}
                                                    title="Remover Foto"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileRef.current?.click();
                                                }}
                                                className={classes.buttonCamera}
                                                title="Alterar Foto"
                                            >
                                                <Camera size={16} />
                                            </button>
                                        </div>
                                        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                    </div>

                                    <div className="flex-1 space-y-4 w-full">
                                        <div>
                                            <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${classes.textMuted}`}>Cor do Avatar</label>
                                            <div className="flex flex-wrap gap-2">
                                                {AVATAR_COLORS.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, avatarColor: c.id })}
                                                        className={`w-8 h-8 rounded-full ${c.bg} ${c.text} ${c.border} border flex items-center justify-center transition-all ${formData.avatarColor === c.id ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-dark-900 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                                    >
                                                        {formData.avatarColor === c.id && <Check size={14} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-bold uppercase tracking-widest mb-1 ${classes.textMuted}`}>Iniciais (Max 3)</label>
                                            <input
                                                className={`w-full md:w-32 p-2 rounded-lg border outline-none uppercase text-center font-bold tracking-tighter ${classes.input}`}
                                                value={formData.initials || ''}
                                                onChange={e => setFormData({ ...formData, initials: e.target.value.toUpperCase().substring(0, 3) })}
                                                placeholder={getInitials(formData.name || '')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className={classes.sectionTitle}><User size={14} /> Dados Pessoais</h3>

                                    <div>
                                        <label className={classes.label}>Nome Completo</label>
                                        <input required className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Dr. João Silva" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={classes.label}>Cargo</label>
                                            <select className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
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
                                            <label className={classes.label}>Email</label>
                                            <input type="email" className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={classes.label}>Celular / WhatsApp</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.phone} onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
                                        </div>
                                        <div>
                                            <label className={classes.label}>CPF</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} placeholder="000.000.000-00" />
                                        </div>
                                    </div>

                                </div>

                                {/* Qualification & Address */}
                                <div className="space-y-4">
                                    <h3 className={classes.sectionTitle}><FileText size={14} /> Qualificação e Endereço Profissional</h3>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className={classes.label}>Nacionalidade</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={classes.label}>Gênero</label>
                                            <select className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })}>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Feminino">Feminino</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={classes.label}>Estado Civil</label>
                                            <select className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                                                <option value="Solteiro(a)">Solteiro(a)</option>
                                                <option value="Casado(a)">Casado(a)</option>
                                                <option value="Divorciado(a)">Divorciado(a)</option>
                                                <option value="Separado(a) Judicialmente">Separado(a) Judicialmente</option>
                                                <option value="Viúvo(a)">Viúvo(a)</option>
                                                <option value="União Estável">União Estável</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={classes.label}>OAB (Opcional)</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.oab} onChange={e => setFormData({ ...formData, oab: e.target.value })} placeholder="000.000/UF" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-1">
                                            <label className={classes.label}>CEP</label>
                                            <div className="flex gap-2">
                                                <input
                                                    className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                    value={formData.addressZip}
                                                    onChange={e => setFormData({ ...formData, addressZip: maskCEP(e.target.value) })}
                                                    placeholder="00000-000"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCepSearch}
                                                    disabled={loadingCep}
                                                    className={classes.btnSearch}
                                                >
                                                    <Search size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <label className={classes.label}>Rua / Av.</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.addressStreet} onChange={e => setFormData({ ...formData, addressStreet: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3">
                                            <label className={classes.label}>Número</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.addressNumber} onChange={e => setFormData({ ...formData, addressNumber: e.target.value })} />
                                        </div>
                                        <div className="col-span-9">
                                            <label className={classes.label}>Complemento</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.addressComplement} onChange={e => setFormData({ ...formData, addressComplement: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className={classes.label}>Bairro</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.addressNeighborhood} onChange={e => setFormData({ ...formData, addressNeighborhood: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={classes.label}>Cidade</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.addressCity} onChange={e => setFormData({ ...formData, addressCity: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={classes.label}>UF</label>
                                            <input className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}
                                                value={formData.addressState} onChange={e => setFormData({ ...formData, addressState: e.target.value })} maxLength={2} />
                                        </div>
                                    </div>
                                </div>

                            </form>

                            <div className={classes.modalFooter}>
                                {isEditing && currentUser?.isAdmin && (
                                    <button type="button" onClick={() => handleDelete(formData.id!)} className={classes.btnDanger}>
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button type="button" onClick={() => setShowModal(false)} className={classes.buttonCancel}>Cancelar</button>
                                <button
                                    type="submit"
                                    form="teamForm"
                                    disabled={isLoading}
                                    className={`flex-1 py-3 rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isHybrid ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'}`}
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
        </div>
    );
};

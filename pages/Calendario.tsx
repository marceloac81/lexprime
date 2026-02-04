
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { ChevronLeft, ChevronRight, Plus, Clock, Search, CheckCircle2, AlertCircle, X, Edit, ChevronDown, User, MapPin, RefreshCw, Copy, Globe, Smartphone, Check, Trash2, RotateCcw, CalendarIcon } from '../components/Icons';
import { supabase } from '../utils/supabaseClient';
import { calculateDeadline, formatDate } from '../utils/dateUtils';
import { Deadline, Case, Holiday } from '../types';

import { CalculatorModal } from '../components/CalculatorModal';

export const Calendario: React.FC = () => {
    const { appointments, deadlines, cases, addDeadline, updateDeadline, deleteDeadline, holidays, isLoading, setIsLoading } = useStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);

    // State for modals & picker
    const [showNewModal, setShowNewModal] = useState(false);
    const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeSyncTab, setActiveSyncTab] = useState<'outlook' | 'google' | 'iphone'>('outlook');
    const [syncToken, setSyncToken] = useState<string>('');
    const [isResettingToken, setIsResettingToken] = useState(false);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDateStr(today.toISOString().split('T')[0]);
    };

    // Picker Logic
    const changeYear = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear() + offset, currentDate.getMonth(), 1));
    };

    const selectMonth = (monthIndex: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
        setShowMonthPicker(false);
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Format Month Name
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const monthsList = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Get selected day items
    const selectedDeadlines = deadlines.filter(d => d.dueDate === selectedDateStr);
    const selectedAppointments = appointments.filter(a => a.date.startsWith(selectedDateStr));
    const hasItems = selectedDeadlines.length > 0 || selectedAppointments.length > 0;
    const selectedDateObj = new Date(selectedDateStr + 'T12:00:00'); // Safe parse

    const handleEditDeadline = (d: Deadline) => {
        setEditingDeadline(d);
    };

    const handleSaveDeadline = (d: Deadline) => {
        setIsLoading(true);
        setTimeout(() => {
            if (editingDeadline) {
                updateDeadline(d);
            } else {
                addDeadline(d);
            }
            setIsLoading(false);
            setEditingDeadline(null);
            setShowNewModal(false);
        }, 600);
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    // Fetch Sync Token
    useEffect(() => {
        const fetchToken = async () => {
            const { data, error } = await supabase
                .from('office_settings')
                .select('value')
                .eq('key', 'calendar_token')
                .single();
            if (data) setSyncToken(data.value);
        };
        fetchToken();
    }, []);

    const handleCopyToken = () => {
        const url = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/calendar-feed?token=${syncToken}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetToken = async () => {
        if (!confirm('Ao redefinir o link, todos os calendários já sincronizados pararão de funcionar. Deseja continuar?')) return;

        setIsResettingToken(true);
        const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        try {
            const { error } = await supabase
                .from('office_settings')
                .update({ value: newToken })
                .eq('key', 'calendar_token');

            if (error) throw error;
            setSyncToken(newToken);
        } catch (err) {
            alert('Erro ao redefinir link. Tente novamente.');
        } finally {
            setIsResettingToken(false);
        }
    };

    // Close picker when clicking outside (simple implementation)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showMonthPicker && !(e.target as Element).closest('.date-picker-container')) {
                setShowMonthPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMonthPicker]);

    return (
        <div className="p-4 md:p-8 h-full flex flex-col animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendário</h1>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative date-picker-container z-20">
                        <button onClick={goToToday} className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider">
                            Hoje
                        </button>
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-l-none text-slate-600 dark:text-slate-300 transition-colors"><ChevronLeft size={20} /></button>

                        <button
                            onClick={() => setShowMonthPicker(!showMonthPicker)}
                            className="px-4 py-2 font-bold text-sm border-l border-r border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 capitalize min-w-[160px] text-center flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            {monthName} <ChevronDown size={14} className="opacity-50" />
                        </button>

                        <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-r-lg text-slate-600 dark:text-slate-300 transition-colors"><ChevronRight size={20} /></button>

                        {/* DATE PICKER DROPDOWN */}
                        {showMonthPicker && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-fade-in">
                                {/* Year Control */}
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                                    <button onClick={() => changeYear(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg"><ChevronLeft size={16} /></button>
                                    <span className="font-bold text-slate-900 dark:text-white">{currentDate.getFullYear()}</span>
                                    <button onClick={() => changeYear(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg"><ChevronRight size={16} /></button>
                                </div>
                                {/* Month Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    {monthsList.map((m, idx) => (
                                        <button
                                            key={m}
                                            onClick={() => selectMonth(idx)}
                                            className={`py-2 text-xs font-medium rounded-lg transition-colors ${currentDate.getMonth() === idx
                                                ? 'bg-primary-600 text-white'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-700'
                                                }`}
                                        >
                                            {m.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowSyncModal(true)}
                        className="group p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg transition-all flex items-center gap-2.5 text-left"
                        title="Sincronizar com Outlook, Google e iPhone"
                    >
                        <RefreshCw size={22} className="group-hover:rotate-180 transition-transform duration-500" />
                        <div className="hidden lg:flex flex-col leading-tight">
                            <span className="text-sm font-bold">Sincronizar Calendário</span>
                            <span className="text-[10px] text-slate-400 font-medium">Outlook • Google • iPhone</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowNewModal(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-primary-500/20 font-medium active:scale-95 transition-transform"
                    >
                        <Plus size={18} /> <span className="hidden md:inline">Novo Prazo</span><span className="md:hidden">Novo</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-2">
                {/* CALENDAR GRID */}
                <div className="flex-[3] bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[600px] relative">
                    <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700 shrink-0">
                        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(d => (
                            <div key={d} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-dark-900/50">{d}</div>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ direction: 'rtl' }}>
                        <div className="grid grid-cols-7 auto-rows-fr" style={{ direction: 'ltr' }}>
                            {days.map((day, idx) => {
                                if (day === null) return <div key={idx} className="bg-slate-50/30 dark:bg-dark-900/30 border-b border-r border-slate-100 dark:border-slate-800" />;

                                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const dayDeadlines = deadlines.filter(d => d.dueDate === dateStr);
                                const dayAppointments = appointments.filter(a => a.date.startsWith(dateStr));
                                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                const isSelected = selectedDateStr === dateStr;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedDateStr(dateStr)}
                                        className={`border-b border-r border-slate-100 dark:border-slate-800 p-1 md:p-2 min-h-[150px] md:min-h-[180px] relative group cursor-pointer transition-colors
                                ${isSelected ? 'bg-primary-50 dark:bg-primary-900/10 ring-2 ring-inset ring-primary-500/50' : 'hover:bg-slate-50 dark:hover:bg-dark-900/50'}
                                ${isToday && !isSelected ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                            `}
                                    >
                                        <span className={`text-sm font-bold block mb-2 w-7 h-7 flex items-center justify-center rounded-full 
                                ${isToday ? 'bg-primary-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}
                                ${isSelected && !isToday ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : ''}
                            `}>
                                            {day}
                                        </span>

                                        <div className="space-y-1">
                                            {dayDeadlines.map(d => {
                                                const dCase = cases.find(c => c.id === d.caseId);
                                                const procNum = dCase?.number || 'Avulso';
                                                return (
                                                    <div key={d.id} className="text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 truncate border-l-2 border-rose-500 font-medium" title={`${(d.startTime || '09:00').slice(0, 5)} - ${d.title}\nProcesso: ${procNum}`}>
                                                        <span className="hidden md:inline">{(d.startTime || '09:00').slice(0, 5)} - {d.title}</span>
                                                        <span className="md:hidden">{(d.startTime || '09:00').slice(0, 5)}</span>
                                                    </div>
                                                );
                                            })}
                                            {dayAppointments.map(a => (
                                                <div key={a.id} className="text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 truncate border-l-2 border-purple-500 font-medium" title={`${(a.date.substring(11, 16) || '09:00')} - ${a.title}`}>
                                                    {(a.date.substring(11, 16) || '09:00')} <span className="hidden md:inline">{a.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* EVENTS PANEL */}
                <div className="flex-1 min-w-[320px] lg:max-w-md flex flex-col bg-white dark:bg-dark-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-dark-900/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                                {selectedDateObj.toLocaleDateString('pt-BR', { weekday: 'long' })}, {selectedDateObj.getDate()} de {selectedDateObj.toLocaleDateString('pt-BR', { month: 'long' })}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {selectedDeadlines.length} prazos • {selectedAppointments.length} eventos
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {selectedDeadlines.length === 0 && selectedAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-dark-900 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                    <Clock size={32} />
                                </div>
                                <p className="text-sm font-medium">Nenhum compromisso para hoje</p>
                            </div>
                        ) : (
                            <>
                                {selectedDeadlines
                                    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                    .map(deadline => {
                                        const dCase = cases.find(c => c.id === deadline.caseId);
                                        const clientName = dCase?.clientName || deadline.customerName || 'Não informado';
                                        const procNum = dCase?.number || 'Avulso';
                                        const statusLabel = deadline.status === 'Done' ? 'Concluído' : deadline.status === 'Canceled' ? 'Cancelado' : 'Pendente';
                                        const statusColor = deadline.status === 'Done' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : deadline.status === 'Canceled' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';

                                        return (
                                            <div key={deadline.id} className="group bg-white dark:bg-dark-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${deadline.priority === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-mono font-bold text-slate-400 transition-colors">{(deadline.startTime || 'O dia todo').slice(0, 5)}</span>
                                                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${statusColor}`}>
                                                                {statusLabel}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight mb-0.5 truncate">{deadline.title}</h4>
                                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 truncate mb-1">{clientName}</p>
                                                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                                            {procNum}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0 ml-2">
                                                        <button onClick={() => handleEditDeadline(deadline)} className="text-slate-300 hover:text-primary-500 p-1">
                                                            <Edit size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {selectedAppointments.map(appointment => (
                                    <div key={appointment.id} className="bg-white dark:bg-dark-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono font-bold text-slate-400">{appointment.date.substring(11, 16) || 'O dia todo'}</span>
                                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">Evento</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">{appointment.title}</h4>
                                                {appointment.location && (
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                        <MapPin size={12} /> {appointment.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="w-full py-3 mt-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-dark-700 transition-all border-dashed"
                        >
                            Adicionar Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Calculator Modal Reuse for New & Edit */}
            {(showNewModal || editingDeadline) && (
                <CalculatorModal
                    onClose={() => {
                        setShowNewModal(false);
                        setEditingDeadline(null);
                    }}
                    cases={cases}
                    onSave={handleSaveDeadline}
                    initialDate={selectedDateStr}
                    initialData={editingDeadline}
                    onDelete={deleteDeadline}
                />
            )}
            {/* Sync Modal */}
            {showSyncModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-dark-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <RefreshCw size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:white">Sincronizar Calendário</h3>
                                    <p className="text-xs text-slate-500">Outlook, Google Calendar e iPhone</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Link Box */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seu Link de Feed (iCal)</label>
                                    <button
                                        onClick={handleResetToken}
                                        disabled={isResettingToken}
                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <RotateCcw size={12} /> Redefinir Link
                                    </button>
                                </div>
                                <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 rounded-xl items-center">
                                    <div className="flex-1 px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-300 truncate">
                                        {syncToken ? (
                                            `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/calendar-feed?token=${syncToken}`
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 italic">
                                                <RefreshCw size={14} className="animate-spin" /> Gerando link seguro...
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleCopyToken}
                                        disabled={!syncToken}
                                        className={`${copied ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-dark-800 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600'} hover:opacity-90 px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 min-w-[110px] justify-center disabled:opacity-50`}
                                    >
                                        {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                    </button>
                                </div>
                            </div>

                            {/* Device Tabs */}
                            <div className="space-y-4">
                                <div className="flex border-b border-slate-100 dark:border-slate-700">
                                    <button
                                        onClick={() => setActiveSyncTab('outlook')}
                                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 ${activeSyncTab === 'outlook' ? 'border-primary-500 text-primary-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <CalendarIcon size={14} /> Outlook
                                    </button>
                                    <button
                                        onClick={() => setActiveSyncTab('google')}
                                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 ${activeSyncTab === 'google' ? 'border-primary-500 text-primary-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Globe size={14} /> Google
                                    </button>
                                    <button
                                        onClick={() => setActiveSyncTab('iphone')}
                                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-2 ${activeSyncTab === 'iphone' ? 'border-primary-500 text-primary-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Smartphone size={14} /> iPhone
                                    </button>
                                </div>

                                <div className="min-h-[140px]">
                                    {activeSyncTab === 'outlook' && (
                                        <ol className="space-y-3 animate-fade-in">
                                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                                <span>No Outlook, clique em <strong>Adicionar Calendário</strong> &gt; <strong>Da Internet</strong>.</span>
                                            </li>
                                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                                <span>Cole o link copiado acima e clique em <strong>Assinar</strong>.</span>
                                            </li>
                                        </ol>
                                    )}
                                    {activeSyncTab === 'google' && (
                                        <ol className="space-y-3 animate-fade-in">
                                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                                <span>No Google Agenda, clique no <strong>+</strong> ao lado de 'Outras agendas'.</span>
                                            </li>
                                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                                <span>Selecione <strong>Do URL</strong>, cole o link e clique em <strong>Adicionar agenda</strong>.</span>
                                            </li>
                                        </ol>
                                    )}
                                    {activeSyncTab === 'iphone' && (
                                        <ol className="space-y-3 animate-fade-in">
                                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                                <span>Acesse <strong>Ajustes</strong> &gt; <strong>Calendário</strong> &gt; <strong>Contas</strong>.</span>
                                            </li>
                                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                                <span>Toque em <strong>Adicionar Conta</strong> &gt; <strong>Outra</strong> &gt; <strong>Adic. Calendário Assinado</strong>.</span>
                                            </li>
                                            <li className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                                <span>Cole o link no campo Servidor e toque em <strong>Seguinte</strong>.</span>
                                            </li>
                                        </ol>
                                    )}
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 flex gap-3">
                                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                                        <strong>Nota sobre sincronização:</strong> Outlook e Google podem levar de 4 a 24 horas para refletir mudanças recentes devido ao cache dos servidores deles.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-dark-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                            <button
                                onClick={() => setShowSyncModal(false)}
                                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                Concluído
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

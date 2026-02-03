
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { ChevronLeft, ChevronRight, Plus, Clock, Search, CheckCircle2, AlertCircle, X, Edit, ChevronDown, User, MapPin } from '../components/Icons';
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
                        onClick={() => setShowNewModal(true)}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-primary-500/20 font-medium active:scale-95 transition-transform"
                    >
                        <Plus size={18} /> <span className="hidden md:inline">Novo Prazo</span><span className="md:hidden">Novo</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-2">
                {/* CALENDAR GRID */}
                <div className="flex-[3] bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[600px]">
                    <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
                        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(d => (
                            <div key={d} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-dark-900/50">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
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
                                    className={`border-b border-r border-slate-100 dark:border-slate-800 p-1 md:p-2 min-h-[100px] md:min-h-[120px] relative group cursor-pointer transition-colors
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
                                        {dayDeadlines.map(d => (
                                            <div key={d.id} className="text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 truncate border-l-2 border-rose-500 font-medium">
                                                <span className="hidden md:inline">{d.title}</span>
                                                <span className="md:hidden">Prazo</span>
                                            </div>
                                        ))}
                                        {dayAppointments.map(a => (
                                            <div key={a.id} className="text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 truncate border-l-2 border-purple-500 font-medium">
                                                {a.date.substring(11, 16)} <span className="hidden md:inline">{a.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
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
                                    .map(deadline => (
                                        <div key={deadline.id} className="group bg-white dark:bg-dark-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${deadline.priority === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-primary-500 transition-colors">{(deadline.startTime || 'O dia todo').slice(0, 5)}</span>
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${deadline.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                                            {deadline.type?.toUpperCase() === 'PRAZO PROCESSUAL' ? 'PRAZO' : deadline.type}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">{deadline.title}</h4>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{deadline.caseTitle || deadline.customerName || 'Sem processo'}</p>
                                                </div>
                                                <button onClick={() => handleEditDeadline(deadline)} className="text-slate-300 hover:text-primary-500 p-1">
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

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
        </div>
    );
};

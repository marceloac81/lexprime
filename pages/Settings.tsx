import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { Download, Moon, Sun, Trash2, User, UserCheck, Shield, Bell, ChevronRight, CheckCircle2, AlertCircle, Upload, CalendarIcon, RotateCcw, Clock, Search } from '../components/Icons';
import { Holiday, Case, Client, Deadline, TeamMember } from '../types';
import {
    generateContactsCSV, generateCasesCSV, generateDeadlinesCSV, generateTeamCSV, generateHolidaysCSV, downloadCSV,
    parseContactsCSV, parseCasesCSV, parseDeadlinesCSV, parseTeamCSV, parseHolidaysCSV
} from '../utils/importHelpers';

export const Settings: React.FC = () => {
    const {
        theme, isDarkMode, toggleTheme, currentUser, resetHolidays,
        holidays, importHolidays, addNotification, clients, importClients, cases, importCases,
        deadlines, importDeadlines, teamMembers, importTeamMembers,
        syncData, isLoading, setIsLoading,
        activityLogs, fetchActivityLogs, clearActivityLogs
    } = useStore();
    const clientsInputRef = useRef<HTMLInputElement>(null);
    const casesInputRef = useRef<HTMLInputElement>(null);
    const deadlinesInputRef = useRef<HTMLInputElement>(null);
    const teamInputRef = useRef<HTMLInputElement>(null);
    const holidayInputRef = useRef<HTMLInputElement>(null);

    const [logFilter, setLogFilter] = useState({ user: '', date: '' });

    const filteredLogs = activityLogs.filter(log => {
        const matchesUser = !logFilter.user || log.userName.toLowerCase().includes(logFilter.user.toLowerCase());
        const matchesDate = !logFilter.date || log.createdAt.startsWith(logFilter.date);
        return matchesUser && matchesDate;
    });

    // Track when import is complete and needs sync
    const [pendingSync, setPendingSync] = useState<{ type: string; expectedCount: number } | null>(null);

    // Trigger sync after state update is complete
    useEffect(() => {
        if (pendingSync) {
            // Verify state was updated before syncing
            let currentCount = 0;
            switch (pendingSync.type) {
                case 'clients': currentCount = clients.length; break;
                case 'cases': currentCount = cases.length; break;
                case 'deadlines': currentCount = deadlines.length; break;
                case 'team': currentCount = teamMembers.length; break;
                case 'holidays': currentCount = holidays.length; break;
            }

            // Only sync if we have the expected count (state update completed)
            if (currentCount >= pendingSync.expectedCount) {
                syncData();
                setPendingSync(null);
            }
        }
    }, [clients, cases, deadlines, teamMembers, holidays, pendingSync, syncData]);

    const handleImport = (type: 'clients' | 'cases' | 'deadlines' | 'team' | 'holidays') => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            try {
                let count = 0;
                if (type === 'clients') {
                    const parsed = parseContactsCSV(text);
                    if (parsed.length > 0) {
                        importClients(parsed);
                        count = parsed.length;
                    }
                } else if (type === 'cases') {
                    const parsed = parseCasesCSV(text);
                    if (parsed.length > 0) {
                        importCases(parsed);
                        count = parsed.length;
                    }
                } else if (type === 'deadlines') {
                    const parsed = parseDeadlinesCSV(text);
                    if (parsed.length > 0) {
                        importDeadlines(parsed);
                        count = parsed.length;
                    }
                } else if (type === 'team') {
                    const parsed = parseTeamCSV(text);
                    if (parsed.length > 0) {
                        importTeamMembers(parsed);
                        count = parsed.length;
                    }
                } else if (type === 'holidays') {
                    const parsed = parseHolidaysCSV(text);
                    if (parsed.length > 0) {
                        importHolidays(parsed);
                        count = parsed.length;
                    }
                }

                if (count > 0) {
                    addNotification(`${count} registros carregados. Iniciando sincronização...`, 'info');
                    // Set pending sync to trigger after state update
                    const currentCount = type === 'clients' ? clients.length :
                        type === 'cases' ? cases.length :
                            type === 'deadlines' ? deadlines.length :
                                type === 'team' ? teamMembers.length :
                                    type === 'holidays' ? holidays.length : 0;
                    setPendingSync({ type, expectedCount: currentCount + count });
                }
            } catch (err) {
                addNotification("Erro ao processar arquivo.", "warning");
            }
        };
        reader.readAsText(file);
        if (e.target) e.target.value = '';
    };

    const handleBackupAll = () => {
        const dateStr = new Date().toISOString().split('T')[0];

        if (cases.length > 0) {
            downloadCSV(generateCasesCSV(cases), `processos_${dateStr}.csv`);
        }

        if (clients.length > 0) {
            setTimeout(() => downloadCSV(generateContactsCSV(clients), `contatos_${dateStr}.csv`), 500);
        }

        if (deadlines.length > 0) {
            setTimeout(() => downloadCSV(generateDeadlinesCSV(deadlines, cases), `prazos_${dateStr}.csv`), 1000);
        }

        if (teamMembers.length > 0) {
            setTimeout(() => downloadCSV(generateTeamCSV(teamMembers), `equipe_${dateStr}.csv`), 1500);
        }

        if (holidays.length > 0) {
            setTimeout(() => downloadCSV(generateHolidaysCSV(holidays), `feriados_${dateStr}.csv`), 2000);
        }

        addNotification("Backup iniciado! Os arquivos serão baixados sequencialmente.", 'success');
    };

    return (
        <div className={`animate-fade-in pb-20 relative min-h-full flex flex-col ${theme === 'hybrid' ? 'bg-[#222e35]' : ''}`}>
            {/* Header - Sticky */}
            <div className={`sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${theme === 'hybrid'
                ? 'bg-[#111b21] border-[#202c33]'
                : (theme === 'sober' ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800')
                }`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === 'hybrid' ? 'text-[#e9edef]' : (theme === 'sober' ? 'text-slate-900' : 'text-slate-900 dark:text-white')}`}>Configurações</h1>
                        <p className={`text-sm mt-1 ${theme === 'hybrid' ? 'text-[#8696a0]' : (theme === 'sober' ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400')}`}>Gerencie suas preferências e dados do sistema.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 md:px-8 pt-4 md:pt-8 flex-1 flex flex-col max-w-4xl mx-auto w-full">

                <div className="space-y-6 pb-20">
                    {/* Profile Section */}
                    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl font-bold text-primary-600">
                            {currentUser?.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentUser?.name}</h2>
                            <p className="text-slate-500">{currentUser?.email}</p>
                            <span className="inline-block mt-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 uppercase">{currentUser?.role}</span>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Aparência</h3>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-900 rounded-lg">
                            <div className="flex items-center gap-3">
                                {isDarkMode ? <Moon className="text-purple-500" /> : (theme === 'hybrid' ? <Moon className="text-[#00a884]" /> : (theme === 'sober' ? <Clock className="text-slate-500" /> : <Sun className="text-orange-500" />))}
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Tema: {theme === 'dark' ? 'Dark' : theme === 'hybrid' ? 'Dark Verde' : theme === 'sober' ? 'Neutro' : 'Claro'}</p>
                                    <p className="text-xs text-slate-500">Altere o visual da interface</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-primary-600' : theme === 'hybrid' ? 'bg-[#00a884]' : theme === 'sober' ? 'bg-slate-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${theme === 'dark' || theme === 'hybrid' || theme === 'sober' ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-primary-600" /> Gestão de Dados (CSV)
                        </h3>

                        <div className="space-y-4">
                            <input type="file" accept=".csv" ref={casesInputRef} className="hidden" onChange={handleImport('cases')} />
                            <input type="file" accept=".csv" ref={clientsInputRef} className="hidden" onChange={handleImport('clients')} />
                            <input type="file" accept=".csv" ref={deadlinesInputRef} className="hidden" onChange={handleImport('deadlines')} />
                            <input type="file" accept=".csv" ref={teamInputRef} className="hidden" onChange={handleImport('team')} />
                            <input type="file" accept=".csv" ref={holidayInputRef} className="hidden" onChange={handleImport('holidays')} />

                            {[
                                { label: 'Processos', count: cases.length, ref: casesInputRef, exportFn: () => downloadCSV(generateCasesCSV(cases), 'processos.csv') },
                                { label: 'Contatos', count: clients.length, ref: clientsInputRef, exportFn: () => downloadCSV(generateContactsCSV(clients), 'contatos.csv') },
                                { label: 'Prazos', count: deadlines.length, ref: deadlinesInputRef, exportFn: () => downloadCSV(generateDeadlinesCSV(deadlines, cases), 'prazos.csv') },
                                { label: 'Equipe', count: teamMembers.length, ref: teamInputRef, exportFn: () => downloadCSV(generateTeamCSV(teamMembers), 'equipe.csv') },
                                { label: 'Feriados', count: holidays.length, ref: holidayInputRef, exportFn: () => downloadCSV(generateHolidaysCSV(holidays), 'feriados.csv') },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</span>
                                        <span className="text-xs text-slate-500">{item.count} registros</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => item.ref.current?.click()}
                                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                            title="Importar"
                                        >
                                            <Upload size={18} />
                                        </button>
                                        <button
                                            onClick={item.exportFn}
                                            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                            title="Exportar"
                                        >
                                            <Download size={18} />
                                        </button>
                                        {item.label === 'Feriados' && (
                                            <button
                                                onClick={resetHolidays}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                title="Restaurar Feriados Padrão"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 flex flex-col gap-3">
                                <button
                                    onClick={syncData}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Shield size={20} />
                                    )}
                                    Sincronizar Tudo com Supabase
                                </button>
                                <button
                                    onClick={handleBackupAll}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-dark-700 transition-all"
                                >
                                    <Download size={20} /> Exportar Backup Completo (ZIP/CSV)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Activity History - Admin Only */}
                    {currentUser?.isAdmin && (
                        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Clock size={20} className="text-primary-600" /> Histórico de Atividades
                                </span>
                                <button
                                    onClick={clearActivityLogs}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                                >
                                    <Trash2 size={14} /> Limpar Tudo
                                </button>
                            </h3>

                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filtrar por usuário..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm transition-focus outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        value={logFilter.user}
                                        onChange={e => setLogFilter({ ...logFilter, user: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm transition-focus outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        value={logFilter.date}
                                        onChange={e => setLogFilter({ ...logFilter, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.slice(0, 50).map(log => {
                                        const getLogDetailString = () => {
                                            try {
                                                if (!log.details) return '';

                                                if (log.tableName === 'cases') {
                                                    const title = log.details.title || '';
                                                    const number = log.details.number || '';
                                                    return `${title}${number ? ` (${number})` : ''}`;
                                                }
                                                if (log.tableName === 'clients') {
                                                    return `${log.details.name || log.details.trade_name || 'Desconhecido'}`;
                                                }
                                                if (log.tableName === 'deadlines') {
                                                    const title = log.details.title || '';
                                                    const caseTitle = log.details.case_title || '';
                                                    return `${title}${caseTitle ? ` em ${caseTitle}` : ''}`;
                                                }
                                                return '';
                                            } catch {
                                                return '';
                                            }
                                        };
                                        const detailStr = getLogDetailString();

                                        return (
                                            <div key={log.id} className="flex gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    {log.userName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {log.userName}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-1 items-center">
                                                        <span className={`font-bold ${log.action === 'INSERT' ? 'text-emerald-600' :
                                                            log.action === 'UPDATE' ? 'text-blue-600' : 'text-rose-600'
                                                            }`}>
                                                            {log.action === 'INSERT' ? 'Criou' : log.action === 'UPDATE' ? 'Editou' : 'Excluiu'}
                                                        </span>
                                                        <span>
                                                            {log.tableName === 'cases' ? 'o processo' :
                                                                log.tableName === 'clients' ? 'o contato' :
                                                                    log.tableName === 'deadlines' ? 'o prazo' : log.tableName}
                                                        </span>
                                                        {detailStr && (
                                                            <span className="font-medium text-slate-800 dark:text-slate-200">
                                                                "{detailStr}"
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-slate-500">Nenhuma atividade encontrada.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

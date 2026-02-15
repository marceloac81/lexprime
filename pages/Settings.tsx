import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../context/Store';
import { Download, Moon, Sun, Trash2, User, UserCheck, Shield, Bell, ChevronRight, CheckCircle2, AlertCircle, Upload, CalendarIcon, RotateCcw } from '../components/Icons';
import { Holiday, Case, Client, Deadline, TeamMember } from '../types';
import {
    generateContactsCSV, generateCasesCSV, generateDeadlinesCSV, generateTeamCSV, generateHolidaysCSV, downloadCSV,
    parseContactsCSV, parseCasesCSV, parseDeadlinesCSV, parseTeamCSV, parseHolidaysCSV
} from '../utils/importHelpers';

export const Settings: React.FC = () => {
    const {
        isDarkMode, toggleTheme, currentUser, resetHolidays,
        holidays, importHolidays, addNotification, clients, importClients, cases, importCases,
        deadlines, importDeadlines, teamMembers, importTeamMembers,
        syncData, isLoading
    } = useStore();
    const clientsInputRef = useRef<HTMLInputElement>(null);
    const casesInputRef = useRef<HTMLInputElement>(null);
    const deadlinesInputRef = useRef<HTMLInputElement>(null);
    const teamInputRef = useRef<HTMLInputElement>(null);
    const holidayInputRef = useRef<HTMLInputElement>(null);

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
                                    holidays.length;
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
        <div className="p-8 h-full animate-fade-in max-w-3xl mx-auto overflow-y-auto custom-scrollbar">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Configurações</h1>

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
                            {isDarkMode ? <Moon className="text-purple-500" /> : <Sun className="text-orange-500" />}
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Tema Escuro</p>
                                <p className="text-xs text-slate-500">Ajuste para ambientes com pouca luz</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-primary-600' : 'bg-slate-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
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
            </div>
        </div>
    );
};

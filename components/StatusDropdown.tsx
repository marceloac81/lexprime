
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, X, Loader2, ChevronDown } from './Icons';

export type Status = 'Pending' | 'Done' | 'Canceled';

interface StatusDropdownProps {
    id: string;
    currentStatus: Status;
    onUpdate: (id: string, status: Status) => void;
}

// 2. Hook de Mutação Simulado
const useUpdateStatus = (onUpdate: (id: string, status: Status) => void) => {
    const [isPending, setIsPending] = useState(false);

    const mutate = (id: string, status: Status) => {
        setIsPending(true);
        // Simula delay de rede/API
        setTimeout(() => {
            onUpdate(id, status);
            setIsPending(false);
            console.log(`Status atualizado para: ${status}`); // onSuccess simulation
        }, 500);
    };

    return { mutate, isPending };
};

// 3. Componente StatusDropdown
export const StatusDropdown: React.FC<StatusDropdownProps> = ({ id, currentStatus, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { mutate, isPending } = useUpdateStatus(onUpdate);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fecha ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (status: Status) => {
        if (status !== currentStatus) {
            mutate(id, status);
        }
        setIsOpen(false);
    };

    const getStatusConfig = (s: Status) => {
        switch(s) {
            case 'Done': 
                return { 
                    label: 'Concluído', 
                    icon: CheckCircle2, 
                    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
                    iconColor: 'text-blue-600'
                };
            case 'Canceled': 
                return { 
                    label: 'Cancelado', 
                    icon: X, 
                    color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
                    iconColor: 'text-rose-600'
                };
            default: 
                return { 
                    label: 'Pendente', 
                    icon: AlertCircle, 
                    color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
                    iconColor: 'text-amber-600'
                };
        }
    };

    const currentConfig = getStatusConfig(currentStatus);
    const CurrentIcon = currentConfig.icon;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm whitespace-nowrap outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400
                    ${currentConfig.color} ${isPending ? 'opacity-70 cursor-wait' : 'active:scale-95'}
                `}
            >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <CurrentIcon size={14} />}
                {currentConfig.label}
                {!isPending && <ChevronDown size={12} className="opacity-50 ml-0.5" />}
            </button>

            {isOpen && (
                <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-fade-in overflow-hidden"
                >
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {(['Pending', 'Done', 'Canceled'] as Status[]).map((status) => {
                            const config = getStatusConfig(status);
                            const Icon = config.icon;
                            const isSelected = currentStatus === status;
                            
                            return (
                                <button
                                    key={status}
                                    onClick={() => handleSelect(status)}
                                    className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors
                                        ${isSelected ? 'bg-slate-100 dark:bg-dark-700' : 'hover:bg-slate-50 dark:hover:bg-dark-700/50'}
                                        ${config.iconColor}
                                    `}
                                >
                                    <Icon size={14} />
                                    {config.label}
                                    {isSelected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

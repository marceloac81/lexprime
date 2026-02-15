
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const { mutate, isPending } = useUpdateStatus(onUpdate);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Atualiza coordenadas ao abrir
    useLayoutEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + rect.width / 2 + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Fecha ao clicar fora ou dar scroll
    useEffect(() => {
        const handleEvents = (event: Event) => {
            const target = event.target as Node;
            const clickedInsideTrigger = dropdownRef.current?.contains(target);
            const clickedInsideMenu = menuRef.current?.contains(target);

            if (!clickedInsideTrigger && !clickedInsideMenu) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleEvents);
            window.addEventListener('scroll', handleEvents, true);
            window.addEventListener('resize', () => setIsOpen(false));
        }

        return () => {
            document.removeEventListener('mousedown', handleEvents);
            window.removeEventListener('scroll', handleEvents, true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    const handleSelect = (e: React.MouseEvent, status: Status) => {
        e.preventDefault();
        e.stopPropagation();
        if (status !== currentStatus) {
            mutate(id, status);
        }
        setIsOpen(false);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const getStatusConfig = (s: Status) => {
        switch (s) {
            case 'Done':
                return {
                    label: 'Concluído',
                    icon: CheckCircle2,
                    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
                    iconColor: 'text-blue-600 dark:text-blue-400'
                };
            case 'Canceled':
                return {
                    label: 'Cancelado',
                    icon: X,
                    color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
                    iconColor: 'text-rose-600 dark:text-rose-400'
                };
            default:
                return {
                    label: 'Pendente',
                    icon: AlertCircle,
                    color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
                    iconColor: 'text-amber-600 dark:text-amber-400'
                };
        }
    };

    const currentConfig = getStatusConfig(currentStatus);
    const CurrentIcon = currentConfig.icon;

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={handleToggle}
                disabled={isPending}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all shadow-sm whitespace-nowrap outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400
                    ${currentConfig.color} ${isPending ? 'opacity-70 cursor-wait' : 'active:scale-95'}
                `}
            >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <CurrentIcon size={14} />}
                {currentConfig.label}
                {!isPending && <ChevronDown size={12} className="opacity-50 ml-0.5" />}
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="absolute mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50 z-[9999] animate-fade-in overflow-hidden"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateX(-50%)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {(['Pending', 'Done', 'Canceled'] as Status[]).map((status) => {
                            const config = getStatusConfig(status);
                            const Icon = config.icon;
                            const isSelected = currentStatus === status;

                            return (
                                <button
                                    key={status}
                                    onClick={(e) => handleSelect(e, status)}
                                    className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors
                                        ${isSelected ? 'bg-slate-100 dark:bg-slate-700/60' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'}
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
                </div>,
                document.body
            )}
        </div>
    );
};

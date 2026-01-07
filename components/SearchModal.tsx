import React from 'react';
import { Search } from './Icons';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    setPage: (page: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, setPage }) => {
    if (!isOpen) return null;

    return (
        <div
            className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-32 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-dark-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                    <Search className="text-slate-400 mr-3" size={24} />
                    <input
                        autoFocus
                        placeholder="Buscar processos, clientes, prazos..."
                        className="flex-1 bg-transparent outline-none text-lg text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 hidden md:inline">ESC</span>
                </div>
                <div className="p-2">
                    <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Navegação Rápida</div>
                    <button onClick={() => { setPage('cases'); onClose(); }} className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Ir para Processos
                    </button>
                    <button onClick={() => { setPage('deadlines'); onClose(); }} className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Calculadora de Prazos
                    </button>
                    <button onClick={() => { setPage('clients'); onClose(); }} className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Novo Cliente
                    </button>
                </div>
            </div>
        </div>
    );
};

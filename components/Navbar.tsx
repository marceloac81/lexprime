import React from 'react';
import { Menu } from './Icons';
import { useStore } from '../context/Store';

interface NavbarProps {
    onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    const { theme } = useStore();
    return (
        <div className={`md:hidden fixed top-0 left-0 right-0 h-16 border-b px-4 flex items-center justify-between z-[100] no-print transition-colors ${theme === 'hybrid'
            ? 'bg-[#111b21] border-[#202c33]'
            : (theme === 'sober' ? 'bg-slate-200 border-slate-300' : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-slate-800')
            }`}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${theme === 'hybrid' ? 'bg-[#00a884]' : 'bg-primary-600'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                </div>
                <span className={`font-bold text-lg ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>LexPrime</span>
            </div>
            <button onClick={onMenuClick} className={`p-2 rounded-lg ${theme === 'hybrid' ? 'text-[#e9edef] hover:bg-[#202c33]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800'}`}>
                <Menu size={24} />
            </button>
        </div>
    );
};

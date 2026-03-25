
import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Briefcase, Clock, CalendarIcon, Users,
  Settings, LogOut, Moon, Sun, X, User, ChevronLeft, ChevronRight, FileText, Calculator,
  Check, ChevronUp
} from './Icons';
import { useStore } from '../context/Store';
import { getInitials } from '../utils/textUtils';
import { getAvatarColorStyles } from '../utils/styleUtils';

interface SidebarProps {
  activePage: string;
  setPage: (page: string) => void;
  isOpen: boolean;
  close: () => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}

const NavItem = ({ page, icon: Icon, label, active, onClick, count, collapsed, theme }: any) => (
  <button
    onClick={() => onClick(page)}
    title={collapsed ? label : ''}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${active
      ? (theme === 'hybrid'
        ? 'bg-[#202c33] text-[#00a884] font-semibold'
        : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold')
      : (theme === 'hybrid'
        ? 'text-[#e9edef] hover:bg-[#202c33] hover:text-[#00a884]'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white')
      } ${collapsed ? 'justify-center' : ''}`}
  >
    <Icon size={20} className={`transition-colors flex-shrink-0 ${active
      ? (theme === 'hybrid'
        ? 'text-[#00a884]'
        : 'text-primary-600 dark:text-primary-400')
      : (theme === 'hybrid'
        ? 'text-[#8696a0] group-hover:text-[#00a884]'
        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white')}`} />

    {!collapsed && <span>{label}</span>}

    {/* Badge Logic */}
    {count && count > 0 ? (
      <div className={`
            ${collapsed ? 'absolute top-2 right-2 px-1 py-0.5 min-w-[14px] h-3.5 flex items-center justify-center text-[9px]' : 'ml-auto px-1.5 py-0.5 text-[10px]'}
            rounded-md bg-rose-500 text-white font-bold shadow-sm animate-fade-in
        `}>
        {count}
      </div>
    ) : active ? (
      <div className={`
            rounded-full bg-primary-600 dark:bg-primary-400 shadow-[0_0_8px_rgba(37,99,235,0.5)]
            ${collapsed ? 'absolute top-3 right-3 w-1.5 h-1.5' : 'ml-auto w-1.5 h-1.5'}
        `} />
    ) : null}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, isOpen, close, collapsed, toggleCollapse }) => {
  const { logout, theme, setTheme, currentUser, deadlines, appointments } = useStore();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: '☀' },
    { value: 'hybrid', label: 'Dark Verde', icon: '💬' }
  ];

  const currentThemeLabel = themeOptions.find(opt => opt.value === theme)?.label || 'Claro';

  // Handle click outside to close theme menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (page: string) => {
    setPage(page);
    close(); // Close sidebar on mobile when item clicked
  };

  // Calculate badges
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const pendingDeadlinesToday = deadlines.filter(d => d.dueDate === today && (!d.status || d.status === 'Pending') && !d.isDone).length;
  const todayAppointments = appointments.filter(a => a.date && a.date.startsWith(today)).length;
  const agendaBadgeCount = pendingDeadlinesToday + todayAppointments;

  // Wait, looking at NavItem props:
  // <NavItem ... page="deadlines" ... count={pendingDeadlinesToday} />
  // <NavItem ... page="calendario" ... count={agendaBadgeCount} />

  // The original code had: const agendaBadgeCount = pendingDeadlinesToday + todayAppointments;
  // This implies Agenda badge shows BOTH deadlines and appointments? 
  // If the user said "badge number stopped working", maybe they want them separated?
  // Usually Agenda shows everything. But let's check NavItem usage in previous file view.
  // Line 108: page="deadlines" count={pendingDeadlinesToday}
  // Line 109: page="calendario" count={agendaBadgeCount}

  // If I look at the code I read:
  // agendaBadgeCount = pendingDeadlinesToday + todayAppointments;

  // I will make the deadline check more robust as planned.

  return (
    <aside className={`
        fixed inset-y-0 left-0 z-[120] 
        ${theme === 'hybrid'
        ? 'bg-[#111b21] border-[#202c33]'
        : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-slate-800'
      }
        border-r 
        flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
        md:relative md:translate-x-0 no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'w-20' : 'w-64'}
    `}>
      <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-2 relative`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`
                w-10 h-10 flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-800 
                rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 text-white transition-all
                ${collapsed ? 'mx-auto' : ''}
            `}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <span className={`font-bold text-xl tracking-tight block leading-tight ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>LexPrime</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-400'}`}>Advocacia</span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button onClick={close} className="md:hidden p-2 text-slate-400 hover:text-slate-600 absolute right-4">
          <X size={24} />
        </button>
      </div>

      {/* Desktop Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className={`hidden md:flex absolute -right-3 top-9 z-50 w-6 h-6 border rounded-full items-center justify-center transition-colors shadow-sm ${theme === 'hybrid'
          ? 'bg-[#202c33] border-[#111b21] text-[#8696a0] hover:text-[#e9edef]'
          : 'bg-slate-100 dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white'
          }`}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>


      <nav className={`flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden ${collapsed ? 'items-center flex flex-col' : ''}`}>
        <NavItem collapsed={collapsed} theme={theme} page="dashboard" icon={LayoutDashboard} label="Dashboard" active={activePage === 'dashboard'} onClick={handleNavClick} />
        <NavItem collapsed={collapsed} theme={theme} page="deadlines" icon={Clock} label="Prazos" active={activePage === 'deadlines'} onClick={handleNavClick} count={pendingDeadlinesToday} />
        <NavItem collapsed={collapsed} theme={theme} page="calendario" icon={CalendarIcon} label="Calendário" active={activePage === 'calendario'} onClick={handleNavClick} count={agendaBadgeCount} />
        <NavItem collapsed={collapsed} theme={theme} page="cases" icon={Briefcase} label="Processos" active={activePage === 'cases'} onClick={handleNavClick} />
        <NavItem collapsed={collapsed} theme={theme} page="clients" icon={Users} label="Contatos" active={activePage === 'clients'} onClick={handleNavClick} />
        <NavItem collapsed={collapsed} theme={theme} page="publications" icon={FileText} label="Publicações" active={activePage === 'publications'} onClick={handleNavClick} />
        <NavItem collapsed={collapsed} theme={theme} page="calculations" icon={Calculator} label="Cálculos" active={activePage === 'calculations'} onClick={handleNavClick} />

        {collapsed && <div className={`my-4 h-px w-full ${theme === 'hybrid' ? 'bg-[#202c33]' : 'bg-slate-200 dark:bg-slate-800'}`} />}

        <NavItem collapsed={collapsed} theme={theme} page="team" icon={User} label="Equipe" active={activePage === 'team'} onClick={handleNavClick} />
        {currentUser?.isAdmin && (
          <NavItem collapsed={collapsed} theme={theme} page="settings" icon={Settings} label="Configurações" active={activePage === 'settings'} onClick={handleNavClick} />
        )}
      </nav>

      <div className={`p-4 border-t ${theme === 'hybrid' ? 'border-[#202c33]' : 'border-slate-200 dark:border-slate-800'} space-y-3 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`rounded-xl p-3 flex items-center gap-3 border ${collapsed ? 'justify-center p-2' : ''} ${theme === 'hybrid'
          ? 'bg-[#202c33] border-[#202c33]'
          : 'bg-slate-50 dark:bg-dark-800 border-slate-100 dark:border-slate-700'
          }`}>
          <div className={`w-10 h-10 flex-shrink-0 rounded-full ${getAvatarColorStyles(currentUser?.avatarColor || 'blue')} border border-opacity-30 flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden`}>
            {currentUser?.photo ? (
              <img src={currentUser.photo} className="w-full h-full object-cover" alt={currentUser.name} />
            ) : (
              getInitials(currentUser?.name || '', currentUser?.initials)
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold break-words leading-tight ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>{currentUser?.name}</p>
              <p className={`text-xs truncate ${theme === 'hybrid' ? 'text-[#8696a0]' : 'text-slate-500'}`}>{currentUser?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className={`p-1.5 rounded-lg transition-colors shadow-sm ${theme === 'hybrid' ? 'text-[#8696a0] hover:text-rose-500 hover:bg-[#111b21]' : 'text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-dark-700'}`}>
              <LogOut size={18} />
            </button>
          )}
        </div>
        {/* Modern Segmented Theme Switcher */}
        <div className={`mt-4 p-1 rounded-[14px] flex transition-all relative ${collapsed ? 'flex-col gap-1.5 items-center' : 'w-full gap-1'} 
          ${theme === 'hybrid' 
            ? 'bg-[#1c272e] shadow-inner shadow-black/20' 
            : 'bg-slate-100/80 dark:bg-dark-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-inner'
          }`}>
          
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[11px] text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative z-10
              ${collapsed ? 'w-10 h-10 p-0' : 'flex-1'}
              ${theme === 'light' 
                ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-primary-600 scale-[1.02]' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
            title="Tema Claro"
          >
            <Sun size={collapsed ? 20 : 14} className={theme === 'light' ? 'animate-pulse-subtle' : ''} />
            {!collapsed && <span>Claro</span>}
          </button>
          
          <button
            onClick={() => setTheme('hybrid')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-[11px] text-[10px] font-bold uppercase tracking-wider transition-all duration-300 relative z-10
              ${collapsed ? 'w-10 h-10 p-0' : 'flex-1'}
              ${theme === 'hybrid' 
                ? 'bg-[#00a884] shadow-[0_2px_12px_rgba(0,168,132,0.3)] text-white scale-[1.02]' 
                : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5'}`}
            title="Tema Escuro"
          >
            <Moon size={collapsed ? 20 : 14} className={theme === 'hybrid' ? 'animate-float-subtle' : ''} />
            {!collapsed && <span>Escuro</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

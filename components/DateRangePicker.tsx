import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore } from '../context/Store';

interface DateRangePickerProps {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    onChange: (start: string, end: string) => void;
    label?: string;
    disabled?: boolean;
}

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatDisplay(start: string, end: string): string {
    if (!start) return '';
    const fmt = (d: string) => {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };
    if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return fmt(start);
    return '';
}

function toYMD(date: Date): string {
    return date.toISOString().split('T')[0];
}

function startOfMonth(year: number, month: number): Date {
    return new Date(year, month, 1);
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    startDate, endDate, onChange, disabled
}) => {
    const { theme } = useStore();
    const isHybrid = theme === 'hybrid';

    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);

    // Temp values while calendar is open (only commit on "Selecionar")
    const [tempStart, setTempStart] = useState(startDate);
    const [tempEnd, setTempEnd] = useState(endDate);
    const [selecting, setSelecting] = useState<'start' | 'end'>('start');

    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const containerRef = useRef<HTMLDivElement>(null);

    // Sync temp state when external values change (e.g., on load from localStorage)
    useEffect(() => {
        setTempStart(startDate);
        setTempEnd(endDate);
    }, [startDate, endDate]);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openCalendar = () => {
        if (disabled) return;
        setTempStart(startDate);
        setTempEnd(endDate);
        setSelecting('start');
        // Navigate to start date month if it exists
        if (startDate) {
            const d = new Date(startDate + 'T00:00:00');
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
        } else {
            setViewYear(today.getFullYear());
            setViewMonth(today.getMonth());
        }
        setOpen(true);
    };

    const handleDayClick = (ymd: string) => {
        if (selecting === 'start') {
            setTempStart(ymd);
            setTempEnd('');
            setSelecting('end');
        } else {
            if (ymd < tempStart) {
                // Clicked before start → swap
                setTempEnd(tempStart);
                setTempStart(ymd);
            } else {
                setTempEnd(ymd);
            }
            setSelecting('start');
        }
    };

    const handleConfirm = () => {
        const s = tempStart;
        const e = tempEnd || tempStart;
        onChange(s, e);
        setOpen(false);
    };

    const handleCancel = () => {
        setTempStart(startDate);
        setTempEnd(endDate);
        setOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
        else setViewMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
        else setViewMonth(m => m + 1);
    };

    // Build calendar grid
    const firstDay = startOfMonth(viewYear, viewMonth).getDay(); // 0=Sun
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const dd = String(d).padStart(2, '0');
        const mm = String(viewMonth + 1).padStart(2, '0');
        cells.push(`${viewYear}-${mm}-${dd}`);
    }

    const rangeStart = tempStart;
    const rangeEnd = tempEnd || hovered || tempStart;
    const rangeMin = rangeStart < rangeEnd ? rangeStart : rangeEnd;
    const rangeMax = rangeStart < rangeEnd ? rangeEnd : rangeStart;

    // Styling helpers
    const bg = isHybrid
        ? 'bg-[#2a3942] border-[#354751] text-[#e9edef] shadow-black/40' 
        : 'bg-white border-slate-200 text-slate-800';
    const inputBg = isHybrid
        ? 'bg-transparent text-[#e9edef]'
        : 'bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-100 placeholder:text-slate-400';
    const headerText = isHybrid ? 'text-[#aebac1]' : 'text-slate-600';
    const dayHover = isHybrid ? 'hover:bg-[#354751]' : 'hover:bg-primary-50';
    const todayRing = isHybrid ? 'ring-1 ring-[#00a884]' : 'ring-1 ring-primary-500';
    const activeDay = isHybrid ? 'bg-[#00a884] text-white' : 'bg-primary-600 text-white';
    const inRange = isHybrid ? 'bg-[#354751]/60 text-[#e9edef]' : 'bg-primary-100 text-primary-800';

    const todayYMD = toYMD(today);

    return (
        <div className="relative" ref={containerRef}>
            {/* Input Field */}
            <div
                className={`relative flex items-center gap-2 px-3 rounded-xl border cursor-pointer transition-all group h-[46px]
                    ${inputBg}
                    ${open
                        ? (isHybrid ? 'border-[#00a884] ring-2 ring-[#00a884]/20' : 'border-primary-500 ring-2 ring-primary-500/20')
                        : (isHybrid ? 'border-[#354751] hover:border-[#8696a0]' : 'border-slate-200 hover:border-slate-400')
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={openCalendar}
            >
                <CalendarDays
                    size={16}
                    className={isHybrid
                        ? (open ? 'text-[#00a884]' : 'text-[#8696a0]')
                        : (open ? 'text-primary-500' : 'text-slate-400')}
                />
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-none ${startDate ? (isHybrid ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white') : (isHybrid ? 'text-[#8696a0]' : 'text-slate-400')}`}>
                        {startDate ? formatDisplay(startDate, endDate) : 'Selecionar período...'}
                    </p>
                </div>
                {(startDate || endDate) && (
                    <button
                        onClick={e => { e.stopPropagation(); onChange('', ''); }}
                        className={`p-1 rounded-md transition-colors ${isHybrid ? 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#354751]' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Calendar Popover */}
            {open && (
                <div className={`absolute top-full left-0 mt-2 z-[200] w-[300px] rounded-2xl border shadow-2xl overflow-hidden animate-scale-in ${bg}`}>

                    {/* Month Navigation */}
                    <div className={`flex items-center justify-between px-4 pt-4 pb-2 ${isHybrid ? 'border-[#354751]' : 'border-slate-100'}`}>
                        <button
                            onClick={prevMonth}
                            className={`p-1.5 rounded-lg transition-colors ${isHybrid ? 'hover:bg-[#354751] text-[#aebac1]' : 'hover:bg-slate-100 text-slate-500'}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className={`text-sm font-bold uppercase tracking-wide ${isHybrid ? 'text-[#e9edef]' : 'text-slate-800'}`}>
                            {MONTHS_PT[viewMonth].slice(0, 3).toUpperCase()}. {viewYear}
                        </span>
                        <button
                            onClick={nextMonth}
                            className={`p-1.5 rounded-lg transition-colors ${isHybrid ? 'hover:bg-[#354751] text-[#aebac1]' : 'hover:bg-slate-100 text-slate-500'}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day of Week Headers */}
                    <div className="grid grid-cols-7 px-3 pb-1">
                        {DAYS_PT.map((d, i) => (
                            <div key={i} className={`text-center text-[10px] font-bold py-1 ${headerText}`}>{d}</div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                        {cells.map((ymd, i) => {
                            if (!ymd) return <div key={i} />;
                            const isToday = ymd === todayYMD;
                            const isStart = ymd === rangeStart;
                            const isEnd = ymd === (tempEnd || (selecting === 'end' ? hovered : ''));
                            const isActive = ymd === rangeStart || ymd === (tempEnd);
                            const isInRange = ymd > rangeMin && ymd < rangeMax;
                            const day = parseInt(ymd.split('-')[2]);

                            return (
                                <button
                                    key={ymd}
                                    onClick={() => handleDayClick(ymd)}
                                    onMouseEnter={() => selecting === 'end' && setHovered(ymd)}
                                    onMouseLeave={() => setHovered(null)}
                                    className={`relative text-xs font-medium h-8 w-full flex items-center justify-center transition-all duration-150 rounded-full
                                        ${isActive ? activeDay : isInRange ? inRange : dayHover}
                                        ${isToday && !isActive ? todayRing : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Hint */}
                    <div className={`text-center text-[10px] pb-2 ${isHybrid ? 'text-[#8696a0]' : 'text-slate-400'}`}>
                        {selecting === 'start' ? 'Clique para selecionar início' : 'Clique para selecionar fim'}
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t ${isHybrid ? 'border-[#354751]' : 'border-slate-100'}`}>
                        <button
                            onClick={handleCancel}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isHybrid ? 'text-[#aebac1] hover:bg-[#354751]' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!tempStart}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40
                                ${isHybrid
                                    ? 'bg-[#00a884] text-white hover:bg-[#00a884]/80'
                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                                }`}
                        >
                            Selecionar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

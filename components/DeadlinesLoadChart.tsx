import React, { useEffect, useRef, useState } from 'react';

export interface DeadlineDayDatum {
  dateKey: string; // YYYY-MM-DD
  dayNum: string;  // DD
  monthNum: string; // MM
  weekdayShort: string; // Seg, Ter...
  isToday: boolean;
  isWeekend: boolean;
  count: number;
}

interface DeadlinesLoadChartProps {
  days: DeadlineDayDatum[];
  theme: 'light' | 'hybrid';
  onNavigate?: () => void;
}

const BAR_DURATION = 750;
const BAR_STAGGER = 35;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PALETTE = {
  light: {
    textMain: 'text-slate-900',
    textMuted: 'text-slate-400',
    textSub: 'text-slate-500',
    grid: 'border-slate-200/70',
    track: 'bg-slate-100/90',
    barNormalFrom: '#60a5fa',
    barNormalTo: '#2563eb',
    barTodayFrom: '#fbbf24',
    barTodayTo: '#d97706',
    barPeakFrom: '#f43f5e',
    barPeakTo: '#e11d48',
    barEmpty: '#e2e8f0',
    footer: 'text-slate-500',
    footerStrong: 'text-slate-800',
    focusRing: 'focus-visible:ring-blue-500/40',
  },
  hybrid: {
    textMain: 'text-[#e9edef]',
    textMuted: 'text-[#8696a0]',
    textSub: 'text-[#aebac1]',
    grid: 'border-[#354751]/70',
    track: 'bg-[#202c33]',
    barNormalFrom: '#34d399',
    barNormalTo: '#00a884',
    barTodayFrom: '#fbbf24',
    barTodayTo: '#d97706',
    barPeakFrom: '#fb7185',
    barPeakTo: '#e11d48',
    barEmpty: '#354751',
    footer: 'text-[#aebac1]',
    footerStrong: 'text-[#e9edef]',
    focusRing: 'focus-visible:ring-[#00a884]/50',
  },
} as const;

export const DeadlinesLoadChart: React.FC<DeadlinesLoadChartProps> = ({ days, theme, onNavigate }) => {
  const pal = PALETTE[theme === 'hybrid' ? 'hybrid' : 'light'];
  const totalInWindow = days.reduce((sum, d) => sum + d.count, 0);
  const maxCount = days.reduce((m, d) => Math.max(m, d.count), 0);
  const peakDay = maxCount > 0 ? days.find(d => d.count === maxCount) : null;
  const fullDuration = BAR_DURATION + Math.max(0, days.length - 1) * BAR_STAGGER;

  const [elapsed, setElapsed] = useState(() => (prefersReducedMotion() ? Number.POSITIVE_INFINITY : 0));
  const animationDone = useRef(false);

  useEffect(() => {
    if (animationDone.current || days.length === 0) return;
    if (prefersReducedMotion()) {
      animationDone.current = true;
      setElapsed(Number.POSITIVE_INFINITY);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const e = now - start;
      setElapsed(e);
      if (e < fullDuration) {
        frame = requestAnimationFrame(step);
      } else {
        animationDone.current = true;
        setElapsed(Number.POSITIVE_INFINITY);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [days.length, fullDuration]);

  const barProgress = (index: number) =>
    easeOutQuart(clamp01((elapsed - index * BAR_STAGGER) / BAR_DURATION));

  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredDay = hovered !== null ? days[hovered] : null;

  return (
    <div className="flex flex-col gap-3 w-full" onMouseLeave={() => setHovered(null)}>
      {/* Vertical bars area */}
      <div
        className="relative pt-4 pb-1"
        role="img"
        aria-label={`Carga de prazos nos próximos 14 dias: ${totalInWindow} prazos no total.${
          peakDay ? ` Dia mais cheio: ${peakDay.weekdayShort}, ${peakDay.dayNum}/${peakDay.monthNum} com ${peakDay.count} prazos.` : ''
        }`}
      >
        {/* Subtle horizontal reference lines */}
        <div className="absolute inset-x-0 top-4 bottom-6 pointer-events-none flex flex-col justify-between" aria-hidden="true">
          <div className={`border-t border-dashed ${pal.grid}`} />
          <div className={`border-t border-dashed ${pal.grid}`} />
          <div className={`border-t ${pal.grid}`} />
        </div>

        <div className="relative grid grid-cols-14 gap-1 items-end h-[116px]" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day, i) => {
            const p = barProgress(i);
            const heightPct = maxCount > 0 && day.count > 0 ? Math.max(16, (day.count / maxCount) * 100) * p : 0;
            const isHovered = hovered === i;
            const isDimmed = hovered !== null && !isHovered;
            const isPeak = maxCount >= 3 && day.count === maxCount && !day.isToday;

            const barGradient = day.isToday
              ? `linear-gradient(180deg, ${pal.barTodayFrom}, ${pal.barTodayTo})`
              : isPeak
                ? `linear-gradient(180deg, ${pal.barPeakFrom}, ${pal.barPeakTo})`
                : `linear-gradient(180deg, ${pal.barNormalFrom}, ${pal.barNormalTo})`;

            return (
              <button
                key={day.dateKey}
                type="button"
                onMouseEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                onClick={onNavigate}
                title={`${day.weekdayShort}, ${day.dayNum}/${day.monthNum}: ${day.count} ${day.count === 1 ? 'prazo' : 'prazos'}`}
                aria-label={`${day.weekdayShort}, ${day.dayNum}/${day.monthNum}: ${day.count} ${day.count === 1 ? 'prazo' : 'prazos'}`}
                className={`h-full flex flex-col items-center justify-end gap-1 rounded focus:outline-none focus-visible:ring-2 transition-opacity duration-150 ${pal.focusRing}`}
                style={{ opacity: isDimmed ? 0.38 : 1 }}
              >
                {/* Count above bar */}
                <span
                  className={`text-[9.5px] font-bold leading-none tabular-nums h-3 flex items-center ${
                    day.count > 0
                      ? (day.isToday ? 'text-amber-500' : isPeak ? 'text-rose-500' : pal.textMain)
                      : 'opacity-0'
                  }`}
                >
                  {day.count > 0 ? day.count : ''}
                </span>

                {/* Bar column */}
                <div className="w-full flex-1 flex items-end justify-center px-[1px]">
                  {day.count > 0 ? (
                    <div
                      className="w-full max-w-[14px] rounded-t-full rounded-b-[2px] relative overflow-hidden transition-transform duration-150"
                      style={{
                        height: `${heightPct}%`,
                        background: barGradient,
                        transform: isHovered ? 'scaleY(1.04)' : undefined,
                        transformOrigin: 'bottom',
                      }}
                    >
                      <span className="absolute inset-y-0 left-0 w-1/3 bg-white/20" />
                    </div>
                  ) : (
                    <div
                      className="w-full max-w-[10px] h-[3px] rounded-full opacity-60"
                      style={{ backgroundColor: pal.barEmpty }}
                    />
                  )}
                </div>

                {/* Day number label */}
                <span
                  className={`text-[9.5px] leading-none tabular-nums ${
                    day.isToday
                      ? 'font-extrabold text-amber-500'
                      : day.isWeekend
                        ? `font-medium opacity-55 ${pal.textMuted}`
                        : `font-semibold ${pal.textSub}`
                  }`}
                >
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Insight footer */}
      <div className={`flex items-center justify-between gap-2 pt-2 border-t text-[11px] ${pal.grid} ${pal.footer}`}>
        {hoveredDay ? (
          <>
            <span className="font-bold truncate">
              <span className={pal.footerStrong}>
                {hoveredDay.isToday ? 'Hoje' : hoveredDay.weekdayShort}, {hoveredDay.dayNum}/{hoveredDay.monthNum}
              </span>
            </span>
            <span className="tabular-nums shrink-0">
              <strong className={pal.footerStrong}>{hoveredDay.count}</strong> {hoveredDay.count === 1 ? 'prazo' : 'prazos'}
            </span>
          </>
        ) : peakDay ? (
          <>
            <span className="truncate">
              Pico: <strong className={pal.footerStrong}>{peakDay.weekdayShort}, {peakDay.dayNum}/{peakDay.monthNum}</strong> ({peakDay.count})
            </span>
            <span className="tabular-nums shrink-0">
              <strong className={pal.footerStrong}>{totalInWindow}</strong> em 14 dias
            </span>
          </>
        ) : (
          <span className="truncate">Nenhum prazo previsto nos próximos 14 dias.</span>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';

export interface AreaDatum {
  name: string;
  value: number;
  color: string;
}

interface AreaBarsProps {
  areas: AreaDatum[];
  total: number;
  theme: 'light' | 'hybrid';
  onNavigate?: () => void;
}

const ROW_DURATION = 900;
const ROW_STAGGER = 60;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const formatPct = (pct: number) => {
  if (pct > 0 && pct < 1) return '<1%';
  return `${Math.round(pct)}%`;
};

const PALETTE = {
  light: {
    textMain: 'text-slate-900',
    textLabel: 'text-slate-600',
    textMuted: 'text-slate-400',
    track: 'bg-slate-100',
    grid: 'border-slate-200/70',
    rowHover: 'bg-slate-50',
    rank: 'bg-slate-100 text-slate-500',
    rankLeader: 'text-white',
    stackTrack: 'bg-slate-100',
    stackGap: '#ffffff',
    footer: 'text-slate-500',
    footerStrong: 'text-slate-800',
    focusRing: 'focus-visible:ring-blue-500/40',
  },
  hybrid: {
    textMain: 'text-[#e9edef]',
    textLabel: 'text-[#d1d7db]',
    textMuted: 'text-[#8696a0]',
    track: 'bg-[#202c33]',
    grid: 'border-[#354751]/70',
    rowHover: 'bg-[#202c33]/70',
    rank: 'bg-[#202c33] text-[#aebac1]',
    rankLeader: 'text-[#111b21]',
    stackTrack: 'bg-[#202c33]',
    stackGap: '#2a3942',
    footer: 'text-[#aebac1]',
    footerStrong: 'text-[#e9edef]',
    focusRing: 'focus-visible:ring-[#00a884]/50',
  },
} as const;

export const AreaBars: React.FC<AreaBarsProps> = ({ areas, total, theme, onNavigate }) => {
  const pal = PALETTE[theme === 'hybrid' ? 'hybrid' : 'light'];
  const safeTotal = total > 0 ? total : 1;
  const maxValue = areas.reduce((m, a) => Math.max(m, a.value), 0) || 1;
  const hasData = areas.length > 0;
  const fullDuration = ROW_DURATION + Math.max(0, areas.length - 1) * ROW_STAGGER;

  // One-shot staggered reveal. Guarded only on completion so StrictMode remounts don't freeze it.
  const [elapsed, setElapsed] = useState(() => (prefersReducedMotion() ? Number.POSITIVE_INFINITY : 0));
  const animationDone = useRef(false);

  useEffect(() => {
    if (animationDone.current || !hasData) return;
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
  }, [hasData, fullDuration]);

  const rowProgress = (index: number) =>
    easeOutQuart(clamp01((elapsed - index * ROW_STAGGER) / ROW_DURATION));
  const overallProgress = easeOutQuart(clamp01(elapsed / fullDuration));

  const [hovered, setHovered] = useState<number | null>(null);

  const top3Share = (areas.slice(0, 3).reduce((s, a) => s + a.value, 0) / safeTotal) * 100;
  const hoveredArea = hovered !== null ? areas[hovered] : null;

  if (!hasData) {
    return (
      <div className={`h-52 flex items-center justify-center text-xs ${pal.textMuted}`}>Sem dados suficientes</div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full" onMouseLeave={() => setHovered(null)}>
      {/* Distribution strip: whole portfolio split by area */}
      <div
        className={`flex h-2 w-full rounded-full overflow-hidden ${pal.stackTrack}`}
        role="img"
        aria-label={`Distribuição dos processos por área: ${areas
          .map(a => `${a.name} ${a.value} (${formatPct((a.value / safeTotal) * 100)})`)
          .join(', ')}.`}
      >
        {areas.map((a, i) => {
          const share = (a.value / safeTotal) * 100;
          const isDimmed = hovered !== null && hovered !== i;
          return (
            <div
              key={a.name}
              className="h-full transition-opacity duration-200"
              onMouseEnter={() => setHovered(i)}
              style={{
                width: `${share * overallProgress}%`,
                background: a.color,
                opacity: isDimmed ? 0.3 : 1,
                boxShadow: i > 0 ? `inset 1.5px 0 0 ${pal.stackGap}` : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Ranked rows */}
      <div className="relative">
        {/* Subtle quarter grid behind the bars */}
        <div className="absolute inset-y-0 pointer-events-none" style={{ left: 112, right: 64 }} aria-hidden="true">
          {[25, 50, 75].map(q => (
            <div key={q} className={`absolute inset-y-0 border-l border-dashed ${pal.grid}`} style={{ left: `${q}%` }} />
          ))}
        </div>

        <ul className="relative flex flex-col gap-[3px]">
          {areas.map((a, i) => {
            const p = rowProgress(i);
            const share = (a.value / safeTotal) * 100;
            const widthPct = (a.value / maxValue) * 100 * p;
            const isLeader = i === 0;
            const isHovered = hovered === i;
            const isDimmed = hovered !== null && !isHovered;
            const shownValue = Math.round(a.value * p);

            return (
              <li key={a.name}>
                <button
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  onClick={onNavigate}
                  aria-label={`${i + 1}º ${a.name}: ${a.value} processos (${formatPct(share)})`}
                  className={`w-full grid items-center gap-2 rounded-md px-1 py-[3px] text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 ${pal.focusRing} ${
                    isHovered ? pal.rowHover : ''
                  }`}
                  style={{ gridTemplateColumns: '104px 1fr 56px', opacity: isDimmed ? 0.45 : 1 }}
                >
                  {/* Rank + name */}
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`shrink-0 w-4 h-4 rounded text-[9px] font-extrabold flex items-center justify-center tabular-nums ${
                        isLeader ? pal.rankLeader : pal.rank
                      }`}
                      style={isLeader ? { background: `linear-gradient(135deg, ${a.color}cc, ${a.color})` } : undefined}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`truncate text-[11px] ${isLeader || isHovered ? `font-bold ${pal.textMain}` : `font-semibold ${pal.textLabel}`}`}
                      title={a.name}
                    >
                      {a.name}
                    </span>
                  </span>

                  {/* Bar */}
                  <span className={`relative block h-[11px] rounded-full overflow-hidden ${pal.track}`}>
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${Math.max(widthPct, a.value > 0 ? 1.5 * p : 0)}%`,
                        background: `linear-gradient(90deg, ${a.color}8c 0%, ${a.color} 70%)`,
                        boxShadow: isLeader || isHovered ? `0 0 10px ${a.color}55` : undefined,
                        transition: 'box-shadow 200ms ease',
                      }}
                    >
                      {/* Glossy top highlight */}
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/25" />
                    </span>
                  </span>

                  {/* Value + share */}
                  <span className="flex items-baseline justify-end gap-1 tabular-nums">
                    <span className={`text-[11px] font-extrabold ${pal.textMain}`}>{shownValue}</span>
                    <span className={`text-[10px] font-semibold ${pal.textMuted}`}>{formatPct(share)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Insight footer (switches to hovered area details) */}
      <div className={`flex items-center justify-between gap-2 pt-2 border-t text-[11px] ${pal.grid} ${pal.footer}`}>
        {hoveredArea ? (
          <>
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hoveredArea.color }} />
              <span className={`font-bold truncate ${pal.footerStrong}`}>{hoveredArea.name}</span>
            </span>
            <span className="tabular-nums shrink-0">
              <strong className={pal.footerStrong}>{hoveredArea.value}</strong> de {total} processos
            </span>
          </>
        ) : (
          <>
            <span className="truncate">
              Top 3 concentram <strong className={pal.footerStrong}>{Math.round(top3Share)}%</strong> da carteira
            </span>
            <span className="tabular-nums shrink-0">
              <strong className={pal.footerStrong}>{total}</strong> processos
            </span>
          </>
        )}
      </div>
    </div>
  );
};

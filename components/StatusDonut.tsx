import React, { useEffect, useId, useRef, useState } from 'react';

type SegmentKey = 'active' | 'archived';

interface StatusDonutProps {
  active: number;
  archived: number;
  theme: 'light' | 'hybrid';
  onNavigate?: () => void;
}

// Geometry (SVG user units)
const SIZE = 220;
const C = SIZE / 2;
const R = 78;
const STROKE = 15;
const CIRC = 2 * Math.PI * R;
const TICK_COUNT = 72;
const TICK_INNER = 95;
const TICK_OUTER = 100;
const TICK_OUTER_MAJOR = 104;
const DURATION = 1400;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

const polar = (radius: number, angleDeg: number) => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + radius * Math.cos(a), y: C + radius * Math.sin(a) };
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PALETTE = {
  light: {
    activeStops: ['#7dd3fc', '#3b82f6', '#4338ca'],
    activeAccent: '#2563eb',
    activeSoft: 'rgba(37, 99, 235, 0.10)',
    archivedStops: ['#e2e8f0', '#94a3b8'],
    archivedAccent: '#94a3b8',
    archivedSoft: 'rgba(148, 163, 184, 0.14)',
    track: '#f1f5f9',
    tickIdle: '#e2e8f0',
    discFrom: '#ffffff',
    discTo: '#f8fafc',
    discStroke: '#e2e8f0',
    innerDash: '#e2e8f0',
    textMain: 'text-slate-900',
    textMuted: 'text-slate-400',
    tile: 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:bg-white',
    tileActive: 'bg-white border-slate-300 shadow-sm',
    barTrack: 'bg-slate-200/70',
    dotRing: '#ffffff',
  },
  hybrid: {
    activeStops: ['#5eead4', '#00a884', '#047857'],
    activeAccent: '#00a884',
    activeSoft: 'rgba(0, 168, 132, 0.14)',
    archivedStops: ['#8696a0', '#54656f'],
    archivedAccent: '#8696a0',
    archivedSoft: 'rgba(134, 150, 160, 0.16)',
    track: '#202c33',
    tickIdle: '#354751',
    discFrom: '#2f424d',
    discTo: '#24343d',
    discStroke: '#3b5260',
    innerDash: '#3b5260',
    textMain: 'text-[#e9edef]',
    textMuted: 'text-[#aebac1]',
    tile: 'bg-[#202c33]/70 border-[#354751] hover:border-[#425866] hover:bg-[#202c33]',
    tileActive: 'bg-[#202c33] border-[#425866] shadow-sm',
    barTrack: 'bg-[#354751]',
    dotRing: '#2a3942',
  },
} as const;

export const StatusDonut: React.FC<StatusDonutProps> = ({ active, archived, theme, onNavigate }) => {
  const total = active + archived;
  const pal = PALETTE[theme === 'hybrid' ? 'hybrid' : 'light'];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  // One-shot reveal animation (0 → 1). Stops after completion; skipped with reduced motion.
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0));
  const animationDone = useRef(false);
  const hasData = total > 0;

  useEffect(() => {
    // Note: guard only on completion so React StrictMode's mount→cleanup→remount
    // doesn't cancel the animation and leave progress stuck at 0.
    if (animationDone.current || !hasData) return;
    if (prefersReducedMotion()) {
      animationDone.current = true;
      setProgress(1);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / DURATION, 1);
      setProgress(easeOutQuart(t));
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        animationDone.current = true;
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [hasData]);

  const [hovered, setHovered] = useState<SegmentKey | null>(null);

  const activePct = total > 0 ? (active / total) * 100 : 0;
  const archivedPct = total > 0 ? 100 - activePct : 0;

  // Segment geometry along the circumference, with visual gaps that account for round caps.
  const bothPresent = active > 0 && archived > 0;
  const gapLen = bothPresent ? STROKE + 7 : 0;
  const activeLen = total > 0 ? (active / total) * CIRC : 0;
  const archivedLen = total > 0 ? CIRC - activeLen : 0;

  const segments: { key: SegmentKey; start: number; drawLen: number }[] = [
    { key: 'active', start: gapLen / 2, drawLen: Math.max(0.01, activeLen - gapLen) },
    { key: 'archived', start: activeLen + gapLen / 2, drawLen: Math.max(0.01, archivedLen - gapLen) },
  ];

  const revealed = CIRC * progress;
  const visibleOf = (seg: { start: number; drawLen: number }) =>
    Math.max(0, Math.min(seg.drawLen, revealed - seg.start));

  const activeSeg = segments[0];
  const activeVisible = active > 0 ? visibleOf(activeSeg) : 0;
  const activeEndAngle = ((activeSeg.start + activeVisible) / CIRC) * 360;
  const endDot = polar(R, activeEndAngle);

  const center = (() => {
    if (hovered === 'active') return { value: active, label: 'Ativos', pct: activePct, accent: pal.activeAccent };
    if (hovered === 'archived') return { value: archived, label: 'Arquivados', pct: archivedPct, accent: pal.archivedAccent };
    return { value: Math.round(total * progress), label: 'Total', pct: null as number | null, accent: pal.activeAccent };
  })();

  const ariaLabel = `Status dos processos: ${total} no total, ${active} ativos (${Math.round(activePct)}%) e ${archived} arquivados (${Math.round(archivedPct)}%).`;

  const legend: { key: SegmentKey; label: string; value: number; pct: number; stops: readonly string[]; soft: string }[] = [
    { key: 'active', label: 'Ativos', value: active, pct: activePct, stops: pal.activeStops, soft: pal.activeSoft },
    { key: 'archived', label: 'Arquivados', value: archived, pct: archivedPct, stops: pal.archivedStops, soft: pal.archivedSoft },
  ];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[196px] aspect-square">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={ariaLabel}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={`${uid}-active`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={pal.activeStops[0]} />
              <stop offset="55%" stopColor={pal.activeStops[1]} />
              <stop offset="100%" stopColor={pal.activeStops[2]} />
            </linearGradient>
            <linearGradient id={`${uid}-archived`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={pal.archivedStops[0]} />
              <stop offset="100%" stopColor={pal.archivedStops[1]} />
            </linearGradient>
            <radialGradient id={`${uid}-disc`} cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor={pal.discFrom} />
              <stop offset="100%" stopColor={pal.discTo} />
            </radialGradient>
            <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <filter id={`${uid}-disc-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity={theme === 'hybrid' ? 0.35 : 0.08} />
            </filter>
          </defs>

          {/* Gauge ticks: light up clockwise in sync with the active arc */}
          <g aria-hidden="true">
            {Array.from({ length: TICK_COUNT }).map((_, i) => {
              const angle = (i / TICK_COUNT) * 360;
              const isMajor = i % 6 === 0;
              const frac = i / TICK_COUNT;
              const lit = total > 0 && frac < (active / total) * progress;
              const p1 = polar(TICK_INNER, angle);
              const p2 = polar(isMajor ? TICK_OUTER_MAJOR : TICK_OUTER, angle);
              return (
                <line
                  key={i}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={lit ? pal.activeAccent : pal.tickIdle}
                  strokeOpacity={lit ? (isMajor ? 0.9 : 0.55) : isMajor ? 0.9 : 0.6}
                  strokeWidth={isMajor ? 1.6 : 1}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Base track */}
          <circle cx={C} cy={C} r={R} fill="none" stroke={pal.track} strokeWidth={STROKE} />

          {/* Soft glow behind the active arc (static filter, no continuous animation) */}
          {active > 0 && activeVisible > 0 && (
            <circle
              cx={C}
              cy={C}
              r={R}
              fill="none"
              stroke={`url(#${uid}-active)`}
              strokeWidth={STROKE}
              strokeLinecap={bothPresent ? 'round' : 'butt'}
              strokeDasharray={`${activeVisible} ${CIRC}`}
              strokeDashoffset={-activeSeg.start}
              transform={`rotate(-90 ${C} ${C})`}
              filter={`url(#${uid}-glow)`}
              opacity={hovered === 'archived' ? 0.12 : theme === 'hybrid' ? 0.45 : 0.35}
              style={{ transition: 'opacity 250ms ease' }}
              aria-hidden="true"
            />
          )}

          {/* Data arcs */}
          {segments.map(seg => {
            const value = seg.key === 'active' ? active : archived;
            if (value <= 0) return null;
            const visible = visibleOf(seg);
            if (visible <= 0) return null;
            const isHovered = hovered === seg.key;
            const isDimmed = hovered !== null && !isHovered;
            return (
              <circle
                key={seg.key}
                cx={C}
                cy={C}
                r={R}
                fill="none"
                stroke={`url(#${uid}-${seg.key})`}
                strokeWidth={isHovered ? STROKE + 4 : STROKE}
                strokeLinecap={bothPresent ? 'round' : 'butt'}
                strokeDasharray={`${visible} ${CIRC}`}
                strokeDashoffset={-seg.start}
                transform={`rotate(-90 ${C} ${C})`}
                opacity={isDimmed ? 0.35 : 1}
                className="cursor-pointer"
                style={{ transition: 'stroke-width 220ms ease, opacity 220ms ease' }}
                onMouseEnter={() => setHovered(seg.key)}
                onClick={onNavigate}
              />
            );
          })}

          {/* Leading marker at the end of the active arc */}
          {bothPresent && activeVisible > 0 && (
            <g aria-hidden="true" opacity={hovered === 'archived' ? 0.35 : 1} style={{ transition: 'opacity 220ms ease' }}>
              <circle cx={endDot.x} cy={endDot.y} r={5.5} fill={pal.dotRing} />
              <circle cx={endDot.x} cy={endDot.y} r={3.2} fill={pal.activeAccent} />
            </g>
          )}

          {/* Inner disc + fine dashed ring */}
          <circle cx={C} cy={C} r={R - STROKE / 2 - 9} fill={`url(#${uid}-disc)`} stroke={pal.discStroke} strokeWidth={1} filter={`url(#${uid}-disc-shadow)`} />
          <circle
            cx={C}
            cy={C}
            r={R - STROKE / 2 - 15}
            fill="none"
            stroke={pal.innerDash}
            strokeWidth={0.8}
            strokeDasharray="1.5 4"
            aria-hidden="true"
          />
        </svg>

        {/* Center readout (HTML for crisp typography) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" aria-hidden="true">
          <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${pal.textMuted}`}>{center.label}</span>
          <span className={`text-[32px] leading-none font-extrabold tracking-tight tabular-nums mt-1 ${pal.textMain}`}>
            {center.value}
          </span>
          <span
            className="mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums transition-colors"
            style={{
              color: center.accent,
              backgroundColor: center.pct === null ? 'transparent' : (hovered === 'archived' ? pal.archivedSoft : pal.activeSoft),
            }}
          >
            {center.pct === null ? 'processos' : `${center.pct.toFixed(1).replace('.', ',')}%`}
          </span>
        </div>
      </div>

      {/* Interactive legend tiles (synced with the chart) */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {legend.map(item => {
          const isHovered = hovered === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onMouseEnter={() => setHovered(item.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(item.key)}
              onBlur={() => setHovered(null)}
              onClick={onNavigate}
              aria-label={`${item.label}: ${item.value} processos (${Math.round(item.pct)}%)`}
              className={`text-left rounded-lg border px-2.5 py-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${
                theme === 'hybrid' ? 'focus-visible:ring-[#00a884]/50' : 'focus-visible:ring-blue-500/40'
              } ${isHovered ? pal.tileActive : pal.tile}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${pal.textMuted}`}>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: `linear-gradient(135deg, ${item.stops[0]}, ${item.stops[item.stops.length - 1]})` }}
                  />
                  {item.label}
                </span>
                <span className={`text-[10px] font-bold tabular-nums ${pal.textMuted}`}>{Math.round(item.pct)}%</span>
              </div>
              <div className={`text-lg font-extrabold leading-tight tabular-nums mt-0.5 ${pal.textMain}`}>{item.value}</div>
              <div className={`h-1 rounded-full mt-1 overflow-hidden ${pal.barTrack}`}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.pct * progress}%`,
                    background: `linear-gradient(90deg, ${item.stops[0]}, ${item.stops[item.stops.length - 1]})`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

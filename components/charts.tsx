'use client';

import { useId, useRef, useState } from 'react';
import type { CurvePoint, HungerProfile } from '@/lib/analysis';
import { HOUR, hm, pad } from '@/lib/time';
import { TONE, type Tone } from './ui';

/* ---------- geometry ---------- */
type Pt = [number, number];

/** Catmull-Rom through points, as cubic Béziers. */
function smoothPath(pts: Pt[]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function segments(curve: CurvePoint[]) {
  const out: CurvePoint[][] = [];
  let cur: CurvePoint[] = [];
  for (const c of curve) {
    if (c.v == null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(c);
  }
  if (cur.length) out.push(cur);
  return out.filter((s) => s.length > 1);
}

/** Pointer scrubbing over a chart: returns the nearest index for the finger's x. */
function useScrub(count: number, toIndex: (fx: number) => number) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const at = (clientX: number) => {
    const el = ref.current;
    if (!el || !count) return;
    const r = el.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setIdx(toIndex(fx));
  };
  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      at(e.clientX);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' || e.buttons) at(e.clientX);
    },
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === 'mouse' && setIdx(null),
    onPointerUp: (e: React.PointerEvent) => e.pointerType !== 'mouse' && setTimeout(() => setIdx(null), 1400),
  };
  return { ref, idx, setIdx, handlers };
}

/** Floating readout pinned above the selected point, kept inside the chart box. */
function Tip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div
      className="pop-in pointer-events-none absolute z-10 rounded-[12px] bg-elevated px-3 py-1.5 text-center whitespace-nowrap shadow-[var(--shadow-float)]"
      style={{
        left: `clamp(48px, ${x * 100}%, calc(100% - 48px))`,
        top: `max(50px, calc(${y * 100}% - 12px))`,
        translate: '-50% -100%',
      }}
    >
      {children}
    </div>
  );
}

/* ---------- home: fasting progress bar ---------- */
export function FastProgress({ start, target, now }: { start: number; target: number; now: number }) {
  const p = Math.min(1, (now - start) / (target * HOUR));
  return (
    <div
      role="progressbar"
      aria-label="Мацгийн явц"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      className="relative h-3 overflow-hidden rounded-full bg-green-soft"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-[var(--ease-out-soft)]"
        style={{
          width: `${Math.max(p * 100, 4)}%`,
          background: 'linear-gradient(90deg, color-mix(in srgb, var(--green) 70%, white), var(--green))',
        }}
      />
    </div>
  );
}

/* ---------- fast tab: 24h dial — where the fast sits in the day ---------- */
export function FastDial({
  start,
  end,
  now,
  fasting,
  planned,
  children,
}: {
  start: number;
  end: number;
  now: number;
  fasting: boolean;
  /** a scheduled fast: draw its window, nothing elapsed */
  planned?: boolean;
  children: React.ReactNode;
}) {
  const S = 288;
  const c = S / 2;
  const r = 110;
  const stroke = 18;
  const ang = (t: number) => {
    const d = new Date(t);
    return ((d.getHours() + d.getMinutes() / 60) / 24) * 360;
  };
  const pt = (deg: number, rad = r): Pt => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)];
  };
  const arc = (from: number, sweep: number) => {
    const sw = Math.max(0.01, Math.min(359.99, sweep));
    const [x1, y1] = pt(from);
    const [x2, y2] = pt(from + sw);
    return `M${x1},${y1} A${r},${r} 0 ${sw > 180 ? 1 : 0} 1 ${x2},${y2}`;
  };
  const a0 = ang(start);
  const total = ((end - start) / HOUR / 24) * 360;
  const done = planned ? 0 : fasting ? Math.min(total, ((now - start) / HOUR / 24) * 360) : total;
  const [nx, ny] = pt(ang(now));
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox={`0 0 ${S} ${S}`} className="block h-full w-full" aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--fill-2)" strokeWidth={stroke} />
        <path d={arc(a0, total)} fill="none" stroke="var(--green-soft)" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={arc(a0, done)}
          fill="none"
          stroke="var(--green)"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="draw-in"
          style={{ ['--len' as string]: 800 }}
        />
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = pt((h / 24) * 360, r + 23);
          return (
            <text key={h} x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--ink-2)">
              {pad(h)}
            </text>
          );
        })}
        {Array.from({ length: 24 }, (_, h) => {
          const [x1, y1] = pt((h / 24) * 360, r - stroke / 2 - 5);
          const [x2, y2] = pt((h / 24) * 360, r - stroke / 2 - (h % 6 === 0 ? 10 : 7));
          return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-3)" strokeWidth="1" strokeLinecap="round" />;
        })}
        <circle cx={nx} cy={ny} r={9} fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.5" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ---------- hunger: average intensity by time of day ---------- */
export function HungerArea({ profile, nowHour, height = 170 }: { profile: HungerProfile; nowHour?: number; height?: number }) {
  const gid = useId().replace(/:/g, '');
  const W = 340;
  const H = height;
  const top = 30;
  const bottom = 22;
  const [d0, d1] = profile.domain;
  const sx = (h: number) => ((h - d0) / (d1 - d0)) * W;
  const sy = (v: number) => top + (1 - v / 10) * (H - top - bottom);
  const base = H - bottom;
  const segs = segments(profile.curve);
  const ticks: number[] = [];
  for (let h = Math.ceil(d0 / 3) * 3; h <= d1; h += 3) ticks.push(h);
  const peak = profile.peak;
  const peakPt =
    peak &&
    profile.curve
      .filter((c) => c.h >= peak.start && c.h <= peak.end && c.v != null)
      .reduce<CurvePoint | null>((a, b) => (!a || (b.v as number) > (a.v as number) ? b : a), null);

  const defined = profile.curve.filter((c) => c.v != null);
  const scrub = useScrub(defined.length, (fx) => {
    const h = d0 + fx * (d1 - d0);
    let best = 0;
    defined.forEach((c, i) => Math.abs(c.h - h) < Math.abs(defined[best].h - h) && (best = i));
    return best;
  });
  const sel = scrub.idx != null ? defined[scrub.idx] : null;

  return (
    <figure>
      <div ref={scrub.ref} className="relative touch-pan-y select-none" {...scrub.handlers}>
        {sel && sel.v != null && (
          <Tip x={sx(sel.h) / W} y={sy(sel.v) / H}>
            <span className="block text-caption text-ink-2 tnum">{hm(new Date(2000, 0, 1, Math.floor(sel.h), Math.round((sel.h % 1) * 60)))}</span>
            <span className="text-body font-semibold text-amber-ink tnum">{sel.v.toFixed(1)}</span>
          </Tip>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`hf${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--amber)" stopOpacity="0.32" />
              <stop offset="1" stopColor="var(--amber)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[2.5, 5, 7.5].map((g) => (
            <line key={g} x1="0" x2={W} y1={sy(g)} y2={sy(g)} stroke="var(--sep)" strokeWidth="1" />
          ))}
          {peak && (
            <g>
              <rect
                x={sx(peak.start)}
                y={top - 14}
                width={sx(peak.end) - sx(peak.start)}
                height={base - top + 14}
                fill="var(--amber)"
                opacity="0.12"
                rx="8"
              />
            </g>
          )}
          {segs.map((s, i) => {
            const pts: Pt[] = s.map((c) => [sx(c.h), sy(c.v as number)]);
            const line = smoothPath(pts);
            const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${base} L${pts[0][0].toFixed(1)},${base} Z`;
            return (
              <g key={i}>
                <path d={area} fill={`url(#hf${gid})`} className="fade-in" />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--amber)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="draw-in"
                  style={{ ['--len' as string]: 900 }}
                />
              </g>
            );
          })}
          {nowHour != null && nowHour >= d0 && (
            <line x1={sx(nowHour)} x2={sx(nowHour)} y1={top - 6} y2={base} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="2 3" />
          )}
          {peakPt && peakPt.v != null && !sel && (
            <g>
              <circle cx={sx(peakPt.h)} cy={sy(peakPt.v)} r="5.5" fill="var(--surface)" stroke="var(--amber)" strokeWidth="2.5" />
              <text
                x={Math.min(W - 14, Math.max(14, sx(peakPt.h)))}
                y={sy(peakPt.v) - 12}
                textAnchor="middle"
                fontSize="12.5"
                fontWeight="700"
                fill="var(--amber-ink)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {(peak?.value ?? peakPt.v).toFixed(1)}
              </text>
            </g>
          )}
          {sel && sel.v != null && (
            <g>
              <line x1={sx(sel.h)} x2={sx(sel.h)} y1={top - 10} y2={base} stroke="var(--amber)" strokeWidth="1.5" />
              <circle cx={sx(sel.h)} cy={sy(sel.v)} r="5.5" fill="var(--amber)" stroke="var(--surface)" strokeWidth="2" />
            </g>
          )}
          {ticks.map((h) => (
            <text
              key={h}
              x={Math.min(W - 7, Math.max(7, sx(h)))}
              y={H - 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="var(--ink-2)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {pad(h)}
            </text>
          ))}
        </svg>
      </div>
      <figcaption className="sr-only">
        Өдрийн цаг тус бүрийн дундаж өлсөлт:{' '}
        {profile.hourly
          .filter((x) => x.avg != null)
          .map((x) => `${pad(x.h)}:00 — ${(x.avg as number).toFixed(1)}`)
          .join(', ')}
      </figcaption>
    </figure>
  );
}

/* ---------- trend area (weight, vitals) with touch tooltip ---------- */
export function TrendArea({
  points,
  unit,
  label,
  tone = 'teal',
  format = (v: number) => v.toFixed(1),
  minSpan = 0.6,
}: {
  points: { t: number; v: number }[];
  unit: string;
  label: string;
  tone?: Tone;
  format?: (v: number) => string;
  /** smallest value range the plot shows, so small drifts are not drawn as cliffs */
  minSpan?: number;
}) {
  const gid = useId().replace(/:/g, '');
  const W = 340;
  const H = 150;
  const padY = 18;
  const n = points.length;
  const t0 = points[0]?.t ?? 0;
  const t1 = points[n - 1]?.t ?? 1;
  const sx = (t: number) => (t1 === t0 ? W / 2 : 6 + ((t - t0) / (t1 - t0)) * (W - 52));
  const scrub = useScrub(n, (fx) => {
    const x = fx * W;
    let best = 0;
    points.forEach((p, i) => Math.abs(sx(p.t) - x) < Math.abs(sx(points[best].t) - x) && (best = i));
    return best;
  });
  if (n < 2) return null;
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = Math.max(minSpan, max - min);
  const mid = (min + max) / 2;
  const lo = mid - span * 0.65;
  const hi = mid + span * 0.65;
  const sy = (v: number) => padY + (1 - (v - lo) / (hi - lo)) * (H - padY * 2);
  const pts: Pt[] = points.map((p) => [sx(p.t), sy(p.v)]);
  const line = smoothPath(pts);
  const area = `${line} L${pts[n - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const last = pts[n - 1];
  const t = TONE[tone];
  const sel = scrub.idx != null ? scrub.idx : null;
  return (
    <figure>
      <div ref={scrub.ref} className="relative touch-pan-y select-none" {...scrub.handlers}>
        {sel != null && (
          <Tip x={pts[sel][0] / W} y={pts[sel][1] / H}>
            <span className="block text-caption text-ink-2">
              {new Date(points[sel].t).getMonth() + 1}/{new Date(points[sel].t).getDate()}
            </span>
            <span className="text-body font-semibold tnum" style={{ color: t.ink }}>
              {format(points[sel].v)} {unit}
            </span>
          </Tip>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`tf${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={t.fill} stopOpacity="0.26" />
              <stop offset="1" stopColor={t.fill} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.2, 0.5, 0.8].map((f) => {
            const y = padY + f * (H - padY * 2);
            const v = hi - f * (hi - lo);
            return (
              <g key={f}>
                <line x1="0" x2={W - 34} y1={y} y2={y} stroke="var(--sep)" strokeWidth="1" />
                <text x={W} y={y + 4} textAnchor="end" fontSize="10.5" fontWeight="500" fill="var(--ink-2)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {format(v)}
                </text>
              </g>
            );
          })}
          <path d={area} fill={`url(#tf${gid})`} className="fade-in" />
          <path d={line} fill="none" stroke={t.fill} strokeWidth="2.5" strokeLinecap="round" className="draw-in" />
          {sel == null && (
            <g>
              <circle cx={last[0]} cy={last[1]} r="9" fill={t.fill} opacity="0.18" />
              <circle cx={last[0]} cy={last[1]} r="4.5" fill={t.fill} stroke="var(--surface)" strokeWidth="2" />
              <text
                x={last[0]}
                y={last[1] - 14}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={t.ink}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {format(points[n - 1].v)}
              </text>
            </g>
          )}
          {sel != null && (
            <g>
              <line x1={pts[sel][0]} x2={pts[sel][0]} y1={0} y2={H} stroke={t.fill} strokeWidth="1.5" opacity="0.5" />
              <circle cx={pts[sel][0]} cy={pts[sel][1]} r="5.5" fill={t.fill} stroke="var(--surface)" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>
      <figcaption className="sr-only">
        {label}: {points.map((p) => `${new Date(p.t).getMonth() + 1}/${new Date(p.t).getDate()} ${format(p.v)} ${unit}`).join(', ')}
      </figcaption>
    </figure>
  );
}

/* ---------- day bars (fasting, sleep) with tap-to-read ---------- */
export function DayBars({
  values,
  labels,
  longLabels,
  goal,
  format,
  label,
  tone,
  goalText,
}: {
  values: (number | null)[];
  labels: string[];
  longLabels?: string[];
  goal?: number;
  format: (v: number) => string;
  label: string;
  tone: Tone;
  /** short text naming the reference line, e.g. "16ц зорилго" */
  goalText?: string;
}) {
  const W = 340;
  const H = 132;
  const top = 10;
  const bottom = 22;
  const n = values.length;
  const max = Math.max(goal ?? 0, ...values.map((v) => v ?? 0)) * 1.12 || 1;
  const bw = W / n;
  const sy = (v: number) => top + (1 - v / max) * (H - top - bottom);
  const lastIdx = values.map((v, i) => (v ? i : -1)).filter((i) => i >= 0).pop();
  const every = n <= 7 ? 1 : n <= 14 ? 2 : 5;
  const scrub = useScrub(n, (fx) => Math.min(n - 1, Math.floor(fx * n)));
  const sel = scrub.idx != null && values[scrub.idx] ? scrub.idx : null;
  const t = TONE[tone];
  const w = Math.min(n <= 7 ? 26 : 8, bw * 0.62);
  const rr = Math.min(8, w / 2);
  const bar = (x: number, y: number, h: number) =>
    `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
  return (
    <figure>
      <div ref={scrub.ref} className="relative touch-pan-y select-none" {...scrub.handlers}>
        {sel != null && (
          <Tip x={(sel + 0.5) / n} y={sy(values[sel] as number) / H}>
            <span className="block text-caption text-ink-2">{(longLabels ?? labels)[sel]}</span>
            <span className="text-body font-semibold tnum" style={{ color: t.ink }}>
              {format(values[sel] as number)}
            </span>
          </Tip>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
          {goal != null && (
            <g>
              <line x1="0" x2={W} y1={sy(goal)} y2={sy(goal)} stroke={t.fill} strokeWidth="1.5" opacity="0.35" />
              {goalText && (
                <text x={W} y={sy(goal) - 5} textAnchor="end" fontSize="10.5" fontWeight="600" fill={t.ink}>
                  {goalText}
                </text>
              )}
            </g>
          )}
          {values.map((v, i) => {
            const x = i * bw + (bw - w) / 2;
            if (!v) {
              return <rect key={i} x={x} y={H - bottom - 4} width={w} height={4} rx={2} fill="var(--fill)" />;
            }
            const y = sy(v);
            const h = Math.max(rr * 2, H - bottom - y);
            const strong = sel != null ? i === sel : i === lastIdx;
            return (
              <path
                key={i}
                d={bar(x, H - bottom - h, h)}
                fill={t.fill}
                fillOpacity={strong ? 1 : 0.32}
                className="grow-in transition-[fill-opacity] duration-200"
                style={{ animationDelay: `${i * 24}ms` }}
              />
            );
          })}
          {labels.map((l, i) =>
            (n - 1 - i) % every === 0 ? (
              <text
                key={i}
                x={i * bw + bw / 2}
                y={H - 5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight={i === (sel ?? lastIdx) ? 700 : 500}
                fill={i === (sel ?? lastIdx) ? t.ink : 'var(--ink-2)'}
              >
                {l}
              </text>
            ) : null,
          )}
        </svg>
      </div>
      <figcaption className="sr-only">
        {label}: {values.map((v, i) => `${(longLabels ?? labels)[i]} ${v ? format(v) : 'бүртгэлгүй'}`).join(', ')}
      </figcaption>
    </figure>
  );
}

/* ---------- water: one drop-glass per day, filled to the day's share of the goal ---------- */
export function WaterDays({
  values,
  labels,
  goal,
}: {
  values: number[];
  labels: string[];
  goal: number;
}) {
  const n = values.length;
  const big = n <= 7;
  return (
    <ul
      className={`grid gap-y-3 ${big ? 'grid-cols-7 gap-x-2' : 'grid-cols-10 gap-x-1.5'}`}
      aria-label="Өдөр бүрийн ус, зорилготой харьцуулсан"
    >
      {values.map((v, i) => {
        const p = Math.min(1, v / goal);
        const met = v >= goal;
        return (
          <li key={i} className="flex flex-col items-center gap-1">
            <span
              className="relative block w-full overflow-hidden rounded-full bg-blue-soft"
              style={{ aspectRatio: big ? '0.62' : '1', maxWidth: big ? 34 : 26 }}
              aria-label={`${labels[i]}: ${(v / 1000).toFixed(1)} л`}
              role="img"
            >
              <span
                className="grow-in absolute inset-x-0 bottom-0 block"
                style={{
                  height: `${p * 100}%`,
                  background: met
                    ? 'var(--blue)'
                    : 'linear-gradient(180deg, color-mix(in srgb, var(--blue) 55%, transparent), color-mix(in srgb, var(--blue) 75%, transparent))',
                  animationDelay: `${i * 20}ms`,
                }}
              />
            </span>
            {(big || i % 5 === 4 || i === n - 1) && (
              <span className="text-[10px] font-medium text-ink-2 tnum">{labels[i]}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

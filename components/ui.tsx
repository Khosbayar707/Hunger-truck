'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* ---------- sheet routing: one sheet open at a time, any screen can ask ---------- */
export type SheetName =
  | 'hunger'
  | 'weight'
  | 'sleep'
  | 'water'
  | 'vital'
  | 'goal'
  | 'fast-start'
  | 'fast-edit'
  | 'fast-detail'
  | 'hunger-detail'
  | 'advice';

export interface SheetState {
  name: SheetName;
  payload?: string;
}

interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
  tone?: 'default' | 'error';
}

interface UI {
  sheet: SheetState | null;
  openSheet: (name: SheetName, payload?: string) => void;
  closeSheet: () => void;
  toast: (text: string, opts?: { action?: Toast['action']; tone?: Toast['tone'] }) => void;
  currentToast: Toast | null;
  dismissToast: () => void;
}

const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [currentToast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismissToast = useCallback(() => setToast(null), []);
  const toast = useCallback<UI['toast']>((text, opts) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), text, ...opts });
    timer.current = setTimeout(() => setToast(null), opts?.action ? 4500 : 2400);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo<UI>(
    () => ({
      sheet,
      openSheet: (name, payload) => setSheet({ name, payload }),
      closeSheet: () => setSheet(null),
      toast,
      currentToast,
      dismissToast,
    }),
    [sheet, toast, currentToast, dismissToast],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUI outside UIProvider');
  return v;
}

/* ---------- clock ---------- */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, intervalMs);
    const onVis = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs]);
  return now;
}

/* ---------- metric identity ---------- */
export type Tone = 'green' | 'amber' | 'blue' | 'indigo' | 'teal';
export const TONE: Record<Tone, { fill: string; ink: string; soft: string }> = {
  green: { fill: 'var(--green)', ink: 'var(--green-ink)', soft: 'var(--green-soft)' },
  amber: { fill: 'var(--amber)', ink: 'var(--amber-ink)', soft: 'var(--amber-soft)' },
  blue: { fill: 'var(--blue)', ink: 'var(--blue-ink)', soft: 'var(--blue-soft)' },
  indigo: { fill: 'var(--indigo)', ink: 'var(--indigo-ink)', soft: 'var(--indigo-soft)' },
  teal: { fill: 'var(--teal)', ink: 'var(--teal-ink)', soft: 'var(--teal-soft)' },
};

/** Small tinted icon badge: the metric's identity mark. */
export function Badge({ tone, children, size = 30 }: { tone: Tone; children: React.ReactNode; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-[10px]"
      style={{ width: size, height: size, background: TONE[tone].soft, color: TONE[tone].ink }}
    >
      {children}
    </span>
  );
}

/* ---------- screen with an iOS-style large title that collapses into a compact bar ---------- */
export function Screen({
  title,
  sub,
  accessory,
  children,
}: {
  title: string;
  sub?: React.ReactNode;
  accessory?: React.ReactNode;
  children: React.ReactNode;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-8px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div
        aria-hidden={!compact}
        className="fixed inset-x-0 top-0 z-30 transition-[opacity,transform] duration-200"
        style={{
          opacity: compact ? 1 : 0,
          transform: compact ? 'none' : 'translateY(-4px)',
          pointerEvents: compact ? 'auto' : 'none',
          background: 'var(--material)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          boxShadow: compact ? '0 0.5px 0 var(--sep)' : 'none',
        }}
      >
        <div className="mx-auto flex h-[calc(env(safe-area-inset-top)+44px)] max-w-[34rem] items-end justify-center px-5 pb-2.5">
          <span className="text-[14px] font-semibold tracking-[-0.01em]">{title}</span>
        </div>
      </div>
      <main className="rise-in mx-auto w-full max-w-[34rem] px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-[calc(env(safe-area-inset-bottom)+112px)]">
        <header className="mb-5 flex items-end justify-between gap-3 px-1">
          <div>
            <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.03em]">{title}</h1>
            {sub && <p className="mt-0.5 text-footnote font-medium text-ink-2">{sub}</p>}
          </div>
          {accessory}
        </header>
        <div ref={sentinel} className="-mt-px h-px" />
        {children}
      </main>
    </>
  );
}

/** Section title + optional note, sitting outside a group like iOS. */
export function GroupTitle({
  title,
  note,
  aside,
  first,
}: {
  title: string;
  note?: string;
  aside?: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div className={`${first ? "mt-1" : "mt-8"} mb-2.5 flex items-end justify-between gap-3 px-1`}>
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>
        {note && <p className="mt-0.5 text-footnote text-ink-2">{note}</p>}
      </div>
      {aside}
    </div>
  );
}

/** L2 grouped surface. */
export function Group({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grouped overflow-hidden ${className}`}>{children}</div>;
}

/** A row inside a Group: 52px+, inset separator. Renders a button when interactive. */
export function Row({
  children,
  onClick,
  role,
  ariaChecked,
  ariaLabel,
  className = '',
  inset = 16,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  role?: string;
  ariaChecked?: boolean;
  ariaLabel?: string;
  className?: string;
  inset?: number;
}) {
  const cls = `row-sep flex min-h-[52px] w-full items-center gap-3 px-4 text-left ${onClick ? 'tap-row' : ''} ${className}`;
  const style = { ['--sep-inset' as string]: `${inset}px` };
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      role={role}
      aria-checked={ariaChecked}
      aria-label={ariaLabel}
      className={cls}
      style={style}
    >
      {children}
    </button>
  ) : (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

/** iOS-style switch, 51×31 visual inside a 52px row. */
export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300"
      style={{ background: on ? 'var(--green)' : 'var(--fill)' }}
    >
      <span
        className="absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-transform duration-300 ease-[var(--ease-ios)]"
        style={{ transform: on ? 'translateX(20px)' : 'none' }}
      />
    </span>
  );
}

/** Segmented control with a sliding elevated thumb. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const n = options.length;
  return (
    <div role="radiogroup" aria-label={label} className="relative flex rounded-[12px] bg-fill/70 p-[3px]">
      <span
        aria-hidden="true"
        className="seg-thumb absolute top-[3px] bottom-[3px] left-[3px] rounded-[10px] transition-transform duration-300 ease-[var(--ease-ios)]"
        style={{ width: `calc((100% - 6px) / ${n})`, transform: `translateX(${idx * 100}%)` }}
      />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative z-[1] min-h-[36px] flex-1 rounded-[10px] text-[12px] transition-colors duration-200 ${
              on ? 'font-semibold text-ink' : 'font-medium text-ink-2'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`rounded-[18px] bg-fill-2 ${className}`} aria-hidden="true" />;
}

/** Neutral trend: a small triangle + amount, tinted but never judged. */
export function Trend({ delta, unit, tone = 'teal' }: { delta: number | null; unit: string; tone?: Tone }) {
  if (delta == null || delta === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-footnote font-semibold tnum" style={{ color: TONE[tone].ink }}>
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
        <path d={delta < 0 ? 'M5 9L1 2.5h8z' : 'M5 1l4 6.5H1z'} fill="currentColor" />
      </svg>
      <span className="sr-only">{delta < 0 ? 'буурсан' : 'өссөн'}</span>
      {Math.abs(delta).toFixed(1)} {unit}
    </span>
  );
}

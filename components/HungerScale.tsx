'use client';

import { useRef } from 'react';
import { HUNGER_WORDS } from '@/lib/analysis';

/**
 * 1–10 hunger slider. Amber track with ten detents and a lifted thumb.
 * Tap anywhere, drag, or use arrow / number keys. Snaps to whole values.
 */
export default function HungerScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 15; // thumb radius: 1 and 10 sit at the thumb's centre, not the track's edge
    const t = (clientX - r.left - pad) / (r.width - pad * 2);
    const v = Math.min(10, Math.max(1, Math.round(t * 9) + 1));
    if (v !== value) {
      onChange(v);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(5);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    const cur = value ?? 0;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(10, cur + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, cur - 1 || 1);
    if (e.key === 'Home') next = 1;
    if (e.key === 'End') next = 10;
    if (/^[0-9]$/.test(e.key)) next = e.key === '0' ? 10 : +e.key;
    if (next != null) {
      e.preventDefault();
      onChange(next);
    }
  };

  const p = value ? (value - 1) / 9 : 0;

  return (
    <div>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Өлсөлтийн түвшин"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value ? `${value}, ${HUNGER_WORDS[value]}` : 'Сонгоогүй'}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          pick(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && pick(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        className="relative h-[52px] touch-none select-none rounded-full outline-offset-0"
      >
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-fill" />
        {/* fill */}
        <div
          className="absolute top-1/2 left-0 h-[10px] -translate-y-1/2 rounded-full transition-[width] duration-200 ease-[var(--ease-out-soft)]"
          style={{
            width: value ? `calc(15px + (100% - 30px) * ${p})` : 0,
            background: 'linear-gradient(90deg, color-mix(in srgb, var(--amber) 55%, transparent), var(--amber))',
          }}
        />
        {/* detents */}
        <div className="absolute inset-x-[15px] top-1/2 flex -translate-y-1/2 justify-between" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className="h-[4px] w-[4px] rounded-full transition-colors duration-200"
              style={{ background: value && i + 1 <= value ? 'rgb(255 255 255 / 0.85)' : 'var(--ink-3)' }}
            />
          ))}
        </div>
        {/* thumb */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-[30px] w-[30px] rounded-full bg-white shadow-[0_3px_10px_rgb(0_0_0/0.18),0_0_0_0.5px_rgb(0_0_0/0.06)] transition-[left,opacity,transform] duration-200 ease-[var(--ease-out-soft)]"
          style={{
            left: `calc(15px + (100% - 30px) * ${p})`,
            opacity: value ? 1 : 0,
            transform: `translate(-50%, -50%) scale(${value ? 1 : 0.6})`,
          }}
        />
      </div>
      <div className="flex justify-between px-[11px] text-caption text-ink-2 tnum" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`w-2 text-center transition-colors ${value === i + 1 ? 'font-bold text-amber-ink' : ''}`}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

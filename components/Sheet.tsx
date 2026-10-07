'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { IconClose } from './icons';

/**
 * Bottom sheet. Slides up over a scrim, keeps the screen behind in view.
 * Close: scrim tap, Escape, drag the handle down, or the sheet's own action.
 */
export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  // Commit the off-screen position with a forced layout read, then slide in.
  // Not rAF-based: rAF never fires in a hidden or backgrounded page, which would strand the sheet.
  useLayoutEffect(() => {
    if (open && mounted && !shown) {
      panel.current?.getBoundingClientRect();
      setShown(true);
    }
  }, [open, mounted, shown]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    const t = setTimeout(() => panel.current?.focus({ preventScroll: true }), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = prevOverflow;
      clearTimeout(t);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    setDrag(Math.max(0, e.clientY - startY.current));
  };
  const onPointerUp = () => {
    if (drag > 90) onClose();
    startY.current = null;
    setDrag(0);
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        className="absolute inset-0 bg-[var(--scrim)] transition-opacity duration-[400ms]"
        style={{ opacity: shown ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] w-full max-w-[34rem] flex-col rounded-t-[24px] bg-surface shadow-[var(--shadow-float)] outline-none"
        style={{
          transform: shown ? `translateY(${drag}px)` : 'translateY(100%)',
          transition: startY.current != null ? 'none' : 'transform 440ms var(--ease-ios)',
        }}
      >
        <div
          className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-hidden="true"
        >
          <span className="h-[5px] w-9 rounded-full bg-fill" />
        </div>
        <div className="flex items-start justify-between gap-3 pr-3 pl-5">
          <h2 id={titleId} className="pt-1 pb-4 text-[18px] leading-tight font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="-mt-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-full active:opacity-60"
          >
            <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-fill-2 text-ink-2">
              <IconClose size={16} strokeWidth={2.2} />
            </span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
        {footer && <div className="shrink-0 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+20px)]">{footer}</div>}
        {!footer && <div className="h-[calc(env(safe-area-inset-bottom)+20px)] shrink-0" />}
      </div>
    </div>
  );
}

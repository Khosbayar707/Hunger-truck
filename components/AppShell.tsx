'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import SheetHost from './Sheets';
import { UIProvider, useUI } from './ui';
import { IconFast, IconHistory, IconSettings, IconToday } from './icons';
import { useData } from '@/lib/store';
import { promptKey } from '@/lib/actions';
import { recordCount, requestPersist } from '@/lib/backup';

const TABS = [
  { href: '/', label: 'Өнөөдөр', Icon: IconToday },
  { href: '/fast/', label: 'Мацаг', Icon: IconFast },
  { href: '/history/', label: 'Түүх', Icon: IconHistory },
  { href: '/settings/', label: 'Тохиргоо', Icon: IconSettings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <ThemeSync />
      <ServiceWorker />
      <HourlyNotifier />
      <PersistStorage />
      {children}
      <TabBar />
      <SheetHost />
      <ToastView />
    </UIProvider>
  );
}

/** Floating material tab bar: elevated, translucent, clear of the home indicator. */
function TabBar() {
  const path = usePathname() || '/';
  const norm = path.endsWith('/') ? path : path + '/';
  return (
    <nav aria-label="Үндсэн цэс" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <ul
        className="mx-auto flex max-w-[30rem] rounded-[26px] p-1.5 shadow-[var(--shadow-float)]"
        style={{
          background: 'var(--material)',
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        }}
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = href === '/' ? norm === '/' : norm.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[54px] flex-col items-center justify-center gap-[3px] rounded-[20px] text-[10px] tracking-[-0.01em] transition-[color,background-color,transform] duration-200 active:scale-95 ${
                  active ? 'bg-green-soft font-semibold text-green-ink' : 'font-medium text-ink-2'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 1.9 : 1.6} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ToastView() {
  const { currentToast: t, dismissToast } = useUI();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-[60] flex justify-center px-5"
    >
      {t && (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={`pop-in pointer-events-auto flex max-w-[30rem] items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4 text-footnote font-medium text-white shadow-[var(--shadow-float)] ${
            t.tone === 'error' ? 'bg-danger' : 'bg-[#2c2c2e]'
          }`}
        >
          <span className="py-1.5 leading-snug">{t.text}</span>
          {t.action && (
            <button
              className="min-h-[34px] shrink-0 rounded-full bg-white/15 px-3.5 font-semibold active:bg-white/25"
              onClick={() => {
                t.action!.run();
                dismissToast();
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ThemeSync() {
  const pref = useData().profile.theme;
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        m.setAttribute('content', dark ? '#111113' : '#f5f5f7');
      });
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
  return null;
}

function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}

/** Once the journal holds data, ask the browser to keep it through storage pressure. */
function PersistStorage() {
  const has = recordCount(useData()) > 0;
  useEffect(() => {
    if (has) requestPersist();
  }, [has]);
  return null;
}

export function isQuiet(h: number, s: number, e: number) {
  if (s === e) return false;
  return s < e ? h >= s && h < e : h >= s || h < e;
}

/** While the app is open but hidden, nudge once per hour. Without a push server this is best effort. */
function HourlyNotifier() {
  const d = useData();
  const p = d.profile;
  useEffect(() => {
    if (!p.hourlyPrompt) return;
    const check = async () => {
      const now = new Date();
      if (isQuiet(now.getHours(), p.quietStart, p.quietEnd)) return;
      if (p.lastPromptHour === promptKey(now.getTime())) return;
      if (!document.hidden) return; // visible: the Today screen shows its own inline prompt
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const reg = await navigator.serviceWorker?.getRegistration();
      reg?.showNotification('Одоо хэр өлсөж байна?', {
        body: 'Нэг товшилтоор тэмдэглээрэй.',
        tag: 'hunger-' + promptKey(now.getTime()),
        icon: '/icons/icon-192.png',
        data: { url: '/?log=hunger' },
      });
    };
    const id = setInterval(check, 60e3);
    return () => clearInterval(id);
  }, [p.hourlyPrompt, p.quietStart, p.quietEnd, p.lastPromptHour]);
  return null;
}

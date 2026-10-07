'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FastProgress, HungerArea } from '../charts';
import { IconDownload, IconDrop, IconHeart, IconHunger, IconMoon, IconPlus, IconScale, IconSteps, IconTimer } from '../icons';
import { Badge, GroupTitle, Screen, Segmented, Skeleton, TONE, Trend, useNow, useUI, type Tone } from '../ui';
import { isQuiet } from '../AppShell';
import { goalLabel } from './Fast';
import { VITALS } from '../Sheets';
import { replaceAll, useData, useHydrated } from '@/lib/store';
import { addWater, endFast, promptKey, removeEntry } from '@/lib/actions';
import { backupDue, exportData, snoozeBackup } from '@/lib/backup';
import { hungerProfile, inRange, windowLabel, MIN_ENTRIES } from '@/lib/analysis';
import { HOUR, clockDur, dayKey, hm, longDate, longDur, relDay, shortDur } from '@/lib/time';
import type { Data, MetricKey, VitalType } from '@/lib/types';

export default function Today() {
  const hydrated = useHydrated();
  const now = useNow(15_000);
  return (
    <Screen title="Өнөөдөр" sub={hydrated ? longDate(now) : ' '}>
      {hydrated ? <TodayBody now={now} /> : <TodaySkeleton />}
      <Suspense>
        <OpenFromQuery />
      </Suspense>
    </Screen>
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Ачаалж байна" className="space-y-4">
      <Skeleton className="h-[300px] rounded-[28px]" />
      <Skeleton className="h-[170px]" />
    </div>
  );
}

function TodayBody({ now }: { now: number }) {
  const d = useData();
  return (
    <>
      <HourlyNudge d={d} now={now} />
      <FastHero d={d} now={now} />
      <HungerCard d={d} now={now} />
      <TodayWidgets d={d} now={now} />
      <PatternCard d={d} now={now} />
      <BackupNudge d={d} now={now} />
    </>
  );
}

/* ---------- 1. NOW: the fasting hero (L3) ---------- */
function FastHero({ d, now }: { d: Data; now: number }) {
  const { openSheet, toast } = useUI();
  const f = d.activeFast;
  const goal = f?.targetHours ?? d.profile.fastingGoalH;

  const pill = (text: string, live: boolean) => (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-footnote font-semibold ${
        live ? 'bg-green-soft text-green-ink' : 'bg-fill-2 text-ink-2'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-green' : 'bg-ink-3'}`} aria-hidden="true" />
      {text}
    </span>
  );
  const goalChip = (
    <button
      onClick={() => openSheet('goal')}
      className="tap inline-flex h-11 items-center rounded-full px-1 text-footnote font-semibold text-ink-2"
      aria-label={`Мацгийн зорилго ${goalLabel(goal)}, өөрчлөх`}
    >
      <span className="rounded-full bg-fill-2 px-3 py-1.5 tnum">{goalLabel(goal)}</span>
    </button>
  );

  if (f) {
    const el = now - f.startTime;
    const endT = f.startTime + f.targetHours * HOUR;
    const left = endT - now;
    const end = () => {
      const snap: Data = structuredClone(d);
      if (endFast()) toast(`Мацаг дууслаа · ${shortDur(el)}`, { action: { label: 'Буцаах', run: () => replaceAll(snap) } });
      else toast('Мэдээллийг хадгалж чадсангүй.', { tone: 'error' });
    };
    return (
      <section aria-label="Мацгийн төлөв" className="hero relative overflow-hidden px-5 pt-4 pb-5">
        <Glow />
        <div className="relative flex items-center justify-between">
          {pill('Мацаг барьж байна', true)}
          {goalChip}
        </div>
        <p className="relative mt-3 text-display font-light tracking-[-0.05em] tnum" aria-label={`${longDur(el)} өнгөрсөн`}>
          {clockDur(el)}
        </p>
        <p className="relative mt-1 text-footnote font-medium text-ink-2">мацаглаж буй хугацаа</p>
        <div className="relative mt-6">
          <FastProgress start={f.startTime} target={f.targetHours} now={now} />
        </div>
        <div className="relative mt-3 flex items-baseline justify-between gap-3">
          <p className="text-body font-semibold tnum">
            {left > 0 ? (
              <>
                {shortDur(left)} <span className="font-medium text-ink-2">үлдлээ</span>
              </>
            ) : (
              <span className="text-green-ink">Зорилгод хүрсэн · +{shortDur(-left)}</span>
            )}
          </p>
          <p className="text-footnote font-medium text-ink-2 tnum">
            {hm(f.startTime)} → {hm(endT)}
          </p>
        </div>
        <button className="btn-primary relative mt-5 w-full" onClick={end}>
          Мацаг дуусгах
        </button>
      </section>
    );
  }

  const last = d.fasts[d.fasts.length - 1];
  const windowEnd = last ? last.endTime + (24 - goal) * HOUR : null;
  return (
    <section aria-label="Мацгийн төлөв" className="hero relative overflow-hidden px-5 pt-4 pb-5">
      <div className="flex items-center justify-between">
        {pill(last ? 'Хооллох цонх' : 'Мацаг бариагүй байна', false)}
        {goalChip}
      </div>
      {last ? (
        <>
          <p className="mt-3 text-display font-light tracking-[-0.05em] tnum" aria-label={`Сүүлийн мацгаас хойш ${longDur(now - last.endTime)}`}>
            {clockDur(now - last.endTime)}
          </p>
          <p className="mt-1 text-footnote font-medium text-ink-2">
            сүүлийн мацгаас хойш · {relDay(last.endTime).toLowerCase()} {hm(last.endTime)}
          </p>
          {windowEnd && windowEnd > now && (
            <p className="mt-4 text-body text-ink-2">
              {goal}:{24 - goal} хэмнэлээр дараагийн мацаг <span className="font-semibold text-ink tnum">{hm(windowEnd)}</span>-д.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-display font-light tracking-[-0.05em] text-ink-3 tnum" aria-hidden="true">
            0:00
          </p>
          <p className="mt-3 max-w-[30ch] text-body text-ink-2">
            {goal} цаг мацаг, {24 - goal} цаг хооллох цонх. Эхлүүлмэгц явц энд харагдана.
          </p>
        </>
      )}
      <button className="btn-primary mt-5 w-full" onClick={() => openSheet('fast-start')}>
        Мацаг эхлүүлэх
      </button>
    </section>
  );
}

/** One soft light source in the hero's corner: depth, not decoration. */
function Glow() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full opacity-70 blur-3xl"
      style={{ background: 'radial-gradient(circle, var(--green-soft), transparent 70%)' }}
    />
  );
}

/* ---------- opt-in hourly nudge ---------- */
function HourlyNudge({ d, now }: { d: Data; now: number }) {
  const { openSheet } = useUI();
  const p = d.profile;
  const h = new Date(now).getHours();
  if (!p.hourlyPrompt || isQuiet(h, p.quietStart, p.quietEnd)) return null;
  if (p.lastPromptHour === promptKey(now)) return null;
  return (
    <button
      onClick={() => openSheet('hunger')}
      className="tap rise-in mb-4 flex min-h-[52px] w-full items-center gap-3 rounded-[18px] bg-amber-soft px-4 text-left"
    >
      <IconHunger size={20} className="text-amber-ink" />
      <span className="flex-1 text-body">
        <span className="font-semibold tnum">{hm(now)}</span> <span className="text-ink-2">— одоо хэр өлсөж байна?</span>
      </span>
      <span className="text-footnote font-semibold text-amber-ink">Тэмдэглэх</span>
    </button>
  );
}

/* ---------- 2. ACTION: hunger, one thumb ---------- */
function HungerCard({ d, now }: { d: Data; now: number }) {
  const { openSheet } = useUI();
  if (!d.profile.visibleMetrics.includes('hunger')) {
    return (
      <button className="btn-primary btn-amber mt-4 w-full" onClick={() => openSheet('hunger')}>
        <IconPlus size={20} /> Өлсөлт бүртгэх
      </button>
    );
  }
  const today = d.hunger.filter((h) => dayKey(h.timestamp) === dayKey(now));
  const avg = today.length ? today.reduce((a, h) => a + h.intensity, 0) / today.length : null;
  const lastH = today[today.length - 1];
  const frac = (t: number) => {
    const x = new Date(t);
    return (x.getHours() + x.getMinutes() / 60) / 24;
  };
  return (
    <>
      <GroupTitle title="Одоо ямар байна?" />
      <section className="grouped p-4" aria-label="Өнөөдрийн өлсөлт">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Badge tone="amber">
              <IconHunger size={18} />
            </Badge>
            <span className="text-title font-semibold">Өлсөлт</span>
          </div>
          {lastH && (
            <button
              onClick={() => openSheet('hunger-detail', lastH.id)}
              className="tap -my-2 min-h-[44px] rounded-full px-2 text-footnote font-medium text-ink-2 tnum"
            >
              Сүүлд {hm(lastH.timestamp)}-д: <span className="font-semibold text-ink">{lastH.intensity}</span>
            </button>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          {avg != null ? (
            <p className="tnum">
              <span className="text-[44px] leading-none font-light tracking-[-0.04em] text-amber-ink">{avg.toFixed(1)}</span>
              <span className="ml-1 text-body font-medium text-ink-2">/ 10</span>
              <span className="mt-1 block text-footnote text-ink-2">
                өнөөдрийн дундаж · {today.length} бүртгэл
              </span>
            </p>
          ) : (
            <p className="max-w-[24ch] text-body text-ink-2">Өнөөдөр хараахан бүртгэл алга.</p>
          )}
        </div>
        {/* today's entries on a 24h strip */}
        <div className="relative mt-4 h-5" aria-hidden="true">
          <div className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-fill-2" />
          <div
            className="absolute top-1/2 h-[10px] w-[2px] -translate-y-1/2 rounded-full bg-ink-3"
            style={{ left: `${frac(now) * 100}%` }}
          />
          {today.map((h) => (
            <span
              key={h.id}
              className="absolute top-1/2 rounded-full border-2 border-surface"
              style={{
                left: `${frac(h.timestamp) * 100}%`,
                width: 8 + h.intensity,
                height: 8 + h.intensity,
                transform: 'translate(-50%, -50%)',
                background: `color-mix(in srgb, var(--amber) ${40 + h.intensity * 6}%, transparent)`,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10.5px] font-medium text-ink-3 tnum" aria-hidden="true">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
        <button
          className="btn-tinted mt-4 min-h-[52px] w-full bg-amber-soft text-[16px] text-amber-ink"
          onClick={() => openSheet('hunger')}
        >
          <IconPlus size={20} strokeWidth={2} />
          Өлсөлт бүртгэх
        </button>
      </section>
    </>
  );
}

/* ---------- 3. TODAY: widgets ---------- */
interface Widget {
  key: MetricKey;
  tone: Tone;
  icon: React.ReactNode;
  label: string;
  value: string | null;
  unit?: string;
  foot?: React.ReactNode;
  open: () => void;
}

function TodayWidgets({ d, now }: { d: Data; now: number }) {
  const { openSheet, toast } = useUI();
  const today = dayKey(now);
  const visible = d.profile.visibleMetrics;

  const lastW = d.weights[d.weights.length - 1];
  const wk = d.weights.filter((w) => w.timestamp >= now - 7 * 24 * HOUR);
  const wDelta = wk.length >= 2 ? +(lastW.weight - wk[0].weight).toFixed(1) : null;
  const sl = [...d.sleep].reverse().find((s) => dayKey(s.wakeTime) === today);
  const h = d.profile.heightCm;
  const bmi = lastW && h ? lastW.weight / (h / 100) ** 2 : null;
  const fastToday = d.fasts.filter((f) => dayKey(f.endTime) === today).reduce((a, f) => a + (f.endTime - f.startTime), 0);
  const water = d.water.filter((w) => dayKey(w.timestamp) === today).reduce((a, w) => a + w.amount, 0);
  const goal = d.profile.waterGoalMl;

  const vital = (k: VitalType, icon: React.ReactNode, tone: Tone): Widget => {
    const v = [...d.vitals].reverse().find((x) => x.type === k);
    return {
      key: k,
      tone,
      icon,
      label: VITALS[k].name,
      value: v ? (v.value2 != null ? `${v.value}/${v.value2}` : String(v.value)) : null,
      unit: VITALS[k].unit,
      foot: v ? relDay(v.timestamp) : undefined,
      open: () => openSheet('vital', k),
    };
  };

  const base: Widget[] = [
    {
      key: 'weight',
      tone: 'teal',
      icon: <IconScale size={17} />,
      label: 'Жин',
      value: lastW ? String(lastW.weight) : null,
      unit: 'кг',
      foot: wDelta ? <Trend delta={wDelta} unit="кг" /> : lastW ? relDay(lastW.timestamp) : undefined,
      open: () => openSheet('weight'),
    },
    {
      key: 'sleep',
      tone: 'indigo',
      icon: <IconMoon size={17} />,
      label: 'Нойр',
      value: sl ? shortDur(sl.duration * 60e3) : null,
      foot: sl ? `${hm(sl.sleepStart)} – ${hm(sl.wakeTime)}` : undefined,
      open: () => openSheet('sleep'),
    },
    {
      key: 'fasting',
      tone: 'green',
      icon: <IconTimer size={17} />,
      label: 'Өнөөдрийн мацаг',
      value: fastToday ? shortDur(fastToday) : null,
      open: () => (d.activeFast ? openSheet('goal') : openSheet('fast-start')),
    },
    {
      key: 'bmi',
      tone: 'teal',
      icon: <IconScale size={17} />,
      label: 'BMI',
      value: bmi ? bmi.toFixed(1) : null,
      foot: !h ? 'Өндрөө оруулна уу' : undefined,
      open: () => openSheet('weight'),
    },
    vital('steps', <IconSteps size={17} />, 'green'),
    vital('hr', <IconHeart size={17} />, 'amber'),
    vital('glucose', <IconDrop size={17} />, 'indigo'),
    vital('ketone', <IconDrop size={17} />, 'teal'),
    vital('bp', <IconHeart size={17} />, 'indigo'),
  ];
  const widgets = base.filter((w) => visible.includes(w.key));

  const addW = (ml: number) => {
    const { ok, id } = addWater(ml);
    if (ok) toast(`+${ml} мл ус`, { action: { label: 'Буцаах', run: () => removeEntry('water', id) } });
    else toast('Мэдээллийг хадгалж чадсангүй.', { tone: 'error' });
  };

  if (!widgets.length && !visible.includes('water')) return null;

  return (
    <>
      <GroupTitle title="Таны өнөөдөр" />
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2">
        {visible.includes('water') && (
          <div className="grouped flex w-[236px] shrink-0 snap-start flex-col p-4">
            <button onClick={() => openSheet('water')} className="text-left active:opacity-70">
              <span className="flex items-center gap-2">
                <Badge tone="blue" size={26}>
                  <IconDrop size={16} />
                </Badge>
                <span className="text-footnote font-semibold text-ink-2">Ус</span>
              </span>
              <span className="mt-3 block tnum">
                <span className="text-[30px] leading-none font-light tracking-[-0.03em] text-blue-ink">{(water / 1000).toFixed(1)}</span>
                <span className="ml-1 text-footnote font-medium text-ink-2">/ {(goal / 1000).toFixed(1)} л</span>
              </span>
            </button>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-soft" aria-hidden="true">
              <div
                className="h-full rounded-full bg-blue transition-[width] duration-500 ease-[var(--ease-out-soft)]"
                style={{ width: `${Math.min(100, (water / goal) * 100)}%` }}
              />
            </div>
            <div className="mt-3 flex gap-2">
              {[250, 500].map((ml) => (
                <button
                  key={ml}
                  onClick={() => addW(ml)}
                  aria-label={`${ml} мл ус нэмэх`}
                  className="tap min-h-[40px] flex-1 rounded-[12px] bg-blue-soft text-footnote font-semibold text-blue-ink tnum"
                >
                  +{ml}
                </button>
              ))}
            </div>
          </div>
        )}
        {widgets.map((w) => (
          <button
            key={w.key}
            onClick={w.open}
            className="grouped tap flex min-h-[148px] w-[148px] shrink-0 snap-start flex-col p-4 text-left"
          >
            <span className="flex items-center gap-2">
              <Badge tone={w.tone} size={26}>
                {w.icon}
              </Badge>
              <span className="truncate text-footnote font-semibold text-ink-2">{w.label}</span>
            </span>
            <span className="mt-auto block pt-3 tnum">
              {w.value ? (
                <>
                  <span className="text-[28px] leading-none font-light tracking-[-0.03em]" style={{ color: TONE[w.tone].ink }}>
                    {w.value}
                  </span>
                  {w.unit && <span className="ml-1 text-footnote font-medium text-ink-2">{w.unit}</span>}
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-body font-semibold" style={{ color: TONE[w.tone].ink }}>
                  <IconPlus size={16} strokeWidth={2} /> Нэмэх
                </span>
              )}
            </span>
            <span className="mt-1.5 block min-h-[18px] text-caption text-ink-2">{w.foot}</span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------- 4. PATTERN ---------- */
function PatternCard({ d, now }: { d: Data; now: number }) {
  const { openSheet } = useUI();
  const [range, setRange] = useState(14);
  const prof = useMemo(() => hungerProfile(inRange(d.hunger, range, now)), [d.hunger, range, now]);
  const total = d.hunger.length;

  if (total < MIN_ENTRIES) {
    return (
      <>
        <GroupTitle title="Өлсөлтийн хэв маяг" />
        <section className="grouped p-5">
          <Badge tone="amber" size={36}>
            <IconHunger size={20} />
          </Badge>
          <p className="mt-3 text-title font-semibold">Таны хэв маяг хараахан бүрдээгүй байна.</p>
          <p className="mt-1 max-w-[34ch] text-body text-ink-2">
            Хэд хэдэн удаа өлсөлтөө бүртгэсний дараа өдрийн аль цагт хамгийн их өлсдөгийг тань энд харуулна.
          </p>
          <div className="mt-4 flex items-center gap-3" aria-label={`${total} / ${MIN_ENTRIES} бүртгэл`}>
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {Array.from({ length: MIN_ENTRIES }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < total ? 'bg-amber' : 'bg-fill'}`} />
              ))}
            </div>
            <span className="text-footnote font-semibold text-ink-2 tnum">
              {total} / {MIN_ENTRIES}
            </span>
          </div>
        </section>
      </>
    );
  }

  const nowH = new Date(now).getHours() + new Date(now).getMinutes() / 60;
  return (
    <>
      <GroupTitle title="Өлсөлтийн хэв маяг" />
      <section className="grouped p-5" aria-label="Өлсөлтийн хэв маяг">
        {prof.peak ? (
          <>
            <p className="text-[34px] leading-tight font-light tracking-[-0.035em] text-amber-ink tnum">{windowLabel(prof.peak)}</p>
            <p className="mt-1 text-body text-ink-2">Таны өлсөлт ихэвчлэн энэ үед хамгийн өндөр байна.</p>
            <p className="mt-3 inline-flex items-baseline gap-1.5 rounded-full bg-amber-soft px-3 py-1 tnum">
              <span className="text-body font-bold text-amber-ink">{prof.average!.toFixed(1)}</span>
              <span className="text-footnote font-medium text-ink-2">/ 10 дундаж</span>
            </p>
          </>
        ) : (
          <p className="text-body text-ink-2">
            Сүүлийн {range} хоногт хэв маяг гаргахад бүртгэл хангалтгүй байна. Хугацааг уртасгаж үзээрэй.
          </p>
        )}
        <div className="mt-6 -mx-1">
          <HungerArea profile={prof} nowHour={nowH} height={160} />
        </div>
        <div className="mt-4">
          <Segmented
            label="Хугацаа"
            value={range}
            onChange={setRange}
            options={[
              { value: 7, label: '7 хоног' },
              { value: 14, label: '14 хоног' },
              { value: 30, label: '30 хоног' },
            ]}
          />
        </div>
      </section>
    </>
  );
}

/* ---------- quiet backup reminder ---------- */
function BackupNudge({ d, now }: { d: Data; now: number }) {
  const { toast } = useUI();
  const due = backupDue(d, now);
  if (!due) return null;
  return (
    <section className="grouped mt-8 p-4" aria-label="Нөөц хуулбар">
      <div className="flex items-center gap-3">
        <Badge tone="blue">
          <IconDownload size={17} />
        </Badge>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium">Нөөц хуулбар хийх үү?</span>
          <span className="block text-caption text-ink-2">
            {due.never ? 'Хараахан нөөцлөөгүй байна' : `Сүүлд ${due.days} хоногийн өмнө нөөцөлсөн`}
          </span>
        </span>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="tap min-h-[40px] rounded-full px-3.5 text-footnote font-semibold text-ink-2" onClick={snoozeBackup}>
          7 хоногийн дараа
        </button>
        <button
          className="tap min-h-[40px] rounded-full bg-blue-soft px-4 text-footnote font-semibold text-blue-ink"
          onClick={() => {
            exportData(d, 'json');
            toast('Нөөц хуулбар татагдлаа');
          }}
        >
          Экспорт хийх
        </button>
      </div>
    </section>
  );
}

function OpenFromQuery() {
  const params = useSearchParams();
  const { openSheet } = useUI();
  useEffect(() => {
    if (params.get('log') === 'hunger') {
      openSheet('hunger');
      history.replaceState(null, '', '/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  return null;
}

'use client';

import { useState } from 'react';
import { FastDial } from '../charts';
import { IconCalendar, IconCheck, IconChevron, IconEdit, IconTimer } from '../icons';
import { Badge, Group, GroupTitle, Row, Screen, Skeleton, useNow, useUI } from '../ui';
import { GOALS } from '../Sheets';
import { replaceAll, useData, useHydrated } from '@/lib/store';
import { endFast } from '@/lib/actions';
import { addFastToCalendar, calendarState } from '@/lib/calendar';
import { DAY, HOUR, clockDur, hm, longDur, relDay, secs, shortDur } from '@/lib/time';
import type { Data } from '@/lib/types';

export const goalLabel = (h: number) => GOALS.find((g) => g.h === h)?.label ?? `${h} цаг`;

export default function Fast() {
  const hydrated = useHydrated();
  const d = useData();
  const goal = d.activeFast?.targetHours ?? d.profile.fastingGoalH;
  return (
    <Screen title="Мацаг" sub={hydrated ? `${goal} цаг мацаг · ${Math.max(0, 24 - goal)} цаг хооллох цонх` : ' '}>
      {hydrated ? (
        <>
          <Current d={d} />
          <History d={d} />
          <p className="mt-8 px-1 text-footnote leading-relaxed text-ink-2">
            Мацаг барих үед толгой эргэх, ухаан балартах зэрэг зовиур илэрвэл мацгаа зогсоож, шаардлагатай бол мэргэжлийн
            эмчтэй зөвлөлдөнө үү.
          </p>
        </>
      ) : (
        <div aria-busy="true" className="space-y-4">
          <Skeleton className="h-[460px] rounded-[28px]" />
        </div>
      )}
    </Screen>
  );
}

function Legend() {
  const item = (color: string, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {text}
    </span>
  );
  return (
    <div className="mt-1 flex justify-center gap-4 text-caption font-medium text-ink-2">
      {item('var(--green)', 'Өнгөрсөн')}
      {item('var(--green-soft)', 'Үлдсэн')}
      {item('var(--fill-2)', 'Хооллох цонх')}
    </div>
  );
}

function Current({ d }: { d: Data }) {
  const now = useNow(1000);
  const { openSheet, toast } = useUI();
  const f = d.activeFast;

  if (f) {
    const el = now - f.startTime;
    const endT = f.startTime + f.targetHours * HOUR;
    const left = endT - now;
    const p = Math.min(100, Math.round((el / (f.targetHours * HOUR)) * 100));
    const end = () => {
      const snap: Data = structuredClone(d);
      const early = f.calendar && now < endT;
      if (endFast())
        toast(early ? `Мацаг дууслаа · ${shortDur(el)}. Календарийн сануулгыг хүсвэл устгаарай.` : `Мацаг дууслаа · ${shortDur(el)}`, {
          action: { label: 'Буцаах', run: () => replaceAll(snap) },
        });
      else toast('Мэдээллийг хадгалж чадсангүй.', { tone: 'error' });
    };
    return (
      <>
        <section aria-label="Одоогийн мацаг" className="hero px-5 pt-5 pb-5">
          <FastDial start={f.startTime} end={endT} now={now} fasting>
            <div>
              <p className="flex items-baseline justify-center tnum" aria-label={`${longDur(el)} өнгөрсөн`}>
                <span className="text-[40px] leading-none font-light tracking-[-0.045em]">{clockDur(el)}</span>
                <span className="ml-0.5 text-title font-light text-ink-2" aria-hidden="true">
                  {secs(el)}
                </span>
              </p>
              <p className="mt-1.5 text-footnote font-semibold text-green-ink tnum">
                {p}% · {f.targetHours} цагийн зорилго
              </p>
            </div>
          </FastDial>
          <Legend />
          <dl className="mt-5 grid grid-cols-3 rounded-[18px] bg-fill-2 py-3 text-center">
            <Fact k="Эхэлсэн" v={hm(f.startTime)} sub={relDay(f.startTime)} />
            <Fact k="Дуусах" v={hm(endT)} sub={relDay(endT)} />
            <Fact k={left > 0 ? 'Үлдсэн' : 'Илүү'} v={clockDur(Math.abs(left))} sub={left > 0 ? 'цаг:мин' : 'зорилгоос'} />
          </dl>
          <button className="btn-primary mt-4 w-full" onClick={end}>
            Мацаг дуусгах
          </button>
        </section>
        <Group className="mt-4">
          <Row onClick={() => openSheet('goal')}>
            <Badge tone="green">
              <IconTimer size={17} />
            </Badge>
            <span className="flex-1 text-body font-medium">Зорилгыг өөрчлөх</span>
            <span className="text-body text-ink-2 tnum">{goalLabel(f.targetHours)}</span>
            <IconChevron size={16} className="text-ink-3" />
          </Row>
          <Row onClick={() => openSheet('fast-edit')}>
            <Badge tone="green">
              <IconEdit size={16} />
            </Badge>
            <span className="flex-1 text-body font-medium">Эхэлсэн цагийг засах</span>
            <IconChevron size={16} className="text-ink-3" />
          </Row>
          <CalendarRow fast={f} />
          <Row>
            <span className="w-[30px]" aria-hidden="true" />
            <span className="flex-1 text-body text-ink-2">Хооллох цонх</span>
            <span className="text-body font-semibold tnum">
              {hm(endT)} – {hm(f.startTime + DAY)}
            </span>
          </Row>
        </Group>
      </>
    );
  }

  const last = d.fasts[d.fasts.length - 1];
  const goal = d.profile.fastingGoalH;
  return (
    <>
      <section aria-label="Хооллох цонх" className="hero px-5 pt-5 pb-5">
        {last ? (
          <>
            <FastDial start={last.startTime} end={last.endTime} now={now} fasting={false}>
              <div>
                <p className="text-footnote font-semibold text-ink-2">Хооллох цонх</p>
                <p className="mt-1 text-[38px] leading-none font-light tracking-[-0.045em] tnum">{clockDur(now - last.endTime)}</p>
                <p className="mt-1.5 text-footnote text-ink-2">сүүлийн мацгаас хойш</p>
              </div>
            </FastDial>
            <p className="mt-3 text-center text-body text-ink-2">
              Сүүлийн мацаг {relDay(last.endTime).toLowerCase()} <span className="font-semibold text-ink tnum">{hm(last.endTime)}</span>-д
              дууссан · {shortDur(last.endTime - last.startTime)}
            </p>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto w-fit">
              <Badge tone="green" size={52}>
                <IconTimer size={28} />
              </Badge>
            </div>
            <p className="mt-4 text-title font-semibold">Мацаг хараахан эхлээгүй байна</p>
            <p className="mx-auto mt-1 max-w-[30ch] text-body text-ink-2">
              Эхлүүлмэгц өдрийн аль хэсэгт мацаглаж, аль хэсэгт хооллож байгаагаа энд харна.
            </p>
          </div>
        )}
        <button className="btn-primary mt-5 w-full" onClick={() => openSheet('fast-start')}>
          Мацаг эхлүүлэх
        </button>
      </section>
      <Group className="mt-4">
        <Row onClick={() => openSheet('goal')}>
          <Badge tone="green">
            <IconTimer size={17} />
          </Badge>
          <span className="flex-1 text-body font-medium">Мацгийн зорилго</span>
          <span className="text-body text-ink-2 tnum">{goalLabel(goal)}</span>
          <IconChevron size={16} className="text-ink-3" />
        </Row>
      </Group>
    </>
  );
}

/** Hands the fast's end time to the phone calendar, which alerts reliably even when the app is closed. */
function CalendarRow({ fast }: { fast: NonNullable<Data['activeFast']> }) {
  const { toast } = useUI();
  const st = calendarState(fast);
  return (
    <Row
      onClick={() => {
        addFastToCalendar(fast);
        toast(st === 'stale' ? 'Шинэ цагийг календарьт илгээлээ' : 'Календарийн сануулга үүслээ');
      }}
    >
      <Badge tone="green">
        <IconCalendar size={17} />
      </Badge>
      <span className="min-w-0 flex-1">
        <span className="block text-body font-medium">
          {st === 'none' ? 'Дуусах үед сануулах' : st === 'stale' ? 'Календарийн сануулгыг шинэчлэх' : 'Календарьт нэмсэн'}
        </span>
        <span className={`block text-caption ${st === 'stale' ? 'text-amber-ink' : 'text-ink-2'}`}>
          {st === 'none'
            ? 'Утасны календарь яг цагт нь мэдэгдэнэ'
            : st === 'stale'
              ? 'Цаг өөрчлөгдсөн. Хуучин сануулга үлдсэн бол календараас устгана уу'
              : `${hm(fast.calendar!.end)}-д сануулна · дахин нэмэх`}
        </span>
      </span>
      {st === 'ok' ? (
        <IconCheck size={18} strokeWidth={2.2} className="text-green-ink" />
      ) : (
        <IconChevron size={16} className="text-ink-3" />
      )}
    </Row>
  );
}

function Fact({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="px-1 [&:not(:last-child)]:shadow-[1px_0_0_var(--sep)]">
      <dt className="text-caption font-medium text-ink-2">{k}</dt>
      <dd className="mt-0.5 text-[18px] font-medium tracking-[-0.02em] tnum">{v}</dd>
      {sub && <dd className="text-caption text-ink-2">{sub}</dd>}
    </div>
  );
}

function History({ d }: { d: Data }) {
  const { openSheet } = useUI();
  const [all, setAll] = useState(false);
  const fasts = [...d.fasts].reverse();
  if (!fasts.length) return null;
  const shown = all ? fasts : fasts.slice(0, 7);
  const month = d.fasts.filter((f) => f.endTime > Date.now() - 30 * DAY);
  const avg = month.length ? month.reduce((a, f) => a + f.endTime - f.startTime, 0) / month.length : 0;
  const maxDur = Math.max(...shown.map((f) => f.endTime - f.startTime), ...shown.map((f) => f.targetHours * HOUR));

  return (
    <>
      <GroupTitle
        title="Өмнөх мацгууд"
        note={month.length ? `Сүүлийн 30 хоногт ${month.length} мацаг · дундаж ${shortDur(avg)}` : undefined}
      />
      <Group>
        {shown.map((f) => {
          const dur = f.endTime - f.startTime;
          return (
            <Row key={f.id} onClick={() => openSheet('fast-detail', f.id)} className="min-h-[64px]">
              <span className="w-[5.2rem] shrink-0 text-footnote font-medium text-ink-2">{relDay(f.endTime)}</span>
              <span className="min-w-0 flex-1">
                <span className="text-title font-semibold tracking-[-0.01em] tnum">{shortDur(dur)}</span>
                <span className="relative mt-1.5 block h-[5px] rounded-full bg-fill-2" aria-hidden="true">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${(dur / maxDur) * 100}%`,
                      background: f.completed ? 'var(--green)' : 'color-mix(in srgb, var(--green) 40%, transparent)',
                    }}
                  />
                  <span
                    className="absolute -top-[2px] h-[9px] w-[2px] rounded-full bg-ink-3"
                    style={{ left: `${((f.targetHours * HOUR) / maxDur) * 100}%` }}
                  />
                </span>
              </span>
              <span className="grid w-7 place-items-center">
                {f.completed ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-green-soft text-green-ink">
                    <IconCheck size={14} strokeWidth={2.4} aria-label="Зорилгод хүрсэн" />
                  </span>
                ) : (
                  <span className="text-caption font-semibold text-ink-2 tnum">{f.targetHours}ц</span>
                )}
              </span>
              <IconChevron size={16} className="text-ink-3" />
            </Row>
          );
        })}
      </Group>
      {fasts.length > 7 && (
        <button className="btn-text mt-1 ml-1" onClick={() => setAll((a) => !a)}>
          {all ? 'Хураах' : `Бүгдийг харах (${fasts.length})`}
        </button>
      )}
    </>
  );
}

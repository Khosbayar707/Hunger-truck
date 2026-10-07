'use client';

import { useMemo, useState } from 'react';
import { DayBars, HungerArea, TrendArea, WaterDays } from '../charts';
import { IconChevron, IconDrop, IconHeart, IconHunger, IconMoon, IconPlus, IconScale, IconSteps, IconTimer } from '../icons';
import { Badge, Group, GroupTitle, Row, Screen, Segmented, Skeleton, TONE, Trend, useUI, type Tone } from '../ui';
import { VITALS } from '../Sheets';
import { useData, useHydrated } from '@/lib/store';
import { HUNGER_WORDS, MIN_ENTRIES, daySeries, hungerProfile, inRange, insights, weightChange, windowLabel } from '@/lib/analysis';
import { DAY, WEEKDAYS, WEEKDAY_SHORT, dayKey, hm, pad, relDay, shortDur } from '@/lib/time';
import type { Data, VitalType } from '@/lib/types';

type Range = 1 | 7 | 30;

/** each insight wears the identity of the metric it talks about */
const INSIGHT_TONE: Record<string, [Tone, React.ReactNode]> = {
  low: ['amber', <IconHunger key="h" size={16} />],
  'fast-hours': ['green', <IconTimer key="t" size={16} />],
  'fast-peak': ['green', <IconTimer key="t" size={16} />],
  sleep: ['indigo', <IconMoon key="m" size={16} />],
  water: ['blue', <IconDrop key="d" size={16} />],
};

export default function History() {
  const hydrated = useHydrated();
  const d = useData();
  const [range, setRange] = useState<Range>(7);
  return (
    <Screen title="Түүх" sub="Таны хэв маяг">
      <Segmented<Range>
        label="Хугацаа сонгох"
        value={range}
        onChange={setRange}
        options={[
          { value: 1, label: 'Өнөөдөр' },
          { value: 7, label: '7 хоног' },
          { value: 30, label: '30 хоног' },
        ]}
      />
      {!hydrated ? (
        <div aria-busy="true" className="mt-5 space-y-4">
          <Skeleton className="h-[320px]" />
          <Skeleton className="h-[220px]" />
        </div>
      ) : range === 1 ? (
        <DayLog key="day" d={d} />
      ) : (
        <Patterns key={range} d={d} range={range} />
      )}
    </Screen>
  );
}

/** Metric card header: identity badge + name, optional trailing action. */
function CardHead({ tone, icon, title, aside }: { tone: Tone; icon: React.ReactNode; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Badge tone={tone}>{icon}</Badge>
        <h2 className="text-title font-semibold tracking-[-0.01em]">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

function Figure({ value, unit, tone, note }: { value: string; unit?: string; tone: Tone; note: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="tnum">
        <span className="text-figure font-light tracking-[-0.035em]" style={{ color: TONE[tone].ink }}>
          {value}
        </span>
        {unit && <span className="ml-1 text-body font-medium text-ink-2">{unit}</span>}
      </p>
      <p className="mt-1 text-footnote text-ink-2">{note}</p>
    </div>
  );
}

/* ---------- 7 / 30 day patterns ---------- */
function Patterns({ d, range }: { d: Data; range: 7 | 30 }) {
  const now = Date.now();
  const prof = useMemo(() => hungerProfile(inRange(d.hunger, range, now)), [d.hunger, range, now]);
  const ins = useMemo(() => insights(d, range, now), [d, range, now]);
  const days = useMemo(() => daySeries(d, range, now), [d, range, now]);
  const dates = days.map((m) => new Date(m.date + 'T12:00'));
  const labels = dates.map((t) => (range === 7 ? WEEKDAY_SHORT[t.getDay()] : String(t.getDate())));
  const longLabels = dates.map((t) => (range === 7 ? WEEKDAYS[t.getDay()] : `${t.getMonth() + 1}/${t.getDate()} · ${WEEKDAY_SHORT[t.getDay()]}`));
  const has = (xs: (number | null)[]) => xs.some((x) => x);
  const avgOf = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => !!x);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const rangeText = range === 7 ? '7 хоногийн' : '30 хоногийн';
  const otherIns = ins.filter((i) => i.id !== 'peak');

  return (
    <div className="rise-in">
      <HungerByTime prof={prof} range={range} />

      <GroupTitle title="Ажиглалт" note="Зөвхөн таны өөрийн бүртгэлээс" />
      {otherIns.length ? (
        <Group>
          {otherIns.map((i) => (
            <Row key={i.id} className="items-start py-3.5" inset={58}>
              <Badge tone={INSIGHT_TONE[i.id]?.[0] ?? 'amber'}>{INSIGHT_TONE[i.id]?.[1] ?? <IconHunger size={16} />}</Badge>
              <p className="flex-1 text-body leading-snug">{i.text}</p>
            </Row>
          ))}
        </Group>
      ) : (
        <div className="grouped p-4 text-body text-ink-2">
          Одоогоор хангалттай мэдээлэл алга. Өлсөлт, нойр, усаа тогтмол тэмдэглэх тусам энд ажиглалт гарна.
        </div>
      )}

      <Weight d={d} range={range} />

      {has(days.map((m) => m.fastingDuration)) && (
        <section className="grouped mt-4 p-4" aria-label="Мацгийн хугацаа">
          <CardHead tone="green" icon={<IconTimer size={17} />} title="Мацгийн хугацаа" />
          <Figure
            tone="green"
            value={shortDur(avgOf(days.map((m) => m.fastingDuration || null)) * 60e3)}
            note={
              <>
                өдрийн дундаж · <span className="font-semibold text-ink">Зорилго {d.profile.fastingGoalH} цаг</span>
              </>
            }
          />
          <div className="mt-6">
            <DayBars
              tone="green"
              label="Өдөр бүрийн мацгийн хугацаа"
              values={days.map((m) => (m.fastingDuration ? m.fastingDuration / 60 : null))}
              labels={labels}
              longLabels={longLabels}
              goal={d.profile.fastingGoalH}
              format={(v) => shortDur(v * 3600e3)}
            />
          </div>
        </section>
      )}

      {has(days.map((m) => m.sleepDuration)) && (
        <section className="grouped mt-4 p-4" aria-label="Нойр">
          <CardHead tone="indigo" icon={<IconMoon size={17} />} title="Нойр" />
          <Figure
            tone="indigo"
            value={shortDur(avgOf(days.map((m) => m.sleepDuration)) * 60e3)}
            note={
              <>
                {rangeText} дундаж · <span className="font-semibold text-ink">Зорилго 7 цаг</span>
              </>
            }
          />
          <div className="mt-6">
            <DayBars
              tone="indigo"
              label="Шөнө бүрийн нойр"
              values={days.map((m) => (m.sleepDuration ? m.sleepDuration / 60 : null))}
              labels={labels}
              longLabels={longLabels}
              goal={7}
              format={(v) => shortDur(v * 3600e3)}
            />
          </div>
        </section>
      )}

      {has(days.map((m) => m.waterAmount)) && (
        <section className="grouped mt-4 p-4" aria-label="Ус">
          <CardHead tone="blue" icon={<IconDrop size={17} />} title="Ус" />
          <Figure
            tone="blue"
            value={(avgOf(days.map((m) => m.waterAmount || null)) / 1000).toFixed(1)}
            unit="л"
            note={
              <>
                өдрийн дундаж · зорилгод{' '}
                <span className="font-semibold text-ink tnum">
                  {days.filter((m) => m.waterAmount >= d.profile.waterGoalMl).length} / {range}
                </span>{' '}
                өдөр хүрсэн
              </>
            }
          />
          <div className="mt-5">
            <WaterDays values={days.map((m) => m.waterAmount)} labels={labels} goal={d.profile.waterGoalMl} />
          </div>
        </section>
      )}

      <Vitals d={d} range={range} />
      <Records d={d} range={range} />
    </div>
  );
}

function HungerByTime({ prof, range }: { prof: ReturnType<typeof hungerProfile>; range: number }) {
  const { openSheet } = useUI();
  if (!prof.enough) {
    return (
      <section className="grouped mt-5 p-5">
        <Badge tone="amber" size={36}>
          <IconHunger size={20} />
        </Badge>
        <h2 className="mt-3 text-title font-semibold">Өлсөлтийн хэв маяг хараахан бүрдээгүй байна.</h2>
        <p className="mt-1 text-body text-ink-2">
          Сүүлийн {range} хоногт {prof.n} бүртгэл байна. {MIN_ENTRIES}-аас дээш бүртгэл, дор хаяж 2 өдөр хэрэгтэй. Дараа нь
          таны өлсөлт өдрийн аль цагт оргилдогийг энд харуулна.
        </p>
        <button className="btn-tinted mt-4 w-full bg-amber-soft text-amber-ink" onClick={() => openSheet('hunger')}>
          <IconPlus size={18} strokeWidth={2} /> Өлсөлт бүртгэх
        </button>
      </section>
    );
  }
  const marks = [6, 9, 12, 15, 18, 21].map((h) => {
    const xs = prof.hourly.filter((x) => x.h >= h && x.h < h + 3 && x.avg != null);
    const c = xs.reduce((a, x) => a + x.count, 0);
    const v = c ? xs.reduce((a, x) => a + (x.avg as number) * x.count, 0) / c : null;
    return { h, v };
  });
  const top = marks.reduce((a, b) => ((b.v ?? -1) > (a.v ?? -1) ? b : a));
  return (
    <section className="grouped mt-5 p-5" aria-label="Цаг тус бүрийн өлсөлт">
      <CardHead tone="amber" icon={<IconHunger size={17} />} title="Таны өлсөлтийн оргил үе" />
      <p className="mt-4 text-[38px] leading-tight font-light tracking-[-0.04em] text-amber-ink tnum">{windowLabel(prof.peak!)}</p>
      <p className="mt-1 text-body text-ink-2">Таны өлсөлт ихэвчлэн энэ үед хамгийн өндөр байна.</p>
      <p className="mt-2 text-footnote text-ink-2 tnum">
        Оргил үед <span className="font-bold text-amber-ink">{prof.peak!.value.toFixed(1)}</span> · дундаж{' '}
        <span className="font-semibold text-ink">{prof.average!.toFixed(1)}</span> / 10 · {prof.n} бүртгэл
      </p>
      <div className="mt-6 -mx-1">
        <HungerArea profile={prof} />
      </div>
      <dl className="mt-4 grid grid-cols-6 rounded-[14px] bg-fill-2 py-2.5 text-center">
        {marks.map((m) => (
          <div key={m.h}>
            <dt className={`text-caption tnum ${m === top ? 'font-semibold text-amber-ink' : 'text-ink-2'}`}>{pad(m.h)}:00</dt>
            <dd className={`mt-0.5 text-body tnum ${m === top ? 'font-bold text-amber-ink' : 'font-medium'}`}>
              {m.v != null ? m.v.toFixed(1) : '—'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Weight({ d, range }: { d: Data; range: number }) {
  const { openSheet } = useUI();
  const from = Date.now() - range * DAY;
  const pts = d.weights.filter((w) => w.timestamp >= from).map((w) => ({ t: w.timestamp, v: w.weight }));
  const last = d.weights[d.weights.length - 1];
  if (!last) return null;
  const change = weightChange(d, range);
  return (
    <section className="grouped mt-4 p-4" aria-label="Жин">
      <CardHead
        tone="teal"
        icon={<IconScale size={17} />}
        title="Жин"
        aside={
          <button className="btn-text -my-2 text-teal-ink" style={{ color: 'var(--teal-ink)' }} onClick={() => openSheet('weight')}>
            <IconPlus size={16} strokeWidth={2} /> Нэмэх
          </button>
        }
      />
      <Figure
        tone="teal"
        value={String(last.weight)}
        unit="кг"
        note={
          change != null ? (
            <span className="inline-flex items-center gap-1.5">
              <Trend delta={change} unit="кг" /> Сүүлийн {range} хоногийн өөрчлөлт
            </span>
          ) : (
            `Сүүлийн ${range} хоногийн чиг хандлага`
          )
        }
      />
      {pts.length >= 2 && (
        <div className="mt-8">
          <TrendArea points={pts} unit="кг" label={`Сүүлийн ${range} хоногийн жин`} tone="teal" minSpan={2} />
        </div>
      )}
    </section>
  );
}

const VITAL_ICON: Record<VitalType, React.ReactNode> = {
  steps: <IconSteps size={17} />,
  hr: <IconHeart size={17} />,
  glucose: <IconDrop size={17} />,
  ketone: <IconDrop size={17} />,
  bp: <IconHeart size={17} />,
};
const VITAL_TONE: Record<VitalType, Tone> = { steps: 'green', hr: 'amber', glucose: 'indigo', ketone: 'teal', bp: 'indigo' };

function Vitals({ d, range }: { d: Data; range: number }) {
  const from = Date.now() - range * DAY;
  const types = (Object.keys(VITALS) as VitalType[]).filter(
    (k) => d.profile.visibleMetrics.includes(k) && d.vitals.some((v) => v.type === k && v.timestamp >= from),
  );
  return (
    <>
      {types.map((k) => {
        const xs = d.vitals.filter((v) => v.type === k && v.timestamp >= from);
        const last = xs[xs.length - 1];
        return (
          <section key={k} className="grouped mt-4 p-4" aria-label={VITALS[k].name}>
            <CardHead tone={VITAL_TONE[k]} icon={VITAL_ICON[k]} title={VITALS[k].name} />
            <Figure
              tone={VITAL_TONE[k]}
              value={last.value2 != null ? `${last.value}/${last.value2}` : String(last.value)}
              unit={VITALS[k].unit}
              note={relDay(last.timestamp)}
            />
            {xs.length >= 2 && (
              <div className="mt-8">
                <TrendArea
                  points={xs.map((x) => ({ t: x.timestamp, v: x.value }))}
                  unit={VITALS[k].unit}
                  label={VITALS[k].name}
                  tone={VITAL_TONE[k]}
                  format={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
                />
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

function Records({ d, range }: { d: Data; range: number }) {
  const { openSheet } = useUI();
  const [n, setN] = useState(8);
  const xs = inRange(d.hunger, range).slice().reverse();
  if (!xs.length) return null;
  return (
    <>
      <GroupTitle title="Өлсөлтийн бүртгэл" />
      <Group>
        {xs.slice(0, n).map((h) => (
          <Row key={h.id} onClick={() => openSheet('hunger-detail', h.id)}>
            <span
              className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] text-footnote font-bold tnum"
              style={{
                background: `color-mix(in srgb, var(--amber) ${8 + h.intensity * 5}%, transparent)`,
                color: 'var(--amber-ink)',
              }}
            >
              {h.intensity}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-medium">{h.reason ?? HUNGER_WORDS[h.intensity]}</span>
              <span className="block text-caption text-ink-2 tnum">
                {relDay(h.timestamp)} · {hm(h.timestamp)}
                {h.fasting ? ' · мацагтай' : ''}
              </span>
            </span>
            <IconChevron size={16} className="text-ink-3" />
          </Row>
        ))}
      </Group>
      {xs.length > n && (
        <button className="btn-text mt-1 ml-1" onClick={() => setN((x) => x + 20)}>
          Цааш харах
        </button>
      )}
    </>
  );
}

/* ---------- a single day, as a timeline ---------- */
function DayLog({ d }: { d: Data }) {
  const { openSheet } = useUI();
  const today = dayKey(Date.now());
  type Ev = { t: number; label: string; value: string; tone: Tone; icon: React.ReactNode; open?: () => void };
  const evs: Ev[] = [
    ...d.hunger
      .filter((h) => dayKey(h.timestamp) === today)
      .map((h) => ({
        t: h.timestamp,
        label: 'Өлсөлт',
        value: `${h.intensity} / 10`,
        tone: 'amber' as Tone,
        icon: <IconHunger size={16} />,
        open: () => openSheet('hunger-detail', h.id),
      })),
    ...d.water
      .filter((w) => dayKey(w.timestamp) === today)
      .map((w) => ({ t: w.timestamp, label: 'Ус', value: `${w.amount} мл`, tone: 'blue' as Tone, icon: <IconDrop size={16} /> })),
    ...d.weights
      .filter((w) => dayKey(w.timestamp) === today)
      .map((w) => ({ t: w.timestamp, label: 'Жин', value: `${w.weight} кг`, tone: 'teal' as Tone, icon: <IconScale size={16} /> })),
    ...d.sleep
      .filter((s) => dayKey(s.wakeTime) === today)
      .map((s) => ({ t: s.wakeTime, label: 'Сэрсэн', value: shortDur(s.duration * 60e3), tone: 'indigo' as Tone, icon: <IconMoon size={16} /> })),
    ...d.fasts
      .filter((f) => dayKey(f.endTime) === today)
      .map((f) => ({
        t: f.endTime,
        label: 'Мацаг дууссан',
        value: shortDur(f.endTime - f.startTime),
        tone: 'green' as Tone,
        icon: <IconTimer size={16} />,
        open: () => openSheet('fast-detail', f.id),
      })),
    ...(d.activeFast && dayKey(d.activeFast.startTime) === today
      ? [{ t: d.activeFast.startTime, label: 'Мацаг эхэлсэн', value: '', tone: 'green' as Tone, icon: <IconTimer size={16} /> }]
      : []),
  ].sort((a, b) => b.t - a.t);

  if (!evs.length) {
    return (
      <section className="grouped rise-in mt-5 p-5">
        <h2 className="text-title font-semibold">Өнөөдөр хараахан бүртгэл алга.</h2>
        <p className="mt-1 text-body text-ink-2">
          Өлсөлт, ус, жин, нойр — өнөөдөр тэмдэглэсэн бүхэн энд цаг хугацааны дарааллаар харагдана.
        </p>
        <button className="btn-tinted mt-4 w-full bg-amber-soft text-amber-ink" onClick={() => openSheet('hunger')}>
          <IconPlus size={18} strokeWidth={2} /> Өлсөлт бүртгэх
        </button>
      </section>
    );
  }
  return (
    <div className="rise-in">
      <GroupTitle title="Өнөөдрийн бүртгэл" note={`${evs.length} бүртгэл`} />
      <Group>
        {evs.map((e, i) => (
          <Row key={i} onClick={e.open} inset={58}>
            <Badge tone={e.tone}>{e.icon}</Badge>
            <span className="flex-1 text-body font-medium">{e.label}</span>
            <span className="text-body font-semibold tnum" style={{ color: TONE[e.tone].ink }}>
              {e.value}
            </span>
            <span className="w-11 text-right text-footnote text-ink-2 tnum">{hm(e.t)}</span>
          </Row>
        ))}
      </Group>
    </div>
  );
}

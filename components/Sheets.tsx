'use client';

import { useEffect, useRef, useState } from 'react';
import Sheet from './Sheet';
import HungerScale from './HungerScale';
import { IconChevron, IconMinus, IconPlus, IconTrash } from './icons';
import { Switch, useUI, type SheetName } from './ui';
import { replaceAll, useData } from '@/lib/store';
import {
  addSleep,
  addVital,
  addWater,
  addWeight,
  logHunger,
  removeEntry,
  setFastStart,
  setFastTarget,
  startFast,
} from '@/lib/actions';
import { HUNGER_WORDS } from '@/lib/analysis';
import { addFastToCalendar } from '@/lib/calendar';
import { HOUR, MIN, dayKey, hm, longDur, relDay, shortDur, toLocalInput } from '@/lib/time';
import type { Data, VitalType } from '@/lib/types';

export const GOALS = [
  { h: 12, label: '12:12' },
  { h: 14, label: '14:10' },
  { h: 16, label: '16:8' },
  { h: 18, label: '18:6' },
  { h: 20, label: '20:4' },
];

export const VITALS: Record<VitalType, { name: string; unit: string; two?: boolean; step: string }> = {
  steps: { name: 'Алхалт', unit: 'алхам', step: '1' },
  hr: { name: 'Зүрхний цохилт', unit: 'уд/мин', step: '1' },
  glucose: { name: 'Цусан дахь сахар', unit: 'ммоль/л', step: '0.1' },
  ketone: { name: 'Кетон', unit: 'ммоль/л', step: '0.1' },
  bp: { name: 'Даралт', unit: 'мм МУБ', two: true, step: '1' },
};

/** Host keeps the last sheet rendered during its exit animation. */
export default function SheetHost() {
  const { sheet, closeSheet } = useUI();
  const [last, setLast] = useState(sheet);
  if (sheet && sheet !== last) setLast(sheet);
  const open = !!sheet;
  const s = sheet ?? last;
  if (!s) return null;
  const props = { open, onClose: closeSheet, payload: s.payload };
  const map: Record<SheetName, React.ReactNode> = {
    hunger: <HungerSheet {...props} />,
    weight: <WeightSheet {...props} />,
    sleep: <SleepSheet {...props} />,
    water: <WaterSheet {...props} />,
    vital: <VitalSheet {...props} />,
    goal: <GoalSheet {...props} />,
    'fast-start': <FastStartSheet {...props} />,
    'fast-edit': <FastEditSheet {...props} />,
    'fast-detail': <FastDetailSheet {...props} />,
    'hunger-detail': <HungerDetailSheet {...props} />,
  };
  return <>{map[s.name]}</>;
}

interface SP {
  open: boolean;
  onClose: () => void;
  payload?: string;
}

function useSaveFeedback() {
  const { toast } = useUI();
  return (ok: boolean, msg: string, retry: () => boolean, undo?: () => void) => {
    if (ok) toast(msg, undo ? { action: { label: 'Буцаах', run: undo } } : undefined);
    else
      toast('Мэдээллийг хадгалж чадсангүй. Өмнөх мэдээлэл тань хэвээр байна.', {
        tone: 'error',
        action: { label: 'Дахин оролдох', run: () => retry() },
      });
  };
}

/* ---------- hunger ---------- */
const REASONS = ['Хоолны цаг', 'Стресс', 'Уйдсан', 'Ядарсан', 'Хоол харсан', 'Цангасан', 'Бусад'];
const MOODS = ['Тайван', 'Сайн', 'Энгийн', 'Ядарсан', 'Түгшсэн'];

function HungerSheet({ open, onClose }: SP) {
  const d = useData();
  const feedback = useSaveFeedback();
  const [value, setValue] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const [time, setTime] = useState('');
  const [fasting, setFasting] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [mood, setMood] = useState<string | undefined>();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setValue(null);
      setMore(false);
      setTime(hm(Date.now()));
      setFasting(!!d.activeFast);
      setReason(undefined);
      setMood(undefined);
      setNote('');
    }
    // reset only when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    if (!value) return;
    const now = new Date();
    let ts = now.getTime();
    if (more && time && time !== hm(now)) {
      const [h, m] = time.split(':').map(Number);
      const t = new Date(now);
      t.setHours(h, m, 0, 0);
      if (t.getTime() > now.getTime()) t.setDate(t.getDate() - 1);
      ts = t.getTime();
    }
    const entry = {
      intensity: value,
      timestamp: ts,
      fasting: more ? fasting : undefined,
      reason: more ? reason : undefined,
      mood: more ? mood : undefined,
      note: more && note.trim() ? note.trim() : undefined,
    };
    const run = () => logHunger(entry);
    const { ok, id } = run();
    feedback(ok, `Өлсөлт ${value} · ${hm(ts)}`, () => run().ok, () => removeEntry('hunger', id));
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Одоо хэр өлсөж байна?"
      footer={
        <button
          className="btn-primary btn-amber w-full"
          disabled={!value}
          onClick={save}
        >
          Бүртгэх
        </button>
      }
    >
      <div
        className="mb-5 rounded-[22px] bg-fill-2 px-4 pt-5 pb-4 text-center"
        aria-live="polite"
      >
        <p
          className="text-[72px] leading-none font-light tracking-[-0.04em] tnum transition-colors duration-200"
          style={{ color: value ? 'var(--amber-ink)' : 'var(--ink-3)' }}
        >
          {value ?? '–'}
        </p>
        <p className={`mt-2 text-title font-semibold ${value ? 'text-ink' : 'text-ink-2'}`}>
          {value ? HUNGER_WORDS[value] : 'Түвшнээ сонгоно уу'}
        </p>
      </div>

      <HungerScale value={value} onChange={setValue} />
      <div className="mt-1 flex justify-between px-0.5 text-caption text-ink-2">
        <span>Огт өлсөөгүй</span>
        <span>Тэсэхэд хэцүү</span>
      </div>

      <button
        className="btn-text mt-4 -ml-1"
        style={{ color: 'var(--ink-2)' }}
        aria-expanded={more}
        onClick={() => setMore((m) => !m)}
      >
        Нэмэлт мэдээлэл
        <IconChevron size={16} className={`transition-transform duration-200 ${more ? 'rotate-90' : ''}`} />
      </button>

      {more && (
        <div className="rise-in space-y-5 pt-1 pb-2">
          <div className="overflow-hidden rounded-[18px] bg-fill-2">
            <label className="row-sep flex min-h-[52px] items-center justify-between gap-3 px-4">
              <span className="text-body">Цаг</span>
              <input
                type="time"
                className="rounded-[10px] bg-surface px-2.5 py-1.5 text-body font-medium tnum outline-none"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={fasting}
              onClick={() => setFasting((f) => !f)}
              className="row-sep flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left"
            >
              <span className="text-body">Мацаг барьж байсан</span>
              <Switch on={fasting} />
            </button>
          </div>
          <ChipGroup label="Шалтгаан" options={REASONS} value={reason} onChange={setReason} />
          <ChipGroup label="Сэтгэл санаа" options={MOODS} value={mood} onChange={setMood} />
          <label className="block">
            <span className="mb-1.5 block text-footnote font-medium text-ink-2">Тайлбар</span>
            <input
              className="field"
              value={note}
              maxLength={140}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Жишээ нь: кофе уусан"
            />
          </label>
        </div>
      )}
    </Sheet>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange: (v?: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-footnote font-medium text-ink-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o === value;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? undefined : o)}
              className={`tap min-h-[44px] rounded-full px-4 text-footnote font-medium transition-colors duration-200 ${
                on ? 'bg-amber-soft text-amber-ink shadow-[inset_0_0_0_1.5px_var(--amber)]' : 'bg-fill-2 text-ink'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ---------- weight ---------- */
function WeightSheet({ open, onClose }: SP) {
  const d = useData();
  const feedback = useSaveFeedback();
  const last = d.weights[d.weights.length - 1]?.weight;
  const [val, setVal] = useState('');
  useEffect(() => {
    if (open) setVal(last != null ? last.toFixed(1) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const num = parseFloat(val.replace(',', '.'));
  const valid = !isNaN(num) && num > 20 && num < 400;
  const step = (dx: number) => setVal(((isNaN(num) ? last ?? 70 : num) + dx).toFixed(1));
  const save = () => {
    if (!valid) return;
    const w = +num.toFixed(1);
    feedback(addWeight(w), `Жин ${w} кг`, () => addWeight(w));
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Жин"
      footer={
        <button className="btn-primary w-full" disabled={!valid} onClick={save}>
          Хадгалах
        </button>
      }
    >
      <div className="flex items-center justify-between gap-3 py-4">
        <StepBtn label="0.1 кг хасах" onClick={() => step(-0.1)}>
          <IconMinus />
        </StepBtn>
        <label className="flex items-baseline justify-center gap-2">
          <span className="sr-only">Жин, килограмм</span>
          <input
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="0.0"
            className="w-[4.2ch] bg-transparent text-center text-[56px] leading-none font-light tracking-[-0.04em] tnum outline-none placeholder:text-ink-2"
          />
          <span className="text-lg text-ink-2">кг</span>
        </label>
        <StepBtn label="0.1 кг нэмэх" onClick={() => step(0.1)}>
          <IconPlus />
        </StepBtn>
      </div>
      <p className="pb-2 text-center text-sm text-ink-2">
        {last != null ? `Өмнөх: ${last} кг · ${relDay(d.weights[d.weights.length - 1].timestamp)}` : 'Огноо, цаг автоматаар бүртгэгдэнэ.'}
      </p>
    </Sheet>
  );
}

function StepBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-fill-2 text-ink transition-transform duration-150 active:scale-95"
    >
      {children}
    </button>
  );
}

/* ---------- sleep ---------- */
function SleepSheet({ open, onClose }: SP) {
  const d = useData();
  const feedback = useSaveFeedback();
  const [bed, setBed] = useState('23:00');
  const [wake, setWake] = useState('07:00');
  useEffect(() => {
    if (!open) return;
    const l = d.sleep[d.sleep.length - 1];
    if (l) {
      setBed(hm(l.sleepStart));
      setWake(hm(l.wakeTime));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const calc = () => {
    const now = new Date();
    const [wh, wm] = wake.split(':').map(Number);
    const [bh, bm] = bed.split(':').map(Number);
    const w = new Date(now);
    w.setHours(wh, wm, 0, 0);
    if (w.getTime() > now.getTime() + 30 * MIN) w.setDate(w.getDate() - 1);
    const b = new Date(w);
    b.setHours(bh, bm, 0, 0);
    if (b.getTime() >= w.getTime()) b.setDate(b.getDate() - 1);
    return { start: b.getTime(), end: w.getTime() };
  };
  const { start, end } = calc();
  const dur = end - start;
  const valid = dur > 30 * MIN && dur < 20 * HOUR;
  const already = d.sleep.some((s) => dayKey(s.wakeTime) === dayKey(end));

  const save = () => {
    feedback(addSleep(start, end), `Нойр ${shortDur(dur)}`, () => addSleep(start, end));
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Нойр"
      footer={
        <button className="btn-primary w-full" disabled={!valid} onClick={save}>
          Хадгалах
        </button>
      }
    >
      <div className="flex gap-3">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm text-ink-2">Унтсан цаг</span>
          <input type="time" className="field tnum" value={bed} onChange={(e) => setBed(e.target.value)} />
        </label>
        <label className="flex-1">
          <span className="mb-1.5 block text-sm text-ink-2">Сэрсэн цаг</span>
          <input type="time" className="field tnum" value={wake} onChange={(e) => setWake(e.target.value)} />
        </label>
      </div>
      <div className="py-8 text-center">
        <p className="text-sm text-ink-2">Нийт нойр</p>
        <p className="mt-1 text-[44px] leading-none font-light tracking-[-0.03em] tnum">{valid ? shortDur(dur) : '–'}</p>
        {already && <p className="mt-3 text-sm text-ink-2">Энэ өдөр нойр бүртгэгдсэн байна. Шинэ бүртгэл нэмэгдэнэ.</p>}
      </div>
    </Sheet>
  );
}

/* ---------- water ---------- */
function WaterSheet({ open, onClose }: SP) {
  const d = useData();
  const { toast } = useUI();
  const [custom, setCustom] = useState('');
  const today = d.water.filter((w) => dayKey(w.timestamp) === dayKey(Date.now()));
  const total = today.reduce((a, w) => a + w.amount, 0);
  const add = (ml: number) => {
    const { ok, id } = addWater(ml);
    if (ok) toast(`+${ml} мл`, { action: { label: 'Буцаах', run: () => removeEntry('water', id) } });
    else toast('Мэдээллийг хадгалж чадсангүй.', { tone: 'error' });
  };
  return (
    <Sheet open={open} onClose={onClose} title="Ус">
      <p className="text-[44px] leading-none font-light tracking-[-0.03em] text-blue-ink tnum">
        {(total / 1000).toFixed(1)}
        <span className="ml-1.5 text-lg text-ink-2">/ {(d.profile.waterGoalMl / 1000).toFixed(1)} л</span>
      </p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {[250, 500, 750].map((ml) => (
          <button key={ml} className="btn-tinted bg-blue-soft text-blue-ink tnum" onClick={() => add(ml)}>
            +{ml}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseInt(custom, 10);
          if (n > 0 && n < 5000) {
            add(n);
            setCustom('');
          }
        }}
      >
        <input
          inputMode="numeric"
          className="field tnum"
          placeholder="Өөр хэмжээ, мл"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
        />
        <button className="btn-quiet shrink-0" disabled={!custom}>
          Нэмэх
        </button>
      </form>
      {today.length > 0 && (
        <ul className="mt-6 mb-2">
          {[...today].reverse().map((w) => (
            <li key={w.id} className="row-sep flex min-h-[48px] items-center justify-between text-sm">
              <span className="tnum text-ink-2">{hm(w.timestamp)}</span>
              <span className="flex items-center gap-1">
                <span className="tnum">{w.amount} мл</span>
                <button
                  aria-label={`${hm(w.timestamp)}-ийн ${w.amount} мл устгах`}
                  className="grid h-11 w-11 place-items-center text-ink-2 active:text-danger"
                  onClick={() => removeEntry('water', w.id)}
                >
                  <IconTrash size={18} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

/* ---------- optional vitals ---------- */
function VitalSheet({ open, onClose, payload }: SP) {
  const d = useData();
  const feedback = useSaveFeedback();
  const enabled = (Object.keys(VITALS) as VitalType[]).filter((k) => d.profile.visibleMetrics.includes(k));
  const [type, setType] = useState<VitalType>((payload as VitalType) || enabled[0] || 'hr');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  useEffect(() => {
    if (open) {
      setType((payload as VitalType) || enabled[0] || 'hr');
      setA('');
      setB('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payload]);
  const meta = VITALS[type];
  const va = parseFloat(a.replace(',', '.'));
  const vb = parseFloat(b.replace(',', '.'));
  const valid = !isNaN(va) && va > 0 && (!meta.two || (!isNaN(vb) && vb > 0));
  const save = () => {
    const run = () => addVital(type, va, meta.two ? vb : undefined);
    feedback(run(), `${meta.name} хадгалагдлаа`, run);
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={meta.name}
      footer={
        <button className="btn-primary w-full" disabled={!valid} onClick={save}>
          Хадгалах
        </button>
      }
    >
      <div className="flex gap-3 pb-2">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm text-ink-2">{meta.two ? 'Дээд' : meta.unit}</span>
          <input inputMode="decimal" className="field tnum" value={a} onChange={(e) => setA(e.target.value)} />
        </label>
        {meta.two && (
          <label className="flex-1">
            <span className="mb-1.5 block text-sm text-ink-2">Доод</span>
            <input inputMode="decimal" className="field tnum" value={b} onChange={(e) => setB(e.target.value)} />
          </label>
        )}
      </div>
      {meta.two && <p className="pb-2 text-sm text-ink-2">{meta.unit}</p>}
    </Sheet>
  );
}

/* ---------- fasting goal ---------- */
function GoalSheet({ open, onClose: close, payload }: SP) {
  const d = useData();
  const { openSheet } = useUI();
  // opened from the start sheet: return there instead of dropping the user's flow
  const onClose = payload === 'start' ? () => openSheet('fast-start') : close;
  const current = d.activeFast?.targetHours ?? d.profile.fastingGoalH;
  const isPreset = GOALS.some((g) => g.h === current);
  const [custom, setCustom] = useState(current);
  useEffect(() => {
    if (open) setCustom(isPreset ? 15 : current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const choose = (h: number) => {
    setFastTarget(h);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Мацгийн зорилго">
      <ul role="radiogroup" aria-label="Мацгийн зорилго">
        {GOALS.map((g) => {
          const on = g.h === current;
          return (
            <li key={g.h}>
              <button
                role="radio"
                aria-checked={on}
                onClick={() => choose(g.h)}
                className="row-sep tap-row -mx-5 flex min-h-[60px] w-[calc(100%+2.5rem)] items-center gap-4 px-5 text-left"
              >
                <span className="w-14 text-lg font-medium tnum">{g.label}</span>
                <span className="flex-1 text-sm text-ink-2">
                  {g.h} цаг мацаг · {24 - g.h} цаг хооллох цонх
                </span>
                <Radio on={on} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="py-5">
        <p className="mb-3 text-sm text-ink-2">Өөрийн хугацаа</p>
        <div className="flex items-center gap-3">
          <StepBtn label="1 цаг хасах" onClick={() => setCustom((c) => Math.max(10, c - 1))}>
            <IconMinus />
          </StepBtn>
          <span className="flex-1 text-center text-2xl font-light tnum">{custom} цаг</span>
          <StepBtn label="1 цаг нэмэх" onClick={() => setCustom((c) => Math.min(36, c + 1))}>
            <IconPlus />
          </StepBtn>
          <button className="btn-quiet" onClick={() => choose(custom)}>
            Сонгох
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-2">
          Зорилгоо өөрийн биеийн байдалд тохируулан сонгоно уу. Удаан хугацааны мацгийн өмнө эмчтэйгээ зөвлөлдөх нь зүйтэй.
        </p>
      </div>
    </Sheet>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px] transition-colors ${
        on ? 'border-green' : 'border-fill'
      }`}
    >
      <span className={`h-[11px] w-[11px] rounded-full bg-green transition-transform duration-200 ${on ? 'scale-100' : 'scale-0'}`} />
    </span>
  );
}

/* ---------- start fast ---------- */
function FastStartSheet({ open, onClose }: SP) {
  const d = useData();
  const { openSheet, toast } = useUI();
  const [when, setWhen] = useState<'now' | 'earlier'>('now');
  const [at, setAt] = useState('');
  useEffect(() => {
    if (open) {
      setWhen('now');
      setAt(toLocalInput(Date.now() - HOUR));
    }
  }, [open]);
  const goal = d.profile.fastingGoalH;
  const startTs = when === 'now' ? Date.now() : new Date(at).getTime();
  const valid = when === 'now' || (!isNaN(startTs) && startTs <= Date.now() && Date.now() - startTs < 72 * HOUR);
  const go = () => {
    // one timestamp for both the stored fast and the calendar event, so they match exactly
    const s0 = when === 'now' ? Date.now() : startTs;
    const ok = startFast(goal, s0);
    if (ok)
      toast(`Мацаг эхэллээ · ${hm(s0)}`, {
        action: { label: 'Календарьт нэмэх', run: () => addFastToCalendar({ startTime: s0, targetHours: goal }) },
      });
    else toast('Мэдээллийг хадгалж чадсангүй.', { tone: 'error' });
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Мацаг эхлүүлэх"
      footer={
        <button className="btn-primary w-full" disabled={!valid} onClick={go}>
          Эхлүүлэх
        </button>
      }
    >
      <button
        onClick={() => openSheet('goal', 'start')}
        className="row-sep tap-row -mx-5 flex min-h-[60px] w-[calc(100%+2.5rem)] items-center justify-between px-5 text-left"
      >
        <span>
          <span className="block text-sm text-ink-2">Зорилго</span>
          <span className="tnum">
            {goal} цаг мацаг · {Math.max(0, 24 - goal)} цаг хооллох цонх
          </span>
        </span>
        <IconChevron size={18} className="text-ink-2" />
      </button>
      <div className="py-5" role="radiogroup" aria-label="Эхэлсэн цаг">
        <p className="mb-3 text-sm text-ink-2">Сүүлд хэзээ хооллосон бэ?</p>
        <div className="grid grid-cols-2 gap-2">
          {(['now', 'earlier'] as const).map((w) => (
            <button
              key={w}
              role="radio"
              aria-checked={when === w}
              onClick={() => setWhen(w)}
              className={`min-h-[48px] rounded-[12px] text-[15px] font-medium transition-colors duration-200 ${
                when === w ? 'bg-green-soft text-green-ink shadow-[inset_0_0_0_1.5px_var(--green)]' : 'bg-fill-2 text-ink'
              }`}
            >
              {w === 'now' ? 'Яг одоо' : 'Өмнө нь'}
            </button>
          ))}
        </div>
        {when === 'earlier' && (
          <input
            type="datetime-local"
            className="field rise-in mt-3 tnum"
            value={at}
            max={toLocalInput(Date.now())}
            onChange={(e) => setAt(e.target.value)}
            aria-label="Мацаг эхэлсэн огноо, цаг"
          />
        )}
        {valid && (
          <p className="mt-4 text-sm text-ink-2 tnum">
            Дуусах хугацаа: {relDay(startTs + goal * HOUR)} {hm(startTs + goal * HOUR)}
          </p>
        )}
      </div>
    </Sheet>
  );
}

/* ---------- edit active fast start ---------- */
function FastEditSheet({ open, onClose }: SP) {
  const d = useData();
  const [at, setAt] = useState('');
  useEffect(() => {
    if (open && d.activeFast) setAt(toLocalInput(d.activeFast.startTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const ts = new Date(at).getTime();
  const valid = !isNaN(ts) && ts <= Date.now();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Эхэлсэн цагийг засах"
      footer={
        <button
          className="btn-primary w-full"
          disabled={!valid}
          onClick={() => {
            setFastStart(ts);
            onClose();
          }}
        >
          Хадгалах
        </button>
      }
    >
      <input
        type="datetime-local"
        className="field tnum"
        value={at}
        max={toLocalInput(Date.now())}
        onChange={(e) => setAt(e.target.value)}
        aria-label="Мацаг эхэлсэн огноо, цаг"
      />
      {!valid && at && <p className="mt-2 text-sm text-danger">Ирээдүйн цаг сонгох боломжгүй.</p>}
      <div className="h-4" />
    </Sheet>
  );
}

/* ---------- record details ---------- */
function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="row-sep flex min-h-[48px] items-center justify-between gap-4 text-[15px]">
      <dt className="text-ink-2">{k}</dt>
      <dd className="text-right tnum">{v}</dd>
    </div>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button
      className={`btn-quiet w-full ${armed ? 'border-danger text-danger' : 'text-danger'}`}
      onClick={() => {
        if (armed) return onConfirm();
        setArmed(true);
        t.current = setTimeout(() => setArmed(false), 3000);
      }}
    >
      <IconTrash size={18} />
      {armed ? 'Дахин дарж баталгаажуулна уу' : 'Устгах'}
    </button>
  );
}

function FastDetailSheet({ open, onClose, payload }: SP) {
  const d = useData();
  const f = d.fasts.find((x) => x.id === payload);
  const { toast } = useUI();
  if (!f) return <Sheet open={open} onClose={onClose} title="Мацаг"><p className="pb-4 text-ink-2">Бүртгэл олдсонгүй.</p></Sheet>;
  const dur = f.endTime - f.startTime;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${relDay(f.endTime)} · ${shortDur(dur)}`}
      footer={
        <DeleteButton
          onConfirm={() => {
            const snap: Data = structuredClone(d);
            removeEntry('fasts', f.id);
            toast('Мацгийн бүртгэл устлаа', { action: { label: 'Буцаах', run: () => replaceAll(snap) } });
            onClose();
          }}
        />
      }
    >
      <dl>
        <DetailRow k="Эхэлсэн" v={`${relDay(f.startTime)} ${hm(f.startTime)}`} />
        <DetailRow k="Дууссан" v={`${relDay(f.endTime)} ${hm(f.endTime)}`} />
        <DetailRow k="Үргэлжилсэн" v={longDur(dur)} />
        <DetailRow k="Зорилго" v={`${f.targetHours} цаг`} />
        <DetailRow k="Төлөв" v={f.completed ? 'Зорилгод хүрсэн' : `${longDur(f.targetHours * HOUR - dur)} дутуу`} />
      </dl>
    </Sheet>
  );
}

function HungerDetailSheet({ open, onClose, payload }: SP) {
  const d = useData();
  const h = d.hunger.find((x) => x.id === payload);
  const { toast } = useUI();
  if (!h) return <Sheet open={open} onClose={onClose} title="Өлсөлт"><p className="pb-4 text-ink-2">Бүртгэл олдсонгүй.</p></Sheet>;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Өлсөлт ${h.intensity} · ${HUNGER_WORDS[h.intensity]}`}
      footer={
        <DeleteButton
          onConfirm={() => {
            const snap: Data = structuredClone(d);
            removeEntry('hunger', h.id);
            toast('Бүртгэл устлаа', { action: { label: 'Буцаах', run: () => replaceAll(snap) } });
            onClose();
          }}
        />
      }
    >
      <dl>
        <DetailRow k="Цаг" v={`${relDay(h.timestamp)} ${hm(h.timestamp)}`} />
        <DetailRow
          k="Мацаг"
          v={h.fasting ? (h.fastHours != null ? `${Math.floor(h.fastHours)} дахь цаг` : 'Барьж байсан') : 'Бариагүй'}
        />
        {h.reason && <DetailRow k="Шалтгаан" v={h.reason} />}
        {h.mood && <DetailRow k="Сэтгэл санаа" v={h.mood} />}
        {h.note && <DetailRow k="Тайлбар" v={h.note} />}
      </dl>
    </Sheet>
  );
}

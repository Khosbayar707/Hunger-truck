'use client';

import { useEffect, useRef, useState } from 'react';
import {
  IconChevron,
  IconDownload,
  IconDrop,
  IconHeart,
  IconHunger,
  IconLock,
  IconMinus,
  IconMoon,
  IconPlus,
  IconScale,
  IconSteps,
  IconTimer,
  IconTrash,
  IconUpload,
} from '../icons';
import { Badge, Group, GroupTitle, Row, Screen, Segmented, Switch, useUI, type Tone } from '../ui';
import { VITALS } from '../Sheets';
import { goalLabel } from './Fast';
import { emptyData, normalize, replaceAll, useData, useHydrated } from '@/lib/store';
import { setProfile, toggleMetric } from '@/lib/actions';
import { pad, relDay } from '@/lib/time';
import { exportData, recordCount, requestPersist, usePersistState } from '@/lib/backup';
import type { Data, MetricKey, ThemePref, VitalType } from '@/lib/types';

const CORE: { key: MetricKey; label: string; tone: Tone; icon: React.ReactNode }[] = [
  { key: 'hunger', label: 'Өлсөлт', tone: 'amber', icon: <IconHunger size={17} /> },
  { key: 'water', label: 'Ус', tone: 'blue', icon: <IconDrop size={17} /> },
  { key: 'weight', label: 'Жин', tone: 'teal', icon: <IconScale size={17} /> },
  { key: 'sleep', label: 'Нойр', tone: 'indigo', icon: <IconMoon size={17} /> },
  { key: 'fasting', label: 'Өнөөдрийн мацаг', tone: 'green', icon: <IconTimer size={17} /> },
  { key: 'bmi', label: 'BMI', tone: 'teal', icon: <IconScale size={17} /> },
];
const OPTIONAL: { key: VitalType; tone: Tone; icon: React.ReactNode }[] = [
  { key: 'steps', tone: 'green', icon: <IconSteps size={17} /> },
  { key: 'hr', tone: 'amber', icon: <IconHeart size={17} /> },
  { key: 'glucose', tone: 'indigo', icon: <IconDrop size={17} /> },
  { key: 'ketone', tone: 'teal', icon: <IconDrop size={17} /> },
  { key: 'bp', tone: 'indigo', icon: <IconHeart size={17} /> },
];

export default function Settings() {
  const hydrated = useHydrated();
  const d = useData();
  const p = d.profile;
  const { openSheet } = useUI();
  if (!hydrated) return <Screen title="Тохиргоо">{null}</Screen>;
  return (
    <Screen title="Тохиргоо">
      <GroupTitle first title="Таны мэдээлэл" note="Тооцоолол болон зорилгод ашиглана." />
      <Group>
        <Row>
          <span className="flex-1">
            <span className="block text-body font-medium">Өндөр</span>
            <span className="block text-caption text-ink-2">BMI тооцоход ашиглана</span>
          </span>
          <NumberField value={p.heightCm} unit="см" min={100} max={250} onChange={(v) => setProfile({ heightCm: v })} label="Өндөр, сантиметр" />
        </Row>
        <Row>
          <span className="flex-1 text-body font-medium">Усны зорилго</span>
          <Stepper
            value={p.waterGoalMl}
            step={250}
            min={1000}
            max={5000}
            format={(v) => `${(v / 1000).toFixed(2).replace(/0$/, '')} л`}
            onChange={(v) => setProfile({ waterGoalMl: v })}
            label="Усны зорилго"
          />
        </Row>
        <Row onClick={() => openSheet('goal')}>
          <span className="flex-1 text-body font-medium">Мацгийн зорилго</span>
          <span className="text-body text-ink-2 tnum">{goalLabel(p.fastingGoalH)}</span>
          <IconChevron size={16} className="text-ink-3" />
        </Row>
      </Group>

      <GroupTitle title="Нүүр дэлгэц" note="Өнөөдөр дэлгэц дээр харагдах үзүүлэлтүүд." />
      <Group>
        {CORE.map((m) => (
          <Row
            key={m.key}
            role="switch"
            ariaChecked={p.visibleMetrics.includes(m.key)}
            onClick={() => toggleMetric(m.key, !p.visibleMetrics.includes(m.key))}
            inset={58}
          >
            <Badge tone={m.tone}>{m.icon}</Badge>
            <span className="flex-1">
              <span className="block text-body font-medium">{m.label}</span>
              {m.key === 'bmi' && !p.heightCm && <span className="block text-caption text-ink-2">Өндрөө оруулсны дараа</span>}
            </span>
            <Switch on={p.visibleMetrics.includes(m.key)} />
          </Row>
        ))}
      </Group>

      <GroupTitle title="Нэмэлт үзүүлэлт" note="Асаасан үзүүлэлт нүүр дэлгэц болон Түүхэд гарна." />
      <Group>
        {OPTIONAL.map((m) => (
          <Row
            key={m.key}
            role="switch"
            ariaChecked={p.visibleMetrics.includes(m.key)}
            onClick={() => toggleMetric(m.key, !p.visibleMetrics.includes(m.key))}
            inset={58}
          >
            <Badge tone={m.tone}>{m.icon}</Badge>
            <span className="flex-1 text-body font-medium">{VITALS[m.key].name}</span>
            <Switch on={p.visibleMetrics.includes(m.key)} />
          </Row>
        ))}
      </Group>

      <GroupTitle title="Сануулга" />
      <Group>
        <Row
          role="switch"
          ariaChecked={p.hourlyPrompt}
          onClick={async () => {
            const on = !p.hourlyPrompt;
            setProfile({ hourlyPrompt: on });
            if (on && 'Notification' in window && Notification.permission === 'default') {
              await Notification.requestPermission().catch(() => {});
            }
          }}
        >
          <span className="flex-1 text-body font-medium">Цаг тутам өлсөлт асуух</span>
          <Switch on={p.hourlyPrompt} />
        </Row>
        {p.hourlyPrompt && (
          <Row>
            <span className="flex-1 text-body font-medium">Чимээгүй цаг</span>
            <span className="flex items-center gap-1.5">
              <HourSelect value={p.quietStart} onChange={(v) => setProfile({ quietStart: v })} label="Чимээгүй цаг эхлэх" />
              <span className="text-ink-2">–</span>
              <HourSelect value={p.quietEnd} onChange={(v) => setProfile({ quietEnd: v })} label="Чимээгүй цаг дуусах" />
            </span>
          </Row>
        )}
      </Group>
      <p className="mt-2 px-4 text-footnote text-ink-2">
        Тухайн цагт тэмдэглээгүй бол Өнөөдөр дэлгэц дээр асуулт гарна. Апп бүрэн хаалттай үед мэдэгдэл найдвартай ирэхгүй байж
        болно.
      </p>

      <GroupTitle title="Харагдах байдал" />
      <Segmented<ThemePref>
        label="Өнгөний горим"
        value={p.theme}
        onChange={(v) => setProfile({ theme: v })}
        options={[
          { value: 'system', label: 'Систем' },
          { value: 'light', label: 'Цайвар' },
          { value: 'dark', label: 'Бараан' },
        ]}
      />

      <Install />
      <DataSection d={d} />

      <p className="mt-8 px-4 text-footnote leading-relaxed text-ink-2">
        Hunger Truck бол хувийн тэмдэглэлийн хэрэгсэл бөгөөд онош тавихгүй. Мацаг барих үед толгой эргэх, ухаан балартах зэрэг
        зовиур илэрвэл мацгаа зогсоож, шаардлагатай бол мэргэжлийн эмчтэй зөвлөлдөнө үү.
      </p>
      <p className="mt-2 px-4 text-caption text-ink-2">Хувилбар 3.0</p>
    </Screen>
  );
}

/* ---------- inline controls ---------- */
function NumberField({
  value,
  unit,
  min,
  max,
  onChange,
  label,
}: {
  value: number | null;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number | null) => void;
  label: string;
}) {
  const [v, setV] = useState(value?.toString() ?? '');
  useEffect(() => setV(value?.toString() ?? ''), [value]);
  const commit = () => {
    const n = parseInt(v, 10);
    if (!v) onChange(null);
    else if (n >= min && n <= max) onChange(n);
    else setV(value?.toString() ?? '');
  };
  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <input
        inputMode="numeric"
        value={v}
        placeholder="—"
        onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="h-10 w-16 rounded-[10px] bg-fill-2 text-center text-body font-semibold tnum outline-none focus:ring-2 focus:ring-green"
      />
      <span className="text-body text-ink-2">{unit}</span>
    </label>
  );
}

function Stepper({
  value,
  step,
  min,
  max,
  format,
  onChange,
  label,
}: {
  value: number;
  step: number;
  min: number;
  max: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  label: string;
}) {
  const btn = 'grid h-9 w-11 place-items-center text-ink transition-colors active:bg-fill disabled:opacity-30';
  return (
    <span className="flex items-center gap-2.5" role="group" aria-label={label}>
      <span className="text-body font-semibold tnum" aria-live="polite">
        {format(value)}
      </span>
      <span className="flex overflow-hidden rounded-[10px] bg-fill-2">
        <button aria-label="Багасгах" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className={btn}>
          <IconMinus size={16} strokeWidth={2} />
        </button>
        <span className="my-2 w-px bg-sep" aria-hidden="true" />
        <button aria-label="Нэмэгдүүлэх" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className={btn}>
          <IconPlus size={16} strokeWidth={2} />
        </button>
      </span>
    </span>
  );
}

function HourSelect({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      className="h-10 rounded-[10px] bg-fill-2 px-2 text-body font-medium tnum outline-none"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>
          {pad(h)}:00
        </option>
      ))}
    </select>
  );
}

/* ---------- install ---------- */
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
}

function Install() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setStandalone(
      matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true,
    );
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const on = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);
  if (standalone) return null;
  return (
    <>
      <GroupTitle title="Апп суулгах" note="Нүүр дэлгэцэд нэмбэл бүтэн дэлгэцээр, интернэтгүй ч нээгдэнэ." />
      {evt ? (
        <button
          className="btn-primary w-full"
          onClick={async () => {
            await evt.prompt();
            setEvt(null);
          }}
        >
          Нүүр дэлгэцэд нэмэх
        </button>
      ) : (
        <div className="grouped p-4 text-body text-ink-2">
          {ios ? (
            <>
              Safari-ийн <span className="font-semibold text-ink">Хуваалцах</span> товчийг дараад{' '}
              <span className="font-semibold text-ink">Нүүр дэлгэцэд нэмэх</span> («Add to Home Screen»)-ийг сонгоно уу.
            </>
          ) : (
            <>
              Хөтчийн цэснээс <span className="font-semibold text-ink">Апп суулгах</span> эсвэл{' '}
              <span className="font-semibold text-ink">Нүүр дэлгэцэд нэмэх</span> («Install app» / «Add to Home
              screen»)-ийг сонгоно уу.
            </>
          )}
        </div>
      )}
    </>
  );
}

/* ---------- data ---------- */
const backupDate = (t: number) => {
  const r = relDay(t);
  if (r === 'Өнөөдөр' || r === 'Өчигдөр') return r.toLowerCase();
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}-нд`;
};

function DataSection({ d }: { d: Data }) {
  const { toast } = useUI();
  const file = useRef<HTMLInputElement>(null);
  const [armed, setArmed] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const count = recordCount(d);
  const [persist, setPersist] = usePersistState();
  const last = d.profile.lastExportAt;

  return (
    <>
      <GroupTitle title="Мэдээлэл" />
      <div className="grouped mb-3 flex items-start gap-3 p-4">
        <Badge tone="green">
          <IconLock size={17} />
        </Badge>
        <p className="flex-1 text-body text-ink-2">
          Таны мэдээлэл зөвхөн энэ төхөөрөмж дээр хадгалагдана. Бүртгэл, сервер байхгүй. Одоогоор{' '}
          <span className="font-semibold text-ink tnum">{count}</span> бүртгэл байна.
        </p>
      </div>
      <Group className="mb-3">
        <Row>
          <span className="flex-1">
            <span className="block text-body font-medium">Хадгалалтын хамгаалалт</span>
            <span className="block text-caption text-ink-2">
              {persist === 'granted'
                ? 'Browser энэ мэдээллийг өөрөө устгахгүй.'
                : persist === 'unsupported'
                  ? 'Энэ browser дэмждэггүй. Тогтмол экспорт хийнэ үү.'
                  : 'Санах ой дүүрэхэд browser устгаж болзошгүй. Апп суулгавал ихэвчлэн хамгаалагдана.'}
            </span>
          </span>
          {persist === 'granted' ? (
            <span className="rounded-full bg-green-soft px-3 py-1 text-footnote font-semibold text-green-ink">Идэвхтэй</span>
          ) : persist !== 'unsupported' ? (
            <button
              className="tap min-h-[36px] shrink-0 rounded-full bg-fill-2 px-3.5 text-footnote font-semibold"
              onClick={async () => {
                const r = await requestPersist();
                setPersist(r);
                toast(r === 'granted' ? 'Хадгалалт хамгаалагдлаа' : 'Browser зөвшөөрсөнгүй. Апп суулгаад дахин оролдоно уу.');
              }}
            >
              Хүсэх
            </button>
          ) : null}
        </Row>
      </Group>
      <Group>
        <Row onClick={() => exportData(d, 'json')} inset={58}>
          <Badge tone="blue">
            <IconDownload size={17} />
          </Badge>
          <span className="flex-1">
            <span className="block text-body font-medium">JSON экспорт</span>
            <span className="block text-caption text-ink-2">
              {last ? `Сүүлд ${backupDate(last)} нөөцөлсөн` : 'Нөөц хуулбар, дахин импортлох боломжтой'}
            </span>
          </span>
        </Row>
        <Row onClick={() => exportData(d, 'csv')} inset={58}>
          <Badge tone="blue">
            <IconDownload size={17} />
          </Badge>
          <span className="flex-1">
            <span className="block text-body font-medium">CSV экспорт</span>
            <span className="block text-caption text-ink-2">Хүснэгтэд нээх</span>
          </span>
        </Row>
        <Row onClick={() => file.current?.click()} inset={58}>
          <Badge tone="blue">
            <IconUpload size={17} />
          </Badge>
          <span className="flex-1">
            <span className="block text-body font-medium">JSON импорт</span>
            <span className="block text-caption text-ink-2">Одоогийн мэдээллийг солино</span>
          </span>
        </Row>
      </Group>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const raw = JSON.parse(await f.text());
            if (raw.version !== 2 || !Array.isArray(raw.hunger)) throw new Error('format');
            const snap: Data = structuredClone(d);
            replaceAll(normalize(raw));
            toast('Импорт амжилттай', { action: { label: 'Буцаах', run: () => replaceAll(snap) } });
          } catch {
            toast('Энэ файлыг уншиж чадсангүй. Hunger Truck-ийн JSON экспорт эсэхийг шалгана уу.', { tone: 'error' });
          }
        }}
      />
      <Group className="mt-4">
        <Row
          onClick={() => {
            if (!armed) {
              setArmed(true);
              t.current = setTimeout(() => setArmed(false), 4000);
              return;
            }
            const snap: Data = structuredClone(d);
            replaceAll({ ...emptyData(), profile: d.profile });
            setArmed(false);
            toast('Бүх бүртгэл устлаа', { action: { label: 'Буцаах', run: () => replaceAll(snap) } });
          }}
          className="justify-center"
        >
          <IconTrash size={18} className="text-danger" />
          <span className="text-body font-semibold text-danger">
            {armed ? 'Дахин дарж баталгаажуулна уу' : 'Бүх бүртгэлийг устгах'}
          </span>
        </Row>
      </Group>
      <p className="mt-2 px-4 text-footnote text-ink-2">Тохиргоо хэвээр үлдэнэ. Устгахаас өмнө экспорт хийхийг зөвлөе.</p>
    </>
  );
}

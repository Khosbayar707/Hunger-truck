'use client';

import { IconDrop, IconHeart, IconHunger, IconMoon, IconTimer } from './icons';
import { Badge, GroupTitle, useUI, type Tone } from './ui';
import { ADVICE, TOPIC_LABEL, adviceFor, type Advice, type AdviceTopic } from '@/lib/advice';
import type { Data } from '@/lib/types';

/** Each topic borrows its metric's hue; safety stays neutral (red is for real errors only). */
const TOPIC: Record<AdviceTopic, { tone: Tone | null; icon: React.ReactNode }> = {
  fasting: { tone: 'green', icon: <IconTimer size={17} /> },
  food: { tone: 'green', icon: <IconTimer size={17} /> },
  hunger: { tone: 'amber', icon: <IconHunger size={17} /> },
  water: { tone: 'blue', icon: <IconDrop size={17} /> },
  sleep: { tone: 'indigo', icon: <IconMoon size={17} /> },
  safety: { tone: null, icon: <IconHeart size={17} /> },
};

function TopicBadge({ topic }: { topic: AdviceTopic }) {
  const t = TOPIC[topic];
  if (t.tone) return <Badge tone={t.tone}>{t.icon}</Badge>;
  return (
    <span aria-hidden="true" className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-fill-2 text-ink-2">
      {t.icon}
    </span>
  );
}

function AdviceItem({ a, className = '' }: { a: Advice; className?: string }) {
  return (
    <li className={`flex gap-3 ${className}`}>
      <TopicBadge topic={a.topic} />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold">{a.title}</p>
        <p className="mt-0.5 max-w-[38ch] text-footnote font-normal text-ink-2">{a.text}</p>
      </div>
    </li>
  );
}

/** Today: a few tips that fit the current fast, hunger pattern, sleep and water. */
export function AdviceCard({ d, now }: { d: Data; now: number }) {
  const { openSheet } = useUI();
  const tips = adviceFor(d, now);
  return (
    <>
      <GroupTitle
        title="Зөвлөгөө"
        aside={
          <button
            onClick={() => openSheet('advice')}
            className="tap -my-2 min-h-[44px] px-1 text-[15px] font-semibold text-green-ink"
          >
            Бүгд
          </button>
        }
      />
      <section className="grouped px-4" aria-label="Зөвлөгөө">
        <ul>
          {tips.map((a) => (
            <AdviceItem key={a.id} a={a} className="row-sep py-3.5 [--sep-inset:42px]" />
          ))}
        </ul>
      </section>
    </>
  );
}

/** Sheet body: the whole library, grouped by topic. */
export function AdviceLibrary() {
  const topics = Object.keys(TOPIC_LABEL) as AdviceTopic[];
  return (
    <div className="pb-2">
      {topics.map((t) => (
        <section key={t} className="mb-5" aria-label={TOPIC_LABEL[t]}>
          <h3 className="mb-1 text-footnote font-semibold text-ink-2">{TOPIC_LABEL[t]}</h3>
          <ul>
            {ADVICE.filter((a) => a.topic === t).map((a) => (
              <AdviceItem key={a.id} a={a} className="row-sep py-3 [--sep-inset:42px]" />
            ))}
          </ul>
        </section>
      ))}
      <p className="text-caption text-ink-3">Ерөнхий мэдээлэл бөгөөд эмчийн зөвлөгөөг орлохгүй.</p>
    </div>
  );
}

import type { Data, DailyMetrics, HungerEntry } from './types';
import { DAY, HOUR, dayKey, pad, startOfDay } from './time';

export const MIN_ENTRIES = 6;
export const MIN_DAYS = 2;

const fracHour = (t: number) => {
  const d = new Date(t);
  return d.getHours() + d.getMinutes() / 60;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function inRange<T extends { timestamp: number }>(xs: T[], days: number, now = Date.now()) {
  if (!days) return xs;
  const from = startOfDay(now) - (days - 1) * DAY;
  return xs.filter((x) => x.timestamp >= from);
}

export interface CurvePoint {
  h: number;
  v: number | null;
}

export interface HungerProfile {
  n: number;
  days: number;
  enough: boolean;
  average: number | null;
  curve: CurvePoint[];
  domain: [number, number];
  peak: { start: number; end: number; value: number } | null;
  low: { start: number; end: number; value: number } | null;
  /** raw hourly averages for the text alternative + direct labels */
  hourly: { h: number; avg: number | null; count: number }[];
}

/** Gaussian-smoothed average hunger by time of day. Gaps stay gaps; nothing is invented. */
export function hungerProfile(entries: HungerEntry[]): HungerProfile {
  const n = entries.length;
  const days = new Set(entries.map((e) => dayKey(e.timestamp))).size;
  const pts = entries.map((e) => ({ h: fracHour(e.timestamp), v: e.intensity }));
  const earliest = pts.length ? Math.min(...pts.map((p) => p.h)) : 6;
  const domain: [number, number] = [Math.min(6, Math.floor(earliest)), 24];

  const sigma = 1.1;
  const curve: CurvePoint[] = [];
  for (let h = domain[0]; h <= domain[1] + 1e-9; h += 0.25) {
    let sw = 0;
    let sv = 0;
    for (const p of pts) {
      const dist = Math.abs(p.h - h);
      const w = Math.exp(-(dist * dist) / (2 * sigma * sigma));
      sw += w;
      sv += w * p.v;
    }
    curve.push({ h, v: sw > 0.35 ? sv / sw : null });
  }

  const hourly = Array.from({ length: 24 }, (_, h) => {
    const xs = pts.filter((p) => Math.floor(p.h) === h).map((p) => p.v);
    return { h, avg: mean(xs), count: xs.length };
  });

  const window = (best: 'max' | 'min') => {
    let pick: { start: number; value: number } | null = null;
    for (let s = domain[0]; s <= domain[1] - 2; s += 1) {
      const seg = curve.filter((c) => c.h >= s && c.h <= s + 2 && c.v != null).map((c) => c.v as number);
      if (seg.length < 7) continue;
      const v = mean(seg)!;
      if (!pick || (best === 'max' ? v > pick.value : v < pick.value)) pick = { start: s, value: v };
    }
    if (!pick) return null;
    const raw = pts.filter((p) => p.h >= pick!.start && p.h < pick!.start + 2).map((p) => p.v);
    return { start: pick.start, end: pick.start + 2, value: mean(raw) ?? pick.value };
  };

  const enough = n >= MIN_ENTRIES && days >= MIN_DAYS;
  return {
    n,
    days,
    enough,
    average: mean(pts.map((p) => p.v)),
    curve,
    domain,
    peak: enough ? window('max') : null,
    low: enough ? window('min') : null,
    hourly,
  };
}

export const windowLabel = (w: { start: number; end: number }) => `${pad(w.start)}:00–${pad(w.end)}:00`;

/* ---------- daily metrics ---------- */
export function dailyMetrics(d: Data, t: number): DailyMetrics {
  const key = dayKey(t);
  const s = startOfDay(t);
  const e = s + DAY;
  const hunger = d.hunger.filter((h) => dayKey(h.timestamp) === key).map((h) => h.intensity);
  const fastMs = d.fasts.reduce((acc, f) => acc + Math.max(0, Math.min(f.endTime, e) - Math.max(f.startTime, s)), 0);
  const sleep = d.sleep.filter((x) => dayKey(x.wakeTime) === key);
  const water = d.water.filter((w) => dayKey(w.timestamp) === key).reduce((a, w) => a + w.amount, 0);
  const weights = d.weights.filter((w) => dayKey(w.timestamp) === key);
  return {
    date: key,
    averageHunger: mean(hunger),
    fastingDuration: Math.round(fastMs / 60e3),
    sleepDuration: sleep.length ? sleep.reduce((a, x) => a + x.duration, 0) : null,
    waterAmount: water,
    weight: weights.length ? weights[weights.length - 1].weight : null,
  };
}

export function daySeries(d: Data, days: number, now = Date.now()): DailyMetrics[] {
  return Array.from({ length: days }, (_, i) => dailyMetrics(d, now - (days - 1 - i) * DAY));
}

/** Change from the reading closest to `days` ago. Null when history is too short to say. */
export function weightChange(d: Data, days: number) {
  const ws = d.weights;
  if (ws.length < 2) return null;
  const last = ws[ws.length - 1];
  const target = last.timestamp - days * DAY;
  const older = ws.filter((w) => w.timestamp <= last.timestamp - days * DAY * 0.5);
  if (!older.length) return null;
  const ref = older.reduce((a, b) => (Math.abs(b.timestamp - target) < Math.abs(a.timestamp - target) ? b : a));
  return +(last.weight - ref.weight).toFixed(1);
}

/* ---------- insights: observations from the owner's own records only ---------- */
export interface Insight {
  id: string;
  text: string;
}

export function insights(d: Data, rangeDays: number, now = Date.now()): Insight[] {
  const out: Insight[] = [];
  const hs = inRange(d.hunger, rangeDays, now);
  const prof = hungerProfile(hs);
  if (!prof.enough) return out;

  if (prof.peak) {
    out.push({ id: 'peak', text: `Таны өлсөлт ихэвчлэн ${windowLabel(prof.peak)} цагт хамгийн өндөр байна.` });
  }
  if (prof.low && prof.peak && prof.peak.value - prof.low.value >= 1.5) {
    out.push({ id: 'low', text: `Хамгийн бага нь ${windowLabel(prof.low)} орчим — дунджаар ${prof.low.value.toFixed(1)}.` });
  }

  // hunger by hour into a fast
  const fe = hs.filter((h) => h.fasting && h.fastHours != null);
  if (fe.length >= 5) {
    const bins = new Map<number, number[]>();
    fe.forEach((h) => {
      const b = Math.floor((h.fastHours as number) / 2) * 2;
      bins.set(b, [...(bins.get(b) ?? []), h.intensity]);
    });
    const best = [...bins.entries()].filter(([, v]) => v.length >= 2).sort((a, b) => mean(b[1])! - mean(a[1])!)[0];
    if (best) {
      out.push({
        id: 'fast-hours',
        text: `Мацгийн ${best[0]}–${best[0] + 2} дахь цагт өлсөлт хамгийн өндөр байна (${mean(best[1])!.toFixed(1)}).`,
      });
    }
    const fp = hungerProfile(fe);
    if (fp.peak && fp.n >= 6) {
      const mid = fp.peak.start + 1;
      out.push({ id: 'fast-peak', text: `Мацаг барьж байх үед ${pad(mid)}:00 орчимд өлсөлт нэмэгдэх хандлагатай.` });
    }
  }

  // sleep vs next-day hunger
  const byDay = new Map<string, number[]>();
  hs.forEach((h) => {
    const k = dayKey(h.timestamp);
    byDay.set(k, [...(byDay.get(k) ?? []), h.intensity]);
  });
  const sleepByDay = new Map<string, number>();
  d.sleep.forEach((s) => sleepByDay.set(dayKey(s.wakeTime), (sleepByDay.get(dayKey(s.wakeTime)) ?? 0) + s.duration));
  const longS: number[] = [];
  const shortS: number[] = [];
  byDay.forEach((v, k) => {
    const sl = sleepByDay.get(k);
    if (sl == null) return;
    (sl >= 420 ? longS : shortS).push(mean(v)!);
  });
  if (longS.length >= 3 && shortS.length >= 3) {
    const a = mean(longS)!;
    const b = mean(shortS)!;
    if (Math.abs(a - b) >= 0.5) {
      out.push({
        id: 'sleep',
        text: `7+ цаг унтсан өдрүүдэд дундаж өлсөлт ${a.toFixed(1)}, бусад өдөрт ${b.toFixed(1)} байна.`,
      });
    }
  }

  // water goal vs hunger
  const goal = d.profile.waterGoalMl;
  const metW: number[] = [];
  const missW: number[] = [];
  byDay.forEach((v, k) => {
    const w = d.water.filter((x) => dayKey(x.timestamp) === k).reduce((a, x) => a + x.amount, 0);
    (w >= goal ? metW : missW).push(mean(v)!);
  });
  if (metW.length >= 3 && missW.length >= 3) {
    const a = mean(metW)!;
    const b = mean(missW)!;
    if (Math.abs(a - b) >= 0.5) {
      out.push({
        id: 'water',
        text: `Усны зорилгодоо хүрсэн өдрүүдэд дундаж өлсөлт ${a.toFixed(1)}, бусад өдөрт ${b.toFixed(1)} байна.`,
      });
    }
  }
  return out;
}

export const HUNGER_WORDS: Record<number, string> = {
  1: 'Огт өлсөөгүй',
  2: 'Бараг өлсөөгүй',
  3: 'Бага зэрэг',
  4: 'Бага зэрэг',
  5: 'Дунд зэрэг',
  6: 'Дунд зэрэг',
  7: 'Маш их',
  8: 'Маш их',
  9: 'Тэсэхэд хэцүү',
  10: 'Тэсэхэд хэцүү',
};

export const fastHoursIn = (start: number, now: number) => (now - start) / HOUR;

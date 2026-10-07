'use client';

import { uid, update } from './store';
import type { Data, HungerEntry, MetricKey, UserProfile, VitalType } from './types';
import { HOUR } from './time';

export function startFast(targetHours: number, startTime = Date.now()) {
  return update((d) => ({ ...d, activeFast: { startTime, targetHours } }));
}

export function setFastStart(startTime: number) {
  return update((d) => (d.activeFast ? { ...d, activeFast: { ...d.activeFast, startTime } } : d));
}

export function setFastTarget(targetHours: number) {
  return update((d) => ({
    ...d,
    profile: { ...d.profile, fastingGoalH: targetHours },
    activeFast: d.activeFast ? { ...d.activeFast, targetHours } : null,
  }));
}

/** Ends the active fast. Fasts under 10 minutes are discarded as accidental. */
export function endFast(endTime = Date.now()) {
  return update((d) => {
    if (!d.activeFast) return d;
    const { startTime, targetHours } = d.activeFast;
    const keep = endTime - startTime >= 10 * 60e3;
    return {
      ...d,
      activeFast: null,
      fasts: keep
        ? [
            ...d.fasts,
            { id: uid(), startTime, endTime, targetHours, completed: endTime - startTime >= targetHours * HOUR },
          ]
        : d.fasts,
    };
  });
}

export function logHunger(e: Omit<HungerEntry, 'id' | 'fasting' | 'fastHours'> & { fasting?: boolean }) {
  const id = uid();
  const ok = update((d) => {
    const inFast = d.activeFast && e.timestamp >= d.activeFast.startTime;
    const fasting = e.fasting ?? !!inFast;
    const fastHours = fasting && d.activeFast ? (e.timestamp - d.activeFast.startTime) / HOUR : null;
    const entry: HungerEntry = { ...e, id, fasting, fastHours };
    const hunger = [...d.hunger, entry].sort((a, b) => a.timestamp - b.timestamp);
    return { ...d, hunger, profile: { ...d.profile, lastPromptHour: hourKeyOf(e.timestamp) } };
  });
  return { ok, id };
}

const hourKeyOf = (t: number) => {
  const x = new Date(t);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}T${x.getHours()}`;
};
export const promptKey = hourKeyOf;

export function addWeight(weight: number, timestamp = Date.now()) {
  return update((d) => ({
    ...d,
    weights: [...d.weights, { id: uid(), weight, timestamp }].sort((a, b) => a.timestamp - b.timestamp),
  }));
}

export function addWater(amount: number) {
  const id = uid();
  const ok = update((d) => ({ ...d, water: [...d.water, { id, amount, timestamp: Date.now() }] }));
  return { ok, id };
}

export function addSleep(sleepStart: number, wakeTime: number) {
  return update((d) => ({
    ...d,
    sleep: [
      ...d.sleep,
      { id: uid(), sleepStart, wakeTime, duration: Math.round((wakeTime - sleepStart) / 60e3) },
    ].sort((a, b) => a.wakeTime - b.wakeTime),
  }));
}

export function addVital(type: VitalType, value: number, value2?: number) {
  return update((d) => ({
    ...d,
    vitals: [...d.vitals, { id: uid(), type, value, value2, timestamp: Date.now() }],
  }));
}

type ListKey = 'weights' | 'hunger' | 'fasts' | 'sleep' | 'water' | 'vitals';
export function removeEntry(list: ListKey, id: string) {
  return update((d) => ({ ...d, [list]: (d[list] as { id: string }[]).filter((x) => x.id !== id) }) as Data);
}

export function setProfile(patch: Partial<UserProfile>) {
  return update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
}

export function toggleMetric(key: MetricKey, on: boolean) {
  return update((d) => {
    const set = new Set(d.profile.visibleMetrics);
    if (on) set.add(key);
    else set.delete(key);
    return { ...d, profile: { ...d.profile, visibleMetrics: [...set] } };
  });
}

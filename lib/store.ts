'use client';

import { useSyncExternalStore } from 'react';
import type { Data, UserProfile } from './types';

export const STORAGE_KEY = 'hungertruck.v2';
const LEGACY_KEY = 'hungertruck.v1';

export const defaultProfile = (): UserProfile => ({
  heightCm: null,
  dateOfBirth: null,
  fastingGoalH: 16,
  waterGoalMl: 2500,
  theme: 'system',
  visibleMetrics: ['weight', 'sleep', 'water', 'hunger'],
  hourlyPrompt: false,
  quietStart: 22,
  quietEnd: 8,
  lastPromptHour: '',
  lastExportAt: null,
  exportSnoozeUntil: null,
});

export const emptyData = (): Data => ({
  version: 2,
  profile: defaultProfile(),
  weights: [],
  hunger: [],
  fasts: [],
  activeFast: null,
  plannedFast: null,
  sleep: [],
  water: [],
  vitals: [],
});

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/* ---------- legacy v1 (vanilla build) migration ---------- */
interface V1 {
  hunger?: { t: number; level: number; note?: string; fastH?: number | null }[];
  fasts?: { start: number; end: number; goalH: number }[];
  activeFast?: { start: number; goalH: number } | null;
  metrics?: { t: number; type: string; v: number; v2?: number }[];
  settings?: { hourly?: boolean; quietStart?: number; quietEnd?: number };
}

function migrateV1(old: V1): Data {
  const d = emptyData();
  d.hunger = (old.hunger ?? []).map((h) => ({
    id: uid(),
    intensity: Math.min(10, Math.max(1, Math.round(h.level * 2))),
    timestamp: h.t,
    fasting: h.fastH != null,
    fastHours: h.fastH ?? null,
    note: h.note || undefined,
  }));
  d.fasts = (old.fasts ?? []).map((f) => ({
    id: uid(),
    startTime: f.start,
    endTime: f.end,
    targetHours: f.goalH,
    completed: f.end - f.start >= f.goalH * 3600e3,
  }));
  if (old.activeFast) d.activeFast = { startTime: old.activeFast.start, targetHours: old.activeFast.goalH };
  for (const m of old.metrics ?? []) {
    if (m.type === 'weight') d.weights.push({ id: uid(), weight: m.v, timestamp: m.t });
    else if (m.type === 'water') d.water.push({ id: uid(), amount: m.v, timestamp: m.t });
    else if (m.type === 'sleep')
      d.sleep.push({ id: uid(), sleepStart: m.t - m.v * 3600e3, wakeTime: m.t, duration: Math.round(m.v * 60) });
    else if (['glucose', 'ketone', 'bp', 'hr'].includes(m.type))
      d.vitals.push({ id: uid(), type: m.type as 'glucose', value: m.v, value2: m.v2, timestamp: m.t });
  }
  if (old.settings) {
    d.profile.hourlyPrompt = !!old.settings.hourly;
    d.profile.quietStart = old.settings.quietStart ?? 22;
    d.profile.quietEnd = old.settings.quietEnd ?? 8;
  }
  return d;
}

export function normalize(raw: unknown): Data {
  const r = (raw ?? {}) as Partial<Data>;
  const base = emptyData();
  return {
    ...base,
    ...r,
    version: 2,
    profile: { ...base.profile, ...(r.profile ?? {}) },
    weights: Array.isArray(r.weights) ? r.weights : [],
    hunger: Array.isArray(r.hunger) ? r.hunger : [],
    fasts: Array.isArray(r.fasts) ? r.fasts : [],
    sleep: Array.isArray(r.sleep) ? r.sleep : [],
    water: Array.isArray(r.water) ? r.water : [],
    vitals: Array.isArray(r.vitals) ? r.vitals : [],
    activeFast: r.activeFast ?? null,
    plannedFast: r.plannedFast ?? null,
  };
}

function readStorage(): Data {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) return normalize(JSON.parse(v2));
    const v1 = localStorage.getItem(LEGACY_KEY);
    if (v1) {
      const migrated = migrateV1(JSON.parse(v1));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    /* blocked or corrupt storage: start empty, never crash */
  }
  return emptyData();
}

/* ---------- external store ---------- */
let state: Data | null = null;
let saveError = false;
const listeners = new Set<() => void>();
const SERVER = emptyData();

function emit() {
  listeners.forEach((l) => l());
}

function current(): Data {
  if (state === null) state = readStorage();
  return state;
}

function persist(): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveError = false;
    return true;
  } catch {
    saveError = true;
    return false;
  }
}

/** Apply an immutable update. Returns false when the write to storage failed. */
export function update(fn: (d: Data) => Data): boolean {
  state = fn(current());
  const ok = persist();
  emit();
  return ok;
}

export function retrySave(): boolean {
  const ok = persist();
  emit();
  return ok;
}

export function replaceAll(d: Data) {
  state = normalize(d);
  persist();
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = readStorage();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useData(): Data {
  return useSyncExternalStore(subscribe, current, () => SERVER);
}

export function useSaveError(): boolean {
  return useSyncExternalStore(subscribe, () => saveError, () => false);
}

const noop = () => () => {};
/** false during static prerender + hydration, true once running in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

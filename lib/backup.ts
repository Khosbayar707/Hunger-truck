'use client';

import { useEffect, useState } from 'react';
import { setProfile } from './actions';
import type { Data } from './types';
import { DAY, dayKey } from './time';

/* ---------- export ---------- */
function download(name: string, body: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function toCSV(d: Data) {
  const iso = (t: number) => new Date(t).toISOString();
  const rows: (string | number)[][] = [['type', 'timestamp', 'value', 'value2', 'detail']];
  d.hunger.forEach((h) =>
    rows.push(['hunger', iso(h.timestamp), h.intensity, h.fasting ? 1 : 0, [h.reason, h.mood, h.note].filter(Boolean).join(' | ')]),
  );
  d.weights.forEach((w) => rows.push(['weight', iso(w.timestamp), w.weight, '', '']));
  d.water.forEach((w) => rows.push(['water', iso(w.timestamp), w.amount, '', '']));
  d.sleep.forEach((s) => rows.push(['sleep', iso(s.wakeTime), s.duration, '', iso(s.sleepStart)]));
  d.fasts.forEach((f) =>
    rows.push(['fast', iso(f.startTime), Math.round((f.endTime - f.startTime) / 60e3), f.targetHours, iso(f.endTime)]),
  );
  d.vitals.forEach((v) => rows.push([v.type, iso(v.timestamp), v.value, v.value2 ?? '', '']));
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/** Downloads a backup and remembers when, so the reminder can stay quiet. */
export function exportData(d: Data, format: 'json' | 'csv') {
  const stamp = dayKey(Date.now());
  if (format === 'json') download(`hunger-truck-${stamp}.json`, JSON.stringify(d, null, 2), 'application/json');
  else download(`hunger-truck-${stamp}.csv`, '﻿' + toCSV(d), 'text/csv');
  setProfile({ lastExportAt: Date.now(), exportSnoozeUntil: null });
}

export const recordCount = (d: Data) =>
  d.hunger.length + d.weights.length + d.water.length + d.sleep.length + d.fasts.length + d.vitals.length;

const firstRecordAt = (d: Data) =>
  Math.min(
    ...[...d.hunger, ...d.weights, ...d.water, ...d.vitals].map((x) => x.timestamp),
    ...d.sleep.map((s) => s.wakeTime),
    ...d.fasts.map((f) => f.endTime),
    Infinity,
  );

export const REMIND_AFTER_DAYS = 30;

/** Days since the last backup (or since the first record, if never backed up). Null when no reminder is due. */
export function backupDue(d: Data, now = Date.now()): { days: number; never: boolean } | null {
  if (recordCount(d) < 20) return null;
  const { lastExportAt, exportSnoozeUntil } = d.profile;
  if (exportSnoozeUntil && now < exportSnoozeUntil) return null;
  const since = lastExportAt ?? firstRecordAt(d);
  if (!isFinite(since)) return null;
  const days = Math.floor((now - since) / DAY);
  return days >= REMIND_AFTER_DAYS ? { days, never: lastExportAt == null } : null;
}

export const snoozeBackup = () => setProfile({ exportSnoozeUntil: Date.now() + 7 * DAY });

/* ---------- persistent storage ---------- */
export type PersistState = 'unsupported' | 'granted' | 'denied' | 'unknown';

/** Asks the browser not to evict our data under storage pressure. Safe to call repeatedly. */
export async function requestPersist(): Promise<PersistState> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return 'unsupported';
  try {
    if (await navigator.storage.persisted()) return 'granted';
    return (await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch {
    return 'unknown';
  }
}

export function usePersistState() {
  const [state, setState] = useState<PersistState>('unknown');
  useEffect(() => {
    if (!navigator.storage?.persisted) {
      setState('unsupported');
      return;
    }
    navigator.storage
      .persisted()
      .then((p) => setState(p ? 'granted' : 'denied'))
      .catch(() => setState('unknown'));
  }, []);
  return [state, setState] as const;
}

'use client';

import { update } from './store';
import { HOUR } from './time';

/*
  Fast-end reminder through the phone's own calendar: we hand the OS an .ics event with an alarm
  at the goal time. No server, nothing leaves the device except into the user's calendar app.
  The UID stays fixed per fast and SEQUENCE rises on each re-add, so calendars that honour
  iCalendar updates replace the old event instead of duplicating it.
*/

const utc = (t: number) => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** RFC 5545 line folding at 75 octets, counting UTF-8 bytes (Cyrillic is 2 bytes per letter). */
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // continuation lines start with a space
    if (bytes + b > limit) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function fastIcs(opts: { uid: string; seq: number; start: number; end: number; hours: number }) {
  const { uid, seq, start, end, hours } = opts;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hunger Truck//MN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SEQUENCE:${seq}`,
    `DTSTAMP:${utc(Date.now())}`,
    `DTSTART:${utc(end)}`,
    `DTEND:${utc(end + 15 * 60e3)}`,
    `SUMMARY:${esc(`Мацгийн зорилго: ${hours} цаг`)}`,
    `DESCRIPTION:${esc(`Hunger Truck — ${hours} цагийн мацаг энэ цагт дуусна. Эхэлсэн: ${new Date(start).toLocaleString('mn-MN')}`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${esc('Мацгийн зорилгод хүрлээ')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Opens the event in the OS calendar flow (iOS shows "Add to Calendar"; Android opens it with the calendar app). */
function openIcs(body: string, name: string) {
  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (ios) {
    // Safari hands text/calendar to Calendar when navigated to, not when downloaded
    window.location.href = url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export interface CalendarMark {
  uid: string;
  seq: number;
  end: number;
}

/** Adds (or re-adds after a change) the active fast's end to the calendar and remembers what was added. */
export function addFastToCalendar(fast: { startTime: number; targetHours: number; calendar?: CalendarMark }) {
  const end = fast.startTime + fast.targetHours * HOUR;
  const uid = fast.calendar?.uid ?? `fast-${fast.startTime}-${Math.random().toString(36).slice(2, 8)}@hunger-truck`;
  const seq = fast.calendar ? fast.calendar.seq + 1 : 0;
  openIcs(fastIcs({ uid, seq, start: fast.startTime, end, hours: fast.targetHours }), 'hunger-truck-macag.ics');
  update((d) => (d.activeFast ? { ...d, activeFast: { ...d.activeFast, calendar: { uid, seq, end } } } : d));
}

/** 'none' = never added, 'ok' = calendar matches, 'stale' = start or goal changed since it was added. */
export function calendarState(fast: { startTime: number; targetHours: number; calendar?: CalendarMark }) {
  if (!fast.calendar) return 'none' as const;
  return fast.calendar.end === fast.startTime + fast.targetHours * HOUR ? ('ok' as const) : ('stale' as const);
}

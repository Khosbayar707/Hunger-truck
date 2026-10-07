export const MIN = 60e3;
export const HOUR = 3600e3;
export const DAY = 24 * HOUR;

export const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
export const WEEKDAY_SHORT = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

export const pad = (n: number) => String(n).padStart(2, '0');

export const hm = (t: number | Date) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const dayKey = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const hourKey = (t: number | Date) => `${dayKey(t)}T${pad(new Date(t).getHours())}`;

export const startOfDay = (t: number | Date) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "10 сарын 7 · Лхагва" */
export const longDate = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getMonth() + 1} сарын ${d.getDate()} · ${WEEKDAYS[d.getDay()]}`;
};

/** "Өнөөдөр", "Өчигдөр", or "10/4 · Бя" */
export const relDay = (t: number | Date, now = Date.now()) => {
  const diff = Math.round((startOfDay(now) - startOfDay(t)) / DAY);
  if (diff === 0) return 'Өнөөдөр';
  if (diff === 1) return 'Өчигдөр';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} · ${WEEKDAY_SHORT[d.getDay()]}`;
};

/** clock-style "14:32" (hours can exceed 24) */
export const clockDur = (ms: number) => {
  const m = Math.max(0, Math.floor(ms / MIN));
  return `${Math.floor(m / 60)}:${pad(m % 60)}`;
};

export const secs = (ms: number) => pad(Math.max(0, Math.floor(ms / 1000)) % 60);

/** compact "7ц 42м" */
export const shortDur = (ms: number) => {
  const m = Math.max(0, Math.round(ms / MIN));
  const h = Math.floor(m / 60);
  if (!h) return `${m % 60}м`;
  return m % 60 ? `${h}ц ${m % 60}м` : `${h}ц`;
};

/** spoken "1 цаг 28 минут" */
export const longDur = (ms: number) => {
  const m = Math.max(0, Math.round(ms / MIN));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} минут`;
  return r ? `${h} цаг ${r} минут` : `${h} цаг`;
};

export const toLocalInput = (t: number) => `${dayKey(t)}T${hm(t)}`;

export const hourLabel = (h: number) => `${pad(Math.round(h) % 24 === 0 && h > 0 ? 24 : Math.round(h))}:00`;

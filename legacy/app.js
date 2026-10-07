'use strict';

// ---------- storage ----------
const KEY = 'hungertruck.v1';
const defaults = () => ({
  hunger: [],      // {t, level, note, fastH}
  fasts: [],       // {start, end, goalH}
  activeFast: null, // {start, goalH}
  metrics: [],     // {t, type, v, v2}
  settings: { hourly: false, quietStart: 22, quietEnd: 8, lastPrompt: '' },
});
let db = load();
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw) return { ...defaults(), ...raw, settings: { ...defaults().settings, ...raw.settings } };
  } catch (e) { /* corrupt or blocked storage */ }
  return defaults();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('Хадгалж чадсангүй!'); }
}

// ---------- helpers ----------
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const HOUR = 3600e3;
const pad = (n) => String(n).padStart(2, '0');
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hourKey = (d) => `${dayKey(d)}T${pad(d.getHours())}`;
const fmtDate = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${hm(d)}`;
const toLocalInput = (d) => `${dayKey(d)}T${hm(d)}`;
const fmtDur = (ms) => {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)}:${pad(m % 60)}`;
};
const hColor = (lvl) => `var(--h${Math.round(lvl)})`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WEEK = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// ---------- tabs ----------
$$('.tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $$('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
  renderAll();
  window.scrollTo(0, 0);
}));

// ---------- fasting ----------
const STAGES = [
  [0, 'Хоол шингээж байна'],
  [4, 'Цусан дахь сахар буурч байна'],
  [12, 'Кетоз эхэлж байна'],
  [18, 'Өөх шатаалт идэвхжиж байна'],
  [24, 'Аутофаги нэмэгдэж байна'],
  [48, 'Гүн кетоз'],
];
const RING_LEN = 2 * Math.PI * 52;

function renderFast() {
  const f = db.activeFast;
  const fg = $('#ring-fg');
  fg.style.strokeDasharray = RING_LEN;
  const btn = $('#fast-btn');
  if (!f) {
    fg.style.strokeDashoffset = RING_LEN;
    fg.classList.remove('done');
    $('#fast-elapsed').textContent = '--:--';
    $('#fast-sub').textContent = 'Мацаг эхлээгүй';
    $('#fast-stage').textContent = lastFastText();
    btn.textContent = 'Мацаг эхлүүлэх';
    btn.classList.remove('stop');
    $('#fast-edit-start').hidden = true;
    $('#fast-goal').disabled = false;
    return;
  }
  const el = Date.now() - f.start;
  const goal = f.goalH * HOUR;
  const p = Math.min(1, el / goal);
  fg.style.strokeDashoffset = RING_LEN * (1 - p);
  fg.classList.toggle('done', p >= 1);
  $('#fast-elapsed').textContent = fmtDur(el);
  $('#fast-sub').textContent = p >= 1
    ? `Зорилгод хүрлээ! +${fmtDur(el - goal)}`
    : `Үлдсэн ${fmtDur(goal - el)} · ${Math.floor(p * 100)}%`;
  const h = el / HOUR;
  const stage = STAGES.filter(([s]) => h >= s).pop();
  $('#fast-stage').textContent = stage[1];
  btn.textContent = 'Мацаг дуусгах';
  btn.classList.add('stop');
  $('#fast-edit-start').hidden = false;
  $('#fast-goal').value = String(f.goalH);
  $('#fast-goal').disabled = false;
}

function lastFastText() {
  const last = db.fasts[db.fasts.length - 1];
  if (!last) return '';
  return `Сүүлд хооллосон: ${fmtDur(Date.now() - last.end)} цагийн өмнө`;
}

$('#fast-btn').addEventListener('click', () => {
  if (db.activeFast) {
    const el = Date.now() - db.activeFast.start;
    if (el < 10 * 60e3 && !confirm('10 минутаас бага байна. Дуусгах уу? (хадгалагдахгүй)')) return;
    if (el >= 10 * 60e3) db.fasts.push({ ...db.activeFast, end: Date.now() });
    db.activeFast = null;
    toast(`Мацаг дууслаа: ${fmtDur(el)}`);
  } else {
    db.activeFast = { start: Date.now(), goalH: +$('#fast-goal').value };
    toast('Мацаг эхэллээ');
  }
  save(); renderAll();
});

$('#fast-goal').addEventListener('change', () => {
  if (db.activeFast) { db.activeFast.goalH = +$('#fast-goal').value; save(); renderFast(); }
});

$('#fast-edit-start').addEventListener('click', () => {
  const cur = toLocalInput(new Date(db.activeFast.start)).replace('T', ' ');
  const v = prompt('Эхэлсэн цаг (ОООО-СС-ӨӨ ЦЦ:ММ):', cur);
  if (!v) return;
  const t = new Date(v.trim().replace(' ', 'T')).getTime();
  if (isNaN(t) || t > Date.now()) return toast('Буруу цаг');
  db.activeFast.start = t;
  save(); renderFast();
});

// ---------- hunger ----------
function logHunger(level, note = '') {
  const t = Date.now();
  const fastH = db.activeFast ? (t - db.activeFast.start) / HOUR : null;
  db.hunger.push({ t, level, note, fastH });
  db.settings.lastPrompt = hourKey(new Date(t));
  save();
  toast(`Өлсөлт ${level}/5 бүртгэгдлээ`);
  renderAll();
}

$('#hunger-btns').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const note = $('#hunger-note').value.trim();
  $('#hunger-note').value = '';
  logHunger(+b.dataset.level, note);
});

function hungerLi(h, i) {
  const d = new Date(h.t);
  const fast = h.fastH != null ? ` · мацгийн ${Math.floor(h.fastH)}ц` : '';
  return `<li><span class="dot" style="background:${hColor(h.level)}">${h.level}</span>
    <div class="grow"><div>${fmtDate(d)}<span class="muted small">${fast}</span></div>
    ${h.note ? `<div class="note">${esc(h.note)}</div>` : ''}</div>
    <button class="del" data-del-hunger="${i}" aria-label="Устгах">×</button></li>`;
}

function renderTodayHunger() {
  const today = dayKey(new Date());
  const items = db.hunger.map((h, i) => [h, i]).filter(([h]) => dayKey(new Date(h.t)) === today).reverse();
  $('#today-hunger').innerHTML = items.map(([h, i]) => hungerLi(h, i)).join('')
    || '<li class="muted small">Өнөөдөр бүртгэл алга</li>';
}

document.addEventListener('click', (e) => {
  const d = e.target.closest('[data-del-hunger]');
  if (d && confirm('Энэ бүртгэлийг устгах уу?')) {
    db.hunger.splice(+d.dataset.delHunger, 1); save(); renderAll();
  }
  const m = e.target.closest('[data-del-metric]');
  if (m && confirm('Устгах уу?')) {
    db.metrics.splice(+m.dataset.delMetric, 1); save(); renderAll();
  }
  const f = e.target.closest('[data-del-fast]');
  if (f && confirm('Энэ мацгийг устгах уу?')) {
    db.fasts.splice(+f.dataset.delFast, 1); save(); renderAll();
  }
});

// ---------- hunger analytics ----------
let rangeDays = 30;
$('#range-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  rangeDays = +b.dataset.days;
  $$('#range-seg button').forEach((x) => x.classList.toggle('on', x === b));
  renderHungerStats();
});

function inRange() {
  if (!rangeDays) return db.hunger;
  const from = Date.now() - rangeDays * 24 * HOUR;
  return db.hunger.filter((h) => h.t >= from);
}

function barChart(values, counts, labels, { max = 5, labelEvery = 1 } = {}) {
  const n = values.length, W = 320, H = 130, top = 8, bottom = 18;
  const bw = W / n;
  const ch = H - top - bottom;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let g = 1; g <= 5; g++) {
    const y = top + ch - (g / max) * ch;
    s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="#2a2e36" stroke-width=".5"/>`;
  }
  values.forEach((v, i) => {
    const x = i * bw + 1;
    if (v != null) {
      const h = (v / max) * ch;
      s += `<rect x="${x}" y="${top + ch - h}" width="${bw - 2}" height="${h}" rx="2" fill="${hColor(Math.max(1, v))}">
        <title>${labels[i]}: ${v.toFixed(1)} (${counts[i]} бүртгэл)</title></rect>`;
    }
    if (i % labelEvery === 0) s += `<text x="${x + bw / 2 - 1}" y="${H - 5}" text-anchor="middle">${labels[i]}</text>`;
  });
  return s + '</svg>';
}

function renderHungerStats() {
  const data = inRange();
  const sum = Array(24).fill(0), cnt = Array(24).fill(0);
  data.forEach((h) => { const hr = new Date(h.t).getHours(); sum[hr] += h.level; cnt[hr]++; });
  const avg = sum.map((s, i) => (cnt[i] ? s / cnt[i] : null));
  $('#hour-chart').innerHTML = barChart(avg, cnt, avg.map((_, i) => i), { labelEvery: 3 });

  const ranked = avg.map((v, i) => [v, i]).filter(([v]) => v != null).sort((a, b) => b[0] - a[0]);
  if (ranked.length < 3) {
    $('#hour-summary').innerHTML = `<span class="muted">Дүгнэлт гаргахад илүү бүртгэл хэрэгтэй (одоо ${data.length}).</span>`;
  } else {
    const top = ranked.slice(0, 3).map(([v, i]) => `<b>${pad(i)}:00</b> (${v.toFixed(1)})`).join(', ');
    const low = ranked.slice(-2).reverse().map(([v, i]) => `${pad(i)}:00`).join(', ');
    $('#hour-summary').innerHTML = `Хамгийн их өлсдөг: ${top}<br><span class="muted">Хамгийн бага: ${low} · ${data.length} бүртгэл</span>`;
  }

  // weekday x hour heatmap
  const hs = Array.from({ length: 7 }, () => Array(24).fill(0));
  const hc = Array.from({ length: 7 }, () => Array(24).fill(0));
  data.forEach((h) => { const d = new Date(h.t); hs[d.getDay()][d.getHours()] += h.level; hc[d.getDay()][d.getHours()]++; });
  let html = '<div></div>' + Array.from({ length: 24 }, (_, i) => `<div class="lbl">${i % 3 === 0 ? i : ''}</div>`).join('');
  [1, 2, 3, 4, 5, 6, 0].forEach((wd) => {
    html += `<div class="lbl">${WEEK[wd]}</div>`;
    for (let hr = 0; hr < 24; hr++) {
      const c = hc[wd][hr];
      const v = c ? hs[wd][hr] / c : 0;
      html += c
        ? `<div class="c" style="background:${hColor(Math.max(1, v))}" title="${WEEK[wd]} ${hr}:00 — ${v.toFixed(1)} (${c})"></div>`
        : '<div class="c"></div>';
    }
  });
  $('#heatmap').innerHTML = html;

  // hunger by hour-into-fast
  const fd = data.filter((h) => h.fastH != null);
  if (!fd.length) {
    $('#fast-hour-chart').innerHTML = '<p class="muted small">Мацаг барьж байхдаа өлсөлт бүртгэвэл энд харагдана.</p>';
  } else {
    const maxH = Math.min(72, Math.max(16, Math.ceil(Math.max(...fd.map((h) => h.fastH)))));
    const fs = Array(maxH + 1).fill(0), fc = Array(maxH + 1).fill(0);
    fd.forEach((h) => { const k = Math.min(maxH, Math.floor(h.fastH)); fs[k] += h.level; fc[k]++; });
    const fa = fs.map((s, i) => (fc[i] ? s / fc[i] : null));
    $('#fast-hour-chart').innerHTML = barChart(fa, fc, fa.map((_, i) => i + 'ц'), { labelEvery: Math.ceil((maxH + 1) / 8) });
  }

  const all = db.hunger.map((h, i) => [h, i]).reverse().slice(0, 100);
  $('#all-hunger').innerHTML = all.map(([h, i]) => hungerLi(h, i)).join('') || '<li class="muted small">Бүртгэл алга</li>';
}

// ---------- metrics ----------
const MT = {
  weight: { name: 'Жин', unit: 'кг', lowerBetter: true },
  glucose: { name: 'Цусан дахь сахар', unit: 'ммоль/л' },
  ketone: { name: 'Кетон', unit: 'ммоль/л' },
  bp: { name: 'Даралт', unit: 'мм МУБ' },
  hr: { name: 'Зүрхний цохилт', unit: 'уд/мин' },
  sleep: { name: 'Нойр', unit: 'цаг' },
  mood: { name: 'Сэтгэл санаа', unit: '/5' },
  energy: { name: 'Эрч хүч', unit: '/5' },
  water: { name: 'Ус (өдрөөр)', unit: 'мл', daily: true },
};

$('#m-type').addEventListener('change', () => {
  const bp = $('#m-type').value === 'bp';
  $('#m-val2').hidden = !bp;
  $('#m-val').placeholder = bp ? 'Дээд' : 'Утга';
});
$('#m-time').value = toLocalInput(new Date());

$('#m-add').addEventListener('click', () => {
  const type = $('#m-type').value;
  const v = parseFloat($('#m-val').value);
  const v2 = parseFloat($('#m-val2').value);
  if (isNaN(v) || (type === 'bp' && isNaN(v2))) return toast('Утга оруулна уу');
  const t = new Date($('#m-time').value).getTime() || Date.now();
  db.metrics.push({ t, type, v, ...(type === 'bp' ? { v2 } : {}) });
  db.metrics.sort((a, b) => a.t - b.t);
  save();
  $('#m-val').value = ''; $('#m-val2').value = '';
  $('#m-time').value = toLocalInput(new Date());
  toast(`${MT[type].name} хадгалагдлаа`);
  renderAll();
});

$$('[data-water]').forEach((b) => b.addEventListener('click', () => {
  db.metrics.push({ t: Date.now(), type: 'water', v: +b.dataset.water });
  save(); renderAll(); toast(`+${b.dataset.water} мл`);
}));

function renderWater() {
  const today = dayKey(new Date());
  $('#water-today').textContent = db.metrics
    .filter((m) => m.type === 'water' && dayKey(new Date(m.t)) === today)
    .reduce((a, m) => a + m.v, 0);
}

function spark(series, series2) {
  const all = series.concat(series2 || []);
  if (series.length < 2) return '';
  const W = 300, H = 60, p = 4;
  const min = Math.min(...all), max = Math.max(...all), span = max - min || 1;
  const pts = (s) => s.map((v, i) => `${p + (i / (s.length - 1)) * (W - 2 * p)},${H - p - ((v - min) / span) * (H - 2 * p)}`).join(' ');
  let svg = `<svg viewBox="0 0 ${W} ${H}"><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${pts(series)}"/>`;
  if (series2) svg += `<polyline fill="none" stroke="var(--muted)" stroke-width="2" points="${pts(series2)}"/>`;
  return svg + '</svg>';
}

function renderMetrics() {
  let html = '';
  for (const [type, meta] of Object.entries(MT)) {
    let rows = db.metrics.map((m, i) => ({ ...m, i })).filter((m) => m.type === type);
    if (!rows.length) continue;
    let series, series2, latest, prev;
    if (meta.daily) {
      const byDay = {};
      rows.forEach((m) => { const k = dayKey(new Date(m.t)); byDay[k] = (byDay[k] || 0) + m.v; });
      const days = Object.keys(byDay).sort().slice(-30);
      series = days.map((k) => byDay[k]);
      latest = `${series[series.length - 1]}`;
      prev = series.length > 1 ? series[series.length - 2] : null;
    } else {
      const last30 = rows.slice(-30);
      series = last30.map((m) => m.v);
      if (type === 'bp') series2 = last30.map((m) => m.v2);
      const l = rows[rows.length - 1];
      latest = type === 'bp' ? `${l.v}/${l.v2}` : `${l.v}`;
      prev = rows.length > 1 ? rows[rows.length - 2].v : null;
    }
    let delta = '';
    if (prev != null && type !== 'bp') {
      const d = series[series.length - 1] - prev;
      if (d) {
        const cls = meta.lowerBetter ? (d > 0 ? 'up' : 'down') : '';
        delta = `<span class="delta ${cls}">${d > 0 ? '+' : ''}${+d.toFixed(2)}</span>`;
      }
    }
    const recent = rows.slice(-5).reverse().map((m) => `<li><div class="grow">${fmtDate(new Date(m.t))}</div>
      <b>${m.type === 'bp' ? `${m.v}/${m.v2}` : m.v}</b><button class="del" data-del-metric="${m.i}" aria-label="Устгах">×</button></li>`).join('');
    html += `<div class="card"><div class="metric-head"><h2>${meta.name}</h2>
      <div class="val">${latest} <small>${meta.unit}</small> ${delta}</div></div>
      <div class="chart">${spark(series, series2)}</div><ul class="log">${recent}</ul></div>`;
  }
  $('#metric-cards').innerHTML = html || '<div class="card muted small">Одоогоор үзүүлэлт алга. Дээрээс нэмнэ үү.</div>';
}

// ---------- history ----------
function renderHistory() {
  const fs = db.fasts;
  const durs = fs.map((f) => (f.end - f.start) / HOUR);
  const avg = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
  const hit = fs.filter((f) => f.end - f.start >= f.goalH * HOUR).length;
  $('#fast-stats').innerHTML = `
    <div><b>${fs.length}</b><span>Нийт мацаг</span></div>
    <div><b>${avg.toFixed(1)}ц</b><span>Дундаж</span></div>
    <div><b>${durs.length ? Math.max(...durs).toFixed(1) : 0}ц</b><span>Хамгийн урт</span></div>
    <div><b>${fs.length ? Math.round((hit / fs.length) * 100) : 0}%</b><span>Зорилгод хүрсэн</span></div>
    <div><b>${db.hunger.length}</b><span>Өлсөлт бүртгэл</span></div>
    <div><b>${db.metrics.length}</b><span>Үзүүлэлт</span></div>`;
  $('#fast-history').innerHTML = fs.map((f, i) => [f, i]).reverse().map(([f, i]) => {
    const ok = f.end - f.start >= f.goalH * HOUR;
    return `<li><span class="dot" style="background:${ok ? 'var(--good)' : '#3a3f48'}">${ok ? '✓' : '–'}</span>
      <div class="grow"><div><b>${fmtDur(f.end - f.start)}</b> <span class="muted small">/ ${f.goalH}ц зорилго</span></div>
      <div class="note">${fmtDate(new Date(f.start))} → ${fmtDate(new Date(f.end))}</div></div>
      <button class="del" data-del-fast="${i}" aria-label="Устгах">×</button></li>`;
  }).join('') || '<li class="muted small">Мацгийн түүх алга</li>';
}

// ---------- settings ----------
const S = db.settings;
$('#set-hourly').checked = S.hourly;
$('#set-quiet-start').value = S.quietStart;
$('#set-quiet-end').value = S.quietEnd;

$('#set-hourly').addEventListener('change', async (e) => {
  db.settings.hourly = e.target.checked;
  if (e.target.checked && 'Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  save();
});
['#set-quiet-start', '#set-quiet-end'].forEach((id) => $(id).addEventListener('change', () => {
  db.settings.quietStart = Math.min(23, Math.max(0, +$('#set-quiet-start').value || 0));
  db.settings.quietEnd = Math.min(23, Math.max(0, +$('#set-quiet-end').value || 0));
  save();
}));

$('#export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hunger-truck-${dayKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
$('#import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.hunger) || !Array.isArray(data.metrics)) throw new Error('format');
    if (!confirm('Одоогийн өгөгдлийг импортоор солих уу?')) return;
    localStorage.setItem(KEY, JSON.stringify(data));
    db = load(); renderAll(); toast('Импорт амжилттай');
  } catch { toast('Файл буруу байна'); }
  e.target.value = '';
});
$('#wipe').addEventListener('click', () => {
  if (!confirm('Бүх өгөгдөл бүр мөсөн устна. Эхлээд экспорт хийсэн үү?')) return;
  if (!confirm('Үнэхээр устгах уу?')) return;
  db = defaults(); save(); renderAll(); toast('Устгагдлаа');
});

// ---------- hourly prompt ----------
function isQuiet(h) {
  const { quietStart: s, quietEnd: e } = db.settings;
  return s === e ? false : s < e ? h >= s && h < e : h >= s || h < e;
}
function shouldPrompt() {
  const now = new Date();
  if (!db.settings.hourly || isQuiet(now.getHours())) return false;
  return db.settings.lastPrompt !== hourKey(now);
}
const dlg = $('#prompt-dlg');
function openPrompt(force = false) {
  if (dlg.open || (!force && !shouldPrompt())) return;
  $('#prompt-title').textContent = `${hm(new Date())} — хэр өлсөж байна?`;
  dlg.showModal();
}
dlg.addEventListener('close', () => {
  const v = dlg.returnValue;
  if (/^[1-5]$/.test(v)) logHunger(+v);
  else { db.settings.lastPrompt = hourKey(new Date()); save(); }
});

async function checkHourly() {
  if (!shouldPrompt()) return;
  if (!document.hidden) return openPrompt();
  if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification('Хэр өлсөж байна?', {
      body: 'Дарж 1–5 оноогоор бүртгэнэ үү', tag: 'hunger-' + hourKey(new Date()),
      icon: 'icons/icon-192.png', data: { url: './?ask=1' },
    });
  }
}

// ---------- render loop ----------
function renderAll() {
  renderFast();
  renderTodayHunger();
  renderWater();
  const active = document.querySelector('.tab.active').id;
  if (active === 'tab-hunger') renderHungerStats();
  if (active === 'tab-metrics') renderMetrics();
  if (active === 'tab-history') renderHistory();
}
function tick() {
  $('#clock').textContent = hm(new Date());
  if (db.activeFast || db.fasts.length) renderFast();
}

renderAll();
tick();
setInterval(tick, 1000);
setInterval(checkHourly, 30e3);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { db = load(); renderAll(); checkHourly(); }
});

const params = new URLSearchParams(location.search);
if (params.has('ask')) {
  history.replaceState(null, '', location.pathname);
  openPrompt(true);
} else {
  setTimeout(checkHourly, 600);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

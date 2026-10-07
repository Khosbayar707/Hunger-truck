import type { Data } from './types';
import { hungerProfile, inRange, windowLabel } from './analysis';
import { DAY, HOUR, MIN, dayKey, shortDur } from './time';

/**
 * Practical, general tips. The library is fixed text; `adviceFor` only picks which
 * ones fit the owner's current state. No numbers are invented: anything quoted
 * back (hours into a fast, a peak window, last night's sleep) comes from records.
 */
export type AdviceTopic = 'fasting' | 'hunger' | 'food' | 'water' | 'sleep' | 'safety';

export interface Advice {
  id: string;
  topic: AdviceTopic;
  title: string;
  text: string;
}

export const TOPIC_LABEL: Record<AdviceTopic, string> = {
  fasting: 'Мацаг',
  hunger: 'Өлсөлт',
  food: 'Хооллолт',
  water: 'Ус',
  sleep: 'Нойр',
  safety: 'Аюулгүй байдал',
};

export const ADVICE: Advice[] = [
  {
    id: 'zero-cal',
    topic: 'fasting',
    title: 'Мацгийн үеэр уух зүйл',
    text: 'Ус, хийжүүлсэн ус, чихэр, сүүгүй цай болон хар кофе мацгийг тасалдуулахгүй.',
  },
  {
    id: 'waves',
    topic: 'fasting',
    title: 'Өлсөлт давалгаа шиг ирдэг',
    text: 'Өлсөлт ихэвчлэн 15–20 минутын дотор намждаг. Нэг аяга ус ууж, богино алхаад дахин мэдрээрэй.',
  },
  {
    id: 'electrolytes',
    topic: 'fasting',
    title: 'Удаан мацагт давс',
    text: '12 цагаас удаан мацаглахад толгой өвдөх, сулрах нь давс дутсанаас болдог. Усандаа чимх давс хийж болно.',
  },
  {
    id: 'ramp',
    topic: 'fasting',
    title: 'Зорилгоо аажмаар нэмэх',
    text: '12 цагаас эхэлж, бие дасахын хэрээр 1–2 цагаар уртасгах нь гэнэт урт мацаг барихаас хялбар.',
  },
  {
    id: 'break-gently',
    topic: 'food',
    title: 'Мацгаа зөөлөн нээх',
    text: 'Эхний хоолоо уураг, ногоо агуулсан бага хэмжээгээр эхлүүлбэл ходоодонд хөнгөн.',
  },
  {
    id: 'protein-fiber',
    topic: 'food',
    title: 'Уураг ба эслэг',
    text: 'Хооллох цонхондоо уураг (мах, өндөг, сүүн бүтээгдэхүүн) болон ногоо хангалттай идвэл дараагийн мацаг зөөлөн өнгөрдөг.',
  },
  {
    id: 'thirst',
    topic: 'water',
    title: 'Цангалт өлсөлт шиг мэдрэгдэж болно',
    text: 'Өлсөж байна гэж санагдвал эхлээд нэг аяга ус уугаад 10 минут хүлээж үзээрэй.',
  },
  {
    id: 'real-hunger',
    topic: 'hunger',
    title: 'Ямар өлсөлт вэ?',
    text: 'Бодит өлсөлт аажим нэмэгдэж, ямар ч хоолонд сэтгэл ханадаг. Гэнэт ирж, тодорхой хоол хүсгэдэг бол уйдах, ядрах зэргээс үүдэлтэй байж магадгүй.',
  },
  {
    id: 'peak-plan',
    topic: 'hunger',
    title: 'Оргил цагтаа бэлдэх',
    text: 'Өлсөлт тань ихэвчлэн өндөрсдөг цагийг мэдвэл тэр үед ус, ажил, алхалт төлөвлөх, эсвэл хооллох цонхоо түүнтэй давхцуулж болно.',
  },
  {
    id: 'sleep-hunger',
    topic: 'sleep',
    title: 'Нойр ба өлсөлт',
    text: 'Нойр дутуу үед өлсөлтийн даавар нэмэгдэж, маргааш нь өлсөлт хүчтэй мэдрэгдэх нь элбэг.',
  },
  {
    id: 'late-meal',
    topic: 'sleep',
    title: 'Оройн хоол',
    text: 'Оройн хоолоо унтахаас 2–3 цагийн өмнө идэж дуусгах нь нойр болон мацгийн эхлэлд аль алинд нь тустай.',
  },
  {
    id: 'stop',
    topic: 'safety',
    title: 'Хэзээ зогсоох вэ',
    text: 'Толгой эргэх, ухаан балартах, зүрх дэлсэх, чичрэх бол мацгаа зогсоож хооллоно уу. Мацгийг эрт дуусгах нь бүтэлгүйтэл биш.',
  },
  {
    id: 'doctor',
    topic: 'safety',
    title: 'Эмчтэй зөвлөх',
    text: 'Чихрийн шижин, жирэмсэн, хөхүүл, хооллолтын эмгэгтэй эсвэл байнгын эм уудаг бол мацаг барихаасаа өмнө эмчтэйгээ зөвлөнө үү.',
  },
];

const byId = (id: string) => ADVICE.find((a) => a.id === id)!;

/** Up to `max` tips that fit right now, most pressing first. Falls back to one tip of the day. */
export function adviceFor(d: Data, now: number, max = 3): Advice[] {
  const out: Advice[] = [];
  const f = d.activeFast;
  const hoursIn = f ? (now - f.startTime) / HOUR : 0;

  // strong hunger in the last 90 minutes while fasting: safety first
  const lastH = d.hunger[d.hunger.length - 1];
  if (f && lastH && lastH.intensity >= 8 && now - lastH.timestamp < 90 * MIN && lastH.timestamp >= f.startTime) {
    out.push({ ...byId('stop'), id: 'stop-now', title: `Өлсөлт ${lastH.intensity} байна` });
  }

  // the owner's own peak window is near or here
  if (d.profile.visibleMetrics.includes('hunger')) {
    const prof = hungerProfile(inRange(d.hunger, 14, now));
    if (prof.peak) {
      const nowH = new Date(now).getHours() + new Date(now).getMinutes() / 60;
      const until = prof.peak.start - nowH;
      if (until <= 1.5 && nowH < prof.peak.end) {
        out.push({
          ...byId('peak-plan'),
          id: 'peak-now',
          title: until > 0 ? `${windowLabel(prof.peak)} ойртож байна` : `Одоо таны өлсөлтийн оргил цаг`,
          text: 'Сүүлийн 14 хоногт энэ үед өлсөлт тань хамгийн өндөр байсан. Ус бэлдэх, богино алхалт эсвэл ажлаа энэ цагт төлөвлөж болно.',
        });
      }
    }
  }

  if (f) {
    if (hoursIn >= f.targetHours) {
      out.push({ ...byId('break-gently'), id: 'break-now', text: `Зорилгодоо хүрлээ. ${byId('break-gently').text}` });
    } else if (hoursIn >= 12) {
      out.push(byId('electrolytes'));
    } else if (hoursIn >= 4) {
      out.push(byId('waves'));
    } else {
      out.push(byId('zero-cal'));
    }
  } else {
    const last = d.fasts[d.fasts.length - 1];
    if (last && now - last.endTime < 3 * HOUR) out.push(byId('break-gently'));
    else if (last && now - last.endTime < 24 * HOUR) out.push(byId('protein-fiber'));
  }

  // last night's sleep
  const today = dayKey(now);
  const slept = d.sleep.filter((s) => dayKey(s.wakeTime) === today).reduce((a, s) => a + s.duration, 0);
  if (slept > 0 && slept < 360) {
    out.push({
      ...byId('sleep-hunger'),
      id: 'short-sleep',
      title: `Өнгөрсөн шөнө ${shortDur(slept * MIN)} унтсан`,
      text: `${byId('sleep-hunger').text} Өнөөдөр мацгийг зөөлөн барих нь зүгээр.`,
    });
  }

  // water well behind the goal by the afternoon
  const hour = new Date(now).getHours();
  const water = d.water.filter((w) => dayKey(w.timestamp) === today).reduce((a, w) => a + w.amount, 0);
  if (d.profile.visibleMetrics.includes('water') && hour >= 13 && water < d.profile.waterGoalMl * 0.4) {
    out.push(byId('thirst'));
  }

  if (!out.length) {
    const pool = ADVICE.filter((a) => a.topic !== 'safety');
    out.push(pool[Math.floor(now / DAY) % pool.length]);
  }
  return out.slice(0, max);
}

import type { Data } from './types';
import { HOUR, MIN, shortDur } from './time';

/**
 * Encouragement the owner asked for. Lines are steady rather than cheerful: they
 * talk about getting through hunger and coming back to it, never about weight or
 * looks, and never push past the body's signals. The fact line under a message is
 * drawn only from the owner's own records, and is left out when there is nothing to say.
 */
type Phase = 'hungry' | 'start' | 'middle' | 'close' | 'done' | 'rest';

const LINES: Record<Phase, string[]> = {
  hungry: [
    'Хамгийн хэцүү мөч яг одоо. Хүчтэй өлсөлт ихэвчлэн 15–20 минутад намждаг.',
    'Өлсөлт бол дохио, тушаал биш. Та түүнийг сонсоод, хэзээ идэхээ өөрөө шийднэ.',
    'Нэг аяга ус, арван минут. Дараа нь дахин шийдээрэй.',
    'Эрт дуусгах нь бас зөв сонголт байж болно. Маргааш дахин эхэлнэ.',
  ],
  start: [
    'Эхний цагууд хамгийн амархан. Өдрийн ажилдаа анхаарлаа хандуулаарай.',
    'Сайн эхлэл. Одоо зөвхөн дараагийн нэг цагийг бодоход хангалттай.',
    'Бие тань дасан зохицох чадвартай. Түүнд цаг өгөөрэй.',
  ],
  middle: [
    'Өлсөлт ирж, буцдаг. Энэ давалгаа ч бас өнгөрнө.',
    'Та өлсөлтөө удирдаж байна, өлсөлт таныг биш.',
    'Нэг цаг, нэг цагаар. Бүх замыг нэг дор бодох шаардлагагүй.',
    'Өлсөх мэдрэмж аюулын дохио биш, зүгээр л мэдрэмж. Тэр өнгөрдөг.',
  ],
  close: [
    'Зорилго ойрхон. Үлдсэн хугацаа аль хэдийн өнгөрснөөс хамаагүй богино.',
    'Хамгийн урт хэсгийг та туулчихсан. Үлдсэнийг нь тайван өнгөрөөгөөрэй.',
  ],
  done: [
    'Зорилгодоо хүрлээ. Одоо хоолоо тайван, удаан идээрэй.',
    'Төлөвлөсөн зүйлээ хийлээ. Биеэ сонсож, зөөлөн хооллоорой.',
  ],
  rest: [
    'Жижиг, тогтмол алхмууд урт хугацаанд хамгийн их нөлөөтэй.',
    'Төгс өдөр хэрэггүй. Дахин эхлэх л хангалттай.',
    'Өнөөдрийн бүртгэл маргаашийн ойлголт болно.',
    'Өлсөлтөө ойлгох тусам түүнийг удирдах амархан болдог.',
    'Хурдан биш, тогтвортой. Хийж чадах хэмнэлээ олоорой.',
  ],
};

export interface Motivation {
  phase: Phase;
  line: string;
  /** e.g. "Энэ мацгийн 81% өнгөрлөө" — from records only */
  fact: string | null;
  count: number;
}

export function motivationFor(d: Data, now: number, offset = 0): Motivation {
  const f = d.activeFast;
  const lastH = d.hunger[d.hunger.length - 1];
  let phase: Phase = 'rest';
  if (f) {
    const el = now - f.startTime;
    const left = f.startTime + f.targetHours * HOUR - now;
    const recentHunger = lastH && lastH.timestamp >= f.startTime && now - lastH.timestamp < 60 * MIN && lastH.intensity >= 7;
    if (left <= 0) phase = 'done';
    else if (recentHunger) phase = 'hungry';
    else if (left <= 2 * HOUR) phase = 'close';
    else if (el < 4 * HOUR) phase = 'start';
    else phase = 'middle';
  }

  const pool = LINES[phase];
  const line = pool[(Math.floor(now / (3 * HOUR)) + offset) % pool.length];

  // one honest fact to stand on
  let fact: string | null = null;
  const goal = f?.targetHours ?? d.profile.fastingGoalH;
  const reached = d.fasts.filter((x) => x.endTime - x.startTime >= goal * HOUR).length;
  const longest = d.fasts.reduce((a, x) => Math.max(a, x.endTime - x.startTime), 0);
  if (f && phase !== 'done') {
    const pct = Math.floor(((now - f.startTime) / (f.targetHours * HOUR)) * 100);
    fact = reached
      ? `Энэ мацгийн ${pct}% өнгөрлөө. Та өмнө нь ${goal}+ цагийн мацгийг ${reached} удаа бүрэн барьсан.`
      : `Энэ мацгийн ${pct}% өнгөрлөө.`;
  } else if (f && phase === 'done') {
    fact = `${shortDur(now - f.startTime)} мацаглалаа.`;
  } else if (reached) {
    fact = `Та ${goal}+ цагийн мацгийг ${reached} удаа бүрэн барьсан. Хамгийн урт нь ${shortDur(longest)}.`;
  } else if (d.hunger.length) {
    fact = `Нийт ${d.hunger.length} удаа өлсөлтөө бүртгэсэн. Бүртгэл бүр хэв маягийг тань тодруулна.`;
  }
  return { phase, line, fact, count: pool.length };
}

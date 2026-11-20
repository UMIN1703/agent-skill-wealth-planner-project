// แบบประเมินความเสี่ยง (F007) — ร่างตามแนว Suitability Test มาตรฐาน (10 ข้อ, ข้อละ 1–4 คะแนน)
// รวม 10–40 คะแนน → ระดับ 1–5 ตามช่วงคะแนนมาตรฐาน · pure, เทสต์ได้
// NOTE: อิง "มาตรฐานทั่วไป" ของ กลต./AIMC — ควรตรวจถ้อยคำ/เกณฑ์กับแบบฟอร์มทางการล่าสุดก่อนใช้จริง

export type RiskQuestion = { id: string; q: string; options: { label: string; score: number }[] };

const o = (...pairs: [string, number][]) => pairs.map(([label, score]) => ({ label, score }));

export const RISK_QUESTIONS: RiskQuestion[] = [
  { id: 'age', q: 'อายุของคุณ', options: o(['น้อยกว่า 35 ปี', 4], ['35–44 ปี', 3], ['45–59 ปี', 2], ['ตั้งแต่ 60 ปีขึ้นไป', 1]) },
  { id: 'burden', q: 'ภาระค่าใช้จ่ายต่อรายได้ต่อเดือน', options: o(['มากกว่า 75%', 1], ['50–75%', 2], ['25–50%', 3], ['น้อยกว่า 25%', 4]) },
  { id: 'proportion', q: 'สัดส่วนเงินลงทุนนี้ต่อสินทรัพย์รวม', options: o(['มากกว่า 75%', 1], ['50–75%', 2], ['25–50%', 3], ['น้อยกว่า 25%', 4]) },
  { id: 'experience', q: 'ความรู้/ประสบการณ์ลงทุนในสินทรัพย์เสี่ยง', options: o(['ไม่มี', 1], ['เงินฝาก/ตราสารหนี้', 2], ['กองทุนหุ้น/หุ้น', 3], ['อนุพันธ์/สินค้าโภคภัณฑ์', 4]) },
  { id: 'horizon', q: 'ระยะเวลาที่ยังไม่จำเป็นต้องใช้เงินลงทุนนี้', options: o(['น้อยกว่า 1 ปี', 1], ['1–3 ปี', 2], ['3–5 ปี', 3], ['มากกว่า 5 ปี', 4]) },
  { id: 'goal', q: 'วัตถุประสงค์หลักในการลงทุน', options: o(['เน้นเงินต้นปลอดภัย', 1], ['เน้นรายได้สม่ำเสมอ', 2], ['เติบโตพอประมาณ รับผันผวนได้บ้าง', 3], ['เติบโตสูงสุด รับเสี่ยงสูงได้', 4]) },
  { id: 'drawdown', q: 'ถ้ามูลค่าลงทุนลดลง 10% คุณจะ', options: o(['ตกใจ ขายทันที', 1], ['กังวล ขายบางส่วน', 2], ['อดทนรอได้', 3], ['ถือต่อ/ซื้อเพิ่ม', 4]) },
  { id: 'expected', q: 'ผลตอบแทน/ความเสี่ยงที่รับได้', options: o(['ใกล้เงินฝาก เสี่ยงต่ำ', 1], ['สูงกว่าเงินฝากเล็กน้อย', 2], ['สูงขึ้น ผันผวนได้', 3], ['สูงมาก ขาดทุนมากได้', 4]) },
  { id: 'fx', q: 'รับความเสี่ยงอัตราแลกเปลี่ยน (ลงทุนต่างประเทศ) ได้แค่ไหน', options: o(['รับไม่ได้', 1], ['รับได้เล็กน้อย', 2], ['รับได้ปานกลาง', 3], ['รับได้มาก', 4]) },
  { id: 'complex', q: 'ความเข้าใจตราสารซับซ้อน/อนุพันธ์', options: o(['ไม่เข้าใจ', 1], ['พอเข้าใจ', 2], ['เข้าใจดี', 3], ['เชี่ยวชาญ ลงทุนประจำ', 4]) },
];

export type RiskLevel = 1 | 2 | 3 | 4 | 5;
export type RiskResult = { score: number; level: RiskLevel; label: string; short: string };

export const RISK_LABELS: Record<RiskLevel, string> = {
  1: 'เสี่ยงต่ำ', 2: 'ปานกลางค่อนข้างต่ำ', 3: 'ปานกลางค่อนข้างสูง', 4: 'เสี่ยงสูง', 5: 'เสี่ยงสูงมาก',
};
export const RISK_SHORT: Record<RiskLevel, string> = { 1: 'ต่ำ', 2: 'กลาง–ต่ำ', 3: 'กลาง–สูง', 4: 'สูง', 5: 'สูงมาก' };

/** รวมคะแนน (10–40) → ระดับความเสี่ยง 1–5 ตามช่วงมาตรฐาน กลต. (≤15 / 16–21 / 22–29 / 30–36 / ≥37) */
export function scoreRisk(answers: Record<string, number>): RiskResult {
  const score = RISK_QUESTIONS.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
  const level: RiskLevel = score <= 15 ? 1 : score <= 21 ? 2 : score <= 29 ? 3 : score <= 36 ? 4 : 5;
  return { score, level, label: RISK_LABELS[level], short: RISK_SHORT[level] };
}

/** ตอบครบทุกข้อหรือยัง */
export function isComplete(answers: Record<string, number>): boolean {
  return RISK_QUESTIONS.every((q) => typeof answers[q.id] === 'number');
}

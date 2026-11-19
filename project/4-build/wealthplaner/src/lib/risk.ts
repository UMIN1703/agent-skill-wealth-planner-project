// แบบประเมินความเสี่ยง (F007 · MVP) — pure, เทสต์ได้
// 5 คำถามสไตล์ Suitability ย่อ · รวมคะแนน → ระดับ 1–5 (ยังไม่รวม disclaimer SEC เต็มรูป = รอ Class B)

export type RiskQuestion = { id: string; q: string; options: { label: string; score: number }[] };

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'age', q: 'อายุของคุณ',
    options: [{ label: 'ต่ำกว่า 30 ปี', score: 4 }, { label: '30–45 ปี', score: 3 }, { label: '46–60 ปี', score: 2 }, { label: 'มากกว่า 60 ปี', score: 1 }],
  },
  {
    id: 'horizon', q: 'ระยะเวลาที่ตั้งใจลงทุน',
    options: [{ label: 'มากกว่า 7 ปี', score: 4 }, { label: '3–7 ปี', score: 3 }, { label: '1–3 ปี', score: 2 }, { label: 'น้อยกว่า 1 ปี', score: 1 }],
  },
  {
    id: 'tolerance', q: 'รับความผันผวนของพอร์ตได้แค่ไหน',
    options: [{ label: 'ได้มาก เน้นผลตอบแทนสูง', score: 4 }, { label: 'ได้ปานกลาง', score: 3 }, { label: 'ได้น้อย', score: 2 }, { label: 'รับไม่ได้เลย', score: 1 }],
  },
  {
    id: 'drawdown', q: 'ถ้าพอร์ตลดลง 20% คุณจะ',
    options: [{ label: 'ซื้อเพิ่ม', score: 4 }, { label: 'ถือต่อ', score: 3 }, { label: 'ขายบางส่วน', score: 2 }, { label: 'ขายทั้งหมด', score: 1 }],
  },
  {
    id: 'goal', q: 'เป้าหมายการลงทุน',
    options: [{ label: 'เติบโตสูง รับความเสี่ยงได้', score: 4 }, { label: 'สมดุลเติบโต+ปลอดภัย', score: 3 }, { label: 'รักษาเงินต้นเป็นหลัก', score: 2 }, { label: 'ปลอดภัยที่สุด', score: 1 }],
  },
];

export type RiskLevel = 1 | 2 | 3 | 4 | 5;
export type RiskResult = { score: number; level: RiskLevel; label: string; short: string };

export const RISK_LABELS: Record<RiskLevel, string> = {
  1: 'เสี่ยงต่ำ', 2: 'ปานกลางค่อนข้างต่ำ', 3: 'ปานกลางค่อนข้างสูง', 4: 'เสี่ยงสูง', 5: 'เสี่ยงสูงมาก',
};
export const RISK_SHORT: Record<RiskLevel, string> = { 1: 'ต่ำ', 2: 'กลาง–ต่ำ', 3: 'กลาง–สูง', 4: 'สูง', 5: 'สูงมาก' };

/** รวมคะแนน (5–20) → ระดับความเสี่ยง 1–5 */
export function scoreRisk(answers: Record<string, number>): RiskResult {
  const score = RISK_QUESTIONS.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
  const level: RiskLevel = score <= 8 ? 1 : score <= 11 ? 2 : score <= 14 ? 3 : score <= 17 ? 4 : 5;
  return { score, level, label: RISK_LABELS[level], short: RISK_SHORT[level] };
}

/** ตอบครบทุกข้อหรือยัง */
export function isComplete(answers: Record<string, number>): boolean {
  return RISK_QUESTIONS.every((q) => typeof answers[q.id] === 'number');
}

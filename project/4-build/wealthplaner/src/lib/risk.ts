// WealthPlaner — risk assessment (F007)
// Scores a short questionnaire into a risk level (1..5) and offers a SAMPLE
// starting allocation. Framed as an educational tool, NOT personal investment
// advice — the user must acknowledge a disclaimer before the sample is revealed
// (BR-07), and edits the numbers themselves before saving as an F006 target.
// Pure — no I/O.

import { targetsSumTo100 } from './finance.ts';
import { type Target } from './rebalance.ts';

export type Answer = number | null; // 1..5 ต่อข้อ · null = ยังไม่ตอบ
export type RiskLevel = 1 | 2 | 3 | 4 | 5;

export type AssessResult =
  | { ok: false; reason: 'incomplete'; unanswered: number[] } // F007 AC-E01 (เลขข้อ 1-based)
  | { ok: true; riskLevel: RiskLevel; assessedAt: string };   // F007 AC-01/AC-03

/** F007 AC-01/E01 — ต้องตอบครบทุกข้อจึงคำนวณ; ไม่ครบ → บอกข้อที่ยังไม่ตอบ */
export function assessRisk(answers: Answer[], now: Date): AssessResult {
  const unanswered = answers
    .map((a, i) => (a == null ? i + 1 : 0))
    .filter((n) => n > 0);
  if (answers.length === 0 || unanswered.length > 0) {
    return { ok: false, reason: 'incomplete', unanswered };
  }
  const avg = (answers as number[]).reduce((s, a) => s + a, 0) / answers.length;
  const riskLevel = Math.min(5, Math.max(1, Math.round(avg))) as RiskLevel;
  return { ok: true, riskLevel, assessedAt: now.toISOString() };
}

// สัดส่วนตัวอย่างต่อระดับความเสี่ยง (ระวังสูง → รับเสี่ยงสูง) — รวม 100% ทุกระดับ
const SAMPLE: Record<RiskLevel, Target[]> = {
  1: [{ type: 'หุ้นไทย', targetPercent: 15 }, { type: 'หุ้น ตปท.', targetPercent: 5 },  { type: 'ทองคำ', targetPercent: 20 }, { type: 'เงินสด', targetPercent: 60 }],
  2: [{ type: 'หุ้นไทย', targetPercent: 25 }, { type: 'หุ้น ตปท.', targetPercent: 10 }, { type: 'ทองคำ', targetPercent: 20 }, { type: 'เงินสด', targetPercent: 45 }],
  3: [{ type: 'หุ้นไทย', targetPercent: 35 }, { type: 'หุ้น ตปท.', targetPercent: 20 }, { type: 'ทองคำ', targetPercent: 20 }, { type: 'เงินสด', targetPercent: 25 }],
  4: [{ type: 'หุ้นไทย', targetPercent: 45 }, { type: 'หุ้น ตปท.', targetPercent: 30 }, { type: 'ทองคำ', targetPercent: 15 }, { type: 'เงินสด', targetPercent: 10 }],
  5: [{ type: 'หุ้นไทย', targetPercent: 55 }, { type: 'หุ้น ตปท.', targetPercent: 35 }, { type: 'ทองคำ', targetPercent: 5 },  { type: 'เงินสด', targetPercent: 5 }],
};

/** สัดส่วน "ตัวอย่างเริ่มต้น ปรับได้" ตามระดับ (F007 AC-01/02) — คืนสำเนาใหม่ให้ผู้ใช้แก้ได้ */
export function suggestedAllocation(level: RiskLevel): Target[] {
  return SAMPLE[level].map((t) => ({ ...t }));
}

// NOTE (Class B / legal): ถ้อยคำ disclaimer ต้องให้ฝ่ายกฎหมาย/ก.ล.ต. ยืนยันก่อน launch
// (REQ ข้อ 8, O1) — ค่านี้เป็น placeholder เพื่อให้ flow ทำงาน ไม่ใช่ถ้อยคำสุดท้าย
export const DISCLAIMER_PLACEHOLDER = 'ตัวอย่างเชิงการศึกษา ไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล [ถ้อยคำรอฝ่ายกฎหมายยืนยัน]';

export type AllocationReveal =
  | { revealed: false; requireAck: true; disclaimer: string }              // F007 AC-04 / BR-07
  | { revealed: true; allocation: Target[]; sampleNote: string; ackAt: string };

/** F007 AC-04 / BR-07 — ต้องกดรับทราบ disclaimer ก่อน จึงเปิดเผย allocation ตัวอย่าง */
export function revealSampleAllocation(level: RiskLevel, acknowledgedAt: string | null): AllocationReveal {
  if (!acknowledgedAt) {
    return { revealed: false, requireAck: true, disclaimer: DISCLAIMER_PLACEHOLDER };
  }
  return {
    revealed: true,
    allocation: suggestedAllocation(level),
    sampleNote: 'ตัวอย่างเริ่มต้น ปรับได้',
    ackAt: acknowledgedAt,
  };
}

/** F007 AC-E02 — ก่อนบันทึกเป็นเป้า (F006) สัดส่วนที่แก้แล้วต้องรวม = 100% */
export function canSaveAsTarget(edited: Target[]): boolean {
  return targetsSumTo100(edited.map((t) => t.targetPercent));
}

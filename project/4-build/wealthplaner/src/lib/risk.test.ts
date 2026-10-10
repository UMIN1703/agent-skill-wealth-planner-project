import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assessRisk, suggestedAllocation, revealSampleAllocation, canSaveAsTarget,
  type RiskLevel,
} from './risk.ts';

const now = new Date(Date.UTC(2026, 7, 30, 3, 0, 0));

// F007 AC-01 (traces TC-F007-001)
test('TC-F007-001: ตอบครบ → risk level 1–5 + วันที่ประเมิน', () => {
  const r = assessRisk([5, 4, 5, 4], now); // avg 4.5 → 5
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.riskLevel, 5);
    assert.equal(r.assessedAt, now.toISOString());
  }
  const cautious = assessRisk([1, 2, 1, 2], now); // avg 1.5 → 2
  if (cautious.ok) assert.equal(cautious.riskLevel, 2);
});

// F007 AC-E01 (traces TC-F007-E01)
test('TC-F007-E01: ตอบไม่ครบ → ไม่คำนวณ + บอกข้อที่ยังไม่ตอบ', () => {
  const r = assessRisk([5, null, 3, null], now);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.reason, 'incomplete');
    assert.deepEqual(r.unanswered, [2, 4]); // เลขข้อ 1-based
  }
});

// F007 AC-01/02 — ตัวอย่าง allocation รวม 100% ทุกระดับ
test('suggestedAllocation รวม = 100% ทุกระดับ 1–5', () => {
  for (const lvl of [1, 2, 3, 4, 5] as RiskLevel[]) {
    const sum = suggestedAllocation(lvl).reduce((s, t) => s + t.targetPercent, 0);
    assert.equal(sum, 100, `level ${lvl} ต้องรวม 100`);
  }
});

// F007 AC-04 / BR-07 (traces TC-F007-004)
test('TC-F007-004: ต้องกดรับทราบ disclaimer ก่อนเห็น allocation ตัวอย่าง', () => {
  const before = revealSampleAllocation(3, null);
  assert.equal(before.revealed, false);
  if (!before.revealed) assert.equal(before.requireAck, true);

  const after = revealSampleAllocation(3, now.toISOString());
  assert.equal(after.revealed, true);
  if (after.revealed) {
    assert.equal(after.allocation.length, 4);
    assert.equal(after.ackAt, now.toISOString());
  }
});

// F007 AC-E02 — แก้ตัวอย่างจนรวม ≠ 100% → บันทึกเป็นเป้าไม่ได้ (สอดคล้อง F006)
test('TC-F007-E02: allocation ที่แก้แล้วรวม ≠ 100% → canSaveAsTarget = false', () => {
  const sample = suggestedAllocation(3);
  assert.equal(canSaveAsTarget(sample), true);
  const broken = sample.map((t, i) => (i === 0 ? { ...t, targetPercent: t.targetPercent + 5 } : t));
  assert.equal(canSaveAsTarget(broken), false);
});

// F007 AC-E03 — ข้ามแบบประเมิน แล้วตั้งเป้าเองได้โดยตรง (assessment ไม่บังคับ)
test('TC-F007-E03: ข้ามแบบประเมิน → ตั้งเป้าเองได้ (ไม่ต้องมีผลประเมิน)', () => {
  const userTargets = [
    { type: 'หุ้นไทย', targetPercent: 50 },
    { type: 'เงินสด', targetPercent: 50 },
  ];
  assert.equal(canSaveAsTarget(userTargets), true); // ใช้ได้โดยไม่ต้อง assessRisk
});

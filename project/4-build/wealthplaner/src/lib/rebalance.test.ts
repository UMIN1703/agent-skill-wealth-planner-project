import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRebalanceGap, type Target } from './rebalance.ts';
import { type Allocation } from './portfolio.ts';

const current: Allocation[] = [
  { type: 'หุ้นไทย', valueTHB: 600, percent: 60 },
  { type: 'ทองคำ', valueTHB: 300, percent: 30 },
  { type: 'เงินสด', valueTHB: 100, percent: 10 },
];
const targets: Target[] = [
  { type: 'หุ้นไทย', targetPercent: 50 }, // ถือ 60 → เกิน 10 → ลด
  { type: 'ทองคำ', targetPercent: 30 },   // ตรงเป้า → hold
  { type: 'เงินสด', targetPercent: 20 },   // ถือ 10 → ต่ำ 10 → เพิ่ม
];

// F006 AC-01 (traces TC-F006-001)
test('TC-F006-001: แสดง gap + ทิศทางต่อคลาส', () => {
  const r = computeRebalanceGap(current, targets);
  assert.equal(r.ok, true);
  if (r.ok) {
    const th = r.rows.find((x) => x.type === 'หุ้นไทย')!;
    const gold = r.rows.find((x) => x.type === 'ทองคำ')!;
    const cash = r.rows.find((x) => x.type === 'เงินสด')!;
    assert.equal(th.gap, 10);
    assert.equal(th.action, 'decrease');
    assert.equal(gold.action, 'hold');
    assert.equal(cash.gap, -10);
    assert.equal(cash.action, 'increase');
  }
});

// F006 AC-E01 (traces TC-F006-E01)
test('TC-F006-E01: target รวม ≠ 100 → ไม่คำนวณ gap, บอกเหตุผล', () => {
  const bad: Target[] = [
    { type: 'หุ้นไทย', targetPercent: 50 },
    { type: 'ทองคำ', targetPercent: 30 },
    { type: 'เงินสด', targetPercent: 10 }, // รวม 90
  ];
  const r = computeRebalanceGap(current, bad);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.reason, 'targets_not_100');
    assert.equal(r.sum, 90);
  }
});

// edge: ถือคลาสที่ไม่ได้ตั้งเป้า → เป้า 0, overweight, ควรลด
test('ถือคลาสที่ไม่ได้ตั้งเป้า → target 0 → decrease', () => {
  const cur: Allocation[] = [
    { type: 'หุ้นไทย', valueTHB: 900, percent: 90 },
    { type: 'คริปโต', valueTHB: 100, percent: 10 },
  ];
  const tgt: Target[] = [{ type: 'หุ้นไทย', targetPercent: 100 }];
  const r = computeRebalanceGap(cur, tgt);
  assert.equal(r.ok, true);
  if (r.ok) {
    const crypto = r.rows.find((x) => x.type === 'คริปโต')!;
    assert.equal(crypto.targetPercent, 0);
    assert.equal(crypto.action, 'decrease');
  }
});

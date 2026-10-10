import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStale, computeIncome, computeIncomePercent, toTHB, targetsSumTo100, type Asset,
} from './finance.ts';

const now = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const agedMinutes = (m: number) => new Date(now.getTime() - m * 60000);

// F003 AC-04 / BR-01 — stale boundary (traces TC-F003-004a/b)
test('TC-F003-004a: ราคาเก่า 14 นาที → ยัง online (ไม่ stale)', () => {
  assert.equal(isStale(agedMinutes(14), now), false);
});
test('TC-F003-004b: ราคาเก่า 16 นาที → stale', () => {
  assert.equal(isStale(agedMinutes(16), now), true);
});
test('boundary: 15 นาทีพอดี → ยังไม่ stale (เกณฑ์คือ > 15)', () => {
  assert.equal(isStale(agedMinutes(15), now), false);
});

// F004 / BR-03,05 — income + FX (traces TC-F004-002)
test('TC-F004-002: หุ้น ตปท. USD→THB 35 — income 7,000 / มูลค่า 42,000', () => {
  const a: Asset = { quantity: 10, costPrice: 100, marketPrice: 120, currency: 'USD' };
  const incomeUsd = computeIncome(a);
  assert.equal(incomeUsd, 200);
  assert.equal(toTHB(incomeUsd!, 35), 7000);
  assert.equal(toTHB(a.quantity * a.marketPrice!, 35), 42000);
});

// F004 AC-E01 / BR-03 — no market price → null, not 0
test('TC-F004-E01: ไม่มีราคาตลาด → income = null (ไม่ใช่ 0)', () => {
  assert.equal(computeIncome({ quantity: 5, costPrice: 10, marketPrice: null }), null);
});

// F004 AC-E02 / BR-04 — divide-by-zero guard
test('TC-F004-E02: cost = 0 → เงินได้คำนวณได้ (500) แต่ % = null', () => {
  const a: Asset = { quantity: 5, costPrice: 0, marketPrice: 100 };
  assert.equal(computeIncome(a), 500);
  assert.equal(computeIncomePercent(a), null);
});

// F006 AC-E01 / BR-06 — target must sum to 100
test('TC-F006-E01: เป้ารวม = 100 → true, ≠ 100 → false', () => {
  assert.equal(targetsSumTo100([42, 28, 19, 11]), true);
  assert.equal(targetsSumTo100([42, 28, 19, 10]), false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizePortfolio, type HeldAsset } from './portfolio.ts';

const two: HeldAsset[] = [
  { name: 'A', type: 'หุ้นไทย', brokerChannel: 'SCBS', quantity: 10, costPrice: 10, marketPrice: 15, fxToThb: 1 },       // value 150, income 50
  { name: 'B', type: 'หุ้น ตปท.', brokerChannel: 'IB', quantity: 2, costPrice: 100, marketPrice: 100, currency: 'USD', fxToThb: 35 }, // value 7000, income 0
];

// F002 AC-01 (traces TC-F002-001)
test('TC-F002-001: มูลค่ารวม + สัดส่วน % ตามประเภท', () => {
  const s = summarizePortfolio(two);
  assert.equal(s.totalTHB, 7150);
  const foreign = s.allocation.find((a) => a.type === 'หุ้น ตปท.')!;
  const thai = s.allocation.find((a) => a.type === 'หุ้นไทย')!;
  assert.equal(foreign.valueTHB, 7000);
  assert.equal(thai.valueTHB, 150);
  assert.ok(Math.abs(foreign.percent + thai.percent - 100) < 1e-9); // รวม = 100%
  assert.equal(s.allocation[0].type, 'หุ้น ตปท.'); // เรียงมากไปน้อย
});

// F002 AC-02 (traces TC-F002-002) — cross-broker single number
test('TC-F002-002: ยอดรวมนับข้ามโบรกในตัวเลขเดียว', () => {
  const s = summarizePortfolio(two); // SCBS + IB
  assert.equal(s.totalTHB, 7150);
  assert.equal(s.totalIncomeTHB, 50); // 50 (THB) + 0
});

// F002 AC-E01 (traces TC-F002-E01)
test('TC-F002-E01: ไม่มีสินทรัพย์ → empty (total 0, ไม่ error)', () => {
  const s = summarizePortfolio([]);
  assert.equal(s.isEmpty, true);
  assert.equal(s.totalTHB, 0);
  assert.deepEqual(s.allocation, []);
});

// F002 AC-E02 (traces TC-F002-E02) — some prices missing → fallback to cost, still allocates
test('TC-F002-E02: บางรายการไม่มีราคาตลาด → ใช้ต้นทุน คิดสัดส่วนได้', () => {
  const mixed: HeldAsset[] = [
    { name: 'A', type: 'หุ้นไทย', brokerChannel: 'SCBS', quantity: 10, costPrice: 10, marketPrice: 15, fxToThb: 1 }, // 150
    { name: 'C', type: 'ทองคำ', brokerChannel: 'manual', quantity: 1, costPrice: 50, marketPrice: null, fxToThb: 1 }, // fallback 50
  ];
  const s = summarizePortfolio(mixed);
  assert.equal(s.totalTHB, 200);            // 150 + 50 (fallback ต้นทุน)
  assert.equal(s.totalIncomeTHB, 50);       // income เฉพาะ A (C ไม่มี market → ไม่นับ)
});

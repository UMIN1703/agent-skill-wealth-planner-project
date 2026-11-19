import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizePortfolio, holdingSummary, taxDeductionSummary, categoryAllocation, type HeldAsset } from './portfolio.ts';

const two: HeldAsset[] = [
  { name: 'A', type: 'หุ้นไทย', brokerChannel: 'SCBS', quantity: 10, costPrice: 10, marketPrice: 15, fxToThb: 1 },       // value 150, income 50
  { name: 'B', type: 'หุ้น ตปท.', brokerChannel: 'IB', quantity: 2, costPrice: 100, marketPrice: 100, currency: 'USD', fxToThb: 35 }, // value 7000, income 0
];

// CR-WPN-007 — สรุปรายการสำหรับการ์ด LINE: ชื่อ · จำนวนหน่วย · โบรก · มูลค่า (ไม่มีราคาตลาด → ใช้ต้นทุน)
test('TC-F002-hold-summary: holdingSummary รูปแบบ + ใช้ต้นทุนเมื่อไม่มีราคาตลาด', () => {
  const s = holdingSummary({ name: 'PTT', type: 'หุ้นไทย', brokerChannel: 'ttb', quantity: 1000, costPrice: 35, marketPrice: null, fxToThb: 1 });
  assert.ok(s.includes('PTT · 1,000 หน่วย · ttb'));
  assert.ok(s.includes('฿35,000')); // 1000 × 35 (ไม่มีราคาตลาด → ต้นทุน)
});

// CR-WPN-008 เฟส 2 — สรุปสิทธิลดหย่อนภาษี (รวมต้นทุนตาม bucket, ข้ามรายการไม่มี bucket)
test('TC-F002-tax: taxDeductionSummary รวมต้นทุนตาม tax bucket', () => {
  const rows: (HeldAsset & { taxBucket?: string })[] = [
    { name: 'SSF', type: 'กองทุน SSF', brokerChannel: 'x', quantity: 10, costPrice: 100, marketPrice: null, fxToThb: 1, taxBucket: 'SSF' },
    { name: 'RMF', type: 'กองทุน RMF', brokerChannel: 'x', quantity: 5, costPrice: 200, marketPrice: null, fxToThb: 1, taxBucket: 'RMF' },
    { name: 'หุ้น', type: 'หุ้นไทย', brokerChannel: 'x', quantity: 1, costPrice: 50, marketPrice: null, fxToThb: 1 },
  ];
  const s = taxDeductionSummary(rows);
  assert.equal(s.length, 2); // รายการไม่มี bucket ถูกข้าม
  assert.equal(s.find((x) => x.bucket === 'SSF')!.costTHB, 1000);
  assert.equal(s.find((x) => x.bucket === 'RMF')!.costTHB, 1000);
});

// CR-WPN-008 — allocation ตามหมวด (ใช้ category, fallback type) + % รวม 100
test('TC-F002-cat: categoryAllocation จัดกลุ่มตามหมวด', () => {
  const a: (HeldAsset & { category?: string })[] = [
    { name: 'A', type: 'หุ้นไทย', brokerChannel: 'x', quantity: 1, costPrice: 60, marketPrice: 60, fxToThb: 1, category: 'หุ้นไทย' },
    { name: 'B', type: 'เงินสด', brokerChannel: 'x', quantity: 1, costPrice: 40, marketPrice: 40, fxToThb: 1, category: 'เงินสำรอง/ฉุกเฉิน' },
    { name: 'C', type: 'คริปโต', brokerChannel: 'x', quantity: 1, costPrice: 100, marketPrice: 100, fxToThb: 1 }, // ไม่มี category → ใช้ type
  ];
  const r = categoryAllocation(a);
  assert.equal(r.find((x) => x.type === 'คริปโต')!.valueTHB, 100); // fallback type
  assert.equal(r[0].type, 'คริปโต'); // เรียงมากไปน้อย
  assert.ok(Math.abs(r.reduce((s, x) => s + x.percent, 0) - 100) < 1e-9);
});

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

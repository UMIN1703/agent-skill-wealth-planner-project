import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizePortfolio, holdingSummary, taxDeductionSummary, categoryAllocation, categoryRiskRank, CATEGORY_RISK_ORDER, CATEGORY_TARGETS, buildGrowthSeries, RISK_TARGETS, targetsForRisk, type HeldAsset } from './portfolio.ts';

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

// CR-WPN-011 — กราฟการเติบโต: ต้นทุนสะสมตามวันที่เพิ่ม + มูลค่าจริงจาก snapshot
test('TC-F002-growth: cost สะสมตาม createdAt, value จาก snapshot, เดือนปัจจุบันใช้ค่าสด', () => {
  const now = new Date('2026-06-15T00:00:00Z'); // มิ.ย. = เดือน index 5
  const assets: (HeldAsset & { createdAt?: string })[] = [
    { name: 'A', type: 'หุ้นไทย', brokerChannel: 'x', quantity: 1, costPrice: 100, marketPrice: null, fxToThb: 1, createdAt: '2026-02-10' }, // ก.พ.
    { name: 'B', type: 'ทองคำ', brokerChannel: 'x', quantity: 1, costPrice: 400, marketPrice: null, fxToThb: 1, createdAt: '2026-04-20' }, // เม.ย.
  ];
  const snaps = [{ asOf: '2026-03-31', totalCost: 100, totalValue: 120 }];
  const g = buildGrowthSeries(assets, snaps, 2026, 500, 650, now);

  assert.equal(g.points.length, 12);
  assert.equal(g.currentMonth, 5);                 // มิ.ย.
  assert.equal(g.points[0].cost, 0);               // ม.ค. ยังไม่มีรายการ
  assert.equal(g.points[1].cost, 100);             // ก.พ. +A
  assert.equal(g.points[3].cost, 500);             // เม.ย. +B (รวม 500)
  assert.equal(g.points[2].value, 120);            // มี.ค. จาก snapshot
  assert.equal(g.points[1].value, null);           // ก.พ. ยังไม่มี snapshot
  assert.equal(g.points[5].value, 650);            // มิ.ย. (ปัจจุบัน) = ค่าสด
  assert.equal(g.points[5].cost, 500);             // เดือนปัจจุบันใช้ต้นทุนสด
  assert.equal(g.points[6].value, null);           // ก.ค. อนาคต → ไม่วาด
  assert.equal(g.hasValueHistory, true);
});

// CR-WPN-014 — dual-FX: มูลค่าใช้ valueFx (เรตสด) · ต้นทุนใช้ fxToThb (เรตตอนซื้อ) → กำไรค่าเงินไม่ถูกกลบ
test('TC-F004-livefx: valueFx แยก leg มูลค่า/ต้นทุน → รวมกำไรค่าเงิน', () => {
  const usd: HeldAsset = { name: 'VOO', type: 'หุ้น ตปท.', brokerChannel: 'IB', quantity: 1, costPrice: 100, marketPrice: 120, currency: 'USD', fxToThb: 35, valueFx: 36 };
  const s = summarizePortfolio([usd]);
  assert.equal(s.totalTHB, 120 * 36);                 // มูลค่าใช้เรตสด 36
  assert.equal(s.totalIncomeTHB, 120 * 36 - 100 * 35); // = 820 (กำไรสินทรัพย์ + กำไรค่าเงิน)
  // ไม่มี valueFx → ใช้ fxToThb เดิม (ไม่กระทบของเก่า)
  const noLive: HeldAsset = { ...usd, valueFx: undefined };
  assert.equal(summarizePortfolio([noLive]).totalIncomeTHB, (120 - 100) * 35);
});

// CR-WPN-012 ข้อ 7 — โมเดลเป้าหมายตามความเสี่ยง: ทุกชุดรวม 100% + fallback
test('TC-F006-risk-targets: RISK_TARGETS ทุกระดับรวม = 100% และ targetsForRisk เลือกถูก', () => {
  for (const level of [1, 2, 3, 4, 5] as const) {
    const sum = RISK_TARGETS[level].reduce((s, t) => s + t.percent, 0);
    assert.equal(sum, 100, `ระดับ ${level} ต้องรวม 100 (ได้ ${sum})`);
  }
  // ระดับ 3 = โมเดลกลาง · เสี่ยงสูงกว่า → หุ้นต่างประเทศมากขึ้น, เงินสำรองน้อยลง
  const g = (ts: { category: string; percent: number }[], c: string) => ts.find((t) => t.category === c)?.percent ?? 0;
  assert.ok(g(RISK_TARGETS[5], 'หุ้นต่างประเทศ') > g(RISK_TARGETS[1], 'หุ้นต่างประเทศ'));
  assert.ok(g(RISK_TARGETS[1], 'เงินสำรองฉุกเฉิน') > g(RISK_TARGETS[5], 'เงินสำรองฉุกเฉิน'));
  assert.equal(targetsForRisk(3), RISK_TARGETS[3]);
  assert.equal(targetsForRisk(null), CATEGORY_TARGETS); // ไม่มีระดับ → โมเดลกลาง
  assert.equal(targetsForRisk(9), CATEGORY_TARGETS);    // นอกช่วง → โมเดลกลาง
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

// CR-WPN-009 — ลำดับความเสี่ยงหมวด (น้อย→มาก) ต้องคงที่ · หมวดนอกรายการไปท้ายสุด
test('TC-F002-risk-order: categoryRiskRank เรียงเงินสด→คริปโต, นอกรายการ = 99', () => {
  assert.deepEqual([...CATEGORY_RISK_ORDER],
    ['เงินสด', 'เงินสำรองฉุกเฉิน', 'เกษียณ', 'ทองคำ', 'หุ้นไทย', 'หุ้นต่างประเทศ', 'คริปโต']);
  assert.ok(categoryRiskRank('เงินสด') < categoryRiskRank('คริปโต'));
  assert.ok(categoryRiskRank('เกษียณ') < categoryRiskRank('หุ้นไทย'));
  assert.equal(categoryRiskRank('ไม่รู้จัก'), 99); // นอกรายการ → ท้ายสุด
  const sorted = ['คริปโต', 'เงินสด', 'หุ้นไทย', 'ทองคำ'].sort((a, b) => categoryRiskRank(a) - categoryRiskRank(b));
  assert.deepEqual(sorted, ['เงินสด', 'ทองคำ', 'หุ้นไทย', 'คริปโต']);
});

// CR-WPN-009 — เป้าหมาย allocation ต้องตรงแท็บ Targets ในชีต + รวม = 100%
test('TC-F006-targets: CATEGORY_TARGETS ตรงชีต + รวม 100%', () => {
  assert.equal(CATEGORY_TARGETS.reduce((s, t) => s + t.percent, 0), 100);
  assert.deepEqual(
    Object.fromEntries(CATEGORY_TARGETS.map((t) => [t.category, t.percent])),
    { 'เงินสด': 0, 'เงินสำรองฉุกเฉิน': 12, 'เกษียณ': 13, 'หุ้นไทย': 18, 'หุ้นต่างประเทศ': 45, 'ทองคำ': 10, 'คริปโต': 2 },
  );
});

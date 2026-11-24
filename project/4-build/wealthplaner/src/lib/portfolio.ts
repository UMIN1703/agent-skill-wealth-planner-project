// WealthPlaner — portfolio aggregation (F002)
// Rolls held assets across brokers into one total + allocation by asset type.
// Reuses the finance rules (BR-03/05). Pure — no I/O.

import { computeIncome, toTHB, type Asset } from './finance.ts';

export type HeldAsset = Asset & {
  name: string;
  type: string;          // AssetType label (หุ้นไทย / หุ้น ตปท. / ทองคำ / เงินสด …)
  brokerChannel: string; // บริษัทโบรก
  fxToThb: number;       // 1 สำหรับสินทรัพย์สกุล THB
};

export type Allocation = { type: string; valueTHB: number; percent: number };

export type PortfolioSummary = {
  totalTHB: number;
  totalIncomeTHB: number;
  allocation: Allocation[];
  isEmpty: boolean;
};

/** มูลค่าตลาดเป็น THB — ถ้าไม่มีราคาตลาดใช้ราคาต้นทุน (UI ต้อง flag ว่า fallback) */
export function marketValueTHB(a: HeldAsset): number {
  const price = a.marketPrice ?? a.costPrice;
  return toTHB(price * a.quantity, a.fxToThb);
}

/** สรุปรายการถือครองเป็นข้อความ (การ์ด LINE — CR-WPN-007): ชื่อ · จำนวนหน่วย · โบรก · มูลค่า */
export function holdingSummary(a: HeldAsset): string {
  const qty = a.quantity.toLocaleString('th-TH');
  const value = Math.round(marketValueTHB(a)).toLocaleString('th-TH');
  return `${a.name} · ${qty} หน่วย · ${a.brokerChannel}\nมูลค่า ฿${value}`;
}

// CR-WPN-008 — สัดส่วนตาม "หมวดใหญ่" (Category) สำหรับการ์ด allocation แบบแท็บ
export function categoryAllocation(assets: (HeldAsset & { category?: string })[]): Allocation[] {
  const total = assets.reduce((s, a) => s + marketValueTHB(a), 0);
  const m = new Map<string, number>();
  for (const a of assets) {
    const key = a.category ?? a.type;
    m.set(key, (m.get(key) ?? 0) + marketValueTHB(a));
  }
  return [...m.entries()]
    .map(([type, valueTHB]) => ({ type, valueTHB, percent: total > 0 ? (valueTHB / total) * 100 : 0 }))
    .sort((x, y) => y.valueTHB - x.valueTHB);
}

// เป้าหมาย allocation ตามหมวด 7 หมวด (โมเดลกลาง · รวม = 100)
// ลำดับความเสี่ยงของหมวด (น้อย→มาก) — ใช้เรียงลิสต์สินทรัพย์/สัดส่วนให้สอดคล้องกันทั้งแอป
export const CATEGORY_RISK_ORDER = [
  'เงินสด', 'เงินสำรองฉุกเฉิน', 'เกษียณ', 'ทองคำ', 'หุ้นไทย', 'หุ้นต่างประเทศ', 'คริปโต',
] as const;
/** อันดับความเสี่ยง (0 = เสี่ยงน้อยสุด) · หมวดนอกรายการ → 99 (ไปท้ายสุด) */
export function categoryRiskRank(name: string): number {
  const i = (CATEGORY_RISK_ORDER as readonly string[]).indexOf(name);
  return i === -1 ? 99 : i;
}

// เป้าหมาย allocation — ตรงกับแท็บ Targets ในชีต Personal_Wealth_2026
// (Insurance 2% ของชีตยุบรวมเข้าเงินสำรองฉุกเฉิน 10% → 12% ตาม taxonomy 7 หมวด)
export const CATEGORY_TARGETS: { category: string; percent: number }[] = [
  { category: 'เงินสด', percent: 0 },
  { category: 'เงินสำรองฉุกเฉิน', percent: 12 },
  { category: 'เกษียณ', percent: 13 },
  { category: 'หุ้นไทย', percent: 18 },
  { category: 'หุ้นต่างประเทศ', percent: 45 },
  { category: 'ทองคำ', percent: 10 },
  { category: 'คริปโต', percent: 2 },
];

export type TaxSummaryRow = { bucket: string; costTHB: number };

/** CR-WPN-008 เฟส 2 — สรุปเงินลงทุนที่ได้สิทธิลดหย่อนภาษี (รวมต้นทุนตาม tax bucket) */
export function taxDeductionSummary(assets: (HeldAsset & { taxBucket?: string })[]): TaxSummaryRow[] {
  const m = new Map<string, number>();
  for (const a of assets) {
    if (!a.taxBucket) continue; // ไม่มีสิทธิลดหย่อน → ข้าม
    m.set(a.taxBucket, (m.get(a.taxBucket) ?? 0) + toTHB(a.costPrice * a.quantity, a.fxToThb));
  }
  return [...m.entries()].map(([bucket, costTHB]) => ({ bucket, costTHB })).sort((x, y) => y.costTHB - x.costTHB);
}

// CR-WPN-011 — กราฟการเติบโตของพอร์ตรายเดือนทั้งปี
export type GrowthPoint = { month: number; cost: number; value: number | null }; // month 0=ม.ค.
export type GrowthSeries = {
  year: number;
  points: GrowthPoint[];      // 12 เดือน
  currentMonth: number;       // เดือนล่าสุดที่มีข้อมูล (ไม่วาดเกินนี้)
  currentCost: number;
  currentValue: number;
  hasValueHistory: boolean;   // มี snapshot มูลค่าจริงอย่างน้อย 1 จุด
};

type SnapshotLike = { asOf: string; totalCost: number; totalValue: number };

/** สร้างชุดข้อมูลกราฟ 12 เดือน:
 *  - cost = ต้นทุนสะสม (รวมต้นทุนของ holding ที่เพิ่ม ณ/ก่อนสิ้นเดือนนั้น) — จริงจาก createdAt
 *  - value = มูลค่าจริงจาก snapshot ล่าสุดในเดือนนั้น (null ถ้ายังไม่เคยเก็บ) · เดือนปัจจุบันใช้ค่าสด */
export function buildGrowthSeries(
  assets: (HeldAsset & { createdAt?: string })[],
  snapshots: SnapshotLike[],
  year: number,
  currentCost: number,
  currentValue: number,
  now: Date = new Date(),
): GrowthSeries {
  const costTotal = (a: HeldAsset) => toTHB(a.costPrice * a.quantity, a.fxToThb);
  const isCurrentYear = now.getFullYear() === year;
  const lastMonth = isCurrentYear ? now.getMonth() : 11; // ไม่วาดเกินเดือนปัจจุบันของปีนี้

  const points: GrowthPoint[] = [];
  for (let m = 0; m < 12; m++) {
    const monthEnd = new Date(year, m + 1, 0, 23, 59, 59); // วันสุดท้ายของเดือน m
    let cost = 0;
    for (const a of assets) {
      const created = a.createdAt ? new Date(a.createdAt) : new Date(year - 1, 0, 1); // ไม่มีวันที่ → ถือว่ามีมาก่อน
      if (created <= monthEnd) cost += costTotal(a);
    }
    let value: number | null = null;
    for (const s of snapshots) {        // เรียงเก่า→ใหม่ → ตัวท้ายที่ผ่านเงื่อนไขคือ latest ของเดือน
      if (new Date(s.asOf + 'T23:59:59') <= monthEnd) value = s.totalValue;
    }
    points.push({ month: m, cost, value: m > lastMonth ? null : value });
  }
  // เดือนล่าสุด: เขียนทับด้วยค่าสดของตอนนี้ (ต้นทุน + มูลค่าจริงปัจจุบัน)
  if (lastMonth >= 0 && lastMonth <= 11) points[lastMonth] = { month: lastMonth, cost: currentCost, value: currentValue };

  return { year, points, currentMonth: lastMonth, currentCost, currentValue, hasValueHistory: snapshots.length >= 1 };
}

/** F002: รวมพอร์ตข้ามโบรกเป็นตัวเลขเดียว + สัดส่วน allocation ตามประเภทสินทรัพย์ */
export function summarizePortfolio(assets: HeldAsset[]): PortfolioSummary {
  if (assets.length === 0) {
    return { totalTHB: 0, totalIncomeTHB: 0, allocation: [], isEmpty: true };
  }

  const total = assets.reduce((s, a) => s + marketValueTHB(a), 0);

  const income = assets.reduce((s, a) => {
    const inc = computeIncome(a);           // null เมื่อไม่มีราคาตลาด → ไม่นับ (ไม่ใช่ 0 หลอก)
    return inc == null ? s : s + toTHB(inc, a.fxToThb);
  }, 0);

  const byType = new Map<string, number>();
  for (const a of assets) byType.set(a.type, (byType.get(a.type) ?? 0) + marketValueTHB(a));

  const allocation: Allocation[] = [...byType.entries()]
    .map(([type, valueTHB]) => ({ type, valueTHB, percent: total > 0 ? (valueTHB / total) * 100 : 0 }))
    .sort((x, y) => y.valueTHB - x.valueTHB);

  return { totalTHB: total, totalIncomeTHB: income, allocation, isEmpty: false };
}

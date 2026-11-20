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

// เป้าหมาย allocation ตามหมวด 9 หมวด (โมเดลกลาง · รวม = 100)
export const CATEGORY_TARGETS: { category: string; percent: number }[] = [
  { category: 'เงินสด', percent: 10 },
  { category: 'เงินสำรองฉุกเฉิน', percent: 8 },
  { category: 'สำรองครอบครัว', percent: 2 },
  { category: 'ประกัน', percent: 3 },
  { category: 'เกษียณ', percent: 17 },
  { category: 'หุ้นไทย', percent: 15 },
  { category: 'หุ้นต่างประเทศ', percent: 25 },
  { category: 'ทองคำ', percent: 10 },
  { category: 'คริปโต', percent: 10 },
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

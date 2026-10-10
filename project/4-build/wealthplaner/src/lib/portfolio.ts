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

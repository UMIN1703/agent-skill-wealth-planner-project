// WealthPlaner — core finance rules
// Implements the behaviour spec in SRS-WPN-001 §6.1 (BR-01..BR-06).
// Pure functions, no I/O — external price fetching (F003/F004 integration) is
// gated on O1 (ToS) and lives elsewhere; these rules operate on values given.

export type Asset = {
  quantity: number;
  costPrice: number;
  marketPrice: number | null; // null = ยังไม่มีราคาตลาด
  currency?: string;
};

/** BR-01 / F003 AC-04: ราคา stale เมื่อเก่ากว่า 15 นาที (มากกว่า 15 เท่านั้น) */
export function isStale(priceUpdatedAt: Date, now: Date): boolean {
  const minutes = (now.getTime() - priceUpdatedAt.getTime()) / 60000;
  return minutes > 15;
}

/** BR-03 / F004: income = (market − cost) × qty; ไม่มี market → null (ไม่ใช่ 0) */
export function computeIncome(a: Asset): number | null {
  if (a.marketPrice == null) return null;
  return (a.marketPrice - a.costPrice) * a.quantity;
}

/** BR-04 / F004 AC-E02: %income คำนวณไม่ได้เมื่อ cost = 0 (กันหารศูนย์) หรือไม่มี market */
export function computeIncomePercent(a: Asset): number | null {
  if (a.marketPrice == null || a.costPrice === 0) return null;
  return ((a.marketPrice - a.costPrice) / a.costPrice) * 100;
}

/** BR-05 / NFR-04: แปลงมูลค่าเป็น THB ด้วยอัตราแลกเปลี่ยนล่าสุด */
export function toTHB(amount: number, fxRateToThb: number): number {
  return amount * fxRateToThb;
}

/** BR-06 / F006 AC-E01: rebalance gap คำนวณได้ต่อเมื่อ target รวม = 100% */
export function targetsSumTo100(targetPercents: number[]): boolean {
  const sum = targetPercents.reduce((a, b) => a + b, 0);
  return sum === 100;
}

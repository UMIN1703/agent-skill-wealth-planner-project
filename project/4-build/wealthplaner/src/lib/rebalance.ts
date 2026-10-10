// WealthPlaner — rebalance gap (F006)
// Compares current allocation (from portfolio.ts) against user targets and
// reports the gap per asset class. Gate: targets must sum to 100% (BR-06).
// Pure — no I/O.

import { targetsSumTo100 } from './finance.ts';
import { type Allocation } from './portfolio.ts';

export type Target = { type: string; targetPercent: number };

export type RebalanceRow = {
  type: string;
  currentPercent: number;
  targetPercent: number;
  gap: number; // current − target · (+) เกินเป้า ควรลด · (−) ต่ำกว่าเป้า ควรเพิ่ม
  action: 'increase' | 'decrease' | 'hold';
};

export type RebalanceResult =
  | { ok: true; rows: RebalanceRow[] }
  | { ok: false; reason: 'targets_not_100'; sum: number }; // F006 AC-E01

const EPS = 0.05; // ถือว่า "ตรงเป้า" เมื่อห่างน้อยกว่า 0.05%

/** F006 AC-01/E01 · BR-06 — คำนวณ gap ได้ต่อเมื่อ target รวม = 100% */
export function computeRebalanceGap(current: Allocation[], targets: Target[]): RebalanceResult {
  if (!targetsSumTo100(targets.map((t) => t.targetPercent))) {
    const sum = targets.reduce((s, t) => s + t.targetPercent, 0);
    return { ok: false, reason: 'targets_not_100', sum };
  }

  const curMap = new Map(current.map((c) => [c.type, c.percent]));
  const tgtMap = new Map(targets.map((t) => [t.type, t.targetPercent]));
  const types = [...new Set([...curMap.keys(), ...tgtMap.keys()])]; // union — ครอบทั้งที่ถือและที่ตั้งเป้า

  const rows: RebalanceRow[] = types.map((type) => {
    const currentPercent = curMap.get(type) ?? 0;
    const targetPercent = tgtMap.get(type) ?? 0; // ถือแต่ไม่ได้ตั้งเป้า → เป้า 0 (overweight)
    const gap = currentPercent - targetPercent;
    const action: RebalanceRow['action'] =
      Math.abs(gap) < EPS ? 'hold' : gap > 0 ? 'decrease' : 'increase';
    return { type, currentPercent, targetPercent, gap, action };
  });

  return { ok: true, rows };
}

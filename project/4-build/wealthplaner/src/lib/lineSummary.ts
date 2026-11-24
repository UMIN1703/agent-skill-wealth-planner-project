// WealthPlanner — สร้างข้อความสรุปพอร์ตสำหรับตอบใน LINE (CR-WPN-018 · Batch 5.1)
// pure — reuse logic พอร์ต · เทสต์ได้
import { summarizePortfolio, categoryAllocation, type HeldAsset } from './portfolio.ts';
import { fmt } from './format.ts';

/** ข้อความสรุปพอร์ต (มูลค่า/ต้นทุน/กำไร-ขาดทุน + สัดส่วนตามหมวด) สำหรับ reply ใน LINE */
export function buildPortfolioSummaryText(assets: HeldAsset[]): string {
  const s = summarizePortfolio(assets);
  if (s.isEmpty) return 'ยังไม่มีรายการในพอร์ตของคุณ 📭\nเพิ่มสินทรัพย์ในแอปแล้วลองใหม่อีกครั้ง';

  const cost = s.totalTHB - s.totalIncomeTHB;
  const pctReturn = cost > 0 ? (s.totalIncomeTHB / cost) * 100 : 0;
  const up = s.totalIncomeTHB >= 0;
  const alloc = categoryAllocation(assets).slice(0, 7);
  const allocLines = alloc.map((a) => `• ${a.type} ${a.percent.toFixed(0)}%`).join('\n');

  return [
    '📊 สรุปพอร์ตของคุณ',
    '',
    `มูลค่ารวม  ฿${fmt(s.totalTHB)}`,
    `ต้นทุน      ฿${fmt(cost)}`,
    `${up ? '📈 กำไร' : '📉 ขาดทุน'}  ${up ? '+' : '−'}฿${fmt(Math.abs(s.totalIncomeTHB))} (${up ? '+' : '−'}${Math.abs(pctReturn).toFixed(1)}%)`,
    '',
    '🧩 สัดส่วนตามหมวด',
    allocLines,
  ].join('\n');
}

/** ข้อความนี้ถือเป็นคำขอ "สรุปพอร์ต" ไหม */
export function isSummaryRequest(text: string): boolean {
  return /สรุป|พอร์ต|portfolio|summary/i.test(text.trim());
}

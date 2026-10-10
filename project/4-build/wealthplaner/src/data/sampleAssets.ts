import type { HeldAsset } from '@/lib/portfolio.ts';

export type DisplayAsset = HeldAsset & { source: string; updatedMin: number };

// ข้อมูลตัวอย่าง (mock) — ชั้นข้อมูลจริง (Supabase) รอ credentials (Class B)
export const sampleAssets: DisplayAsset[] = [
  { name: 'PTT', type: 'หุ้นไทย', brokerChannel: 'SCBS', quantity: 12500, costPrice: 27.4, marketPrice: 34.25, fxToThb: 1, source: 'settrade', updatedMin: 2 },
  { name: 'BBL', type: 'หุ้นไทย', brokerChannel: 'KBank', quantity: 1000, costPrice: 150, marketPrice: 145, fxToThb: 1, source: 'settrade', updatedMin: 2 },
  { name: 'AAPL', type: 'หุ้น ตปท.', brokerChannel: 'IBKR', quantity: 30, costPrice: 180, marketPrice: 228.1, currency: 'USD', fxToThb: 35, source: 'investing', updatedMin: 3 },
  { name: 'ทองคำ 96.5%', type: 'ทองคำ', brokerChannel: 'manual', quantity: 50, costPrice: 30000, marketPrice: 32000, fxToThb: 1, source: 'manual', updatedMin: 18 },
  { name: 'เงินสด', type: 'เงินสด', brokerChannel: 'manual', quantity: 1, costPrice: 500000, marketPrice: 500000, fxToThb: 1, source: 'manual', updatedMin: 0 },
];

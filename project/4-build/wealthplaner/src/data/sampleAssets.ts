import type { HeldAsset } from '@/lib/portfolio.ts';

export type TxAction = 'buy' | 'sell' | 'switch';
export type DisplayAsset = HeldAsset & { id?: string; source: string; updatedMin: number; note?: string; category?: string; taxBucket?: string; symbol?: string; createdAt?: string; updatedAt?: string; action?: TxAction };

// ข้อมูลเดโม (mock) — พอร์ตตัวอย่างครบ 9 หมวดตรงชีต + ราคาปัจจุบัน → แสดง P&L/allocation/tax เต็มหน้า
const USD = 33.96;

export const sampleAssets: DisplayAsset[] = [
  // ── เงินสำรองฉุกเฉิน / เงินสด ──
  { name: 'SCB (ฉุกเฉิน)', type: 'เงินสด', brokerChannel: 'SCB', quantity: 1, costPrice: 153816.48, marketPrice: 153816.48, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'เงินสำรองฉุกเฉิน' },
  { name: 'สำรองพ่อแม่', type: 'เงินสด', brokerChannel: 'KEPT', quantity: 1, costPrice: 211030.89, marketPrice: 211030.89, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'เงินสำรองฉุกเฉิน' },
  { name: 'INVX Cash', type: 'เงินสด', brokerChannel: 'INVX', quantity: 1, costPrice: 20023.36, marketPrice: 20023.36, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'เงินสด' },
  { name: 'Dime', type: 'เงินสด', brokerChannel: 'Dime', quantity: 1, costPrice: 41427.2, marketPrice: 41427.2, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'เงินสด' },
  { name: 'KBANK', type: 'เงินสด', brokerChannel: 'KBANK', quantity: 1, costPrice: 4262.85, marketPrice: 4262.85, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'เงินสด' },

  // ── เกษียณ ──
  { name: 'PVD', type: 'กองทุนสำรองเลี้ยงชีพ', brokerChannel: 'PVD', quantity: 1, costPrice: 132667.28, marketPrice: 141060.37, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'เกษียณ', taxBucket: 'PVD' },
  { name: 'สหกรณ์ SCB', type: 'กองทุนสำรองเลี้ยงชีพ', brokerChannel: 'สหกรณ์', quantity: 1, costPrice: 210000, marketPrice: 210000, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'เกษียณ' },

  // ── หุ้นไทย ──
  { name: 'ADVANC', type: 'หุ้นไทย', brokerChannel: 'INVX', quantity: 60, costPrice: 351.92, marketPrice: 336.0, fxToThb: 1, source: 'settrade', updatedMin: 3, category: 'หุ้นไทย' },
  { name: 'ICHI', type: 'หุ้นไทย', brokerChannel: 'INVX', quantity: 5500, costPrice: 14.43, marketPrice: 13.8, fxToThb: 1, source: 'settrade', updatedMin: 3, category: 'หุ้นไทย' },
  { name: 'TISCO', type: 'หุ้นไทย', brokerChannel: 'INVX', quantity: 150, costPrice: 94.66, marketPrice: 125.5, fxToThb: 1, source: 'settrade', updatedMin: 3, category: 'หุ้นไทย' },
  { name: 'TTB', type: 'หุ้นไทย', brokerChannel: 'INVX', quantity: 1000, costPrice: 2.9, marketPrice: 2.72, fxToThb: 1, source: 'settrade', updatedMin: 3, category: 'หุ้นไทย' },
  { name: 'WHA', type: 'หุ้นไทย', brokerChannel: 'INVX', quantity: 5000, costPrice: 4.5, marketPrice: 5.56, fxToThb: 1, source: 'settrade', updatedMin: 3, category: 'หุ้นไทย' },

  // ── หุ้นต่างประเทศ ──
  { name: 'SSF S&P500', type: 'กองทุน SSF', brokerChannel: 'SCBAM', quantity: 1, costPrice: 50000, marketPrice: 58000, fxToThb: 1, source: 'manual', updatedMin: 20, category: 'หุ้นต่างประเทศ', taxBucket: 'SSF' },
  { name: 'RMF World', type: 'กองทุน RMF', brokerChannel: 'SCBAM', quantity: 1, costPrice: 40000, marketPrice: 45000, fxToThb: 1, source: 'manual', updatedMin: 20, category: 'หุ้นต่างประเทศ', taxBucket: 'RMF' },
  { name: 'VOO', type: 'ETF', brokerChannel: 'IBKR', quantity: 5, costPrice: 480, marketPrice: 560, currency: 'USD', fxToThb: USD, source: 'investing', updatedMin: 5, category: 'หุ้นต่างประเทศ' },
  { name: 'ASML', type: 'หุ้น ตปท.', brokerChannel: 'IBKR', quantity: 2, costPrice: 850, marketPrice: 1020, currency: 'USD', fxToThb: USD, source: 'investing', updatedMin: 5, category: 'หุ้นต่างประเทศ' },
  { name: 'AMZN', type: 'หุ้น ตปท.', brokerChannel: 'IBKR', quantity: 10, costPrice: 150, marketPrice: 230, currency: 'USD', fxToThb: USD, source: 'investing', updatedMin: 5, category: 'หุ้นต่างประเทศ' },

  // ── ทองคำ / คริปโต ──
  { name: 'ทองคำ 96.5%', type: 'ทองคำ', brokerChannel: 'manual', quantity: 3, costPrice: 30000, marketPrice: 44500, fxToThb: 1, source: 'manual', updatedMin: 18, category: 'ทองคำ' },
  { name: 'BTC', type: 'คริปโต', brokerChannel: 'Binance', quantity: 0.05, costPrice: 800000, marketPrice: 3120000, fxToThb: 1, source: 'investing', updatedMin: 2, category: 'คริปโต' },
  { name: 'BNB', type: 'คริปโต', brokerChannel: 'Binance', quantity: 2, costPrice: 22000, marketPrice: 21900, fxToThb: 1, source: 'investing', updatedMin: 2, category: 'คริปโต' },
];

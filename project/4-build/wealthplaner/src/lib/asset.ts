// WealthPlaner — asset input validation (F001)
// Implements REQ-WPN-001 F001 AC-01/E01/E02/E04 and the model rules in
// SRS-WPN-001 §4.2 (quantity > 0, cost_price >= 0, unique(name, broker_channel)).
// Pure — no I/O.

import type { DisplayAsset } from '../data/sampleAssets.ts'; // type-only → stripped at runtime

// CR-WPN-008 เฟส 2 — ขยายให้ครอบคลุมพอร์ตจริง (คริปโต/กองทุน/ETF/PVD/ประกัน)
export type AssetType =
  | 'th_stock' | 'foreign_stock' | 'etf' | 'fund' | 'fund_ssf' | 'fund_rmf'
  | 'gold' | 'crypto' | 'cash' | 'bond' | 'provident' | 'insurance' | 'other';

// หมวดใหญ่ (จัดกลุ่มพอร์ตแบบชีต) + Tax Bucket (สิทธิลดหย่อนภาษี)
export type AssetCategory = 'reserve' | 'retirement' | 'th_equity' | 'global' | 'alternative' | 'other';
export type TaxBucket = 'none' | 'ssf' | 'rmf' | 'pvd' | 'insurance';

export type AssetDraft = {
  name: string;
  type: AssetType | '';
  quantity: number | null;
  costPrice: number | null;
  currentPrice: number | null; // ราคา/มูลค่าปัจจุบันต่อหน่วย (ไม่บังคับ) → ปลดล็อก กำไร/ขาดทุนจริง (F004)
  category: AssetCategory | ''; // เว้นว่าง = ใช้ค่าเริ่มต้นตามประเภท
  taxBucket: TaxBucket | '';    // เว้นว่าง = ตามประเภท (ส่วนใหญ่ = ไม่มี)
  brokerChannel: string; // บริษัทโบรก เช่น SCBS, KBank (ระดับบริษัท — D1)
  note: string;          // บันทึกย่อต่อรายการ (ไม่บังคับ)
};

export type FieldError = { field: keyof AssetDraft; message: string };
export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: FieldError[]; firstField: keyof AssetDraft }; // firstField → เลื่อน focus

const isNum = (v: number | null): v is number => v !== null && !Number.isNaN(v);

/** ตรวจร่างสินทรัพย์ก่อนบันทึก (F001 AC-01/E01/E02/E04) — ตรวจตามลำดับช่องเพื่อ focus ช่องแรกที่ผิด */
export function validateAssetDraft(d: AssetDraft): ValidationResult {
  const errors: FieldError[] = [];
  if (!d.name.trim()) errors.push({ field: 'name', message: 'ต้องระบุชื่อสินทรัพย์' });
  if (!d.type) errors.push({ field: 'type', message: 'ต้องเลือกประเภทสินทรัพย์' });

  if (!isNum(d.quantity)) errors.push({ field: 'quantity', message: 'ต้องระบุจำนวนเป็นตัวเลข' });
  else if (d.quantity <= 0) errors.push({ field: 'quantity', message: 'จำนวนต้องมากกว่า 0' });

  if (!isNum(d.costPrice)) errors.push({ field: 'costPrice', message: 'ต้องระบุราคาต้นทุนเป็นตัวเลข' });
  else if (d.costPrice < 0) errors.push({ field: 'costPrice', message: 'ราคาต้นทุนต้องไม่ติดลบ' });

  // ราคาปัจจุบัน — ไม่บังคับ (เว้นว่าง = ยังไม่มีราคาตลาด) แต่ถ้ากรอกต้องไม่ติดลบ
  if (isNum(d.currentPrice) && d.currentPrice < 0) errors.push({ field: 'currentPrice', message: 'ราคาปัจจุบันต้องไม่ติดลบ' });

  if (!d.brokerChannel.trim()) errors.push({ field: 'brokerChannel', message: 'ต้องเลือก broker channel (ฟิลด์บังคับ)' });

  if (errors.length === 0) return { ok: true };
  return { ok: false, errors, firstField: errors[0].field };
}

export type ExistingAsset = { name: string; brokerChannel: string };

/** F001 AC-E03: ถือว่าซ้ำเมื่อ ชื่อ + broker channel เดียวกัน (unique user_id, name, broker_id) */
export function isDuplicate(
  d: { name: string; brokerChannel: string },
  existing: ExistingAsset[],
): boolean {
  const key = (x: { name: string; brokerChannel: string }) =>
    `${x.name.trim().toLowerCase()}|${x.brokerChannel.trim().toLowerCase()}`;
  return existing.some((e) => key(e) === key(d));
}

/** ป้ายประเภทสินทรัพย์สำหรับแสดงผล (sub-type) */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  th_stock: 'หุ้นไทย',
  foreign_stock: 'หุ้น ตปท.',
  etf: 'ETF',
  fund: 'กองทุนรวม',
  fund_ssf: 'กองทุน SSF',
  fund_rmf: 'กองทุน RMF',
  gold: 'ทองคำ',
  crypto: 'คริปโต',
  cash: 'เงินสด',
  bond: 'ตราสารหนี้',
  provident: 'กองทุนสำรองเลี้ยงชีพ',
  insurance: 'ประกัน',
  other: 'อื่นๆ',
};

/** หมวดใหญ่ — ใช้จัดกลุ่มพอร์ต (F002) ให้เหมือนชีต */
export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  reserve: 'เงินสำรอง/ฉุกเฉิน',
  retirement: 'เกษียณ',
  th_equity: 'หุ้นไทย',
  global: 'ต่างประเทศ',
  alternative: 'สินทรัพย์ทางเลือก',
  other: 'อื่นๆ',
};

/** หมวดเริ่มต้นตามประเภท (ผู้ใช้แก้ได้) */
export const DEFAULT_CATEGORY: Record<AssetType, AssetCategory> = {
  th_stock: 'th_equity', foreign_stock: 'global', etf: 'global', fund: 'global',
  fund_ssf: 'retirement', fund_rmf: 'retirement', gold: 'alternative', crypto: 'alternative',
  cash: 'reserve', bond: 'reserve', provident: 'retirement', insurance: 'reserve', other: 'other',
};

export const TAX_BUCKET_LABELS: Record<TaxBucket, string> = {
  none: 'ไม่มี', ssf: 'SSF', rmf: 'RMF', pvd: 'PVD/สำรองเลี้ยงชีพ', insurance: 'ประกันลดหย่อน',
};

/** สิทธิลดหย่อนเริ่มต้นตามประเภท */
export const DEFAULT_TAX_BUCKET: Record<AssetType, TaxBucket> = {
  th_stock: 'none', foreign_stock: 'none', etf: 'none', fund: 'none',
  fund_ssf: 'ssf', fund_rmf: 'rmf', gold: 'none', crypto: 'none',
  cash: 'none', bond: 'none', provident: 'pvd', insurance: 'insurance', other: 'none',
};

/**
 * F001 AC-01: แปลงร่างที่ผ่าน validation แล้วเป็นรายการในพอร์ต
 * - marketPrice = null → ยังไม่มีราคาตลาด (portfolio ใช้ราคาต้นทุนแทนและ flag) · ราคาจริงคือ F003/F004 (รอ O1 ToS)
 * - fxToThb = 1 → กรอกเป็น THB; การแปลง FX ของสินทรัพย์ต่างสกุลเลื่อนไป F004/O1 [command-center, ดู assumptions]
 * - source = 'manual', updatedMin = 0 → เพิ่มด้วยมือ ณ ตอนนี้
 * โยน error ถ้าร่างยังไม่ผ่าน validation (ต้องเรียก validateAssetDraft ให้ ok ก่อน)
 */
export function draftToDisplayAsset(d: AssetDraft): DisplayAsset {
  if (d.type === '' || d.quantity == null || d.costPrice == null) {
    throw new Error('draftToDisplayAsset: ร่างยังไม่ผ่าน validation — เรียก validateAssetDraft ก่อน');
  }
  const cat: AssetCategory = d.category || DEFAULT_CATEGORY[d.type];
  const tax: TaxBucket = d.taxBucket || DEFAULT_TAX_BUCKET[d.type];
  return {
    name: d.name.trim(),
    type: ASSET_TYPE_LABELS[d.type],
    brokerChannel: d.brokerChannel.trim(),
    quantity: d.quantity,
    costPrice: d.costPrice,
    marketPrice: d.currentPrice, // กรอกราคาปัจจุบัน → ใช้คำนวณ P&L จริง · เว้นว่าง (null) → ใช้ต้นทุนแทน
    fxToThb: 1,
    category: ASSET_CATEGORY_LABELS[cat],
    taxBucket: tax === 'none' ? '' : TAX_BUCKET_LABELS[tax],
    note: (d.note ?? '').trim(),
    source: 'manual',
    updatedMin: 0,
  };
}

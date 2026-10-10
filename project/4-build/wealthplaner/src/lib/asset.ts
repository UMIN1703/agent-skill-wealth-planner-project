// WealthPlaner — asset input validation (F001)
// Implements REQ-WPN-001 F001 AC-01/E01/E02/E04 and the model rules in
// SRS-WPN-001 §4.2 (quantity > 0, cost_price >= 0, unique(name, broker_channel)).
// Pure — no I/O.

import type { DisplayAsset } from '../data/sampleAssets.ts'; // type-only → stripped at runtime

export type AssetType = 'th_stock' | 'foreign_stock' | 'gold' | 'cash' | 'bond';

export type AssetDraft = {
  name: string;
  type: AssetType | '';
  quantity: number | null;
  costPrice: number | null;
  brokerChannel: string; // บริษัทโบรก เช่น SCBS, KBank (ระดับบริษัท — D1)
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

/** ป้ายประเภทสินทรัพย์สำหรับแสดงผล — ตรงกับ label ที่ portfolio/allocation ใช้จัดกลุ่ม (F002) */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  th_stock: 'หุ้นไทย',
  foreign_stock: 'หุ้น ตปท.',
  gold: 'ทองคำ',
  cash: 'เงินสด',
  bond: 'ตราสารหนี้',
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
  return {
    name: d.name.trim(),
    type: ASSET_TYPE_LABELS[d.type],
    brokerChannel: d.brokerChannel.trim(),
    quantity: d.quantity,
    costPrice: d.costPrice,
    marketPrice: null,
    fxToThb: 1,
    source: 'manual',
    updatedMin: 0,
  };
}

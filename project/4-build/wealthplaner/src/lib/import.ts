// WealthPlaner — import assets from a spreadsheet (F005)
// Takes already-parsed rows (header + string cells) — the xlsx/CSV parsing layer
// lives in the app; this validates + maps to AssetDraft and reports bad rows.
// Policy (F005 AC-E01): report which row/column is wrong; never import partially
// in silence — invalid rows come back as explicit errors alongside the good ones.

import { validateAssetDraft, type AssetDraft, type AssetType } from './asset.ts';

export const IMPORT_COLUMNS = ['name', 'type', 'quantity', 'costPrice', 'brokerChannel'] as const;

export type RowError = { row: number; column?: string; message: string };

export type ImportResult = {
  headerOk: boolean;
  imported: AssetDraft[];
  errors: RowError[];
};

const TYPE_MAP: Record<string, AssetType> = {
  'หุ้นไทย': 'th_stock', 'หุ้น ตปท.': 'foreign_stock', 'ทองคำ': 'gold', 'เงินสด': 'cash', 'ตราสารหนี้': 'bond',
  th_stock: 'th_stock', foreign_stock: 'foreign_stock', gold: 'gold', cash: 'cash', bond: 'bond',
};

export function importAssets(header: string[], rows: string[][]): ImportResult {
  const idx = new Map(header.map((h, i) => [h.trim(), i]));

  // header: คอลัมน์บังคับต้องครบ (F005 AC-E01)
  const missing = IMPORT_COLUMNS.filter((c) => !idx.has(c));
  if (missing.length > 0) {
    return {
      headerOk: false,
      imported: [],
      errors: missing.map((c) => ({ row: 0, column: c, message: `ไม่พบคอลัมน์ "${c}"` })),
    };
  }

  const imported: AssetDraft[] = [];
  const errors: RowError[] = [];

  rows.forEach((cells, i) => {
    const row = i + 1;
    const get = (c: string) => (cells[idx.get(c)!] ?? '').trim();
    const typeRaw = get('type');
    const qtyRaw = get('quantity');
    const costRaw = get('costPrice');

    if (typeRaw && !TYPE_MAP[typeRaw]) {
      errors.push({ row, column: 'type', message: `ประเภทไม่รู้จัก "${typeRaw}"` });
      return;
    }

    const draft: AssetDraft = {
      name: get('name'),
      type: TYPE_MAP[typeRaw] ?? '',
      quantity: qtyRaw === '' ? null : Number(qtyRaw),
      costPrice: costRaw === '' ? null : Number(costRaw),
      brokerChannel: get('brokerChannel'),
    };

    const v = validateAssetDraft(draft);
    if (v.ok) imported.push(draft);
    else errors.push({ row, column: String(v.firstField), message: v.errors[0].message });
  });

  return { headerOk: true, imported, errors };
}

// WealthPlaner — import assets from a spreadsheet (F005)
// Takes already-parsed rows (header + string cells) — the xlsx/CSV parsing layer
// lives in the app; this validates + maps to AssetDraft and reports bad rows.
// Policy (F005 AC-E01): report which row/column is wrong; never import partially
// in silence — invalid rows come back as explicit errors alongside the good ones.

import { validateAssetDraft, SHEET_CATEGORY_MAP, type AssetDraft, type AssetType, type TaxBucket } from './asset.ts';

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
  // CR-WPN-008 เฟส 2 — ประเภทที่ขยายใหม่ (รองรับทั้งไทย/อังกฤษ/ตัวย่อ)
  'ETF': 'etf', etf: 'etf',
  'กองทุนรวม': 'fund', fund: 'fund',
  'กองทุน SSF': 'fund_ssf', fund_ssf: 'fund_ssf', SSF: 'fund_ssf', ssf: 'fund_ssf',
  'กองทุน RMF': 'fund_rmf', fund_rmf: 'fund_rmf', RMF: 'fund_rmf', rmf: 'fund_rmf',
  'คริปโต': 'crypto', crypto: 'crypto', Crypto: 'crypto',
  'กองทุนสำรองเลี้ยงชีพ': 'provident', provident: 'provident', PVD: 'provident', pvd: 'provident',
  'ประกัน': 'insurance', insurance: 'insurance',
  'อื่นๆ': 'other', other: 'other',
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
    const curRaw = get('currentPrice'); // คอลัมน์ไม่บังคับ

    if (typeRaw && !TYPE_MAP[typeRaw]) {
      errors.push({ row, column: 'type', message: `ประเภทไม่รู้จัก "${typeRaw}"` });
      return;
    }

    const draft: AssetDraft = {
      name: get('name'),
      type: TYPE_MAP[typeRaw] ?? '',
      quantity: qtyRaw === '' ? null : Number(qtyRaw),
      costPrice: costRaw === '' ? null : Number(costRaw),
      currentPrice: curRaw === '' ? null : Number(curRaw),
      category: '', // เฟส 2: เว้นว่าง → ใช้หมวดเริ่มต้นตามประเภท (เฟส 3 จะ map จากชีตจริง)
      taxBucket: '',
      brokerChannel: get('brokerChannel'),
      note: get('note'),
    };

    const v = validateAssetDraft(draft);
    if (v.ok) imported.push(draft);
    else errors.push({ row, column: String(v.firstField), message: v.errors[0].message });
  });

  return { headerOk: true, imported, errors };
}

// ── CR-WPN-008 เฟส 3 — map รูปแบบชีตพอร์ตจริง (Category/Sub-type/Asset/Quantity/Cost(Total)/Current Value/Note/Tax Bucket) ──

/** parse เลขเงิน: ตัดคอมมา/฿, วงเล็บ=ติดลบ, '-'/'N/A'/ว่าง = null */
function parseMoney(s: string): number | null {
  const t = s.replace(/,/g, '').replace(/[฿\s]/g, '').trim();
  if (!t || t === '-' || /^n\/?a$/i.test(t)) return null;
  const neg = /^\(.*\)$/.test(t);
  const n = Number(t.replace(/[()%％]/g, ''));
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}

/** หมวดในชีต → ประเภทของแอป (เมื่อ Sub-type ไม่ได้บอกประเภท เช่น เป็น sector/bank) */
function categoryToType(cat: string): AssetType {
  const x = cat.toLowerCase();
  if (/หุ้นไทย|thai/.test(x)) return 'th_stock';
  if (/ต่างประเทศ|ตปท|global|foreign|international/.test(x)) return 'foreign_stock';
  if (/ประกัน|insurance/.test(x)) return 'insurance';
  if (/retire|เกษียณ/.test(x)) return 'provident';
  if (/ทอง|gold/.test(x)) return 'gold';
  if (/คริปโต|crypto/.test(x)) return 'crypto';
  if (/cash|เงินสด|emergency|reserve|สำรอง|bank/.test(x)) return 'cash';
  return 'other';
}

function taxFromCell(s: string): TaxBucket | '' {
  const x = s.toLowerCase().trim();
  if (x === 'ssf') return 'ssf';
  if (x === 'rmf') return 'rmf';
  if (x === 'pvd') return 'pvd';
  if (/ประกัน|insurance/.test(x)) return 'insurance';
  return ''; // N/A, Direct, สหกรณ์ ฯลฯ → ไม่มีสิทธิลดหย่อน
}

/** map ทั้งตารางจากชีตพอร์ตจริง → AssetDraft (ต้นทุน/ราคา = total ÷ จำนวน · เงินสด/ประกันไม่มีหน่วย → 1) */
export function importSheetRows(header: string[], rows: string[][]): ImportResult {
  const find = (...kw: string[]) => header.findIndex((h) => {
    const x = h.toLowerCase().trim();
    return kw.some((k) => x.includes(k));
  });
  const col = {
    category: find('category', 'หมวด'),
    subtype: find('sub-type', 'subtype', 'ชนิด', 'ประเภท'),
    name: find('asset', 'ticker', 'ชื่อ', 'หลักทรัพย์'),
    quantity: find('quantity', 'จำนวน', 'qty'),
    cost: find('cost', 'ต้นทุน'),
    current: find('current', 'มูลค่าปัจจุบัน', 'value'),
    note: find('note', 'หมายเหตุ', 'โน้ต'),
    tax: find('tax', 'ลดหย่อน'),
  };
  if (col.name < 0 || col.cost < 0) {
    return { headerOk: false, imported: [], errors: [{ row: 0, message: 'ไม่พบคอลัมน์ Asset/Ticker หรือ Cost — ตรวจหัวตารางในชีต' }] };
  }

  const imported: AssetDraft[] = [];
  const errors: RowError[] = [];
  rows.forEach((cells, i) => {
    const row = i + 1;
    const g = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '');
    const name = g(col.name);
    if (!name) return; // แถวว่าง/หัวหมวด → ข้ามเงียบ

    const subtype = g(col.subtype);
    const costTotal = parseMoney(g(col.cost));
    if (costTotal == null) { errors.push({ row, column: 'cost', message: `แถว "${name}": ไม่มีต้นทุน (Cost)` }); return; }
    const q = parseMoney(g(col.quantity));
    const quantity = q && q > 0 ? q : 1; // เงินสด/ประกัน/PVD ไม่มีหน่วย → 1 (มูลค่า = ราคาต่อหน่วย)
    const curTotal = parseMoney(g(col.current));

    const draft: AssetDraft = {
      name,
      type: TYPE_MAP[subtype] ?? categoryToType(g(col.category)),
      quantity,
      costPrice: Math.round((costTotal / quantity) * 100) / 100,
      currentPrice: curTotal != null ? Math.round((curTotal / quantity) * 100) / 100 : null,
      category: SHEET_CATEGORY_MAP[g(col.category)] ?? '', // ใช้หมวดตรงจากชีต (ไม่เจอ → เริ่มต้นตามประเภท)
      taxBucket: taxFromCell(g(col.tax)),
      brokerChannel: subtype || 'manual', // ชีตไม่มีโบรก → ใช้ sub-type เป็นช่องทาง
      note: g(col.note),
    };
    const v = validateAssetDraft(draft);
    if (v.ok) imported.push(draft);
    else errors.push({ row, column: String(v.firstField), message: `แถว "${name}": ${v.errors[0].message}` });
  });

  return { headerOk: true, imported, errors };
}

// ส่งออกรายงานพอร์ตเป็น Google Sheet (CR-WPN-010) — on-demand ที่หน้าสินทรัพย์
// 2 แท็บ: "สรุป" (ภาพรวม + ตามหมวด + ตามเดือน) · "รายการ" (log แบน มีคอลัมน์ เดือน ไว้แยก/pivot)
// pure builders (เทสต์ได้) + writer ที่เรียก Sheets API ด้วย Google token ของผู้ใช้
import type { DisplayAsset } from '../data/sampleAssets.ts';
import { marketValueTHB } from './portfolio.ts';
import { computeIncome } from './finance.ts';

const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const REPORT_NAME = 'WealthPlanner Report';
const TAB_SUMMARY = 'สรุป';
const TAB_LOG = 'รายการ';

const n2 = (n: number) => Math.round(n * 100) / 100;
const ym = (iso?: string) => (iso ? iso.slice(0, 7) : '—');          // YYYY-MM
const dmy = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('th-TH') : '—');

// ── pure builders ───────────────────────────────────────────────────────────

/** แท็บ "รายการ" — log แบน 1 แถว/สินทรัพย์ (คอลัมน์ เดือน ไว้แยกตามเดือน/pivot) */
export function buildLogRows(assets: DisplayAsset[]): (string | number)[][] {
  const header = ['เดือน', 'วันที่เพิ่ม', 'ชื่อ', 'ประเภท', 'หมวด', 'ช่องทาง', 'จำนวนหน่วย',
    'ต้นทุน/หน่วย', 'ต้นทุนรวม', 'ราคาปัจจุบัน', 'มูลค่า', 'กำไร/ขาดทุน', '%ผลตอบแทน', 'สิทธิลดหย่อน', 'แหล่งที่มา', 'โน้ต'];
  const rows = [...assets]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .map((a) => {
      const value = marketValueTHB(a);
      const costTotal = a.costPrice * a.quantity * (a.fxToThb ?? 1);
      const income = computeIncome(a);
      const pct = costTotal > 0 && income !== null ? n2((income / costTotal) * 100) : '';
      return [
        ym(a.createdAt), dmy(a.createdAt), a.name, a.type, a.category ?? '', a.brokerChannel,
        a.quantity, n2(a.costPrice), n2(costTotal), a.marketPrice == null ? '' : n2(a.marketPrice),
        n2(value), income == null ? '' : n2(income), pct === '' ? '' : `${pct}%`,
        a.taxBucket ?? '', a.source === 'slip' ? 'สลิป' : 'เพิ่มเอง', a.note ?? '',
      ];
    });
  return [header, ...rows];
}

/** แท็บ "สรุป" — ภาพรวม + ตามหมวด + ตามเดือน */
export function buildSummaryRows(assets: DisplayAsset[]): (string | number)[][] {
  const totalValue = assets.reduce((s, a) => s + marketValueTHB(a), 0);
  const totalCost = assets.reduce((s, a) => s + a.costPrice * a.quantity * (a.fxToThb ?? 1), 0);
  const totalIncome = assets.reduce((s, a) => s + (computeIncome(a) ?? 0), 0);
  const pct = totalCost > 0 ? n2((totalIncome / totalCost) * 100) : 0;

  const out: (string | number)[][] = [];
  out.push([`รายงานพอร์ต WealthPlanner — ณ ${new Date().toLocaleString('th-TH')}`]);
  out.push([]);
  out.push(['ภาพรวม', '']);
  out.push(['ต้นทุนรวม', n2(totalCost)]);
  out.push(['มูลค่ารวม', n2(totalValue)]);
  out.push(['กำไร/ขาดทุน', n2(totalIncome)]);
  out.push(['%ผลตอบแทน', `${pct}%`]);
  out.push(['จำนวนรายการ', assets.length]);
  out.push([]);

  // ตามหมวด
  out.push(['ตามหมวด', 'มูลค่า', '%พอร์ต']);
  const byCat = new Map<string, number>();
  for (const a of assets) byCat.set(a.category ?? a.type, (byCat.get(a.category ?? a.type) ?? 0) + marketValueTHB(a));
  for (const [cat, v] of [...byCat.entries()].sort((x, y) => y[1] - x[1])) {
    out.push([cat, n2(v), totalValue > 0 ? `${n2((v / totalValue) * 100)}%` : '0%']);
  }
  out.push([]);

  // ตามเดือน (ตามเดือนที่เพิ่มรายการ)
  out.push(['ตามเดือน', 'จำนวนรายการ', 'ต้นทุนที่เพิ่ม', 'มูลค่าปัจจุบัน']);
  const byMonth = new Map<string, { count: number; cost: number; value: number }>();
  for (const a of assets) {
    const k = ym(a.createdAt);
    const m = byMonth.get(k) ?? { count: 0, cost: 0, value: 0 };
    m.count += 1; m.cost += a.costPrice * a.quantity * (a.fxToThb ?? 1); m.value += marketValueTHB(a);
    byMonth.set(k, m);
  }
  for (const [mo, m] of [...byMonth.entries()].sort((x, y) => y[0].localeCompare(x[0]))) {
    out.push([mo, m.count, n2(m.cost), n2(m.value)]);
  }
  return out;
}

// ── Sheets writer ────────────────────────────────────────────────────────────

async function gFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`Google ${res.status} ${url}: ${await res.text()}`);
  return res;
}

async function findReport(token: string): Promise<string | null> {
  const q = `name = '${REPORT_NAME}' and trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'`;
  const url = `${DRIVE}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`;
  const data = (await (await gFetch(token, url)).json()) as { files?: { id: string }[] };
  return data.files?.[0]?.id ?? null;
}

/** สร้าง/หา report sheet → เขียน "สรุป" + "รายการ" ใหม่ (refresh) → คืน url */
export async function exportReport(token: string, assets: DisplayAsset[]): Promise<{ spreadsheetId: string; url: string }> {
  let id = await findReport(token);
  if (!id) {
    const res = await gFetch(token, `${SHEETS}?fields=spreadsheetId`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { title: REPORT_NAME }, sheets: [{ properties: { title: TAB_SUMMARY } }, { properties: { title: TAB_LOG } }] }),
    });
    id = ((await res.json()) as { spreadsheetId: string }).spreadsheetId;
  }
  // ล้างของเดิมก่อนเขียนทับ (refresh)
  await gFetch(token, `${SHEETS}/${id}/values:batchClear`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ranges: [`${TAB_SUMMARY}!A1:Z1000`, `${TAB_LOG}!A1:Z10000`] }),
  });
  await gFetch(token, `${SHEETS}/${id}/values:batchUpdate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${TAB_SUMMARY}!A1`, values: buildSummaryRows(assets) },
        { range: `${TAB_LOG}!A1`, values: buildLogRows(assets) },
      ],
    }),
  });
  return { spreadsheetId: id, url: `https://docs.google.com/spreadsheets/d/${id}/edit` };
}

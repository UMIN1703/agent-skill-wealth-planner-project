// WealthPlaner — เขียนรายการสลิปลง Google Sheets (F009 · CR-WPN-003 rev: ไม่อัปรูปขึ้น Drive)
// เดิมอัปไฟล์รูปขึ้น Drive (กินพื้นที่) → เปลี่ยนเป็น: เก็บรูปไว้ที่ R2 (พื้นที่แอป) แล้วใส่ "ลิงก์รูป"
// (=HYPERLINK) ในแถว Sheet แทน · ใช้ access_token (scope drive.file + spreadsheets)
import { SLIP_SHEET_HEADERS } from './slip.ts';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const LEDGER_NAME = 'WealthPlaner Ledger';

// ── pure helpers (เทสต์ได้) ─────────────────────────────────────────────────

export function sheetsAppendPayload(row: string[]): { values: string[][] } {
  return { values: [row] };
}

/** q สำหรับค้นไฟล์ตามชื่อ (escape ' กัน injection) */
export function driveSearchQuery(name: string, mimeType?: string): string {
  const esc = name.replace(/'/g, "\\'");
  const parts = [`name = '${esc}'`, 'trashed = false'];
  if (mimeType) parts.push(`mimeType = '${mimeType}'`);
  return parts.join(' and ');
}

// ── network wrappers (เรียก Google จริง — ต้องมี token) ──────────────────────

async function gFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Google API ${res.status} ${url}: ${await res.text()}`);
  return res;
}

async function findFile(token: string, q: string): Promise<string | null> {
  const url = `${DRIVE_FILES}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`;
  const data = (await (await gFetch(token, url)).json()) as { files?: { id: string }[] };
  return data.files?.[0]?.id ?? null;
}

/** เติมหัวคอลัมน์ให้ชีตที่มีอยู่แล้ว ถ้ายังไม่มี (self-heal — ไม่ต้องลบสร้างใหม่)
 *  อ่าน A1: ถ้าเป็นหัวแล้วข้าม · ไม่งั้นแทรกแถวบนสุดแล้วเขียนหัวลงไป */
async function ensureHeaderRow(token: string, spreadsheetId: string): Promise<void> {
  const data = (await (await gFetch(
    token, `${SHEETS}/${spreadsheetId}/values/A1:A1`,
  )).json()) as { values?: string[][] };
  if (data.values?.[0]?.[0] === SLIP_SHEET_HEADERS[0]) return; // มีหัวแล้ว

  // sheetId ของแท็บแรก (สเปรดชีตที่สร้างด้วย API มักเป็น 0 แต่ดึงจริงให้ชัวร์)
  const meta = (await (await gFetch(
    token, `${SHEETS}/${spreadsheetId}?fields=sheets.properties.sheetId`,
  )).json()) as { sheets?: { properties: { sheetId: number } }[] };
  const sheetId = meta.sheets?.[0]?.properties.sheetId ?? 0;

  await gFetch(token, `${SHEETS}/${spreadsheetId}:batchUpdate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ insertDimension: {
      range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, inheritFromBefore: false,
    } }] }),
  });
  await gFetch(token, `${SHEETS}/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [[...SLIP_SHEET_HEADERS]] }),
  });
}

/** หา/สร้างสเปรดชีต ledger คืน spreadsheetId (รับประกันว่ามีหัวคอลัมน์เสมอ) */
export async function ensureLedger(token: string): Promise<string> {
  const existing = await findFile(
    token, driveSearchQuery(LEDGER_NAME, 'application/vnd.google-apps.spreadsheet'),
  );
  if (existing) {
    await ensureHeaderRow(token, existing); // ชีตเดิมไม่มีหัว → เติมให้
    return existing;
  }
  const res = await gFetch(token, `${SHEETS}?fields=spreadsheetId`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { title: LEDGER_NAME } }),
  });
  const spreadsheetId = ((await res.json()) as { spreadsheetId: string }).spreadsheetId;
  // เพิ่งสร้างใหม่ → เขียนหัวคอลัมน์เป็นแถวแรก
  await appendLedgerRow(token, spreadsheetId, [...SLIP_SHEET_HEADERS]);
  return spreadsheetId;
}

/** append แถวลง Sheets (USER_ENTERED → สูตร =HYPERLINK ทำงาน) */
export async function appendLedgerRow(token: string, spreadsheetId: string, row: string[]): Promise<void> {
  const url = `${SHEETS}/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`;
  await gFetch(token, url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sheetsAppendPayload(row)),
  });
}

/** บันทึก 1 แถวลง ledger — ไม่อัปรูปขึ้น Drive (รูปเก็บที่ R2, ใส่ลิงก์ในแถวแทน) */
export async function saveSlipRow(token: string, row: string[]): Promise<{ spreadsheetId: string }> {
  const spreadsheetId = await ensureLedger(token);
  await appendLedgerRow(token, spreadsheetId, row);
  return { spreadsheetId };
}

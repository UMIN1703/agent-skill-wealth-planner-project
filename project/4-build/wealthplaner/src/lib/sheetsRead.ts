// อ่านค่าจาก Google Sheet ของผู้ใช้ (CR-WPN-008 เฟส 3) — ใช้ Google token เดิมจาก F009
// Sheets API อ่านตามชื่อแท็บ ไม่ใช่ gid → ดึง metadata หา title ของ gid ก่อน แล้วค่อยอ่านค่า
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';

async function gFetch(token: string, url: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`);
  return res;
}

/** แยก spreadsheetId + gid จากลิงก์ (รองรับทั้ง URL เต็มและ id ล้วน) */
export function parseSheetRef(input: string): { id: string; gid?: string } | null {
  const s = input.trim();
  const idM = s.match(/\/d\/([a-zA-Z0-9-_]{20,})/) ?? s.match(/^([a-zA-Z0-9-_]{20,})$/);
  if (!idM) return null;
  const gidM = s.match(/[#&?]gid=(\d+)/);
  return { id: idM[1], gid: gidM?.[1] };
}

/** คืนค่าตารางทั้งแท็บ (string[][]) — แท็บตาม gid ถ้าระบุ ไม่งั้นแท็บแรก */
export async function readSheetValues(token: string, id: string, gid?: string): Promise<string[][]> {
  const meta = (await (await gFetch(token, `${SHEETS}/${id}?fields=sheets.properties(sheetId,title)`)).json()) as {
    sheets?: { properties: { sheetId: number; title: string } }[];
  };
  const sheets = meta.sheets ?? [];
  const picked = (gid && sheets.find((s) => String(s.properties.sheetId) === gid)) || sheets[0];
  if (!picked) throw new Error('ไม่พบแท็บในสเปรดชีต');
  const title = picked.properties.title;
  const range = `${encodeURIComponent(`${title}!A1:Z5000`)}`;
  const data = (await (await gFetch(token, `${SHEETS}/${id}/values/${range}`)).json()) as { values?: string[][] };
  return data.values ?? [];
}

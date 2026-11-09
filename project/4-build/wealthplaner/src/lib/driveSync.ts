// WealthPlaner — Google Drive/Sheets sync (F009, CR-WPN-002)
// เขียนรูปสลิป + แถวรายการลง Google Drive ของผู้ใช้ด้วย access_token (จาก session)
// pure helpers (สร้าง payload/metadata/multipart) แยกออกมาเทสต์ได้ · network wrappers
// เรียก Google REST จริง — ต้องมี token ที่มี scope drive.file + spreadsheets (Class B)

const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FOLDER_NAME = 'WealthPlaner';
const SLIP_FOLDER = 'slips';
const LEDGER_NAME = 'WealthPlaner Ledger';

// ── pure helpers (เทสต์ได้) ─────────────────────────────────────────────────

export function driveFileMetadata(name: string, mimeType: string, parents?: string[]) {
  return parents ? { name, mimeType, parents } : { name, mimeType };
}

export function sheetsAppendPayload(row: string[]): { values: string[][] } {
  return { values: [row] };
}

/** q สำหรับค้นไฟล์/โฟลเดอร์ตามชื่อ (escape ' กัน injection) */
export function driveSearchQuery(name: string, mimeType?: string, parent?: string): string {
  const esc = name.replace(/'/g, "\\'");
  const parts = [`name = '${esc}'`, 'trashed = false'];
  if (mimeType) parts.push(`mimeType = '${mimeType}'`);
  if (parent) parts.push(`'${parent}' in parents`);
  return parts.join(' and ');
}

/** multipart/related body สำหรับ Drive upload (เมทาดาทา + สื่อ) */
export function buildMultipartRelated(
  metadata: object, media: Uint8Array, mediaType: string, boundary: string,
): { body: Uint8Array; contentType: string } {
  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mediaType}\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + media.length + tail.length);
  body.set(head, 0);
  body.set(media, head.length);
  body.set(tail, head.length + media.length);
  return { body, contentType: `multipart/related; boundary=${boundary}` };
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

async function createFolder(token: string, name: string, parent?: string): Promise<string> {
  const res = await gFetch(token, `${DRIVE_FILES}?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(driveFileMetadata(name, FOLDER_MIME, parent ? [parent] : undefined)),
  });
  return ((await res.json()) as { id: string }).id;
}

/** หา/สร้างโฟลเดอร์ /WealthPlaner/slips แล้วคืน folderId ของ slips */
export async function ensureSlipFolder(token: string): Promise<string> {
  const root = (await findFile(token, driveSearchQuery(FOLDER_NAME, FOLDER_MIME)))
    ?? (await createFolder(token, FOLDER_NAME));
  return (await findFile(token, driveSearchQuery(SLIP_FOLDER, FOLDER_MIME, root)))
    ?? (await createFolder(token, SLIP_FOLDER, root));
}

/** อัปรูปสลิปขึ้นโฟลเดอร์ คืน webViewLink */
export async function uploadSlipImage(
  token: string, folderId: string, media: Uint8Array, mediaType: string, filename: string,
): Promise<string> {
  const boundary = `wpn${Date.now().toString(36)}`;
  const { body, contentType } = buildMultipartRelated(
    driveFileMetadata(filename, mediaType, [folderId]), media, mediaType, boundary,
  );
  const res = await gFetch(token, DRIVE_UPLOAD, {
    method: 'POST', headers: { 'Content-Type': contentType }, body,
  });
  const data = (await res.json()) as { id: string; webViewLink?: string };
  return data.webViewLink ?? `${DRIVE_FILES}/${data.id}`;
}

/** หา/สร้างสเปรดชีต ledger คืน spreadsheetId */
export async function ensureLedger(token: string): Promise<string> {
  const existing = await findFile(
    token, driveSearchQuery(LEDGER_NAME, 'application/vnd.google-apps.spreadsheet'),
  );
  if (existing) return existing;
  const res = await gFetch(token, `${SHEETS}?fields=spreadsheetId`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { title: LEDGER_NAME } }),
  });
  return ((await res.json()) as { spreadsheetId: string }).spreadsheetId;
}

/** append แถวลง Sheets */
export async function appendLedgerRow(token: string, spreadsheetId: string, row: string[]): Promise<void> {
  const url = `${SHEETS}/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`;
  await gFetch(token, url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sheetsAppendPayload(row)),
  });
}

/** orchestrator — อัปรูป + เขียนแถว คืน URL รูปที่อัปแล้ว */
export async function saveConfirmedSlip(
  token: string,
  args: { media: Uint8Array; mediaType: string; filename: string; row: string[] },
): Promise<{ imageUrl: string; spreadsheetId: string }> {
  const folderId = await ensureSlipFolder(token);
  const imageUrl = await uploadSlipImage(token, folderId, args.media, args.mediaType, args.filename);
  const spreadsheetId = await ensureLedger(token);
  // ใส่ URL รูปจริงแทน placeholder ในคอลัมน์ slip_image_url (index 4)
  const row = [...args.row];
  row[4] = imageUrl;
  await appendLedgerRow(token, spreadsheetId, row);
  return { imageUrl, spreadsheetId };
}

// Staging store สำหรับ F009 (CR-WPN-002) — Cloudflare KV (index) + R2 (ไฟล์รูป)
// key: KV = "slip:<lineUserId>:<id>"  ·  R2 = "slips/<lineUserId>/<id>"
// ไม่มี binding (เช่น test) → ทุกฟังก์ชันเงียบ/คืนค่าว่างอย่างตรงไปตรงมา
import { type PendingSlip } from './slip.ts';
import { kv, r2 } from './cfEnv.ts';

const PREFIX = 'slip:';
const idxKey = (u: string, id: string) => `${PREFIX}${u}:${id}`;
const objKey = (u: string, id: string) => `slips/${u}/${id}`;

type IndexEntry = { id: string; lineUserId: string; mediaType: string; receivedAt: string };

/** staging พร้อมใช้ไหม (มีทั้ง KV + R2 binding) */
export function stagingConfigured(): boolean {
  return !!(kv() && r2());
}

/** เก็บสลิปเข้า staging — id = messageId (กันซ้ำ AC-E05) · คืน id หรือ null ถ้าไม่มี binding */
export async function stageSlip(args: {
  lineUserId: string; messageId: string; bytes: ArrayBuffer; mediaType: string;
}): Promise<string | null> {
  const k = kv(); const bucket = r2();
  if (!k || !bucket) return null;
  const id = args.messageId;
  // ห่อเป็น Blob ก่อน put — เลี่ยงบั๊ก cross-realm typed array ของ miniflare (dev) · R2 จริงก็รับ Blob
  await bucket.put(objKey(args.lineUserId, id), new Blob([args.bytes]), { httpMetadata: { contentType: args.mediaType } });
  const entry: IndexEntry = { id, lineUserId: args.lineUserId, mediaType: args.mediaType, receivedAt: new Date().toISOString() };
  await k.put(idxKey(args.lineUserId, id), JSON.stringify(entry));
  return id;
}

/** F009 AC-02 — รายการสลิปรอยืนยันของผู้ใช้ (รูปชี้ไป route ที่สตรีมจาก R2) */
export async function listPendingSlips(lineUserId: string | undefined): Promise<PendingSlip[]> {
  const k = kv();
  if (!k || !lineUserId) return [];
  const { keys } = await k.list({ prefix: `${PREFIX}${lineUserId}:` });
  const out: PendingSlip[] = [];
  for (const key of keys) {
    const v = await k.get(key.name);
    if (!v) continue;
    const e = JSON.parse(v) as IndexEntry;
    out.push({
      id: e.id, sourceMessageId: e.id, lineUserId: e.lineUserId,
      imageUrl: `/api/slips/image/${encodeURIComponent(e.id)}`, receivedAt: e.receivedAt,
    });
  }
  return out;
}

/** อ่านไบต์รูปจาก R2 (สำหรับพรีวิว + อัปขึ้น Drive ตอนยืนยัน) */
export async function getStagedSlipMedia(
  lineUserId: string, id: string,
): Promise<{ bytes: ArrayBuffer; mediaType: string } | null> {
  const bucket = r2();
  if (!bucket) return null;
  const obj = await bucket.get(objKey(lineUserId, id));
  if (!obj) return null;
  return { bytes: await obj.arrayBuffer(), mediaType: obj.httpMetadata?.contentType ?? 'image/jpeg' };
}

/** F009 AC-03 — นำสลิปออกจาก staging หลังบันทึกสำเร็จ */
export async function removePendingSlip(lineUserId: string, id: string): Promise<void> {
  const k = kv(); const bucket = r2();
  await k?.delete(idxKey(lineUserId, id));
  await bucket?.delete(objKey(lineUserId, id));
}

/** ตัวอย่างสลิป (เดโม) ไว้พรีวิวฟอร์มเมื่อยังไม่ wire staging (?demo=1) */
export function demoPendingSlip(): PendingSlip {
  return { id: 'demo-1', sourceMessageId: 'demo-msg-1', lineUserId: 'demo-user', imageUrl: '', receivedAt: new Date().toISOString() };
}

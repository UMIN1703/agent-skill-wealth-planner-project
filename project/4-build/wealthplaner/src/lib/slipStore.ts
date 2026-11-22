// Staging store สำหรับ F009 (CR-WPN-002) — Cloudflare KV อย่างเดียว (ฟรี ไม่ต้องใช้ R2/บัตร)
// KV เก็บทั้ง index ("slip:<u>:<id>" = JSON) และไบต์รูป ("slipimg:<u>:<id>" = ArrayBuffer)
// (เดิมใช้ R2 เก็บรูป แต่ R2 ต้องผูกบัตร → ย้ายรูปมา KV เพื่อให้ deploy ฟรีได้ · KV รับ ArrayBuffer ได้)
// ไม่มี binding (เช่น test) → ทุกฟังก์ชันเงียบ/คืนค่าว่างอย่างตรงไปตรงมา
import { type PendingSlip } from './slip.ts';
import { kv } from './cfEnv.ts';

const PREFIX = 'slip:';
const idxKey = (u: string, id: string) => `${PREFIX}${u}:${id}`;
const imgKey = (u: string, id: string) => `slipimg:${u}:${id}`;

type IndexEntry = { id: string; lineUserId: string; mediaType: string; receivedAt: string };

/** staging พร้อมใช้ไหม (มี KV binding) */
export function stagingConfigured(): boolean {
  return !!kv();
}

/** เก็บสลิปเข้า staging — id = messageId (กันซ้ำ AC-E05) · คืน id หรือ null ถ้าไม่มี binding */
export async function stageSlip(args: {
  lineUserId: string; messageId: string; bytes: ArrayBuffer; mediaType: string;
}): Promise<string | null> {
  const k = kv();
  if (!k) return null;
  const id = args.messageId;
  await k.put(imgKey(args.lineUserId, id), args.bytes); // ไบต์รูปใน KV (รองรับ ArrayBuffer)
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

/** อ่านไบต์รูปจาก KV (สำหรับพรีวิว + ลิงก์รูปในชีต) */
export async function getStagedSlipMedia(
  lineUserId: string, id: string,
): Promise<{ bytes: ArrayBuffer; mediaType: string } | null> {
  const k = kv();
  if (!k) return null;
  const bytes = await k.get(imgKey(lineUserId, id), 'arrayBuffer');
  if (!bytes) return null;
  const idxRaw = await k.get(idxKey(lineUserId, id));
  const mediaType = idxRaw ? (JSON.parse(idxRaw) as IndexEntry).mediaType : 'image/jpeg';
  return { bytes, mediaType };
}

/** F009 AC-03 — นำสลิปออกจากคิว "รอยืนยัน" หลังบันทึกสำเร็จ
 * ลบแค่ index · คงไบต์รูปใน KV ไว้ เพื่อให้ "ลิงก์รูป" ในชีตเปิดได้ตลอด */
export async function removePendingSlip(lineUserId: string, id: string): Promise<void> {
  await kv()?.delete(idxKey(lineUserId, id));
}

/** ตัวอย่างสลิป (เดโม) ไว้พรีวิวฟอร์มเมื่อยังไม่ wire staging (?demo=1) */
export function demoPendingSlip(): PendingSlip {
  return { id: 'demo-1', sourceMessageId: 'demo-msg-1', lineUserId: 'demo-user', imageUrl: '', receivedAt: new Date().toISOString() };
}

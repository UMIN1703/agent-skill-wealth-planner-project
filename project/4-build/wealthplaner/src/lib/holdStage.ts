// พัก "รายการที่จะเข้าพอร์ต" ไว้ใน KV ระหว่างรอผู้ใช้กดคอนเฟิร์มในการ์ด LINE (CR-WPN-007)
// key: hold:<id> · มี TTL (หมดอายุเองถ้าไม่กดยืนยัน) · ไม่มี KV binding → คืน null/เงียบ
import { type AssetDraft } from './asset.ts';
import { kv } from './cfEnv.ts';

const PREFIX = 'hold:';
const TTL_SEC = 3600; // 1 ชม. — พอให้สลับไปกดใน LINE

export type PendingHolding = {
  userKey: string;   // เจ้าของพอร์ต (google:<email> / line:<id>) — ใช้ insert Supabase
  msgUser: string;   // LINE messaging userId — ใช้ตรวจ postback + ส่งการ์ดตอบ
  draft: AssetDraft; // ร่างสินทรัพย์ (ยังไม่บันทึก)
};

function rid(): string {
  return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '');
}

/** พักรายการ → คืน id (หรือ null ถ้าไม่มี KV) */
export async function stagePendingHolding(data: PendingHolding): Promise<string | null> {
  const k = kv();
  if (!k) return null;
  const id = rid();
  await k.put(PREFIX + id, JSON.stringify(data), { expirationTtl: TTL_SEC });
  return id;
}

export async function getPendingHolding(id: string): Promise<PendingHolding | null> {
  const k = kv();
  if (!k) return null;
  const v = await k.get(PREFIX + id);
  return v ? (JSON.parse(v) as PendingHolding) : null;
}

export async function removePendingHolding(id: string): Promise<void> {
  await kv()?.delete(PREFIX + id);
}

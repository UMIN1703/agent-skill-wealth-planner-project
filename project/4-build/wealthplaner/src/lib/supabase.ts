// WealthPlaner — ชั้นข้อมูลจริงของพอร์ต (F001/F002 · CR-WPN-006)
// ใช้ Supabase PostgREST ตรง ๆ ด้วย service_role key (ฝั่งเซิร์ฟเวอร์เท่านั้น — อย่าส่งไปฝั่ง client)
// ไม่มี creds (เช่น dev ที่ยังไม่ตั้งค่า) → ทุกฟังก์ชันคืน null/เงียบ แล้ว caller fallback เป็น sampleAssets
import { getVar } from './cfEnv.ts';
import { getLineKeyForEmail } from './googleLink.ts';
import type { HeldAsset } from './portfolio.ts';
import type { DisplayAsset } from '../data/sampleAssets.ts';

type SessionLike = { provider?: string; lineUserId?: string; user?: { email?: string | null } | null } | null;

const TABLE = 'holdings';

function cfg(): { url: string; key: string } | null {
  const url = getVar('SUPABASE_URL');
  const key = getVar('SUPABASE_SERVICE_ROLE_KEY');
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

/** พร้อมใช้ Supabase ไหม (มี URL + service key) */
export function supabaseConfigured(): boolean {
  return cfg() !== null;
}

/** user_key คงที่ต่อผู้ใช้ — 'line:<id>' เมื่อ login LINE, ไม่งั้น 'google:<email>' (แบบ sync, ไม่ map) */
export function userKeyFromSession(session: SessionLike): string | null {
  if (!session) return null;
  if (session.provider === 'line' && session.lineUserId) return `line:${session.lineUserId}`;
  const email = session.user?.email;
  return email ? `google:${email}` : (session.lineUserId ? `line:${session.lineUserId}` : null);
}

/** user_key แบบรวมบัญชี — login Google (email ที่ผูกกับ LINE ไว้) จะได้ 'line:<id>' เดียวกัน
 *  → login LINE หรือ Google ของคนเดียวกัน เห็นพอร์ตเดียวกัน (ใช้แทน userKeyFromSession ทุกที่ที่อ่าน/เขียนพอร์ต) */
export async function resolveUserKey(session: SessionLike): Promise<string | null> {
  if (!session) return null;
  if (session.provider === 'line' && session.lineUserId) return `line:${session.lineUserId}`;
  const email = session.user?.email;
  if (email) {
    const linked = await getLineKeyForEmail(email); // Google email → line:<id> ถ้าผูกไว้
    return linked ?? `google:${email}`;
  }
  return session.lineUserId ? `line:${session.lineUserId}` : null;
}

async function sb(path: string, init?: RequestInit): Promise<Response> {
  const c = cfg();
  if (!c) throw new Error('supabase not configured');
  const res = await fetch(`${c.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: c.key,
      Authorization: `Bearer ${c.key}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`supabase ${res.status} ${path}: ${await res.text()}`);
  return res;
}

type HoldingRow = {
  id?: string;
  name: string; type: string; broker_channel: string;
  quantity: number; cost_price: number; market_price: number | null;
  fx_to_thb: number; currency: string | null; source: string; note: string | null;
  category: string | null; tax_bucket: string | null; created_at?: string; updated_at?: string;
};

function rowToHeld(r: HoldingRow): DisplayAsset {
  return {
    id: r.id, name: r.name, type: r.type, brokerChannel: r.broker_channel,
    quantity: r.quantity, costPrice: r.cost_price, marketPrice: r.market_price,
    fxToThb: r.fx_to_thb, currency: r.currency ?? undefined,
    note: r.note ?? undefined, category: r.category ?? undefined, taxBucket: r.tax_bucket ?? undefined,
    source: r.source, updatedMin: 0, createdAt: r.created_at, updatedAt: r.updated_at ?? r.created_at,
  };
}

/** ฟิลด์ที่แก้ไขได้ (undefined = ไม่แก้) */
export type HoldingPatch = {
  name?: string; brokerChannel?: string; quantity?: number;
  costPrice?: number; currentPrice?: number | null; note?: string;
};

/** แก้ไขรายการถือครอง (เฉพาะของ user_key นั้น) · ตั้ง updated_at = now → เด้งขึ้น "ล่าสุด" */
export async function updateHolding(userKey: string, id: string, patch: HoldingPatch): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.brokerChannel !== undefined) row.broker_channel = patch.brokerChannel;
  if (patch.quantity !== undefined) row.quantity = patch.quantity;
  if (patch.costPrice !== undefined) row.cost_price = patch.costPrice;
  if (patch.currentPrice !== undefined) row.market_price = patch.currentPrice;
  if (patch.note !== undefined) row.note = patch.note || null;
  const q = `${TABLE}?id=eq.${encodeURIComponent(id)}&user_key=eq.${encodeURIComponent(userKey)}`;
  await sb(q, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  return true;
}

/** ลบรายการถือครอง (เฉพาะของ user_key นั้น) */
export async function deleteHolding(userKey: string, id: string): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  const q = `${TABLE}?id=eq.${encodeURIComponent(id)}&user_key=eq.${encodeURIComponent(userKey)}`;
  await sb(q, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  return true;
}

/** รายการถือครองของผู้ใช้ (เรียงใหม่→เก่า) · ไม่ได้ตั้งค่า Supabase → null (caller fallback mock) */
export async function listHoldings(userKey: string): Promise<DisplayAsset[] | null> {
  if (!supabaseConfigured()) return null;
  const q = `${TABLE}?user_key=eq.${encodeURIComponent(userKey)}&select=*&order=created_at.desc`;
  const rows = (await (await sb(q)).json()) as HoldingRow[];
  return rows.map(rowToHeld);
}

/** เพิ่มรายการถือครอง 1 แถว · คืน true เมื่อเขียนจริง, false เมื่อยังไม่ตั้งค่า Supabase */
export async function insertHolding(
  userKey: string,
  a: HeldAsset & { source?: string; note?: string; category?: string; taxBucket?: string },
): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  const row = {
    user_key: userKey,
    name: a.name, type: a.type, broker_channel: a.brokerChannel,
    quantity: a.quantity, cost_price: a.costPrice, market_price: a.marketPrice,
    fx_to_thb: a.fxToThb, currency: a.currency ?? null, source: a.source ?? 'manual',
    note: a.note ?? null, category: a.category ?? null, tax_bucket: a.taxBucket || null,
  };
  await sb(TABLE, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  return true;
}

// ── portfolio_snapshots (กราฟการเติบโต · CR-WPN-011) ─────────────────────────
const SNAP_TABLE = 'portfolio_snapshots';
export type Snapshot = { asOf: string; totalCost: number; totalValue: number }; // asOf = 'YYYY-MM-DD'

/** วันที่วันนี้ตามเวลาไทย (YYYY-MM-DD) — ใช้เป็นคีย์ as_of ของ snapshot */
export function todayBangkok(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // en-CA → YYYY-MM-DD
}

/** บันทึก snapshot ของวันนี้ (upsert ทับแถวเดิมของวันเดียวกัน) · best-effort — ไม่ throw */
export async function recordSnapshot(userKey: string, totalCost: number, totalValue: number): Promise<void> {
  if (!supabaseConfigured()) return;
  const row = { user_key: userKey, as_of: todayBangkok(), total_cost: totalCost, total_value: totalValue };
  try {
    await sb(`${SNAP_TABLE}?on_conflict=user_key,as_of`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
    });
  } catch {
    // ตารางยังไม่ถูกสร้าง / เน็ตล่ม → ข้ามเงียบ (กราฟ fallback เป็นต้นทุนสะสม)
  }
}

/** อ่าน snapshot ทั้งหมดของผู้ใช้ (เรียงเก่า→ใหม่) · ไม่ตั้งค่า/ตารางไม่มี → [] */
export async function listSnapshots(userKey: string): Promise<Snapshot[]> {
  if (!supabaseConfigured()) return [];
  try {
    const q = `${SNAP_TABLE}?user_key=eq.${encodeURIComponent(userKey)}&select=as_of,total_cost,total_value&order=as_of.asc`;
    const rows = (await (await sb(q)).json()) as { as_of: string; total_cost: number; total_value: number }[];
    return rows.map((r) => ({ asOf: r.as_of, totalCost: r.total_cost, totalValue: r.total_value }));
  } catch {
    return [];
  }
}

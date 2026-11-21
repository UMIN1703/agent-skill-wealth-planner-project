// WealthPlaner — ชั้นข้อมูลจริงของพอร์ต (F001/F002 · CR-WPN-006)
// ใช้ Supabase PostgREST ตรง ๆ ด้วย service_role key (ฝั่งเซิร์ฟเวอร์เท่านั้น — อย่าส่งไปฝั่ง client)
// ไม่มี creds (เช่น dev ที่ยังไม่ตั้งค่า) → ทุกฟังก์ชันคืน null/เงียบ แล้ว caller fallback เป็น sampleAssets
import { getVar } from './cfEnv.ts';
import type { HeldAsset } from './portfolio.ts';
import type { DisplayAsset } from '../data/sampleAssets.ts';

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

/** user_key คงที่ต่อผู้ใช้ — 'line:<id>' เมื่อ login LINE, ไม่งั้น 'google:<email>' */
export function userKeyFromSession(
  session: { provider?: string; lineUserId?: string; user?: { email?: string | null } | null } | null,
): string | null {
  if (!session) return null;
  if (session.provider === 'line' && session.lineUserId) return `line:${session.lineUserId}`;
  const email = session.user?.email;
  return email ? `google:${email}` : (session.lineUserId ? `line:${session.lineUserId}` : null);
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
  name: string; type: string; broker_channel: string;
  quantity: number; cost_price: number; market_price: number | null;
  fx_to_thb: number; currency: string | null; source: string; note: string | null;
  category: string | null; tax_bucket: string | null; created_at?: string;
};

function rowToHeld(r: HoldingRow): DisplayAsset {
  return {
    name: r.name, type: r.type, brokerChannel: r.broker_channel,
    quantity: r.quantity, costPrice: r.cost_price, marketPrice: r.market_price,
    fxToThb: r.fx_to_thb, currency: r.currency ?? undefined,
    note: r.note ?? undefined, category: r.category ?? undefined, taxBucket: r.tax_bucket ?? undefined,
    source: r.source, updatedMin: 0, createdAt: r.created_at,
  };
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

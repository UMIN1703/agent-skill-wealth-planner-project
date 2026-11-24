/// <reference types="@cloudflare/workers-types" />
// เข้าถึง Cloudflare bindings/vars อย่างปลอดภัย (F009 staging — KV/R2)
// getOptionalRequestContext คืน undefined เมื่อไม่มี binding (เช่น test/บาง runtime)
// → ทุกตัวช่วยคืน undefined แทนที่จะพัง (คงพฤติกรรม "ยังไม่ wire = เงียบ/ตรงไปตรงมา")
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';

declare global {
  interface CloudflareEnv {
    SLIP_INDEX?: KVNamespace;                 // index สลิปรอยืนยัน
    SLIP_FILES?: R2Bucket;                    // ไฟล์รูปสลิป
    LINE_CHANNEL_SECRET?: string;
    LINE_CHANNEL_ACCESS_TOKEN?: string;
    SLIP_STAGING?: string;
    AUTH_GOOGLE_ID?: string;
    AUTH_GOOGLE_SECRET?: string;
    SUPABASE_URL?: string;                     // ชั้นข้อมูลพอร์ต (F001/F002 · CR-WPN-006)
    SUPABASE_SERVICE_ROLE_KEY?: string;        // server-only — อย่าส่งไป client
    FINNHUB_API_KEY?: string;                  // ราคาหุ้น/ETF ตปท. (F003 · CR-WPN-014) — ออปชัน
  }
}

type VarName =
  | 'LINE_CHANNEL_SECRET' | 'LINE_CHANNEL_ACCESS_TOKEN' | 'SLIP_STAGING'
  | 'AUTH_GOOGLE_ID' | 'AUTH_GOOGLE_SECRET'
  | 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'FINNHUB_API_KEY';

function env(): Partial<CloudflareEnv> {
  return (getOptionalRequestContext()?.env ?? {}) as Partial<CloudflareEnv>;
}

/** รันงานเบื้องหลังให้จบหลังส่ง response (เช่นเขียน snapshot) โดยไม่บล็อกหน้า ·
 *  บน Cloudflare ใช้ ctx.waitUntil · dev/ไม่มี ctx → ปล่อยให้รันไป (best-effort, ดัก error กันค้าง) */
export function waitUntil(p: Promise<unknown>): void {
  const ctx = getOptionalRequestContext()?.ctx as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (ctx?.waitUntil) ctx.waitUntil(p.catch(() => {}));
  else void p.catch(() => {});
}

export function kv(): KVNamespace | undefined {
  return env().SLIP_INDEX;
}
export function r2(): R2Bucket | undefined {
  return env().SLIP_FILES;
}

/** อ่าน env var: Cloudflare env ก่อน (prod) แล้ว fallback process.env (dev/.env.local) · trim กันอักขระแปลกติดมา (\r/ช่องว่าง) */
export function getVar(name: VarName): string | undefined {
  const v = (env()[name] as string | undefined) ?? process.env[name];
  return v?.trim();
}

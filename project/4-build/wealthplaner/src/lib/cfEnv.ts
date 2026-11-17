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
  }
}

type VarName = 'LINE_CHANNEL_SECRET' | 'LINE_CHANNEL_ACCESS_TOKEN' | 'SLIP_STAGING' | 'AUTH_GOOGLE_ID' | 'AUTH_GOOGLE_SECRET';

function env(): Partial<CloudflareEnv> {
  return (getOptionalRequestContext()?.env ?? {}) as Partial<CloudflareEnv>;
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

// Account linking LINE↔Google (F009) — เก็บ Google token ผูกกับ LINE userId ใน KV
// session login ด้วย LINE (มี lineUserId แต่ไม่มี Google token) → เชื่อม Google ผ่าน OAuth เสริม
// → endpoint บันทึกสลิปดึง token นี้มาเขียน Google Drive ได้ (แก้ dual-identity gap)
import { kv, getVar } from './cfEnv.ts';
import { signClaim, verifyClaim } from './claim.ts';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');

type GoogleLink = { access_token: string; refresh_token?: string; expires_at: number }; // expires_at = epoch ms
const linkKey = (u: string) => `google:${u}`;

/** URL ให้ผู้ใช้ไปกด consent Google (ขอ scope Drive/Sheets + refresh token) */
export function googleAuthUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: getVar('AUTH_GOOGLE_ID') ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleLink> {
  const body = new URLSearchParams({
    code,
    client_id: getVar('AUTH_GOOGLE_ID') ?? '',
    client_secret: getVar('AUTH_GOOGLE_SECRET') ?? '',
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
  const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + j.expires_in * 1000 };
}

async function refreshLink(link: GoogleLink): Promise<GoogleLink> {
  if (!link.refresh_token) throw new Error('no refresh_token (ต้องเชื่อม Google ใหม่)');
  const body = new URLSearchParams({
    refresh_token: link.refresh_token,
    client_id: getVar('AUTH_GOOGLE_ID') ?? '',
    client_secret: getVar('AUTH_GOOGLE_SECRET') ?? '',
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error(`Google refresh ${res.status}: ${await res.text()}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  return { access_token: j.access_token, refresh_token: link.refresh_token, expires_at: Date.now() + j.expires_in * 1000 };
}

export async function saveGoogleLink(lineUserId: string, link: GoogleLink): Promise<void> {
  await kv()?.put(linkKey(lineUserId), JSON.stringify(link));
}

export async function isGoogleLinked(lineUserId: string | undefined): Promise<boolean> {
  if (!lineUserId) return false;
  return !!(await kv()?.get(linkKey(lineUserId)));
}

// แมป Google email ↔ LINE userId — ให้ login Google กับ login LINE ของคนเดียวกันใช้ "พอร์ตเดียวกัน"
const emailKey = (email: string) => `emaillink:${email.toLowerCase()}`;

export async function saveEmailLink(email: string, lineUserId: string): Promise<void> {
  await kv()?.put(emailKey(email), lineUserId);
}
/** คืน user_key แบบ 'line:<id>' ถ้า email นี้ผูกกับบัญชี LINE ไว้ · ไม่ผูก → null */
export async function getLineKeyForEmail(email: string | undefined | null): Promise<string | null> {
  if (!email) return null;
  const id = await kv()?.get(emailKey(email));
  return id ? `line:${id}` : null;
}

/** ดึงอีเมลจาก Google access token (ใช้ตอน account-link เพื่อทำ email↔line mapping) */
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const j = (await res.json()) as { email?: string };
    return j.email ?? null;
  } catch { return null; }
}

/** access token ที่ใช้งานได้ (refresh ให้ถ้าใกล้หมดอายุ) หรือ null ถ้ายังไม่เชื่อม */
export async function getGoogleAccessToken(lineUserId: string): Promise<string | null> {
  const k = kv();
  if (!k) return null;
  const raw = await k.get(linkKey(lineUserId));
  if (!raw) return null;
  let link = JSON.parse(raw) as GoogleLink;
  if (Date.now() > link.expires_at - 60_000) { // ใกล้หมดอายุ → refresh แล้วเก็บกลับ
    link = await refreshLink(link);
    await k.put(linkKey(lineUserId), JSON.stringify(link));
  }
  return link.access_token;
}

// state กัน CSRF — ใช้ signed token (stateless, HMAC) แทน KV
// เดิมเก็บ nonce ใน KV แต่ connect→callback ห่างแค่ ~10 วิ → ชน KV eventual-consistency (sync ได้ถึง 60 วิ)
// → consumeState คืน null → เก็บ Google link ไม่สำเร็จ · signed token ไม่ต้องอ่าน KV เลย
export async function makeState(lineUserId: string): Promise<string> {
  return signClaim({ u: lineUserId, id: 'oauthstate' }, 600); // อายุ 10 นาที
}
export async function consumeState(state: string): Promise<string | null> {
  const c = await verifyClaim(state);
  return c && c.id === 'oauthstate' ? c.u : null;
}

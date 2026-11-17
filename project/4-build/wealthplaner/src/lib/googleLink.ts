// Account linking LINE↔Google (F009) — เก็บ Google token ผูกกับ LINE userId ใน KV
// session login ด้วย LINE (มี lineUserId แต่ไม่มี Google token) → เชื่อม Google ผ่าน OAuth เสริม
// → endpoint บันทึกสลิปดึง token นี้มาเขียน Google Drive ได้ (แก้ dual-identity gap)
import { kv, getVar } from './cfEnv.ts';

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

// state nonce กัน CSRF — ผูก nonce → lineUserId ชั่วคราวใน KV (10 นาที)
export async function makeState(lineUserId: string): Promise<string> {
  const nonce = crypto.randomUUID();
  await kv()?.put(`oauthstate:${nonce}`, lineUserId, { expirationTtl: 600 });
  return nonce;
}
export async function consumeState(nonce: string): Promise<string | null> {
  const k = kv();
  if (!k) return null;
  const u = await k.get(`oauthstate:${nonce}`);
  if (u) await k.delete(`oauthstate:${nonce}`);
  return u;
}

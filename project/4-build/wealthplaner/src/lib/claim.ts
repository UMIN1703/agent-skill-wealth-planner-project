// Claim token (F009 option B) — ผูก "สลิปใบนี้" ไว้ในลิงก์ที่ส่งกลับทาง LINE
// เซ็นด้วย AUTH_SECRET (HMAC-SHA256) → ใครถือลิงก์ = เจ้าของสลิปใบนั้น
// ทำให้ไม่ต้องแมตช์ LINE Login userId กับ Messaging userId (ข้ามปัญหา provider)
const enc = new TextEncoder();

export type Claim = { u: string; id: string; exp: number }; // u = messaging userId, id = slip id

function b64url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usage);
}

export async function signClaim(data: { u: string; id: string }, ttlSec = 86400): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? '';
  const payload: Claim = { ...data, exp: Date.now() + ttlSec * 1000 };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret, ['sign']), enc.encode(body));
  return body + '.' + b64url(sig);
}

export async function verifyClaim(token: string | null | undefined): Promise<Claim | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET ?? '';
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret, ['verify']), fromB64url(sig), enc.encode(body));
  if (!ok) return null;
  try {
    const claim = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Claim;
    return Date.now() > claim.exp ? null : claim;
  } catch {
    return null;
  }
}

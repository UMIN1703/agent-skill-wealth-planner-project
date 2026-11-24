// Auth.js (NextAuth v5) — config กลาง (F008 + F009)
// ใช้ Google + LINE เป็น provider · อ่าน env อัตโนมัติ: AUTH_SECRET, AUTH_GOOGLE_ID/SECRET, AUTH_LINE_ID/SECRET
// ไม่ผูก Supabase — session เก็บเป็น JWT (ไม่ต้องมี DB adapter)
// F009 (CR-WPN-002): ขอ scope Drive/Sheets จาก Google เพิ่ม แล้วเก็บ access_token ไว้ใน JWT
// เพื่อให้ server เขียนไฟล์/แถวลง Google Drive ของผู้ใช้ได้ (ตอนยืนยันสลิป)
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Line from 'next-auth/providers/line';

// ต้องให้ Google re-consent scope ใหม่ (เจ้าของเพิ่ม scope ใน consent screen แล้ว ผู้ใช้กด allow)
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',    // ไฟล์ที่แอปสร้าง (รูปสลิป + สเปรดชีต)
  'https://www.googleapis.com/auth/spreadsheets',   // append แถวลง Sheets ของแอป
].join(' ');

declare module 'next-auth' {
  interface Session {
    accessToken?: string; // Google access token (F009 — เรียก Drive/Sheets API)
    provider?: string;    // 'google' | 'line'
    lineUserId?: string;  // LINE userId (F009 — แมตช์สลิปที่ส่งเข้า OA กับบัญชี)
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // self-hosted (Cloudflare Pages) — เชื่อ host เสมอ (แทน AUTH_TRUST_HOST ที่อาจไม่ถึง runtime)
  providers: [
    Google({
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: 'offline', // ขอ refresh token (ได้ตอน consent ครั้งแรก)
          // ไม่บังคับ prompt:'consent' → Google ขอ consent แค่ครั้งแรกครั้งเดียว
          // ครั้งต่อไปข้ามให้ (ไม่โชว์หน้าเตือน unverified ซ้ำทุก login) · token หมดอายุ → re-login ได้ fresh token
        },
      },
    }),
    Line, // อ่าน AUTH_LINE_ID (Channel ID) / AUTH_LINE_SECRET (Channel secret)
  ],
  pages: {
    signIn: '/login', // ใช้หน้า login ของเราเอง (ไม่ใช้หน้า default ของ NextAuth)
  },
  callbacks: {
    // เก็บ access_token/refresh_token + provider ลง JWT ตอน sign in · ต่ออายุ Google token เมื่อใกล้หมด
    async jwt({ token, account }) {
      const t = token as Record<string, unknown>;
      if (account) {
        t.accessToken = account.access_token;
        t.refreshToken = account.refresh_token ?? t.refreshToken;
        t.expiresAt = account.expires_at; // epoch seconds
        t.provider = account.provider;
        // LINE userId = providerAccountId ของ LINE (ภายใต้ provider เดียวกับ Messaging API → ตรงกัน)
        if (account.provider === 'line') t.lineUserId = account.providerAccountId;
        return token;
      }
      // Google login token หมดทุก ~1 ชม. · NextAuth ไม่ refresh ให้เอง → ต่ออายุด้วย refresh_token
      const exp = t.expiresAt as number | undefined;
      const rt = t.refreshToken as string | undefined;
      if (t.provider === 'google' && rt && exp && Date.now() / 1000 > exp - 60) {
        try {
          const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.AUTH_GOOGLE_ID ?? '',
              client_secret: process.env.AUTH_GOOGLE_SECRET ?? '',
              grant_type: 'refresh_token',
              refresh_token: rt,
            }),
          });
          const j = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };
          if (res.ok && j.access_token) {
            t.accessToken = j.access_token;
            t.expiresAt = Math.floor(Date.now() / 1000) + (j.expires_in ?? 3600);
            if (j.refresh_token) t.refreshToken = j.refresh_token;
          }
        } catch { /* เก็บ token เดิมไว้ — ถ้าหมดจริง API จะ 401 แล้วให้ผู้ใช้ login/เชื่อมใหม่ */ }
      }
      return token;
    },
    // ส่งต่อให้ session อ่านได้ฝั่ง server (F009 ใช้เขียน Drive + แมตช์สลิป)
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.provider = token.provider as string | undefined;
      session.lineUserId = token.lineUserId as string | undefined;
      return session;
    },
  },
});

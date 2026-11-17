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
  providers: [
    Google({
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: 'offline', // ขอ refresh token (ครั้งแรกที่ consent)
          prompt: 'consent',
        },
      },
    }),
    Line, // อ่าน AUTH_LINE_ID (Channel ID) / AUTH_LINE_SECRET (Channel secret)
  ],
  pages: {
    signIn: '/login', // ใช้หน้า login ของเราเอง (ไม่ใช้หน้า default ของ NextAuth)
  },
  callbacks: {
    // เก็บ access_token + provider ลง JWT ตอน sign in (account มีเฉพาะตอนแรก)
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        // LINE userId = providerAccountId ของ LINE (ภายใต้ provider เดียวกับ Messaging API → ตรงกัน)
        if (account.provider === 'line') token.lineUserId = account.providerAccountId;
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

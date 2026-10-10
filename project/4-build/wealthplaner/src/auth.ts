// Auth.js (NextAuth v5) — config กลาง (F008)
// ใช้ Google เป็น provider · อ่าน env อัตโนมัติ: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
// ไม่ผูก Supabase — session เก็บเป็น JWT (ไม่ต้องมี DB adapter)
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Line from 'next-auth/providers/line';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google, // อ่าน AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
    Line,   // อ่าน AUTH_LINE_ID (Channel ID) / AUTH_LINE_SECRET (Channel secret)
  ],
  pages: {
    signIn: '/login', // ใช้หน้า login ของเราเอง (ไม่ใช้หน้า default ของ NextAuth)
  },
});

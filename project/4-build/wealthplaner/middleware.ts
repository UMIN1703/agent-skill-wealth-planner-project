// NextAuth middleware (F008) — เติมสถานะ login (req.auth) ให้ทุก request
// ตอนนี้ "ไม่บล็อก" · จะบังคับ login ก็ uncomment บล็อกด้านล่าง
import { auth } from '@/auth.ts';

export default auth((req) => {
  // (ไม่บังคับ) กันหน้าใช้งานเมื่อยังไม่ล็อกอิน — เปิดใช้ก็ uncomment:
  // const guarded = ['/add', '/import', '/rebalance'];
  // if (!req.auth && guarded.some((p) => req.nextUrl.pathname.startsWith(p))) {
  //   return Response.redirect(new URL('/login', req.nextUrl));
  // }
});

export const config = {
  // จำกัดเฉพาะหน้าที่จะบังคับ login (ปัจจุบัน guard ปิดอยู่) — ไม่ดัก '/' เพื่อเลี่ยงบั๊ก
  // next-on-pages ที่ทำให้ index route คืน 404 เมื่อ middleware matcher ครอบ '/'
  matcher: ['/add/:path*', '/import/:path*', '/rebalance/:path*'],
};

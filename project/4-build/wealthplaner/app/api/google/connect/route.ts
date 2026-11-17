// เริ่มเชื่อม Google (F009 account linking) — ต้อง login ด้วย LINE อยู่ก่อน
// สร้าง state ผูกกับ lineUserId แล้วพาไปหน้า consent ของ Google
import { auth } from '@/auth.ts';
import { googleAuthUrl, makeState } from '@/lib/googleLink.ts';

export const runtime = 'edge';

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.lineUserId) {
    return new Response('ต้องเข้าสู่ระบบด้วย LINE ก่อนเชื่อม Google', { status: 401 });
  }
  // ใช้ AUTH_URL เป็นฐาน (localhost) ให้ redirect_uri ตรงกับที่ลงทะเบียนใน Google เป๊ะ
  const base = process.env.AUTH_URL ?? new URL(req.url).origin;
  const state = await makeState(session.lineUserId);
  return new Response(null, { status: 302, headers: { Location: googleAuthUrl(`${base}/api/google/callback`, state) } });
}

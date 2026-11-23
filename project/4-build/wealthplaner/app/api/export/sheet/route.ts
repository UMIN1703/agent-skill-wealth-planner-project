// ส่งออกรายงานพอร์ตเป็น Google Sheet (CR-WPN-010) — on-demand จากหน้าสินทรัพย์
// ต้องมี Google token (login Google หรือเชื่อม Google ไว้) · ไม่มี → บอกให้เชื่อม Google ก่อน (needLink)
import { auth } from '@/auth.ts';
import { userKeyFromSession, supabaseConfigured, listHoldings } from '@/lib/supabase.ts';
import { getGoogleAccessToken } from '@/lib/googleLink.ts';
import { exportReport } from '@/lib/sheetExport.ts';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  const userKey = userKeyFromSession(session);
  if (!userKey || !supabaseConfigured()) {
    return Response.json({ ok: false, reason: 'ยังไม่เชื่อมฐานข้อมูล (Supabase)' }, { status: 503 });
  }

  // Google token: จาก session (login Google) หรือจาก account link (login LINE + เชื่อม Google)
  const token = (session.provider === 'google' ? session.accessToken : undefined)
    ?? (session.lineUserId ? await getGoogleAccessToken(session.lineUserId) : null);
  if (!token) {
    return Response.json(
      { ok: false, needLink: true, reason: 'ต้องเชื่อม Google ก่อนส่งออกเป็น Sheet' },
      { status: 403 },
    );
  }

  const holdings = await listHoldings(userKey);
  if (!holdings || holdings.length === 0) {
    return Response.json({ ok: false, reason: 'ยังไม่มีรายการในพอร์ตให้ส่งออก' }, { status: 400 });
  }

  try {
    const { url } = await exportReport(token, holdings);
    return Response.json({ ok: true, url });
  } catch (e) {
    console.error('[export/sheet] error:', String(e));
    // ชั่วคราว: ใส่ error จริง (ตัดสั้น) ไว้ดีบั๊กสาเหตุ scope/สิทธิ์
    return Response.json({ ok: false, reason: 'ส่งออกไม่สำเร็จ: ' + String(e).slice(0, 220) }, { status: 502 });
  }
}

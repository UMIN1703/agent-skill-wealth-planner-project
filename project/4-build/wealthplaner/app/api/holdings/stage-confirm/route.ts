// สลิป→พอร์ต แบบยืนยันในการ์ด LINE (CR-WPN-007)
// POST { draft, claim } → validate → พักใน KV → push "การ์ดคอนเฟิร์ม" (ปุ่ม postback) ไป LINE
// ผู้ใช้กดคอนเฟิร์มในแชต → webhook (postback) ค่อยบันทึกจริง
import { auth } from '@/auth.ts';
import { validateAssetDraft, draftToDisplayAsset, type AssetDraft } from '@/lib/asset.ts';
import { userKeyFromSession, supabaseConfigured } from '@/lib/supabase.ts';
import { holdingSummary } from '@/lib/portfolio.ts';
import { stagePendingHolding } from '@/lib/holdStage.ts';
import { getVar } from '@/lib/cfEnv.ts';
import { verifyClaim } from '@/lib/claim.ts';
import { pushLineButtons } from '@/lib/lineApi.ts';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  const userKey = userKeyFromSession(session);
  if (!userKey) return Response.json({ ok: false, reason: 'ระบุผู้ใช้ไม่ได้' }, { status: 400 });

  let body: { draft?: AssetDraft; claim?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response('bad request', { status: 400 });
  }
  if (!body.draft) return Response.json({ ok: false, reason: 'ข้อมูลไม่ครบ (draft)' }, { status: 400 });

  const v = validateAssetDraft(body.draft);
  if (!v.ok) return Response.json({ ok: false, errors: v.errors }, { status: 422 });

  const claim = await verifyClaim(body.claim);
  const lineToken = getVar('LINE_CHANNEL_ACCESS_TOKEN');
  if (!claim?.u || !lineToken) {
    return Response.json({ ok: false, reason: 'ส่งการ์ดคอนเฟิร์มไม่ได้ (ต้องมาจากลิงก์สลิป + ตั้งค่า LINE)', noCard: true }, { status: 409 });
  }
  if (!supabaseConfigured()) {
    return Response.json({ ok: false, configured: false, reason: 'ยังไม่เชื่อมฐานข้อมูล (Supabase)' });
  }

  const asset = draftToDisplayAsset(body.draft);
  const id = await stagePendingHolding({ userKey, msgUser: claim.u, draft: body.draft });
  if (!id) return Response.json({ ok: false, reason: 'staging ไม่พร้อม (KV ยังไม่ตั้งค่า)' }, { status: 503 });

  await pushLineButtons(lineToken, claim.u,
    `ตรวจสอบก่อนบันทึกเข้าพอร์ต\n${holdingSummary(asset)}`, [
      { label: '✅ คอนเฟิร์ม', data: `holdok:${id}` },
      { label: '✖ ยกเลิก', data: `holdno:${id}` },
    ], 'ยืนยันบันทึกเข้าพอร์ต');

  return Response.json({ ok: true, staged: true });
}

// บันทึกสินทรัพย์ลงพอร์ตจริง (F001/F002 persistence · CR-WPN-006)
// POST { draft: AssetDraft, source?: 'manual'|'slip' } → validate → insert ลง Supabase ของผู้ใช้
// ใช้กับการ "เพิ่มด้วยมือ" (direct) · สลิปใช้เส้นทางการ์ดคอนเฟิร์ม (stage-confirm, CR-WPN-007)
// ยังไม่ตั้งค่า Supabase → 200 { ok:false, configured:false } (client เก็บเฉพาะในเซสชันเหมือนเดิม)
import { auth } from '@/auth.ts';
import { validateAssetDraft, draftToDisplayAsset, type AssetDraft } from '@/lib/asset.ts';
import { insertHolding, userKeyFromSession, supabaseConfigured } from '@/lib/supabase.ts';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  const userKey = userKeyFromSession(session);
  if (!userKey) return Response.json({ ok: false, reason: 'ระบุผู้ใช้ไม่ได้' }, { status: 400 });

  let body: { draft?: AssetDraft; source?: string; claim?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response('bad request', { status: 400 });
  }
  if (!body.draft) return Response.json({ ok: false, reason: 'ข้อมูลไม่ครบ (draft)' }, { status: 400 });

  const v = validateAssetDraft(body.draft);
  if (!v.ok) return Response.json({ ok: false, errors: v.errors }, { status: 422 });

  // ยังไม่เชื่อมฐานข้อมูล → แจ้งตรง ๆ (ไม่ใช่ error) ให้ client เก็บในเซสชันต่อไป
  if (!supabaseConfigured()) {
    return Response.json({ ok: false, configured: false, reason: 'ยังไม่เชื่อมฐานข้อมูล (Supabase) — บันทึกเฉพาะในเซสชัน' });
  }

  try {
    const asset = draftToDisplayAsset(body.draft);
    await insertHolding(userKey, { ...asset, source: body.source === 'slip' ? 'slip' : 'manual' });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('[holdings] insert error:', String(e));
    return Response.json({ ok: false, reason: 'บันทึกลงฐานข้อมูลไม่สำเร็จ ลองใหม่' }, { status: 502 });
  }
}

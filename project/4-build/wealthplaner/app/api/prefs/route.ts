// ความเสี่ยง + เป้าหมาย allocation ต่อผู้ใช้ (CR-WPN-012) — sync ข้ามเครื่องแทน localStorage
// GET → { ok, prefs } · PATCH { risk?, targets? } → upsert (ส่งเฉพาะคีย์ที่แก้ ไม่ทับคีย์อื่น)
import { auth } from '@/auth.ts';
import { getPrefs, savePrefs, resolveUserKey, supabaseConfigured, type UserPrefs } from '@/lib/supabase.ts';

export const runtime = 'edge';

async function requireUserKey(): Promise<{ userKey: string } | { error: Response }> {
  const session = await auth();
  if (!session?.user) return { error: Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 }) };
  const userKey = await resolveUserKey(session);
  if (!userKey) return { error: Response.json({ ok: false, reason: 'ระบุผู้ใช้ไม่ได้' }, { status: 400 }) };
  if (!supabaseConfigured()) return { error: Response.json({ ok: false, configured: false }, { status: 503 }) };
  return { userKey };
}

export async function GET(): Promise<Response> {
  const u = await requireUserKey();
  if ('error' in u) return u.error;
  const prefs = await getPrefs(u.userKey);
  return Response.json({ ok: true, prefs: prefs ?? {} });
}

export async function PATCH(req: Request): Promise<Response> {
  const u = await requireUserKey();
  if ('error' in u) return u.error;
  let body: UserPrefs;
  try { body = (await req.json()) as UserPrefs; } catch { return new Response('bad request', { status: 400 }); }

  const patch: UserPrefs = {};
  if (body.risk !== undefined) {
    const r = body.risk;
    if (r !== null && !(r && typeof r.level === 'number' && r.level >= 1 && r.level <= 5)) {
      return Response.json({ ok: false, reason: 'risk ไม่ถูกต้อง' }, { status: 422 });
    }
    patch.risk = r;
  }
  if (body.targets !== undefined) {
    const t = body.targets;
    if (t !== null) {
      if (typeof t !== 'object') return Response.json({ ok: false, reason: 'targets ไม่ถูกต้อง' }, { status: 422 });
      for (const v of Object.values(t)) {
        if (typeof v !== 'number' || v < 0 || v > 100) return Response.json({ ok: false, reason: 'เป้าหมายต้องอยู่ 0–100%' }, { status: 422 });
      }
    }
    patch.targets = t;
  }
  if (patch.risk === undefined && patch.targets === undefined) {
    return Response.json({ ok: false, reason: 'ไม่มีข้อมูลให้บันทึก' }, { status: 400 });
  }

  const ok = await savePrefs(u.userKey, patch);
  return ok ? Response.json({ ok: true }) : Response.json({ ok: false, reason: 'บันทึกไม่สำเร็จ ลองใหม่' }, { status: 502 });
}

// นำเข้าพอร์ตจาก Google Sheet ของผู้ใช้ (CR-WPN-008 เฟส 3 · ใช้ Google token เดิมจาก F009)
// POST { url, commit? } — commit ไม่ใส่/false = พรีวิว (นับ+errors) · true = บันทึกลง Supabase
import { auth } from '@/auth.ts';
import { getGoogleAccessToken } from '@/lib/googleLink.ts';
import { parseSheetRef, readSheetValues } from '@/lib/sheetsRead.ts';
import { importSheetRows } from '@/lib/import.ts';
import { draftToDisplayAsset } from '@/lib/asset.ts';
import { insertHolding, userKeyFromSession, supabaseConfigured } from '@/lib/supabase.ts';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  let body: { url?: string; commit?: boolean };
  try { body = (await req.json()) as typeof body; } catch { return new Response('bad request', { status: 400 }); }

  const ref = parseSheetRef(body.url ?? '');
  if (!ref) return Response.json({ ok: false, reason: 'ลิงก์ Google Sheet ไม่ถูกต้อง' }, { status: 400 });

  const token = (session.provider === 'google' ? session.accessToken : undefined)
    ?? (session.lineUserId ? await getGoogleAccessToken(session.lineUserId) : null);
  if (!token) {
    return Response.json({ ok: false, reason: 'ยังไม่มีสิทธิ์ Google — เข้าสู่ระบบด้วย Google หรือเชื่อม Google ก่อน', needLink: true }, { status: 403 });
  }

  let values: string[][];
  try {
    values = await readSheetValues(token, ref.id, ref.gid);
  } catch (e) {
    console.error('[import/sheet] read error:', String(e));
    return Response.json({ ok: false, reason: 'อ่านชีตไม่สำเร็จ — ตรวจสิทธิ์เข้าถึง/ลิงก์' }, { status: 502 });
  }
  if (values.length < 2) return Response.json({ ok: false, reason: 'ชีตว่างหรือไม่มีข้อมูล' }, { status: 422 });

  const [header, ...rows] = values;
  const result = importSheetRows(header, rows);
  if (!result.headerOk) return Response.json({ ok: false, ...result }, { status: 422 });

  // พรีวิว
  if (!body.commit) {
    return Response.json({
      ok: true, preview: true, count: result.imported.length, errorCount: result.errors.length,
      errors: result.errors.slice(0, 20),
      sample: result.imported.slice(0, 6).map((d) => ({ name: d.name, type: d.type, quantity: d.quantity })),
    });
  }

  // บันทึกจริง
  const userKey = userKeyFromSession(session);
  if (!userKey || !supabaseConfigured()) return Response.json({ ok: false, reason: 'ยังไม่เชื่อมฐานข้อมูล (Supabase)' }, { status: 503 });
  let inserted = 0;
  const errors = [...result.errors];
  for (const d of result.imported) {
    try {
      await insertHolding(userKey, { ...draftToDisplayAsset(d), source: 'import' });
      inserted++;
    } catch (e) {
      console.error('[import/sheet] insert error:', String(e));
      errors.push({ row: 0, message: `บันทึก "${d.name}" ไม่สำเร็จ` });
    }
  }
  return Response.json({ ok: true, inserted, errorCount: errors.length, errors: errors.slice(0, 20) });
}

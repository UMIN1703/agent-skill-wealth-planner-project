// ยืนยันสลิป → อัปรูปขึ้น Google Drive ผู้ใช้ + append แถว Sheets (F009 AC-03/AC-04/AC-05)
// ต้องมี session + Google access_token (scope drive.file+spreadsheets) · รูปอ่านจาก staging (R2)
// ยังไม่ wire creds/staging (Class B) → ตอบ 503 ตรง ๆ ไม่แกล้งบันทึก
import { auth } from '@/auth.ts';
import { validateSlipEntry, slipToSheetRow, type SlipDraft } from '@/lib/slip.ts';
import { getStagedSlipMedia, removePendingSlip } from '@/lib/slipStore.ts';
import { saveConfirmedSlip } from '@/lib/driveSync.ts';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  // AC-05 — ต้องเชื่อม Google (มี token scope Drive) ก่อนจึงเขียนไฟล์/แถวได้
  const token = session.accessToken;
  if (!token) {
    return Response.json(
      { ok: false, reason: 'ต้องเชื่อมบัญชี Google (สิทธิ์ Drive) ก่อนบันทึก' },
      { status: 403 },
    );
  }

  let payload: { id?: string; sourceMessageId?: string; draft?: SlipDraft };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return new Response('bad request', { status: 400 });
  }
  if (!payload.id || !payload.draft) {
    return Response.json({ ok: false, reason: 'ข้อมูลไม่ครบ (id/draft)' }, { status: 400 });
  }

  const res = validateSlipEntry(payload.draft, new Date());
  if (!res.ok) return Response.json({ ok: false, errors: res.errors }, { status: 422 });

  // รูปอยู่ใน staging (R2) — ยังไม่ wire → honest 503
  const media = await getStagedSlipMedia(payload.id);
  if (!media) {
    return Response.json(
      { ok: false, reason: 'staging (Cloudflare R2) ยังไม่ถูกตั้งค่า — ยังดึงรูปสลิปมาอัปไม่ได้ (Class B)' },
      { status: 503 },
    );
  }

  const row = slipToSheetRow({
    ...res.entry,
    slipImageUrl: '', // saveConfirmedSlip จะเติม URL จริงหลังอัป
    sourceMessageId: payload.sourceMessageId ?? payload.id,
    confirmedAt: new Date().toISOString(),
  });

  try {
    const saved = await saveConfirmedSlip(token, {
      media: media.bytes,
      mediaType: media.mediaType,
      filename: `slip-${payload.id}.jpg`,
      row,
    });
    await removePendingSlip(payload.id); // AC-03 — นำออกจากกล่องรอยืนยัน
    return Response.json({ ok: true, ...saved });
  } catch (e) {
    // AC-E04 — เขียน Drive/Sheets ไม่สำเร็จ → ไม่ลบ staging, แจ้ง error ให้ลองใหม่
    return Response.json({ ok: false, reason: 'บันทึกขึ้น Google ไม่สำเร็จ ลองใหม่', detail: String(e) }, { status: 502 });
  }
}

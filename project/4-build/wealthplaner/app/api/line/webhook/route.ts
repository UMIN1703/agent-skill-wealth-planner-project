// LINE Messaging API webhook (F009, CR-WPN-002) — รับสลิปที่ผู้ใช้ส่งเข้า LINE OA
// ตรวจ x-line-signature (AC-E02) → รับเฉพาะรูป (AC-01/E01) → เก็บเข้า staging (Class B)
// โครงนี้ "ตรวจลายเซ็น + แยกประเภท event" ทำงานจริงและเทสต์ได้ · ส่วนดาวน์โหลดรูป/
// เขียน staging/reply = Class B (ต้องมี channel token + KV/R2) ยังเป็น TODO ไม่แกล้งสำเร็จ
import { verifyLineSignature, isSupportedSlipMessage } from '@/lib/slip.ts';

export const runtime = 'edge';

type LineEvent = {
  type: string;
  message?: { type: string; id: string };
  source?: { userId?: string };
};

export function GET() {
  return Response.json({
    ok: true,
    service: 'line-webhook',
    configured: !!process.env.LINE_CHANNEL_SECRET, // false จนกว่าจะตั้ง creds (Class B)
  });
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.LINE_CHANNEL_SECRET ?? '';
  const raw = await req.text();
  const signature = req.headers.get('x-line-signature');

  // ยังไม่ตั้ง channel secret (ยังไม่ wire Class B) → 503 ตรง ๆ ไม่แกล้งรับสลิป
  if (!secret) {
    return Response.json(
      { ok: false, reason: 'LINE Messaging channel ยังไม่ถูกตั้งค่า (Class B)' },
      { status: 503 },
    );
  }

  // AC-E02 — ลายเซ็นไม่ตรง/ไม่มี → ปฏิเสธ กัน webhook ปลอม
  if (!(await verifyLineSignature(secret, raw, signature))) {
    return new Response('invalid signature', { status: 401 });
  }

  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(raw) as { events?: LineEvent[] };
  } catch {
    return new Response('bad request', { status: 400 });
  }

  for (const event of payload.events ?? []) {
    if (isSupportedSlipMessage(event)) {
      // TODO(F009 Class B): ดาวน์โหลดรูปจาก LINE (GET /v2/bot/message/{id}/content ด้วย channel token)
      //   → เก็บไฟล์ลง R2 + index ลง KV ผูกกับ event.source.userId
      //   → reply ผู้ใช้ว่ารับแล้ว พร้อมลิงก์ /slips
      void event;
    } else {
      // AC-E01 — ไม่ใช่รูป → เมื่อ wire reply API ให้ตอบว่ารองรับเฉพาะรูปสลิป
    }
  }

  // LINE ต้องได้ 200 เร็ว ไม่งั้น retry
  return new Response('ok', { status: 200 });
}

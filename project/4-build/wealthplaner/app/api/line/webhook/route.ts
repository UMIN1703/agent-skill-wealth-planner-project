// LINE Messaging API webhook (F009, CR-WPN-002)
// ตรวจ x-line-signature (AC-E02) → รูป: ดาวน์โหลด → เก็บ staging (R2/KV) → reply ลิงก์ claim (AC-01)
//                                 ไม่ใช่รูป: reply ว่ารองรับเฉพาะสลิป (AC-E01)
// ต้องมี LINE_CHANNEL_SECRET (ตรวจลายเซ็น) + LINE_CHANNEL_ACCESS_TOKEN (download/reply)
// + binding KV/R2 (staging) — ขาดอย่างใดอย่างหนึ่ง = ตอบตรงไปตรงมา ไม่แกล้งสำเร็จ
import { verifyLineSignature, isSupportedSlipMessage } from '@/lib/slip.ts';
import { getVar } from '@/lib/cfEnv.ts';
import { stageSlip, stagingConfigured } from '@/lib/slipStore.ts';
import { downloadLineContent, replyLineText } from '@/lib/lineApi.ts';
import { signClaim } from '@/lib/claim.ts';

export const runtime = 'edge';

type LineEvent = {
  type: string;
  replyToken?: string;
  message?: { type: string; id: string };
  source?: { userId?: string };
};

export function GET() {
  return Response.json({
    ok: true,
    service: 'line-webhook',
    configured: !!getVar('LINE_CHANNEL_SECRET'),
    staging: stagingConfigured(),
    canReply: !!getVar('LINE_CHANNEL_ACCESS_TOKEN'),
  });
}

export async function POST(req: Request): Promise<Response> {
  const secret = getVar('LINE_CHANNEL_SECRET') ?? '';
  const raw = await req.text();
  const signature = req.headers.get('x-line-signature');

  if (!secret) {
    return Response.json({ ok: false, reason: 'LINE Messaging channel ยังไม่ถูกตั้งค่า (Class B)' }, { status: 503 });
  }
  if (!(await verifyLineSignature(secret, raw, signature))) {
    return new Response('invalid signature', { status: 401 }); // AC-E02
  }

  let payload: { events?: LineEvent[] };
  try {
    payload = JSON.parse(raw) as { events?: LineEvent[] };
  } catch {
    return new Response('bad request', { status: 400 });
  }

  const token = getVar('LINE_CHANNEL_ACCESS_TOKEN');
  // ลิงก์ claim ใช้ฐาน AUTH_URL เพื่อให้ login ทำงานเมื่อเปิดบนเว็บ (webhook ถูกเรียกผ่านโดเมนสาธารณะ)
  const base = process.env.AUTH_URL ?? new URL(req.url).origin;

  for (const event of payload.events ?? []) {
    try {
      if (isSupportedSlipMessage(event)) {
        const userId = event.source?.userId;
        const messageId = event.message!.id;
        if (!token || !userId) continue; // ไม่มี token/userId → ข้าม

        const { bytes, mediaType } = await downloadLineContent(token, messageId);
        const id = await stageSlip({ lineUserId: userId, messageId, bytes, mediaType });
        if (event.replyToken) {
          const claim = id ? await signClaim({ u: userId, id }) : null;
          await replyLineText(token, event.replyToken,
            claim ? `รับสลิปแล้ว ✅ เปิดลิงก์นี้เพื่อยืนยันและบันทึก:\n${base}/slips?claim=${claim}`
                  : 'รับสลิปแล้ว แต่ระบบจัดเก็บยังไม่พร้อม (staging) โปรดลองใหม่ภายหลัง');
        }
      } else if (event.type === 'message' && token && event.replyToken) {
        await replyLineText(token, event.replyToken, 'ส่งเป็น "รูปสลิป" เท่านั้นนะ เพื่อบันทึกเข้าระบบ 📸'); // AC-E01
      }
    } catch (e) {
      // ไม่ throw — ตอบ 200 ให้ LINE เสมอ กัน retry รัว
      console.error('[line-webhook] error:', String(e));
    }
  }

  return new Response('ok', { status: 200 }); // LINE ต้องได้ 200 เร็ว
}

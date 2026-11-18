// LINE Messaging API webhook (F009, CR-WPN-002)
// ตรวจ x-line-signature (AC-E02) → รูป: ดาวน์โหลด → เก็บ staging (R2/KV) → reply ลิงก์ claim (AC-01)
//                                 ไม่ใช่รูป: reply ว่ารองรับเฉพาะสลิป (AC-E01)
// ต้องมี LINE_CHANNEL_SECRET (ตรวจลายเซ็น) + LINE_CHANNEL_ACCESS_TOKEN (download/reply)
// + binding KV/R2 (staging) — ขาดอย่างใดอย่างหนึ่ง = ตอบตรงไปตรงมา ไม่แกล้งสำเร็จ
import { verifyLineSignature, isSupportedSlipMessage } from '@/lib/slip.ts';
import { getVar } from '@/lib/cfEnv.ts';
import { stageSlip, stagingConfigured } from '@/lib/slipStore.ts';
import { downloadLineContent, replyLineText, replyLineButtons } from '@/lib/lineApi.ts';
import { signClaim } from '@/lib/claim.ts';
import { getPendingHolding, removePendingHolding } from '@/lib/holdStage.ts';
import { insertHolding } from '@/lib/supabase.ts';
import { draftToDisplayAsset } from '@/lib/asset.ts';
import { holdingSummary } from '@/lib/portfolio.ts';

export const runtime = 'edge';

type LineEvent = {
  type: string;
  replyToken?: string;
  message?: { type: string; id: string };
  source?: { userId?: string };
  postback?: { data: string };
};

// postback จากการ์ดคอนเฟิร์ม (CR-WPN-007): holdok:<id> = บันทึก, holdno:<id> = ยกเลิก
async function handleHoldingPostback(token: string, event: LineEvent, base: string): Promise<void> {
  const data = event.postback?.data ?? '';
  const m = /^(holdok|holdno):(.+)$/.exec(data);
  if (!m || !event.replyToken) return;
  const [, action, id] = m;

  const pending = await getPendingHolding(id);
  if (!pending || pending.msgUser !== event.source?.userId) {
    await replyLineText(token, event.replyToken, 'รายการหมดอายุหรือไม่พบแล้ว ลองส่งสลิปใหม่อีกครั้งนะ');
    return;
  }

  if (action === 'holdno') {
    await removePendingHolding(id);
    await replyLineText(token, event.replyToken, 'ยกเลิกแล้ว ❌ ไม่ได้บันทึกเข้าพอร์ต');
    return;
  }

  // holdok → บันทึกจริงลง Supabase แล้วตอบการ์ดสำเร็จ
  const asset = draftToDisplayAsset(pending.draft);
  await insertHolding(pending.userKey, { ...asset, source: 'slip' });
  await removePendingHolding(id);
  await replyLineButtons(token, event.replyToken,
    `✅ บันทึกเข้าพอร์ตสำเร็จ\n${holdingSummary(asset)}`,
    [{ label: '📊 ดูพอร์ต', uri: `${base}/` }], 'บันทึกเข้าพอร์ตสำเร็จ');
}

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
          if (claim) {
            // จังหวะ 1 — ตอบทันที: "ได้รับสลิป" + ปุ่มบันทึก/ดูพอร์ต (สรุปยอดจริงไป push จังหวะ 2 ตอนยืนยัน)
            await replyLineButtons(token, event.replyToken,
              'ได้รับสลิปแล้ว ✅\nแตะ "บันทึกสลิป" เพื่อตรวจยอดและบันทึกเข้าระบบ', [
                { label: '📝 บันทึกสลิป', uri: `${base}/slips?claim=${claim}` },
                { label: '📊 ดูพอร์ต', uri: `${base}/` },
              ]);
          } else {
            await replyLineText(token, event.replyToken,
              'รับสลิปแล้ว แต่ระบบจัดเก็บยังไม่พร้อม (staging) โปรดลองใหม่ภายหลัง');
          }
        }
      } else if (event.type === 'postback' && token) {
        await handleHoldingPostback(token, event, base); // การ์ดคอนเฟิร์ม/ยกเลิก (CR-WPN-007)
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

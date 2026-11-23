// ยืนยันสลิป → บันทึกเข้าพอร์ต (Supabase) โดยตรง · ไม่ต้องเชื่อม Google (CR-WPN-010 · option B)
// Google Sheet เป็น "ส่งออกภายหลัง" แยกต่างหาก (/api/export/sheet) — การบันทึกสลิปไม่พึ่ง Google อีกต่อไป
import { auth } from '@/auth.ts';
import { validateSlipEntry, type SlipDraft } from '@/lib/slip.ts';
import { validateAssetDraft, draftToDisplayAsset, type AssetDraft, type AssetType } from '@/lib/asset.ts';
import { removePendingSlip } from '@/lib/slipStore.ts';
import { verifyClaim } from '@/lib/claim.ts';
import { getVar } from '@/lib/cfEnv.ts';
import { pushLineButtons } from '@/lib/lineApi.ts';
import { userKeyFromSession, supabaseConfigured, insertHolding } from '@/lib/supabase.ts';
import { holdingSummary } from '@/lib/portfolio.ts';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  let payload: {
    id?: string; draft?: SlipDraft; claim?: string;
    portfolio?: { name: string; quantity: number; currentPrice?: number | null };
  };
  try { payload = (await req.json()) as typeof payload; } catch { return new Response('bad request', { status: 400 }); }
  if (!payload.draft) return Response.json({ ok: false, reason: 'ข้อมูลไม่ครบ (draft)' }, { status: 400 });

  const res = validateSlipEntry(payload.draft, new Date());
  if (!res.ok) return Response.json({ ok: false, errors: res.errors }, { status: 422 });

  // ต้องมีชื่อ + จำนวนหน่วย จึงบันทึกเป็นสินทรัพย์ในพอร์ตได้
  const p = payload.portfolio;
  if (!p || !p.name?.trim() || !(p.quantity > 0)) {
    return Response.json({ ok: false, reason: 'กรอกชื่อสินทรัพย์และจำนวนหน่วยเพื่อบันทึกเข้าพอร์ต' }, { status: 422 });
  }
  const userKey = userKeyFromSession(session);
  if (!userKey || !supabaseConfigured()) {
    return Response.json({ ok: false, reason: 'ยังไม่เชื่อมฐานข้อมูล (Supabase)' }, { status: 503 });
  }

  const assetDraft: AssetDraft = {
    name: p.name.trim(),
    type: (payload.draft.assetType ?? '') as AssetType | '',
    quantity: p.quantity,
    costPrice: p.quantity > 0 ? Math.round((res.entry.amountTHB / p.quantity) * 100) / 100 : 0,
    currentPrice: p.currentPrice ?? null,
    category: '', taxBucket: '',
    brokerChannel: (payload.draft.channel ?? '').trim() || 'manual',
    note: (payload.draft.note ?? '').trim(),
  };
  const v = validateAssetDraft(assetDraft);
  if (!v.ok) return Response.json({ ok: false, errors: v.errors }, { status: 422 });

  try {
    const asset = draftToDisplayAsset(assetDraft);
    await insertHolding(userKey, { ...asset, source: 'slip' });

    // นำสลิปออกจากคิวรอยืนยัน (จาก claim หรือ session)
    const claim = await verifyClaim(payload.claim);
    const ownerUserId = claim?.u ?? session.lineUserId;
    const slipId = claim?.id ?? payload.id;
    if (ownerUserId && slipId) await removePendingSlip(ownerUserId, slipId);

    // แจ้งกลับทาง LINE (ถ้ามาจาก claim) — ไม่กระทบการบันทึกถ้า push ล้ม
    const lineToken = getVar('LINE_CHANNEL_ACCESS_TOKEN');
    if (claim?.u && lineToken) {
      const base = process.env.AUTH_URL ?? new URL(req.url).origin;
      try {
        await pushLineButtons(lineToken, claim.u,
          `✅ บันทึกเข้าพอร์ตแล้ว\n${holdingSummary(asset)}`,
          [{ label: '📊 ดูพอร์ต', uri: `${base}/` }], 'บันทึกเข้าพอร์ตแล้ว');
      } catch (e) { console.error('[slips/confirm] LINE push error:', String(e)); }
    }

    return Response.json({ ok: true, addedToPortfolio: true });
  } catch (e) {
    console.error('[slips/confirm] save error:', String(e));
    return Response.json({ ok: false, reason: 'บันทึกเข้าพอร์ตไม่สำเร็จ ลองใหม่' }, { status: 502 });
  }
}

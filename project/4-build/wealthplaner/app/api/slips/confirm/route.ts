// ยืนยันสลิป → append แถวลง Google Sheets ของผู้ใช้ (F009 AC-03/AC-04/AC-05 · CR-WPN-003)
// ไม่อัปรูปขึ้น Drive (ประหยัดพื้นที่) — รูปคงไว้ที่ R2, ใส่ "ลิงก์รูป" (=HYPERLINK) ในแถวแทน
// ต้องมี session + Google access_token (scope spreadsheets/drive.file)
import { auth } from '@/auth.ts';
import { validateSlipEntry, slipToSheetRow, type SlipDraft } from '@/lib/slip.ts';
import { validateAssetDraft, draftToDisplayAsset, type AssetDraft, type AssetType } from '@/lib/asset.ts';
import { getStagedSlipMedia, removePendingSlip } from '@/lib/slipStore.ts';
import { saveSlipRow } from '@/lib/driveSync.ts';
import { getGoogleAccessToken } from '@/lib/googleLink.ts';
import { verifyClaim, signClaim } from '@/lib/claim.ts';
import { getVar } from '@/lib/cfEnv.ts';
import { pushLineButtons } from '@/lib/lineApi.ts';
import { userKeyFromSession, supabaseConfigured, insertHolding } from '@/lib/supabase.ts';
import { holdingSummary } from '@/lib/portfolio.ts';

export const runtime = 'edge';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) return Response.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  let payload: {
    id?: string; sourceMessageId?: string; draft?: SlipDraft; claim?: string;
    portfolio?: { name: string; quantity: number; currentPrice?: number | null }; // ถ้ากรอก → เพิ่มเข้าพอร์ตด้วย
  };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return new Response('bad request', { status: 400 });
  }
  if (!payload.draft) {
    return Response.json({ ok: false, reason: 'ข้อมูลไม่ครบ (draft)' }, { status: 400 });
  }

  // หาเจ้าของสลิป: จาก claim token (option B) หรือจาก LINE session (เดิม)
  const claim = await verifyClaim(payload.claim);
  const ownerUserId = claim?.u ?? session.lineUserId;
  const slipId = claim?.id ?? payload.id;
  if (!ownerUserId || !slipId) {
    return Response.json({ ok: false, reason: 'ระบุสลิปไม่ได้ (ต้องมาจากลิงก์ claim หรือล็อกอิน LINE)' }, { status: 409 });
  }

  // AC-05 — Google token: ใช้ session.accessToken เฉพาะเมื่อ login ด้วย Google เท่านั้น
  // (login LINE ก็มี accessToken แต่เป็นของ LINE ใช้กับ Drive ไม่ได้) → ไม่งั้นดึงจาก KV link
  const token = (session.provider === 'google' ? session.accessToken : undefined)
    ?? (session.lineUserId ? await getGoogleAccessToken(session.lineUserId) : null);
  if (!token) {
    return Response.json(
      { ok: false, reason: 'ยังไม่มีสิทธิ์ Google — เข้าสู่ระบบด้วย Google หรือกด "เชื่อม Google Drive" ก่อน', needLink: true },
      { status: 403 },
    );
  }

  const res = validateSlipEntry(payload.draft, new Date());
  if (!res.ok) return Response.json({ ok: false, errors: res.errors }, { status: 422 });

  const media = await getStagedSlipMedia(ownerUserId, slipId);
  if (!media) {
    return Response.json({ ok: false, reason: 'ไม่พบรูปสลิปใน staging (หมดอายุ/ถูกลบ หรือ KV/R2 ยังไม่ตั้งค่า)' }, { status: 404 });
  }

  // ลิงก์รูป: ชี้ไปที่ route รูปของแอป (เสิร์ฟจาก R2) ด้วย token เซ็น (เปิดได้โดยไม่ต้อง login)
  const base = process.env.AUTH_URL ?? new URL(req.url).origin;
  const imageToken = await signClaim({ u: ownerUserId, id: slipId }, 10 * 365 * 24 * 3600); // อายุยาว (ลิงก์ในชีตใช้ได้ตลอด)
  const imageUrl = `${base}/api/slips/image/${encodeURIComponent(slipId)}?t=${imageToken}`;

  const row = slipToSheetRow({
    ...res.entry,
    slipImageUrl: `=HYPERLINK("${imageUrl}","ดูรูปสลิป")`, // ลิงก์รูปในเซลล์ (ไม่อัปไฟล์ขึ้น Drive)
    sourceMessageId: slipId,
    confirmedAt: new Date().toISOString(),
  });

  try {
    const saved = await saveSlipRow(token, row);
    await removePendingSlip(ownerUserId, slipId); // นำออกจากคิวรอยืนยัน (คงรูปใน R2 ให้ลิงก์ใช้ได้)

    const lineToken = getVar('LINE_CHANNEL_ACCESS_TOKEN');
    let addedToPortfolio = false;

    // (CR-WPN-007 rev2) ถ้ากรอกส่วนพอร์ต → บันทึกเข้า Supabase "ทันที" (ไม่ต้องกดคอนเฟิร์มใน LINE)
    // แล้ว push การ์ด "สำเร็จ + ปุ่มดูพอร์ต" ไว้แจ้งเฉย ๆ · การบันทึกไม่พึ่ง LINE (ใช้ userKey จาก session)
    const p = payload.portfolio;
    const userKey = userKeyFromSession(session);
    if (p && userKey && supabaseConfigured()) {
      const assetDraft: AssetDraft = {
        name: p.name,
        type: (payload.draft.assetType ?? '') as AssetType | '',
        quantity: p.quantity,
        costPrice: p.quantity > 0 ? Math.round((res.entry.amountTHB / p.quantity) * 100) / 100 : 0,
        currentPrice: p.currentPrice ?? null,
        category: '', // อัตโนมัติตามประเภท
        taxBucket: '',
        brokerChannel: (payload.draft.channel ?? '').trim() || 'manual',
        note: (payload.draft.note ?? '').trim(),
      };
      if (validateAssetDraft(assetDraft).ok) {
        try {
          const asset = draftToDisplayAsset(assetDraft);
          await insertHolding(userKey, { ...asset, source: 'slip' });
          addedToPortfolio = true;
          if (claim?.u && lineToken) {
            try {
              await pushLineButtons(lineToken, claim.u,
                `✅ บันทึกเข้าพอร์ตแล้ว\n${holdingSummary(asset)}`,
                [{ label: '📊 ดูพอร์ต', uri: `${base}/` }], 'บันทึกเข้าพอร์ตแล้ว');
            } catch (e) {
              console.error('[slips/confirm] LINE push error:', String(e));
            }
          }
        } catch (e) {
          console.error('[slips/confirm] insert holding error:', String(e));
        }
      }
    }

    // ไม่ได้เพิ่มพอร์ต → จังหวะ 2 เดิม (CR-WPN-005): แจ้งบันทึกรายการลงชีต + ปุ่มดูพอร์ต/ดูชีต
    if (!addedToPortfolio && claim?.u && lineToken) {
      try {
        const amt = Number(row[4]).toLocaleString('th-TH'); // row = [date,catLabel,assetType,channel,amount,...]
        const detail = [row[1], row[2], row[3]].filter(Boolean).join(' · ');
        await pushLineButtons(lineToken, claim.u,
          `✅ บันทึกรายการแล้ว ฿${amt}\n${detail}`, [
            { label: '📊 ดูพอร์ต', uri: `${base}/` },
            { label: '📄 ดูชีต', uri: `https://docs.google.com/spreadsheets/d/${saved.spreadsheetId}/edit` },
          ]);
      } catch (e) {
        console.error('[slips/confirm] LINE push error:', String(e)); // push ล้มไม่กระทบการบันทึก
      }
    }

    return Response.json({ ok: true, ...saved, addedToPortfolio });
  } catch (e) {
    // AC-E04 — เขียน Drive/Sheets ไม่สำเร็จ → ไม่ลบ staging, แจ้ง error ให้ลองใหม่
    console.error('[slips/confirm] save error:', String(e));
    return Response.json({ ok: false, reason: 'บันทึกขึ้น Google ไม่สำเร็จ ลองใหม่' }, { status: 502 });
  }
}

// สตรีมรูปสลิปจาก R2 (F009 · CR-WPN-003)
// เจ้าของรูป: จาก token เซ็น (?t= หรือ ?claim=) → เปิดได้โดยไม่ต้อง login (สำหรับลิงก์ในชีต)
//             ไม่มี token → ใช้ session.lineUserId (ดูในหน้า /slips)
import { auth } from '@/auth.ts';
import { getStagedSlipMedia } from '@/lib/slipStore.ts';
import { verifyClaim } from '@/lib/claim.ts';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  const url = new URL(req.url);
  const claim = await verifyClaim(url.searchParams.get('t') ?? url.searchParams.get('claim'));

  let owner: string | undefined;
  if (claim && claim.id === params.id) {
    owner = claim.u; // token เป็นสิทธิ์ในตัว → ไม่ต้อง login (ลิงก์ในชีตเปิดได้)
  } else {
    const session = await auth();
    if (!session?.user) return new Response('unauthorized', { status: 401 });
    owner = session.lineUserId;
  }
  if (!owner) return new Response('forbidden', { status: 403 });

  const media = await getStagedSlipMedia(owner, params.id);
  if (!media) return new Response('not found', { status: 404 });

  return new Response(media.bytes, {
    headers: { 'Content-Type': media.mediaType, 'Cache-Control': 'private, max-age=3600' },
  });
}

// สตรีมรูปสลิปจาก R2 สำหรับพรีวิวในหน้า /slips (F009)
// เจ้าของสลิป: จาก claim token (?claim=) หรือจาก session.lineUserId (เดิม) · ต้อง login
import { auth } from '@/auth.ts';
import { getStagedSlipMedia } from '@/lib/slipStore.ts';
import { verifyClaim } from '@/lib/claim.ts';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<Response> {
  const session = await auth();
  if (!session?.user) return new Response('unauthorized', { status: 401 });

  const claim = await verifyClaim(new URL(req.url).searchParams.get('claim'));
  const owner = claim && claim.id === params.id ? claim.u : session.lineUserId;
  if (!owner) return new Response('forbidden', { status: 403 });

  const media = await getStagedSlipMedia(owner, params.id);
  if (!media) return new Response('not found', { status: 404 });

  return new Response(media.bytes, {
    headers: { 'Content-Type': media.mediaType, 'Cache-Control': 'private, no-store' },
  });
}

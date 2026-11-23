// Google OAuth callback (F009 account linking) — รับ code → แลก token → เก็บผูกกับ lineUserId
import { exchangeCodeForTokens, saveGoogleLink, consumeState } from '@/lib/googleLink.ts';

export const runtime = 'edge';

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const back = (status: string) => new Response(null, { status: 302, headers: { Location: `${url.origin}/profile/drive?link=${status}` } });

  if (url.searchParams.get('error')) return back('denied'); // ผู้ใช้กดยกเลิก consent
  if (!code || !state) return back('error');

  const lineUserId = await consumeState(state); // ตรวจ state + ได้ lineUserId คืน
  if (!lineUserId) return back('badstate');

  try {
    // redirect_uri ต้องตรงกับตอน authorize เป๊ะ → ใช้ AUTH_URL เหมือนกัน
    const base = process.env.AUTH_URL ?? url.origin;
    const tokens = await exchangeCodeForTokens(code, `${base}/api/google/callback`);
    await saveGoogleLink(lineUserId, tokens);
    return back('ok');
  } catch {
    return back('fail');
  }
}

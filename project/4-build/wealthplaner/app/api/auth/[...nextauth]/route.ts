// NextAuth route handler (F008) — รับทุก endpoint ของ auth
// เช่น /api/auth/signin, /api/auth/callback/google, /api/auth/session, /api/auth/signout
import { handlers } from '@/auth.ts';

export const runtime = 'edge'; // Cloudflare Pages (next-on-pages) — route แบบ dynamic ต้องรันบน edge
export const { GET, POST } = handlers;

// SessionProvider ครอบทั้งแอป (F008) — ให้ useSession()/ปุ่ม logout ทำงานทุกหน้า
'use client';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

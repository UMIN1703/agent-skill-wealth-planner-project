// หน้าตั้งค่า → การแจ้งเตือน
// สวิตช์เปิด/ปิดเก็บ localStorage · ช่องทางส่งคือ LINE (ต้องเชื่อม LINE)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth.ts';
import NotificationSettings from '@/components/NotificationSettings.tsx';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile/notifications');

  const lineConnected = session.provider === 'line' || !!session.lineUserId;

  return (
    <main className="app">
      <div className="topbar">
        <Link href="/profile" aria-label="กลับ" className="icon-btn">
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ flex: 1 }}>การแจ้งเตือน</h1>
      </div>
      <NotificationSettings lineConnected={lineConnected} />
    </main>
  );
}

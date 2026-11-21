// หน้าตั้งค่า → ความเป็นส่วนตัว
// ซ่อนจำนวนเงิน (มีผลจริงกับหน้าพอร์ต) + ล้างข้อมูลในเครื่อง + บอกว่าข้อมูลเก็บที่ไหน
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth.ts';
import PrivacySettings from '@/components/PrivacySettings.tsx';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function PrivacyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile/privacy');

  return (
    <main className="app">
      <div className="topbar">
        <Link href="/profile" aria-label="กลับ" className="btn-ghost" style={{ padding: 8, borderRadius: 999 }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ flex: 1 }}>ความเป็นส่วนตัว</h1>
      </div>
      <PrivacySettings />
    </main>
  );
}

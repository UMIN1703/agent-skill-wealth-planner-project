// หน้าตั้งค่า → ตั้งค่าบัญชี
// แก้ "ชื่อที่แสดง" (เก็บ localStorage, ไปโผล่หัวโปรไฟล์) + ดูข้อมูลบัญชีจาก session (อ่านอย่างเดียว)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth.ts';
import AccountSettings from '@/components/AccountSettings.tsx';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile/account');

  const defaultName = session.user.name ?? 'ผู้ใช้ WealthPlaner';
  const provider = session.provider === 'google' ? 'Google' : session.provider === 'line' ? 'LINE' : '—';
  const contact = session.user.email
    ?? (session.lineUserId ? 'LINE ID: ' + session.lineUserId.slice(0, 10) + '…' : 'ไม่ระบุ');

  return (
    <main className="app">
      <div className="topbar">
        <Link href="/profile" aria-label="กลับ" className="btn-ghost" style={{ padding: 8, borderRadius: 999 }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ flex: 1 }}>ตั้งค่าบัญชี</h1>
      </div>
      <AccountSettings defaultName={defaultName} contact={contact} provider={provider} />
    </main>
  );
}

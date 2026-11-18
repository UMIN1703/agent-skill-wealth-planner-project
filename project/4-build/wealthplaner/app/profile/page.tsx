// หน้าโปรไฟล์ (mockup) — แสดงข้อมูลผู้ใช้จาก session + รายการตั้งค่า (ยังไม่ทำงานจริง)
// ฟีเจอร์จริง (แก้โปรไฟล์/แจ้งเตือน/ความเป็นส่วนตัว) เป็นงานถัดไป — ตอนนี้เป็นภาพตัวอย่าง
import { redirect } from 'next/navigation';
import { User, Bell, Settings, Shield, Link2, ChevronRight } from 'lucide-react';
import { auth } from '@/auth.ts';
import LogoutButton from '@/components/LogoutButton.tsx';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ROWS = [
  { Icon: Settings, label: 'ตั้งค่าบัญชี' },
  { Icon: Bell, label: 'การแจ้งเตือน' },
  { Icon: Link2, label: 'เชื่อมบัญชี Google Drive' },
  { Icon: Shield, label: 'ความเป็นส่วนตัว' },
];

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile');

  const name = session.user.name ?? 'ผู้ใช้ WealthPlaner';
  const image = session.user.image ?? undefined;
  const provider = session.provider === 'google' ? 'Google' : session.provider === 'line' ? 'LINE' : '—';
  const contact = session.user.email
    ?? (session.lineUserId ? 'LINE ID: ' + session.lineUserId.slice(0, 10) + '…' : 'ไม่ระบุ');

  return (
    <main className="app">
      <div className="topbar">
        <h1>โปรไฟล์</h1>
        <LogoutButton />
      </div>

      <section className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--brand-tint)', border: '1px solid var(--brand)', color: 'var(--text)',
        }}>
          {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={34} />}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{name}</div>
          <div className="sub" style={{ fontSize: 13, opacity: 0.8, wordBreak: 'break-all' }}>{contact}</div>
          <span className="chip" style={{ fontSize: 12, marginTop: 6, display: 'inline-block', padding: '2px 10px' }}>
            เข้าสู่ระบบด้วย {provider}
          </span>
        </div>
      </section>

      <section className="card" aria-label="ตั้งค่า">
        {ROWS.map(({ Icon, label }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px',
            borderBottom: '1px solid var(--border)',
          }}>
            <Icon size={20} style={{ opacity: 0.85 }} />
            <span style={{ flex: 1 }}>{label}</span>
            <span className="sub" style={{ fontSize: 12, opacity: 0.6 }}>เร็วๆ นี้</span>
            <ChevronRight size={18} style={{ opacity: 0.4 }} />
          </div>
        ))}
      </section>

      <p className="note" style={{ textAlign: 'center' }}>หน้านี้เป็นตัวอย่าง (mockup) — ฟีเจอร์จะตามมาภายหลัง</p>
    </main>
  );
}

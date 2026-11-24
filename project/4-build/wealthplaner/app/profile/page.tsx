// หน้าโปรไฟล์ (mockup) — แสดงข้อมูลผู้ใช้จาก session + รายการตั้งค่า (ยังไม่ทำงานจริง)
// ฟีเจอร์จริง (แก้โปรไฟล์/แจ้งเตือน/ความเป็นส่วนตัว) เป็นงานถัดไป — ตอนนี้เป็นภาพตัวอย่าง
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { User, Bell, Settings, Shield, ShieldCheck, Link2, Scale, FileUp, ChevronRight } from 'lucide-react';
import { auth } from '@/auth.ts';
import { getPrefs, resolveUserKey } from '@/lib/supabase.ts';
import LogoutButton from '@/components/LogoutButton.tsx';
import DisplayName from '@/components/DisplayName.tsx';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile');

  const name = session.user.name ?? 'ผู้ใช้ WealthPlanner';
  const image = session.user.image ?? undefined;
  const contact = session.user.email
    ?? (session.lineUserId ? 'LINE ID: ' + session.lineUserId.slice(0, 10) + '…' : 'ไม่ระบุ');

  const userKey = await resolveUserKey(session);
  const prefs = userKey ? await getPrefs(userKey) : null; // ผลประเมินความเสี่ยงที่เก็บไว้ (sync ข้ามเครื่อง)

  const driveConnected = session.provider === 'google' && !!session.accessToken;
  const ROWS = [
    { Icon: Scale, label: 'ปรับสมดุลพอร์ต (Rebalance)', status: '', href: '/rebalance' },
    { Icon: FileUp, label: 'นำเข้าจาก Google Sheet', status: '', href: '/import' },
    { Icon: Settings, label: 'ตั้งค่าบัญชี', status: '', href: '/profile/account' },
    { Icon: Bell, label: 'การแจ้งเตือน', status: '', href: '/profile/notifications' },
    { Icon: Link2, label: 'เชื่อมบัญชี Google Drive', status: driveConnected ? 'เชื่อมแล้ว' : 'ยังไม่เชื่อม', href: '/profile/drive' },
    { Icon: Shield, label: 'ความเป็นส่วนตัว', status: '', href: '/profile/privacy' },
  ];

  return (
    <main className="app">
      <div className="topbar">
        <h1>โปรไฟล์</h1>
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
          <div style={{ fontSize: 18, fontWeight: 700 }}><DisplayName fallback={name} /></div>
          <div className="sub" style={{ fontSize: 13, opacity: 0.8, wordBreak: 'break-all' }}>{contact}</div>
          <LogoutButton label />
        </div>
      </section>

      <Link href="/profile/risk" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
        <span style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', background: 'var(--brand-tint)', border: '1px solid var(--brand)',
        }}>
          <ShieldCheck size={20} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 700 }}>แบบประเมินความเสี่ยง</span>
          <span className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {prefs?.risk ? `ระดับ ${prefs.risk.level}/5 · ${prefs.risk.label}` : 'ยังไม่ได้ประเมิน'}
          </span>
        </span>
        <ChevronRight size={18} style={{ opacity: 0.5, flexShrink: 0 }} />
      </Link>

      <section className="card" aria-label="ตั้งค่า">
        {ROWS.map(({ Icon, label, status, href }, i) => {
          const live = status !== 'เร็วๆ นี้';
          const inner = (
            <>
              <Icon size={20} style={{ opacity: 0.85 }} />
              <span style={{ flex: 1 }}>{label}</span>
              <span className="sub" style={{ fontSize: 12, opacity: live ? 0.85 : 0.6, color: status === 'เชื่อมแล้ว' ? 'var(--gain)' : undefined }}>{status}</span>
              <ChevronRight size={18} style={{ opacity: 0.4 }} />
            </>
          );
          const rowStyle = {
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px',
            borderBottom: i < ROWS.length - 1 ? '1px solid var(--border)' : 'none',
          } as const;
          return href
            ? <Link key={label} href={href} style={{ ...rowStyle, color: 'inherit', textDecoration: 'none' }}>{inner}</Link>
            : <div key={label} style={rowStyle}>{inner}</div>;
        })}
      </section>

      <p className="note" style={{ textAlign: 'center' }}>หน้านี้เป็นตัวอย่าง (mockup) — ฟีเจอร์จะตามมาภายหลัง</p>
    </main>
  );
}

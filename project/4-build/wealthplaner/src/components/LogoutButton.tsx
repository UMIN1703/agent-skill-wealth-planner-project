// ปุ่มออกจากระบบใน topbar (F008) — โชว์เฉพาะตอน login แล้ว
'use client';
import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton({ label }: { label?: boolean }) {
  const { status } = useSession();
  if (status !== 'authenticated') return null; // ยังไม่ login → ไม่โชว์ปุ่ม
  const onClick = () => signOut({ callbackUrl: '/login' });

  // แบบมีข้อความ (ใช้ในการ์ดโปรไฟล์)
  if (label) {
    return (
      <button type="button" className="btn-ghost" aria-label="ออกจากระบบ" onClick={onClick}
        style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '6px 14px' }}>
        <LogOut size={15} /> ออกจากระบบ
      </button>
    );
  }

  // แบบไอคอน (topbar)
  return (
    <button type="button" className="iconbtn" aria-label="ออกจากระบบ" title="ออกจากระบบ" onClick={onClick}>
      <LogOut size={17} />
    </button>
  );
}

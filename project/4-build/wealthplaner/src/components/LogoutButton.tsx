// ปุ่มออกจากระบบใน topbar (F008) — โชว์เฉพาะตอน login แล้ว
'use client';
import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const { status } = useSession();
  if (status !== 'authenticated') return null; // ยังไม่ login → ไม่โชว์ปุ่ม
  return (
    <button
      type="button"
      className="iconbtn"
      aria-label="ออกจากระบบ"
      title="ออกจากระบบ"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      <LogOut size={17} />
    </button>
  );
}

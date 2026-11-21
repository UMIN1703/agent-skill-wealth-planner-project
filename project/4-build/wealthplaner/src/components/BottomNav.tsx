'use client';

// แถบนำทางล่าง (bottom navigation) — ปลายทางหลักของแอป 5 แท็บ
// client component: ใช้ usePathname ไฮไลต์แท็บที่กำลังอยู่ · ซ่อนบนหน้า /login (ยังไม่ล็อกอิน)
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PieChart, Plus, Clock, Wallet, User, type LucideIcon } from 'lucide-react';

type Tab = { href: string; label: string; Icon: LucideIcon; accent?: boolean };

const TABS: Tab[] = [
  { href: '/', label: 'พอร์ต', Icon: PieChart },
  { href: '/assets', label: 'สินทรัพย์', Icon: Wallet },
  { href: '/add', label: 'เพิ่ม', Icon: Plus, accent: true },
  { href: '/activity', label: 'ล่าสุด', Icon: Clock },
  { href: '/profile', label: 'โปรไฟล์', Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null; // หน้า login ไม่โชว์เมนู

  return (
    <nav className="bottomnav" aria-label="เมนูหลัก">
      {TABS.map(({ href, label, Icon, accent }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={'bn-item' + (active ? ' active' : '') + (accent ? ' accent' : '')}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bn-ic" aria-hidden="true"><Icon size={20} /></span>
            <span className="bn-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

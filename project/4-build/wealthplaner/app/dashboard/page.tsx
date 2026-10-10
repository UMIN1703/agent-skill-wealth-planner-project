// แดชบอร์ด (F008) — หน้าแรกหลัง login สำเร็จ
// server component: ดึง session จาก cookie ด้วย auth() · ยังไม่ login → เด้งไป /login
// โชว์ผู้ใช้ (ชื่อ/อีเมล/รูปจาก Google) + ปุ่มออกจากระบบ + ทางลัดไปฟีเจอร์หลัก
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Plus, Upload, Scale, LogOut } from 'lucide-react';
import { auth, signOut } from '@/auth.ts';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login'); // กันเข้าถ้ายังไม่ล็อกอิน

  const user = session.user;
  const initial = (user.name ?? user.email ?? '?').trim().charAt(0).toUpperCase();

  return (
    <main className="app">
      <div className="topbar">
        <h1>แดชบอร์ด</h1>
        {/* ออกจากระบบ — server action เรียก signOut แล้วเด้งกลับ /login */}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button type="submit" className="btn-logout"><LogOut size={15} /> ออกจากระบบ</button>
        </form>
      </div>

      {/* การ์ดต้อนรับ + ข้อมูลผู้ใช้ */}
      <section className="card">
        <div className="user-card">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar" src={user.image} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="avatar avatar-fb" aria-hidden="true">{initial}</span>
          )}
          <div>
            <div className="uname">สวัสดี, {user.name ?? 'ผู้ใช้'} 👋</div>
            {user.email && <div className="uemail">{user.email}</div>}
          </div>
        </div>
      </section>

      {/* ทางลัดไปฟีเจอร์หลัก */}
      <section>
        <div className="dash-grid">
          <Link href="/" className="dash-tile">
            <span className="ic"><PieChart size={20} /></span>
            <span className="tt">พอร์ตของฉัน</span>
            <span className="ds">สรุปสินทรัพย์ + สัดส่วน</span>
          </Link>
          <Link href="/add" className="dash-tile lime">
            <span className="ic"><Plus size={20} /></span>
            <span className="tt">เพิ่มสินทรัพย์</span>
            <span className="ds">บันทึกรายการใหม่</span>
          </Link>
          <Link href="/import" className="dash-tile">
            <span className="ic"><Upload size={20} /></span>
            <span className="tt">นำเข้า</span>
            <span className="ds">วางข้อมูล CSV</span>
          </Link>
          <Link href="/rebalance" className="dash-tile">
            <span className="ic"><Scale size={20} /></span>
            <span className="tt">ปรับสมดุล</span>
            <span className="ds">เทียบเป้า allocation</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

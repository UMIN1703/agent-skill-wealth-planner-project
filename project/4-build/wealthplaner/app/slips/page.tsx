// หน้า "สลิปรอยืนยัน" (F009 AC-02/AC-03) — server component, ต้อง login
// ดึงสลิปที่รอยืนยันจาก staging (ยังว่างจนกว่าจะ wire KV/R2 = Class B)
// ?demo=1 → แสดงฟอร์มตัวอย่าง 1 ใบ เพื่อพรีวิว UI ระหว่างยังไม่ wire
import { redirect } from 'next/navigation';
import { Receipt } from 'lucide-react';
import { auth } from '@/auth.ts';
import LogoutButton from '@/components/LogoutButton.tsx';
import SlipReview from '@/components/SlipReview.tsx';
import { listPendingSlips, stagingConfigured, demoPendingSlip } from '@/lib/slipStore.ts';

export const runtime = 'edge';

export default async function SlipsPage({ searchParams }: { searchParams: { demo?: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const configured = stagingConfigured();
  const pending = await listPendingSlips(session.user.email ?? undefined);
  const demo = searchParams?.demo === '1';
  const list = pending.length > 0 ? pending : demo ? [demoPendingSlip()] : [];

  return (
    <main className="app">
      <div className="topbar">
        <h1>สลิปรอยืนยัน</h1>
        <LogoutButton />
      </div>

      {!configured && (
        <div className="notice warn" role="status">
          ยังไม่ได้เชื่อม LINE OA + Google Drive (Class B) — หน้านี้แสดงโครงงานจริงไว้ก่อน
          เมื่อผูก creds แล้ว สลิปที่ส่งเข้า LINE จะมาปรากฏที่นี่
        </div>
      )}

      {list.length === 0 ? (
        <section className="card empty-slip">
          <span className="chip"><Receipt size={22} /></span>
          <p>ยังไม่มีสลิปรอยืนยัน</p>
          <p className="sub">ส่งรูปสลิปเข้า LINE OA ของ WealthPlaner แล้วกลับมายืนยันที่นี่</p>
          <a className="inlink" href="/slips?demo=1">ดูตัวอย่างฟอร์มยืนยัน →</a>
        </section>
      ) : (
        list.map((slip) => <SlipReview key={slip.id} slip={slip} configured={configured} />)
      )}
    </main>
  );
}

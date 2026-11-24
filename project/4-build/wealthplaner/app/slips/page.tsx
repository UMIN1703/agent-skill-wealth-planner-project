// หน้า "สลิปรอยืนยัน" (F009 option B — claim link)
// เปิดผ่านลิงก์ ?claim=<token> ที่ส่งกลับทาง LINE → เห็นสลิปใบนั้นโดยไม่ต้องแมตช์ LINE userId
// บันทึกเข้าพอร์ต (Supabase) โดยตรง — ไม่ต้องเชื่อม Google (ส่งออกชีตแยกที่หน้าสินทรัพย์)
import { redirect } from 'next/navigation';
import { Receipt } from 'lucide-react';
import { auth } from '@/auth.ts';
import SlipReview from '@/components/SlipReview.tsx';
import { listPendingSlips, stagingConfigured, demoPendingSlip } from '@/lib/slipStore.ts';
import { verifyClaim } from '@/lib/claim.ts';
import type { PendingSlip } from '@/lib/slip.ts';

export const runtime = 'edge';

export default async function SlipsPage({ searchParams }: { searchParams: { demo?: string; claim?: string } }) {
  const session = await auth();
  const claimToken = searchParams?.claim;
  if (!session?.user) {
    // เก็บ claim ไว้ผ่าน login → กลับมาหน้าเดิม
    const cb = claimToken ? `/slips?claim=${encodeURIComponent(claimToken)}` : '/slips';
    redirect(`/login?callbackUrl=${encodeURIComponent(cb)}`);
  }

  const configured = stagingConfigured();
  const claim = await verifyClaim(claimToken);

  let list: PendingSlip[];
  if (claim) {
    // สลิปจากลิงก์ claim — ดึงด้วย messaging userId ที่ฝังในโทเคน (ไม่พึ่ง session userId)
    list = [{
      id: claim.id, sourceMessageId: claim.id, lineUserId: claim.u,
      imageUrl: `/api/slips/image/${encodeURIComponent(claim.id)}?claim=${encodeURIComponent(claimToken!)}`,
      receivedAt: new Date().toISOString(),
    }];
  } else {
    const pending = await listPendingSlips(session.lineUserId);
    list = pending.length > 0 ? pending : searchParams?.demo === '1' ? [demoPendingSlip()] : [];
  }

  return (
    <main className="app">
      <div className="topbar">
        <h1>สลิปรอยืนยัน</h1>
      </div>

      {list.length === 0 ? (
        <section className="card empty-slip">
          <span className="chip"><Receipt size={22} /></span>
          <p>ยังไม่มีสลิปรอยืนยัน</p>
          <p className="sub">ส่งรูปสลิปเข้า LINE OA ของ WealthPlanner แล้วกดลิงก์ที่ตอบกลับมา</p>
          <a className="inlink" href="/slips?demo=1">ดูตัวอย่างฟอร์มยืนยัน →</a>
        </section>
      ) : (
        list.map((slip) => (
          <SlipReview key={slip.id} slip={slip} configured={configured} claim={claimToken} />
        ))
      )}
    </main>
  );
}

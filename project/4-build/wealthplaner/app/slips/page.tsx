// หน้า "สลิปรอยืนยัน" (F009 option B — claim link)
// เปิดผ่านลิงก์ ?claim=<token> ที่ส่งกลับทาง LINE → เห็นสลิปใบนั้นโดยไม่ต้องแมตช์ LINE userId
// บันทึกใช้ Google token จาก session (login Google) หรือจาก KV link (login LINE+เชื่อม Google)
import { redirect } from 'next/navigation';
import { Receipt, Link2, CheckCircle2 } from 'lucide-react';
import { auth } from '@/auth.ts';
import SlipReview from '@/components/SlipReview.tsx';
import { listPendingSlips, stagingConfigured, demoPendingSlip } from '@/lib/slipStore.ts';
import { isGoogleLinked } from '@/lib/googleLink.ts';
import { verifyClaim } from '@/lib/claim.ts';
import type { PendingSlip } from '@/lib/slip.ts';

export const runtime = 'edge';

const LINK_MSG: Record<string, string> = {
  ok: 'เชื่อม Google Drive สำเร็จ ✅ บันทึกสลิปได้แล้ว',
  denied: 'ยกเลิกการเชื่อม Google',
  fail: 'เชื่อม Google ไม่สำเร็จ ลองใหม่',
  error: 'ลิงก์เชื่อม Google ไม่ถูกต้อง',
  badstate: 'เซสชันเชื่อม Google หมดอายุ ลองใหม่',
};

export default async function SlipsPage({ searchParams }: { searchParams: { demo?: string; link?: string; claim?: string } }) {
  const session = await auth();
  const claimToken = searchParams?.claim;
  if (!session?.user) {
    // เก็บ claim ไว้ผ่าน login → กลับมาหน้าเดิม
    const cb = claimToken ? `/slips?claim=${encodeURIComponent(claimToken)}` : '/slips';
    redirect(`/login?callbackUrl=${encodeURIComponent(cb)}`);
  }

  const configured = stagingConfigured();
  const claim = await verifyClaim(claimToken);
  const hasGoogle = (session.provider === 'google' && !!session.accessToken) || (await isGoogleLinked(session.lineUserId));
  const linkMsg = searchParams?.link ? LINK_MSG[searchParams.link] : undefined;

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

      {linkMsg && (
        <div className={'notice ' + (searchParams?.link === 'ok' ? 'warn' : 'error')} role="status">{linkMsg}</div>
      )}

      {/* ต้องมีสิทธิ์ Google (login Google หรือเชื่อมไว้) ถึงบันทึกได้ */}
      {!hasGoogle ? (
        <div className="notice warn" role="status">
          ต้องเชื่อมบัญชี Google ก่อน จึงบันทึกสลิปขึ้น Drive/Sheets ได้
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {session.lineUserId && (
              <a className="btn-primary" href="/api/google/connect" style={{ display: 'inline-flex', width: 'auto', padding: '8px 16px' }}>
                <Link2 size={16} /> เชื่อม Google Drive
              </a>
            )}
            <a className="inlink" href="/login">หรือเข้าสู่ระบบด้วย Google</a>
          </div>
        </div>
      ) : (
        <div className="notice" role="status" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={16} /> พร้อมบันทึกขึ้น Google Drive แล้ว
        </div>
      )}

      {list.length === 0 ? (
        <section className="card empty-slip">
          <span className="chip"><Receipt size={22} /></span>
          <p>ยังไม่มีสลิปรอยืนยัน</p>
          <p className="sub">ส่งรูปสลิปเข้า LINE OA ของ WealthPlaner แล้วกดลิงก์ที่ตอบกลับมา</p>
          <a className="inlink" href="/slips?demo=1">ดูตัวอย่างฟอร์มยืนยัน →</a>
        </section>
      ) : (
        list.map((slip) => (
          <SlipReview key={slip.id} slip={slip} configured={configured && hasGoogle} claim={claimToken} />
        ))
      )}
    </main>
  );
}

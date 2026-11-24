// หน้าตั้งค่า → เชื่อมบัญชี Google Drive (ของจริง)
// อ่านสถานะจาก session: เชื่อมแล้วเมื่อ login ด้วย Google + มี access_token (scope drive.file/spreadsheets)
// LINE user ไม่มี token Google → ชวนเชื่อมด้วย Google · หา ledger ที่มีอยู่เพื่อลิงก์เปิดไฟล์
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Check, FileSpreadsheet, FolderOpen, ShieldCheck, ExternalLink } from 'lucide-react';
import { auth } from '@/auth.ts';
import { findLedger } from '@/lib/driveSync.ts';
import { isGoogleLinked } from '@/lib/googleLink.ts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const LINK_MSG: Record<string, { text: string; ok: boolean }> = {
  ok: { text: 'เชื่อม Google สำเร็จ ✅ ส่งออก Sheet ได้แล้ว', ok: true },
  denied: { text: 'ยกเลิกการเชื่อม Google', ok: false },
  fail: { text: 'เชื่อม Google ไม่สำเร็จ ลองใหม่', ok: false },
  error: { text: 'ลิงก์เชื่อม Google ไม่ถูกต้อง', ok: false },
  badstate: { text: 'เซสชันเชื่อม Google หมดอายุ ลองใหม่', ok: false },
};

export default async function DriveSettingsPage({ searchParams }: { searchParams: { link?: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile/drive');

  const token = session.provider === 'google' ? session.accessToken : undefined;
  // เชื่อมแล้ว = login Google (มี token) หรือ login LINE + เชื่อม Google ไว้ (account-link ใน KV)
  const connected = !!token || (await isGoogleLinked(session.lineUserId));
  const email = session.user.email ?? undefined;
  const linkMsg = searchParams?.link ? LINK_MSG[searchParams.link] : undefined;

  // หา ledger ที่มีอยู่ (ถ้า token ใช้ได้) — ล้มเหลว/หมดอายุ → แค่ไม่โชว์ลิงก์ ไม่ throw ทั้งหน้า
  let ledgerId: string | null = null;
  let ledgerError = false;
  if (token) {
    try { ledgerId = await findLedger(token); }
    catch { ledgerError = true; }
  }

  return (
    <main className="app">
      <div className="topbar">
        <Link href="/profile" aria-label="กลับ" className="icon-btn">
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ flex: 1 }}>เชื่อมบัญชี Google Drive</h1>
      </div>

      {linkMsg && (
        <div className={'notice ' + (linkMsg.ok ? 'warn' : 'error')} role="status">{linkMsg.text}</div>
      )}

      {/* การ์ดสถานะ */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            background: connected ? 'color-mix(in srgb, var(--gain) 14%, transparent)' : 'var(--brand-tint)',
            border: `1px solid ${connected ? 'var(--gain)' : 'var(--brand)'}`,
            color: connected ? 'var(--gain)' : 'var(--text)',
          }}>
            {connected ? <Check size={22} /> : <FolderOpen size={22} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              {connected ? 'เชื่อมแล้ว' : 'ยังไม่ได้เชื่อม'}
            </div>
            <div className="sub" style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>
              {connected ? (email ?? 'บัญชี Google') : 'ซิงค์รายการสลิป/พอร์ตขึ้น Google Sheets ของคุณ'}
            </div>
          </div>
        </div>
      </section>

      {connected ? (
        <>
          {/* สิทธิ์ที่อนุญาต */}
          <section className="card">
            <h2>สิทธิ์ที่อนุญาต</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px' }}>
              <FileSpreadsheet size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>สร้าง/แก้ไฟล์ที่แอปสร้าง (Drive)</span>
              <Check size={16} style={{ color: 'var(--gain)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px' }}>
              <ShieldCheck size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>อ่าน/เขียน Google Sheets ของแอป</span>
              <Check size={16} style={{ color: 'var(--gain)' }} />
            </div>
          </section>

          {/* ไฟล์ ledger */}
          <section className="card">
            <h2>ไฟล์บันทึก (Ledger)</h2>
            {ledgerId ? (
              <a href={`https://docs.google.com/spreadsheets/d/${ledgerId}/edit`} target="_blank" rel="noopener noreferrer"
                 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', color: 'inherit', textDecoration: 'none' }}>
                <FileSpreadsheet size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>WealthPlanner Ledger</span>
                <ExternalLink size={16} style={{ opacity: 0.6 }} />
              </a>
            ) : (
              <p className="sub" style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 2px' }}>
                {ledgerError
                  ? 'เชื่อมต่อ Drive ไม่ได้ชั่วคราว — ลองเข้าสู่ระบบด้วย Google ใหม่'
                  : 'ยังไม่มีไฟล์ — ระบบจะสร้าง “WealthPlanner Ledger” ให้อัตโนมัติเมื่อบันทึกสลิปครั้งแรก'}
              </p>
            )}
          </section>

          <Link href="/login?callbackUrl=/profile/drive" className="btn-ghost" style={{ display: 'block', textAlign: 'center' }}>
            สลับบัญชี / เชื่อมใหม่
          </Link>
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
             className="note" style={{ display: 'block', textAlign: 'center', marginTop: 10 }}>
            จัดการสิทธิ์แอปใน Google Account ↗
          </a>
        </>
      ) : (
        <>
          <section className="card">
            <p className="sub" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
              เชื่อม Google เข้ากับบัญชีนี้ครั้งเดียว เพื่อ<b>ส่งออกรายงานเป็น Google Sheet</b> (และซิงค์ไฟล์) ·
              ทำแล้วใช้ได้ตลอดแม้เข้าสู่ระบบด้วย {session.provider === 'line' ? 'LINE' : 'บัญชีนี้'}
            </p>
          </section>
          {session.lineUserId ? (
            // login LINE → เชื่อม Google แบบ account-link (เก็บ token ผูกกับ LINE userId)
            <a href="/api/google/connect" className="btn-primary" style={{ display: 'flex', justifyContent: 'center' }}>
              <FolderOpen size={18} /> เชื่อม Google
            </a>
          ) : (
            <Link href="/login?callbackUrl=/profile/drive" className="btn-primary" style={{ display: 'flex', justifyContent: 'center' }}>
              <FolderOpen size={18} /> เข้าสู่ระบบด้วย Google
            </Link>
          )}
        </>
      )}
    </main>
  );
}

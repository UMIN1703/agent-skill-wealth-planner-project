// หน้าตั้งค่า → เชื่อมบัญชี Google Drive (ของจริง)
// อ่านสถานะจาก session: เชื่อมแล้วเมื่อ login ด้วย Google + มี access_token (scope drive.file/spreadsheets)
// LINE user ไม่มี token Google → ชวนเชื่อมด้วย Google · หา ledger ที่มีอยู่เพื่อลิงก์เปิดไฟล์
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Check, FileSpreadsheet, FolderOpen, ShieldCheck, ExternalLink } from 'lucide-react';
import { auth } from '@/auth.ts';
import { findLedger } from '@/lib/driveSync.ts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DriveSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/profile/drive');

  const token = session.provider === 'google' ? session.accessToken : undefined;
  const connected = !!token;
  const email = session.user.email ?? undefined;

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
        <Link href="/profile" aria-label="กลับ" className="btn-ghost" style={{ padding: 8, borderRadius: 999 }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ flex: 1 }}>เชื่อมบัญชี Google Drive</h1>
      </div>

      {/* การ์ดสถานะ */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            background: connected ? 'rgba(52,211,153,.14)' : 'var(--brand-tint)',
            border: `1px solid ${connected ? '#34D399' : 'var(--brand)'}`,
            color: connected ? '#34D399' : 'var(--text)',
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
              <Check size={16} style={{ color: '#34D399' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px' }}>
              <ShieldCheck size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>อ่าน/เขียน Google Sheets ของแอป</span>
              <Check size={16} style={{ color: '#34D399' }} />
            </div>
          </section>

          {/* ไฟล์ ledger */}
          <section className="card">
            <h2>ไฟล์บันทึก (Ledger)</h2>
            {ledgerId ? (
              <a href={`https://docs.google.com/spreadsheets/d/${ledgerId}/edit`} target="_blank" rel="noopener noreferrer"
                 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', color: 'inherit', textDecoration: 'none' }}>
                <FileSpreadsheet size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>WealthPlaner Ledger</span>
                <ExternalLink size={16} style={{ opacity: 0.6 }} />
              </a>
            ) : (
              <p className="sub" style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 2px' }}>
                {ledgerError
                  ? 'เชื่อมต่อ Drive ไม่ได้ชั่วคราว — ลองเข้าสู่ระบบด้วย Google ใหม่'
                  : 'ยังไม่มีไฟล์ — ระบบจะสร้าง “WealthPlaner Ledger” ให้อัตโนมัติเมื่อบันทึกสลิปครั้งแรก'}
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
              ตอนนี้คุณเข้าสู่ระบบด้วย <b>{session.provider === 'line' ? 'LINE' : 'บัญชีอื่น'}</b> ซึ่งยังเชื่อม Google Drive ไม่ได้
              — เข้าสู่ระบบด้วย Google เพื่อให้แอปซิงค์รายการขึ้น Google Sheets ของคุณได้
            </p>
          </section>
          <Link href="/login?callbackUrl=/profile/drive" className="btn-primary" style={{ display: 'flex', justifyContent: 'center' }}>
            <FolderOpen size={18} /> เชื่อมด้วย Google
          </Link>
        </>
      )}
    </main>
  );
}

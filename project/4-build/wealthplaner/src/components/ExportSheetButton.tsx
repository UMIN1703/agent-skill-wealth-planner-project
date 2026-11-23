'use client';

// ปุ่มส่งออกรายงานพอร์ตเป็น Google Sheet (CR-WPN-010) — หน้าสินทรัพย์
// กด → เช็กว่าเชื่อม Google/Drive ไว้มั้ย (API คืน needLink) → ไม่เชื่อม = เปิด modal ยืนยันเชื่อม
// สำเร็จ = โชว์ลิงก์ให้กดเอง (ไม่เปิดแท็บอัตโนมัติ เลี่ยง popup blocker)
import { useState } from 'react';
import { FileSpreadsheet, Loader2, ExternalLink, X, FolderOpen } from 'lucide-react';

export default function ExportSheetButton() {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reauth, setReauth] = useState(false);
  const [askConnect, setAskConnect] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true); setErr(null); setUrl(null); setReauth(false);
    try {
      const res = await fetch('/api/export/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; needLink?: boolean; needReauth?: boolean; reason?: string };
      if (res.ok && j.ok && j.url) setUrl(j.url);
      else if (j.needLink) setAskConnect(true);           // ยังไม่เชื่อม Google → เปิด modal
      else if (j.needReauth) { setReauth(true); setErr(j.reason ?? 'สิทธิ์ Google หมดอายุ — เข้าสู่ระบบใหม่'); }
      else setErr(res.status === 401 ? 'ต้องเข้าสู่ระบบก่อน' : (j.reason ?? 'ส่งออกไม่สำเร็จ ลองใหม่'));
    } catch { setErr('เครือข่ายขัดข้อง ลองใหม่'); }
    setBusy(false);
  }

  return (
    <>
      <button type="button" className="btn-ghost" onClick={run} disabled={busy}
        aria-label="ส่งออกเป็น Google Sheet" title="ส่งออกเป็น Google Sheet"
        style={{ padding: 8, borderRadius: 999, width: 'auto' }}>
        {busy ? <Loader2 size={18} className="spin" /> : <FileSpreadsheet size={18} />}
      </button>

      {/* modal ยืนยันเชื่อม Google Drive */}
      {askConnect && (
        <div role="dialog" aria-modal="true" aria-label="เชื่อมบัญชี Google Drive"
          onClick={() => setAskConnect(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 360, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 18, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,.5)', textAlign: 'left',
          }}>
            <span style={{
              width: 44, height: 44, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--brand-tint)', border: '1px solid var(--brand)', color: 'var(--text)',
            }}><FolderOpen size={22} /></span>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '14px 0 6px' }}>เชื่อมบัญชี Google Drive</h2>
            <p className="sub" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--muted)', margin: 0 }}>
              การส่งออกรายงานเป็น Google Sheet ต้องเชื่อม Google Drive ก่อน (ครั้งเดียว) · หลังเชื่อมแล้วใช้ได้ตลอด
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <a href="/api/google/connect" className="btn-primary" style={{ flex: 1, display: 'inline-flex', justifyContent: 'center', gap: 6 }}>
                <FolderOpen size={16} /> เชื่อม Google
              </a>
              <button type="button" className="btn-ghost" onClick={() => setAskConnect(false)} style={{ width: 'auto', padding: '10px 16px' }}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ผลลัพธ์ (ลิงก์เปิด / error) */}
      {(url || err) && (
        <div role="status" style={{
          position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: 12, maxWidth: '92vw',
          background: 'var(--surface-2)', border: '1px solid ' + (url ? 'var(--gain)' : 'var(--loss)'),
          color: 'var(--text)', fontSize: 13, fontWeight: 600, padding: '12px 16px', borderRadius: 14,
          boxShadow: '0 12px 34px rgba(0,0,0,.45)',
        }}>
          {url ? (
            <>
              <span>ส่งออกแล้ว ✓</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary"
                style={{ width: 'auto', padding: '7px 14px', display: 'inline-flex', gap: 6, whiteSpace: 'nowrap' }}>
                <ExternalLink size={15} /> เปิดรายงาน
              </a>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--loss)' }}>{err}</span>
              {reauth && (
                <a href="/login?callbackUrl=/assets" className="btn-primary" style={{ width: 'auto', padding: '7px 14px', whiteSpace: 'nowrap' }}>
                  เข้าสู่ระบบใหม่
                </a>
              )}
            </>
          )}
          <button type="button" aria-label="ปิด" onClick={() => { setUrl(null); setErr(null); setReauth(false); }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'inline-flex' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}

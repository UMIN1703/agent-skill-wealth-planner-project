'use client';

// ปุ่มส่งออกรายงานพอร์ตเป็น Google Sheet (CR-WPN-010) — หน้าสินทรัพย์
// ไม่เปิดแท็บอัตโนมัติ (โดน popup blocker บนมือถือ/LINE in-app) → โชว์ลิงก์ให้กดเอง
import { useState } from 'react';
import { FileSpreadsheet, Loader2, ExternalLink, X } from 'lucide-react';

export default function ExportSheetButton() {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true); setErr(null); setUrl(null);
    try {
      const res = await fetch('/api/export/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; needLink?: boolean; reason?: string };
      if (res.ok && j.ok && j.url) {
        setUrl(j.url);
      } else if (j.needLink) {
        if (confirm('ส่งออกเป็น Google Sheet ต้องเชื่อม Google ก่อน (ครั้งเดียว) — เชื่อมเลยมั้ย?')) {
          window.location.href = '/api/google/connect'; return;
        }
      } else {
        setErr(res.status === 401 ? 'ต้องเข้าสู่ระบบก่อน' : (j.reason ?? 'ส่งออกไม่สำเร็จ ลองใหม่'));
      }
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
          ) : <span style={{ color: 'var(--loss)' }}>{err}</span>}
          <button type="button" aria-label="ปิด" onClick={() => { setUrl(null); setErr(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'inline-flex' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}

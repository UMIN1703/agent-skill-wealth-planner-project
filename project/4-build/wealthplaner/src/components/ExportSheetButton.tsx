'use client';

// ปุ่มส่งออกรายงานพอร์ตเป็น Google Sheet (CR-WPN-010) — หน้าสินทรัพย์
// ไม่ต้องเชื่อม Google ไว้ก่อน · กดแล้วถ้ายังไม่เชื่อม จะชวนเชื่อม (needLink)
import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

export default function ExportSheetButton() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function flash(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3500);
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/export/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; needLink?: boolean; reason?: string };
      if (res.ok && j.ok && j.url) {
        window.open(j.url, '_blank', 'noopener');
        flash('ok', 'ส่งออกเป็น Google Sheet แล้ว ✓');
      } else if (j.needLink) {
        if (confirm('ส่งออกเป็น Google Sheet ต้องเชื่อม Google ก่อน (ครั้งเดียว) — เชื่อมเลยมั้ย?')) {
          window.location.href = '/api/google/connect';
          return;
        }
      } else {
        flash('err', j.reason ?? 'ส่งออกไม่สำเร็จ ลองใหม่');
      }
    } catch { flash('err', 'เครือข่ายขัดข้อง ลองใหม่'); }
    setBusy(false);
  }

  return (
    <>
      <button type="button" className="btn-ghost" onClick={run} disabled={busy}
        aria-label="ส่งออกเป็น Google Sheet" title="ส่งออกเป็น Google Sheet"
        style={{ padding: 8, borderRadius: 999, width: 'auto' }}>
        {busy ? <Loader2 size={18} className="spin" /> : <FileSpreadsheet size={18} />}
      </button>
      {toast && (
        <div role="status" style={{
          position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', zIndex: 60,
          background: 'var(--surface-2)', border: '1px solid ' + (toast.kind === 'ok' ? 'var(--gain)' : 'var(--loss)'),
          color: 'var(--text)', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 999,
          boxShadow: '0 10px 30px rgba(0,0,0,.4)', maxWidth: '90vw', textAlign: 'center',
        }}>{toast.text}</div>
      )}
    </>
  );
}

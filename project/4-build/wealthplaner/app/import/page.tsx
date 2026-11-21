'use client';

// หน้านำเข้าจากสเปรดชีต (F005) — DSN-WPN-001 §5.3 หมายเหตุ (ฟอร์ม upload)
// ต่อ importAssets จริง · นโยบาย AC-E01: รายงานแถว/คอลัมน์ที่ผิด ไม่นำเข้าเงียบบางส่วน
// รับ CSV แบบวาง (paste) — การเชื่อม Google Sheet/ไฟล์ .xlsx จริงคือชั้น integration (Class B: API/creds, O1)
// ข้อมูลอยู่ในหน่วยความจำ (mock)

import { useState } from 'react';
import { FileUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { importAssets, IMPORT_COLUMNS, type ImportResult } from '@/lib/import.ts';

const TEMPLATE = [
  IMPORT_COLUMNS.join(','),
  'PTT,หุ้นไทย,1000,34.25,SCBS',
  'AAPL,foreign_stock,30,180,IBKR',
  'ทองคำ 96.5%,ทองคำ,50,30000,manual',
  'BADROW,หุ้นไทย,-5,20,KBank',
].join('\n');

// แยก CSV อย่างง่าย (ไม่รองรับคอมมาในเครื่องหมายคำพูด) — พอสำหรับ paste ระยะ MVP
function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
  if (lines.length === 0) return { header: [], rows: [] };
  const header = lines[0].split(',').map((c) => c.trim());
  const rows = lines.slice(1).map((l) => l.split(',').map((c) => c.trim()));
  return { header, rows };
}

type SheetPreview = { count: number; errorCount: number; errors: { row: number; message: string }[]; sample: { name: string; type: string; quantity: number }[] };

export default function ImportPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetBusy, setSheetBusy] = useState(false);
  const [preview, setPreview] = useState<SheetPreview | null>(null);
  const [sheetMsg, setSheetMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  function run() {
    const { header, rows } = parseCsv(text);
    setResult(importAssets(header, rows));
  }

  // นำเข้าจาก Google Sheet จริง (CR-WPN-008 เฟส 3) — commit=false พรีวิว, true บันทึก
  async function callSheet(commit: boolean) {
    setSheetBusy(true); setSheetMsg(null);
    try {
      const r = await fetch('/api/import/sheet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl, commit }),
      });
      const d = (await r.json()) as { ok: boolean; preview?: boolean; reason?: string } & Partial<SheetPreview> & { inserted?: number };
      if (!d.ok) { setPreview(null); setSheetMsg({ kind: 'error', text: d.reason ?? 'นำเข้าไม่สำเร็จ' }); }
      else if (d.preview) { setPreview({ count: d.count ?? 0, errorCount: d.errorCount ?? 0, errors: d.errors ?? [], sample: d.sample ?? [] }); setSheetMsg({ kind: 'ok', text: `พบ ${d.count ?? 0} รายการพร้อมนำเข้า${d.errorCount ? ` · ข้าม ${d.errorCount} แถว` : ''}` }); }
      else { setPreview(null); setSheetMsg({ kind: 'ok', text: `นำเข้าสำเร็จ ${d.inserted ?? 0} รายการ${d.errorCount ? ` · ข้าม ${d.errorCount}` : ''} — ดูที่หน้าพอร์ต` }); }
    } catch { setSheetMsg({ kind: 'error', text: 'เครือข่ายขัดข้อง ลองใหม่' }); }
    finally { setSheetBusy(false); }
  }

  return (
    <main className="app">
      <div className="topbar">
        <h1>นำเข้าจากสเปรดชีต</h1>
      </div>

      {/* เฟส 3 — นำเข้าจาก Google Sheet จริง */}
      <section className="card form">
        <div className="field">
          <label htmlFor="sheet-url">นำเข้าจาก Google Sheet (วางลิงก์ชีต)</label>
          <input
            id="sheet-url" className="input" placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl} onChange={(e) => { setSheetUrl(e.target.value); setPreview(null); setSheetMsg(null); }}
          />
        </div>
        <div className="btnrow">
          <button type="button" className="btn-ghost" disabled={sheetBusy || sheetUrl.trim() === ''} onClick={() => callSheet(false)}>
            {sheetBusy && !preview ? 'กำลังอ่าน…' : 'ดูตัวอย่าง'}
          </button>
          <button type="button" className="btn-primary" disabled={sheetBusy || !preview || preview.count === 0} onClick={() => callSheet(true)}>
            <FileUp size={18} /> ยืนยันนำเข้า{preview ? ` (${preview.count})` : ''}
          </button>
        </div>
        {sheetMsg && (
          <div className={'notice ' + (sheetMsg.kind === 'error' ? 'error' : 'warn')} role="status">{sheetMsg.text}</div>
        )}
        {preview && (preview.sample.length > 0 || preview.errors.length > 0) && (
          <div className="err-block">
            {preview.sample.map((s, i) => <p className="err-row" key={i}>{s.name} · {s.type} · {s.quantity} หน่วย</p>)}
            {preview.errors.map((e, i) => <p className="err-row" key={'e' + i}><AlertTriangle size={13} /> {e.message}</p>)}
          </div>
        )}
        <p className="note-muted">ต้องเข้าสู่ระบบด้วย Google (หรือเชื่อม Google) + แชร์สิทธิ์อ่านชีต · map คอลัมน์ Category/Sub-type/Asset/Quantity/Cost/Current Value/Note/Tax Bucket</p>
      </section>

      <section className="card form">
        <div className="field">
          <label htmlFor="csv">หรือวางข้อมูล CSV (คอลัมน์: {IMPORT_COLUMNS.join(', ')})</label>
          <textarea
            id="csv" className="input area" rows={7} placeholder={'name,type,quantity,costPrice,brokerChannel\nPTT,หุ้นไทย,1000,34.25,SCBS'}
            value={text} onChange={(e) => { setText(e.target.value); setResult(null); }}
          />
        </div>
        <div className="btnrow">
          <button type="button" className="btn-ghost" onClick={() => { setText(TEMPLATE); setResult(null); }}>ใส่ตัวอย่าง</button>
          <button type="button" className="btn-primary" onClick={run} disabled={text.trim() === ''}>
            <FileUp size={18} /> ตรวจและนำเข้า
          </button>
        </div>
        <p className="note-muted">CSV paste เหมาะกับไฟล์ย่อ/ออฟไลน์ — ถ้าเป็น Google Sheet ใช้ช่อง “นำเข้าจาก Google Sheet” ด้านบนได้เลย</p>
      </section>

      {/* empty state */}
      {result === null && (
        <section className="card"><p className="empty">ยังไม่มีผลนำเข้า — วางข้อมูลแล้วกด “ตรวจและนำเข้า”</p></section>
      )}

      {/* error: header ไม่ครบ (F005 AC-E01) */}
      {result && !result.headerOk && (
        <div className="notice error" role="alert">
          หัวตารางไม่ครบ — {result.errors.map((e) => e.column).join(', ')} · ต้องมีคอลัมน์: {IMPORT_COLUMNS.join(', ')}
        </div>
      )}

      {/* has-data: ผลนำเข้า + แถวที่ผิด */}
      {result && result.headerOk && (
        <section className="card" aria-live="polite">
          <h2>ผลการนำเข้า</h2>
          <p className="ok-line"><CheckCircle2 size={16} /> นำเข้าสำเร็จ {result.imported.length} รายการ</p>
          {result.imported.map((d, i) => (
            <div className="arow" key={d.name + d.brokerChannel + i}>
              <span><span className="nm">{d.name}</span><span className="broker">{d.brokerChannel}</span></span>
              <span className="rt num">{d.quantity} × ฿{d.costPrice}</span>
            </div>
          ))}
          {result.errors.length > 0 && (
            <div className="err-block">
              <p className="err-head"><AlertTriangle size={15} /> ข้าม{result.errors.length} แถวที่ผิด (ต้องแก้ก่อนนำเข้า)</p>
              {result.errors.map((e, i) => (
                <p className="err-row" key={i}>แถว {e.row}{e.column ? ` · คอลัมน์ ${e.column}` : ''} — {e.message}</p>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

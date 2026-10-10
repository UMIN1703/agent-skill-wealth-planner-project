'use client';

// หน้านำเข้าจากสเปรดชีต (F005) — DSN-WPN-001 §5.3 หมายเหตุ (ฟอร์ม upload)
// ต่อ importAssets จริง · นโยบาย AC-E01: รายงานแถว/คอลัมน์ที่ผิด ไม่นำเข้าเงียบบางส่วน
// รับ CSV แบบวาง (paste) — การเชื่อม Google Sheet/ไฟล์ .xlsx จริงคือชั้น integration (Class B: API/creds, O1)
// ข้อมูลอยู่ในหน่วยความจำ (mock)

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton.tsx';
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

export default function ImportPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  function run() {
    const { header, rows } = parseCsv(text);
    setResult(importAssets(header, rows));
  }

  return (
    <main className="app">
      <div className="topbar">
        <Link href="/" className="iconbtn" aria-label="กลับไปหน้าพอร์ต"><ArrowLeft size={18} /></Link>
        <h1>นำเข้าจากสเปรดชีต</h1>
        <LogoutButton />
      </div>

      <section className="card form">
        <div className="field">
          <label htmlFor="csv">วางข้อมูล CSV (คอลัมน์: {IMPORT_COLUMNS.join(', ')})</label>
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
        <p className="note-muted">การเชื่อม Google Sheet / ไฟล์ .xlsx โดยตรงเป็นงาน integration (รอ API/creds — Class B)</p>
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

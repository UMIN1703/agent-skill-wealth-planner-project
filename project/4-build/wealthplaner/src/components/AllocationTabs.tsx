'use client';

// สัดส่วน Asset Allocation แบบ 2 แท็บ (CR-WPN-008) — ไม่มี donut · กรุ๊ปตามหมวดใหญ่
//  ① ปัจจุบัน: แถบ % ต่อหมวด · ② เป้าหมาย: แถบคู่ ปัจจุบัน vs เป้า + ส่วนต่าง (read-only)
import { useState } from 'react';

export type AllocRow = { name: string; curPct: number; curValueTHB: number; tgtPct: number };

const pct = (n: number) => n.toFixed(0) + '%';
const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
const compact = (n: number) => {
  const a = Math.abs(n);
  return a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k' : fmt(n);
};

// สีประจำหมวด (CI เดิม) + fallback แบบ deterministic
const CAT_COLORS: Record<string, string> = {
  'หุ้นไทย': '#7B72FF', 'ต่างประเทศ': '#60A5FA', 'เกษียณ': '#4FD1C5',
  'สินทรัพย์ทางเลือก': '#C1FD42', 'เงินสำรอง/ฉุกเฉิน': '#F982FB',
};
const PALETTE = ['#7B72FF', '#F982FB', '#4FD1C5', '#60A5FA', '#C1FD42', '#FB923C', '#34D399', '#A78BFA'];
function colorFor(name: string): string {
  if (CAT_COLORS[name]) return CAT_COLORS[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function AllocationTabs({ rows }: { rows: AllocRow[] }) {
  const [tab, setTab] = useState<'current' | 'target'>('current');
  const current = rows.filter((r) => r.curPct > 0);

  return (
    <section className="card">
      <div className="pf-seg" role="tablist" aria-label="สัดส่วนสินทรัพย์">
        <button type="button" role="tab" aria-selected={tab === 'current'} className={'pf-seg-i' + (tab === 'current' ? ' on' : '')} onClick={() => setTab('current')}>ปัจจุบัน</button>
        <button type="button" role="tab" aria-selected={tab === 'target'} className={'pf-seg-i' + (tab === 'target' ? ' on' : '')} onClick={() => setTab('target')}>เป้าหมาย</button>
      </div>

      {tab === 'current' ? (
        current.length === 0 ? <p className="empty">ยังไม่มีสินทรัพย์</p> : (
          <>
            <div className="seg-bar">
              {current.map((r) => (
                <span key={r.name} style={{ width: `${r.curPct}%`, background: colorFor(r.name) }} title={`${r.name} ${pct(r.curPct)}`} />
              ))}
            </div>
            <div className="seg-leg">
              {current.map((r) => (
                <div className="seg-item" key={r.name}>
                  <span className="seg-tick" style={{ background: colorFor(r.name) }} />
                  <div className="seg-txt">
                    <span className="seg-nm">{r.name}</span>
                    <span className="seg-val num">฿{compact(r.curValueTHB)}</span>
                  </div>
                  <span className="seg-pct num">{r.curPct.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="alloc-list">
          {rows.map((r) => {
            const gap = r.curPct - r.tgtPct;
            const cls = Math.abs(gap) < 0.5 ? 'na' : gap > 0 ? 'down' : 'up'; // เกินเป้า=ลด, ต่ำกว่าเป้า=เพิ่ม
            return (
              <div className="alloc-row" key={r.name}>
                <div className="alloc-head">
                  <span>{r.name}</span>
                  <span className={'num gapx ' + cls}>{gap >= 0 ? '+' : '−'}{Math.abs(gap).toFixed(0)}%</span>
                </div>
                <div className="alloc-bar"><span style={{ width: `${r.curPct}%` }} /></div>
                <div className="alloc-bar tgt"><span style={{ width: `${r.tgtPct}%` }} /></div>
                <div className="alloc-sub"><span>ปัจจุบัน {pct(r.curPct)}</span><span>เป้า {pct(r.tgtPct)}</span></div>
              </div>
            );
          })}
          <p className="note-muted" style={{ marginTop: 4 }}>เป้าหมายอิงโมเดลกลาง — แก้ค่าเป้าได้ที่หน้า “ปรับสมดุล”</p>
        </div>
      )}
    </section>
  );
}

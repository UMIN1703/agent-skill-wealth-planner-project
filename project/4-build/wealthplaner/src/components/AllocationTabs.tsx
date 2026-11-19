'use client';

// สัดส่วน Asset Allocation แบบ 2 แท็บ (CR-WPN-008) — ไม่มี donut · กรุ๊ปตามหมวดใหญ่
//  ① ปัจจุบัน: แถบ % ต่อหมวด · ② เป้าหมาย: แถบคู่ ปัจจุบัน vs เป้า + ส่วนต่าง (read-only)
import { useState } from 'react';

export type AllocRow = { name: string; curPct: number; curValueTHB: number; tgtPct: number };

const pct = (n: number) => n.toFixed(0) + '%';

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
        <div className="alloc-list">
          {current.length === 0 ? <p className="empty">ยังไม่มีสินทรัพย์</p> : current.map((r) => (
            <div className="alloc-row" key={r.name}>
              <div className="alloc-head"><span>{r.name}</span><span className="num">{pct(r.curPct)}</span></div>
              <div className="alloc-bar"><span style={{ width: `${r.curPct}%` }} /></div>
            </div>
          ))}
        </div>
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

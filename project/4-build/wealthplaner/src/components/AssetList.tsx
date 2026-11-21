'use client';

// ลิสต์สินทรัพย์ (restyle) — แถบเลือกหมวด (chip เลื่อนได้) · "ทั้งหมด" + รายหมวด
// เรียงหมวดตามความเสี่ยงน้อย→มาก · ยอดรวม/สัดส่วนต่อกลุ่ม
import { useState } from 'react';
import { AssetRow } from './AssetRow.tsx';
import { categoryRiskRank } from '@/lib/portfolio.ts';

export type AssetRowData = { name: string; broker: string; group: string; valueTHB: number; pct: number | null; stale: boolean };

const ALL = 'ทั้งหมด';

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
const compact = (n: number) => {
  const a = Math.abs(n);
  return a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k' : fmt(n);
};

export default function AssetList({ rows, totalTHB }: { rows: AssetRowData[]; totalTHB: number }) {
  // จัดกลุ่มตามหมวด เรียงใหญ่→เล็ก
  const groups = new Map<string, AssetRowData[]>();
  for (const r of rows) {
    const arr = groups.get(r.group) ?? [];
    arr.push(r);
    groups.set(r.group, arr);
  }
  const ordered = [...groups.entries()]
    .map(([group, items]) => ({ group, items, sub: items.reduce((x, r) => x + r.valueTHB, 0) }))
    .sort((a, b) => categoryRiskRank(a.group) - categoryRiskRank(b.group) || b.sub - a.sub); // ความเสี่ยงน้อย→มาก

  const [sel, setSel] = useState<string>(ALL); // เริ่มที่ "ทั้งหมด"
  const shown = sel === ALL ? ordered : ordered.filter((g) => g.group === sel);

  if (rows.length === 0) {
    return <section className="card"><h2>สินทรัพย์</h2><p className="empty">ยังไม่มีสินทรัพย์</p></section>;
  }

  return (
    <section className="card">
      <h2>สินทรัพย์</h2>
      <div className="cat-chips" role="tablist" aria-label="หมวดสินทรัพย์">
        <button type="button" role="tab" aria-selected={sel === ALL} className={'cat-chip' + (sel === ALL ? ' on' : '')} onClick={() => setSel(ALL)}>{ALL}</button>
        {ordered.map((g) => (
          <button type="button" key={g.group} role="tab" aria-selected={sel === g.group} className={'cat-chip' + (sel === g.group ? ' on' : '')} onClick={() => setSel(g.group)}>{g.group}</button>
        ))}
      </div>

      {shown.map((g) => (
        <div key={g.group} className="pf-group-wrap">
          <div className="pf-group">
            <span className="gt">{g.group}</span>
            <span className="gv num">฿{compact(g.sub)} · {totalTHB > 0 ? Math.round((g.sub / totalTHB) * 100) : 0}%</span>
          </div>
          {g.items.map((r, i) => (
            <AssetRow key={r.name + r.broker + i} name={r.name} broker={r.broker} valueTHB={r.valueTHB} percent={r.pct} stale={r.stale} />
          ))}
        </div>
      ))}
    </section>
  );
}

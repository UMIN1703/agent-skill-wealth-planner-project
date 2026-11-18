'use client';

// ลิสต์สินทรัพย์ (restyle) — segmented control กรอง ทั้งหมด/กำไร/ขาดทุน + แถวสินทรัพย์
import { useState } from 'react';
import { AssetRow } from './AssetRow.tsx';

export type AssetRowData = { name: string; broker: string; valueTHB: number; pct: number | null; stale: boolean };

const FILTERS: { id: 'all' | 'gain' | 'loss'; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'gain', label: 'กำไร' },
  { id: 'loss', label: 'ขาดทุน' },
];

export default function AssetList({ rows }: { rows: AssetRowData[] }) {
  const [f, setF] = useState<'all' | 'gain' | 'loss'>('all');
  const shown = rows.filter((r) =>
    f === 'all' ? true : f === 'gain' ? (r.pct ?? 0) > 0 : (r.pct ?? 0) < 0,
  );

  return (
    <section className="card">
      <div className="pf-seg" role="tablist" aria-label="กรองสินทรัพย์">
        {FILTERS.map(({ id, label }) => (
          <button key={id} type="button" role="tab" aria-selected={f === id}
            className={'pf-seg-i' + (f === id ? ' on' : '')} onClick={() => setF(id)}>{label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="empty">ไม่มีสินทรัพย์ในกลุ่มนี้</p>
      ) : shown.map((r, i) => (
        <AssetRow key={r.name + r.broker + i} name={r.name} broker={r.broker} valueTHB={r.valueTHB} percent={r.pct} stale={r.stale} />
      ))}
    </section>
  );
}

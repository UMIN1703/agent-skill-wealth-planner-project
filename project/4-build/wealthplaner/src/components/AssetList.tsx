// ลิสต์สินทรัพย์ (restyle) — จัดกลุ่มตาม "หมวด" (เหมือนชีต) + ยอดรวม/สัดส่วนต่อกลุ่ม
import { AssetRow } from './AssetRow.tsx';

export type AssetRowData = { name: string; broker: string; group: string; valueTHB: number; pct: number | null; stale: boolean };

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
const compact = (n: number) => {
  const a = Math.abs(n);
  return a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k' : fmt(n);
};

export default function AssetList({ rows, totalTHB }: { rows: AssetRowData[]; totalTHB: number }) {
  // จัดกลุ่มตามหมวด แล้วเรียงกลุ่มใหญ่→เล็กตามมูลค่า
  const groups = new Map<string, AssetRowData[]>();
  for (const r of rows) {
    const arr = groups.get(r.group) ?? [];
    arr.push(r);
    groups.set(r.group, arr);
  }
  const ordered = [...groups.entries()]
    .map(([group, items]) => ({ group, items, sub: items.reduce((x, r) => x + r.valueTHB, 0) }))
    .sort((a, b) => b.sub - a.sub);

  return (
    <section className="card">
      <h2>สินทรัพย์ตามหมวด</h2>
      {rows.length === 0 ? (
        <p className="empty">ยังไม่มีสินทรัพย์</p>
      ) : ordered.map((g) => (
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

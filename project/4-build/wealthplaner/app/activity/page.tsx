// หน้ารายการล่าสุด — สินทรัพย์ที่เพิ่งเพิ่ม/บันทึก เรียงใหม่→เก่า (listHoldings order=created_at.desc)
// สินทรัพย์ที่กด "เพิ่ม" หรือบันทึกจากสลิป จะมาโผล่บนสุดที่นี่
import { marketValueTHB } from '@/lib/portfolio.ts';
import { loadAssets } from '@/lib/portfolioData.ts';
import type { TxAction } from '@/data/sampleAssets.ts';
import Amount from '@/components/Amount.tsx';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

// ป้ายการกระทำ (ซื้อ/ขาย/สับเปลี่ยน) — สีบอกประเภท
const ACTION: Record<TxAction, { label: string; color: string }> = {
  buy: { label: 'ซื้อ', color: 'var(--gain)' },
  sell: { label: 'ขาย', color: 'var(--loss)' },
  switch: { label: 'สับเปลี่ยน', color: 'var(--info)' },
};
// เดโมไม่มี action จริง → วนให้เห็นครบ 3 แบบ · ของจริง default = ซื้อ (ทุกการบันทึก holding = เพิ่ม/ซื้อ)
const DEMO_CYCLE: TxAction[] = ['buy', 'buy', 'sell', 'buy', 'switch'];

const hhmm = (d: Date) => d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

// หัวข้อวันที่: วันนี้ / เมื่อวาน / "D เดือน (ปี ถ้าไกล)"
function dayLabel(d: Date): string {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(d); b.setHours(0, 0, 0, 0);
  const diff = Math.round((a.getTime() - b.getTime()) / 86400000);
  if (diff <= 0) return 'วันนี้';
  if (diff === 1) return 'เมื่อวาน';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', ...(diff > 300 ? { year: 'numeric' } : {}) });
}

export default async function ActivityPage() {
  const { assets, isDemo } = await loadAssets();
  const recent = assets.slice(0, 15); // ใหม่→เก่า อยู่แล้วจาก listHoldings

  // ผูกวันที่ให้แต่ละรายการ · เดโมไม่มี createdAt → กระจาย ~7 ชม./รายการ ให้เห็นการแบ่งวัน
  const now = Date.now();
  const dated = recent.map((a, i) => ({
    a, i,
    date: a.createdAt ? new Date(a.createdAt) : new Date(now - i * 7 * 3600 * 1000),
  }));

  // จัดกลุ่มตามวัน (เรียงใหม่→เก่าอยู่แล้ว → กลุ่มที่ติดกันพอ)
  const groups: { label: string; items: typeof dated }[] = [];
  for (const it of dated) {
    const label = dayLabel(it.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }

  return (
    <main className="app">
      <div className="topbar">
        <h1>รายการล่าสุด</h1>
      </div>

      {recent.length === 0 ? (
        <section className="card"><p className="empty">ยังไม่มีรายการ — กด “เพิ่ม” เพื่อบันทึกสินทรัพย์แรก</p></section>
      ) : groups.map((g) => (
        <section className="card" key={g.label}>
          <div className="sub" style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', padding: '0 2px 8px' }}>{g.label}</div>
          {g.items.map(({ a, i, date }) => {
            const fromSlip = a.source === 'slip';
            const act = ACTION[a.action ?? (isDemo ? DEMO_CYCLE[i % DEMO_CYCLE.length] : 'buy')];
            return (
              <div key={a.name + a.brokerChannel + i} className="arow" style={{ alignItems: 'center' }}>
                <span className="nm" style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <span className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>
                    <span style={{ color: act.color, fontWeight: 600 }}>{act.label}</span>
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                    {a.category ?? a.type}
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                    {fromSlip ? 'จากสลิป' : 'เพิ่มเอง'}
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                    {hhmm(date)}
                  </span>
                </span>
                <span className="rt"><div className="price num">฿<Amount>{fmt(marketValueTHB(a))}</Amount></div></span>
              </div>
            );
          })}
        </section>
      ))}

      {isDemo && <p className="note" style={{ textAlign: 'center' }}>ข้อมูลเดโม (ตัวอย่าง) — เพิ่มสินทรัพย์จริงแล้วรายการจะมาโผล่ที่นี่</p>}
    </main>
  );
}

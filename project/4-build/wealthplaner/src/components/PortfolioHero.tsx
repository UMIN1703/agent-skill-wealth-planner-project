'use client';

// ฮีโร่พอร์ต (restyle) — ตัวเลขใหญ่กลางจอ + pill toggle สลับ "มูลค่า" / "กำไร/ขาดทุน"
import { useState } from 'react';

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

export default function PortfolioHero({
  totalTHB, incomeTHB, incomePct,
}: { totalTHB: number; incomeTHB: number; incomePct: number }) {
  const [tab, setTab] = useState<'value' | 'pl'>('value');
  const up = incomeTHB >= 0;
  const sign = up ? '+' : '−';

  return (
    <section className="pf-hero">
      <div className="pf-toggle" role="tablist" aria-label="มุมมองพอร์ต">
        <button type="button" role="tab" aria-selected={tab === 'value'} className={'pf-tab' + (tab === 'value' ? ' on' : '')} onClick={() => setTab('value')}>มูลค่า</button>
        <button type="button" role="tab" aria-selected={tab === 'pl'} className={'pf-tab' + (tab === 'pl' ? ' on' : '')} onClick={() => setTab('pl')}>กำไร/ขาดทุน</button>
      </div>

      {tab === 'value' ? (
        <>
          <div className="pf-big num"><span className="cur">฿</span>{fmt(totalTHB)}</div>
          <div className="pf-sub">มูลค่าพอร์ตรวม</div>
        </>
      ) : (
        <>
          <div className={'pf-big num ' + (up ? 'g' : 'l')}>{sign}฿{fmt(Math.abs(incomeTHB))}</div>
          <div className="pf-sub">กำไร/ขาดทุนรวม</div>
        </>
      )}

      <span className={'pf-delta ' + (up ? 'up' : 'down')}>
        {up ? '▲' : '▼'} {sign}{Math.abs(incomePct).toFixed(2)}%
        {tab === 'value' ? ` · ${sign}฿${fmt(Math.abs(incomeTHB))}` : ''}
      </span>
    </section>
  );
}

'use client';

// ฮีโร่พอร์ต (restyle) — ตัวเลขใหญ่กลางจอ + pill toggle สลับ "มูลค่า" / "กำไร/ขาดทุน"
// รองรับ "ซ่อนจำนวนเงิน" (wp_privacy) — ปิดบังตัวเลข + ปุ่มรูปตาสลับได้ (ซิงค์กับหน้าความเป็นส่วนตัว)
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PRIVACY_KEY, type Privacy } from '@/components/PrivacySettings.tsx';

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
const MASK = '••••••';

export default function PortfolioHero({
  totalTHB, incomeTHB, incomePct,
}: { totalTHB: number; incomeTHB: number; incomePct: number }) {
  const [tab, setTab] = useState<'value' | 'pl'>('value');
  const [hidden, setHidden] = useState(false);
  const up = incomeTHB >= 0;
  const sign = up ? '+' : '−';

  useEffect(() => {
    try {
      const s = localStorage.getItem(PRIVACY_KEY);
      if (s) setHidden(!!(JSON.parse(s) as Privacy).hideAmounts);
    } catch { /* ignore */ }
  }, []);

  function toggleHidden() {
    setHidden((v) => {
      const next = !v;
      try { localStorage.setItem(PRIVACY_KEY, JSON.stringify({ hideAmounts: next })); } catch { /* ignore */ }
      return next;
    });
  }

  const money = (n: number) => (hidden ? MASK : fmt(n));

  return (
    <section className="pf-hero" style={{ position: 'relative' }}>
      <button type="button" aria-label={hidden ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'} aria-pressed={hidden} onClick={toggleHidden}
        style={{
          position: 'absolute', top: 0, right: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 999, cursor: 'pointer',
          background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)',
        }}>
        {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <div className="pf-toggle" role="tablist" aria-label="มุมมองพอร์ต">
        <button type="button" role="tab" aria-selected={tab === 'value'} className={'pf-tab' + (tab === 'value' ? ' on' : '')} onClick={() => setTab('value')}>มูลค่า</button>
        <button type="button" role="tab" aria-selected={tab === 'pl'} className={'pf-tab' + (tab === 'pl' ? ' on' : '')} onClick={() => setTab('pl')}>กำไร/ขาดทุน</button>
      </div>

      {tab === 'value' ? (
        <>
          <div className="pf-big num"><span className="cur">฿</span>{money(totalTHB)}</div>
          <div className="pf-sub">มูลค่าพอร์ตรวม</div>
        </>
      ) : (
        <>
          <div className={'pf-big num ' + (up ? 'g' : 'l')}>{hidden ? MASK : `${sign}฿${fmt(Math.abs(incomeTHB))}`}</div>
          <div className="pf-sub">กำไร/ขาดทุนรวม</div>
        </>
      )}

      <span className={'pf-delta ' + (up ? 'up' : 'down')}>
        {up ? '▲' : '▼'} {sign}{Math.abs(incomePct).toFixed(2)}%
        {tab === 'value' ? ` · ${sign}฿${money(Math.abs(incomeTHB))}` : ''}
      </span>
    </section>
  );
}

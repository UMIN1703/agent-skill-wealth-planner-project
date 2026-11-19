'use client';

// การ์ดสถิติ "ความเสี่ยงที่ประเมิน" — อ่านผลจาก localStorage (ทำแบบประเมินที่ /profile)
import { useEffect, useState } from 'react';
import Link from 'next/link';

export const RISK_KEY = 'wp_risk';

export default function RiskStat() {
  const [r, setR] = useState<{ level: number; short: string } | null>(null);
  useEffect(() => {
    try { const s = localStorage.getItem(RISK_KEY); if (s) setR(JSON.parse(s)); } catch { /* ignore */ }
  }, []);

  return (
    <div className="pf-stat">
      <span className="t">ความเสี่ยงที่ประเมิน</span>
      {r
        ? <span className="p">{r.short} <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>({r.level}/5)</span></span>
        : <Link href="/profile" className="p" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>ทำแบบประเมิน →</Link>}
    </div>
  );
}

'use client';

// การ์ดสถิติ "ความเสี่ยงที่ประเมิน" — อ่านผลจาก localStorage (ทำแบบประเมินที่ /profile)
import { useEffect, useState } from 'react';
import Link from 'next/link';

export const RISK_KEY = 'wp_risk';

const DEMO_RISK = { level: 4, short: 'สูง' }; // ตัวอย่างไว้โชว์ก่อนทำแบบประเมินจริง

export default function RiskStat({ initial }: { initial?: { level: number; short: string } | null }) {
  const [r, setR] = useState<{ level: number; short: string } | null>(initial ?? null);
  useEffect(() => {
    if (initial) return; // มีค่าจาก server (sync ข้ามเครื่อง) แล้ว — ไม่ต้องอ่าน localStorage
    try { const s = localStorage.getItem(RISK_KEY); if (s) setR(JSON.parse(s)); } catch { /* ignore */ }
  }, [initial]);

  const d = r ?? DEMO_RISK;
  return (
    <div className="pf-stat">
      <span className="t">ความเสี่ยงที่ประเมิน</span>
      <Link href="/profile" className="p num" style={{ textDecoration: 'none', color: 'var(--text)' }}>
        {d.level}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>/5{r ? '' : ' • ตัวอย่าง'}</span>
      </Link>
    </div>
  );
}

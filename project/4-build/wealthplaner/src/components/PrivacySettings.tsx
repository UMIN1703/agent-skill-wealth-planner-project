'use client';

// ตั้งค่าความเป็นส่วนตัว
// - ซ่อนจำนวนเงิน (wp_privacy) → มีผลจริงกับหน้าพอร์ต (PortfolioHero อ่านคีย์เดียวกัน)
// - ล้างข้อมูลที่เก็บในเครื่องนี้ (localStorage wp_*) · + โน้ตบอกว่าข้อมูลอยู่ที่ไหนบ้าง
import { useState, useEffect } from 'react';
import { Eye, Trash2, Database, HardDrive } from 'lucide-react';
import Toggle from '@/components/Toggle.tsx';

export const PRIVACY_KEY = 'wp_privacy';
export type Privacy = { hideAmounts: boolean };

export default function PrivacySettings() {
  const [hideAmounts, setHideAmounts] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(PRIVACY_KEY);
      if (s) setHideAmounts(!!(JSON.parse(s) as Privacy).hideAmounts);
    } catch { /* ignore */ }
  }, []);

  function toggleHide() {
    setHideAmounts((v) => {
      const next = !v;
      try { localStorage.setItem(PRIVACY_KEY, JSON.stringify({ hideAmounts: next })); } catch { /* ignore */ }
      window.dispatchEvent(new Event('wp-privacy')); // sync ทุก <Amount> + hero
      return next;
    });
  }

  function clearLocal() {
    if (!confirm('ล้างข้อมูลที่เก็บในเครื่องนี้ทั้งหมด (ชื่อที่แสดง, ผลประเมินความเสี่ยง, การแจ้งเตือน, ความเป็นส่วนตัว)?')) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('wp_')).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    setHideAmounts(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 2200);
  }

  return (
    <>
      <section className="card" aria-label="การแสดงผล">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 2px' }}>
          <Eye size={20} style={{ opacity: 0.85, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>ซ่อนจำนวนเงิน</div>
            <div className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>ปิดบังตัวเลขยอดเงินทุกหน้า (พอร์ต · สินทรัพย์ · ล่าสุด)</div>
          </div>
          <Toggle on={hideAmounts} onClick={toggleHide} label="ซ่อนจำนวนเงิน" />
        </div>
      </section>

      {/* ข้อมูลอยู่ที่ไหน */}
      <section className="card">
        <h2>ข้อมูลของคุณเก็บที่ไหน</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', borderBottom: '1px solid var(--border)' }}>
          <Database size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>รายการพอร์ต</span>
          <span className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>ฐานข้อมูลแอป (Supabase)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', borderBottom: '1px solid var(--border)' }}>
          <HardDrive size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>ไฟล์บันทึก (Ledger)</span>
          <span className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>Google Drive ของคุณ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px' }}>
          <Eye size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>การตั้งค่า/ผลประเมิน</span>
          <span className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>เครื่องนี้ (เบราว์เซอร์)</span>
        </div>
      </section>

      <button type="button" className="btn-ghost" onClick={clearLocal}
        style={{ display: 'flex', justifyContent: 'center', width: '100%', color: 'var(--loss)', borderColor: 'color-mix(in srgb, var(--loss) 40%, transparent)' }}>
        <Trash2 size={17} /> ล้างข้อมูลในเครื่องนี้
      </button>
      {cleared && <p className="note" style={{ textAlign: 'center', color: 'var(--gain)' }}>ล้างข้อมูลในเครื่องแล้ว</p>}
      <p className="note-muted">การล้างในเครื่องไม่กระทบรายการพอร์ตในฐานข้อมูลหรือไฟล์ใน Google Drive</p>
    </>
  );
}

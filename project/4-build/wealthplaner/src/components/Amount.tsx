'use client';

// แสดงจำนวนเงิน — ปิดบังเป็น •••••• เมื่อเปิด "ซ่อนจำนวนเงิน" (wp_privacy)
// ใช้ครอบ "ตัวเลข" (ไม่รวมสัญลักษณ์ ฿) ทุกที่ที่โชว์ยอด → ซ่อนพร้อมกันทั้งแอป
// sync สด: ฟัง event 'wp-privacy' (toggle ในหน้าเดียวกัน) + 'storage' (ข้ามแท็บ)
import { useState, useEffect } from 'react';
import { PRIVACY_KEY, type Privacy } from '@/components/PrivacySettings.tsx';

export const AMOUNT_MASK = '••••••';

export function readHideAmounts(): boolean {
  try {
    const s = localStorage.getItem(PRIVACY_KEY);
    return !!(s && (JSON.parse(s) as Privacy).hideAmounts);
  } catch { return false; }
}

export default function Amount({ children }: { children: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => setHidden(readHideAmounts());
    sync();
    window.addEventListener('wp-privacy', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('wp-privacy', sync); window.removeEventListener('storage', sync); };
  }, []);
  return <>{hidden ? AMOUNT_MASK : children}</>;
}

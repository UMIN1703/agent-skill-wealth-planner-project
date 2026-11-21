'use client';

// แสดงชื่อผู้ใช้ — ใช้ override จาก localStorage (ตั้งค่าบัญชี) ถ้ามี, ไม่งั้น fallback ชื่อจาก session
import { useState, useEffect } from 'react';
import { DISPLAY_NAME_KEY } from '@/components/AccountSettings.tsx';

export default function DisplayName({ fallback }: { fallback: string }) {
  const [name, setName] = useState(fallback);
  useEffect(() => {
    try { const v = localStorage.getItem(DISPLAY_NAME_KEY); if (v) setName(v); } catch { /* ignore */ }
  }, []);
  return <>{name}</>;
}

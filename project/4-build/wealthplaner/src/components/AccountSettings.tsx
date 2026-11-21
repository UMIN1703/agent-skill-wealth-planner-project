'use client';

// ตั้งค่าบัญชี — แก้ "ชื่อที่แสดง" ได้จริง (เก็บ localStorage wp_display_name)
// ชื่อนี้ไปแทนที่ชื่อจาก provider ที่หัวโปรไฟล์ (ดู DisplayName.tsx) · ข้อมูลอื่นอ่านอย่างเดียวจาก session
import { useState, useEffect } from 'react';
import { Check, Mail, LogIn } from 'lucide-react';

export const DISPLAY_NAME_KEY = 'wp_display_name';

export default function AccountSettings({
  defaultName, contact, provider,
}: { defaultName: string; contact: string; provider: string }) {
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(DISPLAY_NAME_KEY) ?? defaultName;
      setName(v); setInitial(v);
    } catch { setName(defaultName); setInitial(defaultName); }
  }, [defaultName]);

  const dirty = name.trim() !== '' && name.trim() !== initial;

  function save() {
    const v = name.trim();
    if (!v) return;
    try { localStorage.setItem(DISPLAY_NAME_KEY, v); } catch { /* ignore */ }
    setInitial(v);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1800);
  }

  function reset() {
    try { localStorage.removeItem(DISPLAY_NAME_KEY); } catch { /* ignore */ }
    setName(defaultName); setInitial(defaultName);
  }

  return (
    <>
      <section className="card">
        <h2>ชื่อที่แสดง</h2>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อที่แสดงในแอป"
          aria-label="ชื่อที่แสดง"
          maxLength={40}
          style={{ marginTop: 4 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button type="button" className="btn-primary" disabled={!dirty} onClick={save}>
            <Check size={17} /> บันทึก
          </button>
          {initial !== defaultName && (
            <button type="button" className="btn-ghost" onClick={reset}>ใช้ชื่อจาก {provider}</button>
          )}
          {savedTick && <span className="sub" style={{ fontSize: 13, color: '#34D399' }}>บันทึกแล้ว</span>}
        </div>
        <p className="note-muted">ชื่อนี้จะแสดงที่หัวโปรไฟล์แทนชื่อจากผู้ให้บริการ (เก็บในเครื่องนี้)</p>
      </section>

      <section className="card">
        <h2>ข้อมูลบัญชี</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px', borderBottom: '1px solid var(--border)' }}>
          <Mail size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>บัญชีติดต่อ</span>
          <span className="sub" style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all', textAlign: 'right' }}>{contact}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px' }}>
          <LogIn size={18} style={{ opacity: 0.85, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>เข้าสู่ระบบด้วย</span>
          <span className="sub" style={{ fontSize: 13, color: 'var(--muted)' }}>{provider}</span>
        </div>
      </section>
    </>
  );
}

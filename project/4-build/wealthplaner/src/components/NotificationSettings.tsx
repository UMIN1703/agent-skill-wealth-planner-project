'use client';

// ตั้งค่าการแจ้งเตือน — สวิตช์เปิด/ปิดจริง เก็บ localStorage (wp_notif)
// ช่องทางส่งจริงคือ LINE push (F009) — ต้องเชื่อม LINE ถึงจะส่งได้ (โชว์สถานะด้านบน)
import { useState, useEffect } from 'react';
import { MessageSquareText } from 'lucide-react';
import Toggle from '@/components/Toggle.tsx';

const NOTIF_KEY = 'wp_notif';

type Prefs = { slip: boolean; rebalance: boolean; monthly: boolean };
const DEFAULTS: Prefs = { slip: true, rebalance: true, monthly: false };

const ITEMS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: 'slip', title: 'สรุปยอดเมื่อบันทึกสลิป', desc: 'ส่งการ์ดสรุปกลับทาง LINE หลังบันทึกรายการสำเร็จ' },
  { key: 'rebalance', title: 'เตือนเมื่อพอร์ตเบี่ยงจากเป้า', desc: 'แจ้งเมื่อสัดส่วนคลาสใดห่างเป้าหมายเกิน 5%' },
  { key: 'monthly', title: 'สรุปพอร์ตรายเดือน', desc: 'ส่งภาพรวมมูลค่า/กำไร-ขาดทุน ต้นเดือน' },
];

export default function NotificationSettings({ lineConnected }: { lineConnected: boolean }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const s = localStorage.getItem(NOTIF_KEY);
      if (s) setPrefs({ ...DEFAULTS, ...JSON.parse(s) });
    } catch { /* ignore */ }
  }, []);

  function toggle(key: keyof Prefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  return (
    <>
      {/* ช่องทางส่ง */}
      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            background: lineConnected ? 'color-mix(in srgb, var(--line) 14%, transparent)' : 'var(--brand-tint)',
            border: '1px solid ' + (lineConnected ? 'var(--line)' : 'var(--border)'),
            color: lineConnected ? 'var(--line)' : 'var(--muted)',
          }}>
            <MessageSquareText size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>ส่งผ่าน LINE</div>
            <div className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>
              {lineConnected ? 'เชื่อม LINE แล้ว — พร้อมส่งแจ้งเตือน' : 'ยังไม่ได้เชื่อม LINE — การแจ้งเตือนจะยังไม่ถูกส่ง'}
            </div>
          </div>
        </div>
      </section>

      {/* สวิตช์ */}
      <section className="card" aria-label="รายการแจ้งเตือน">
        {ITEMS.map((it, i) => (
          <div key={it.key} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px',
            borderBottom: i < ITEMS.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{it.title}</div>
              <div className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>{it.desc}</div>
            </div>
            <Toggle on={prefs[it.key]} onClick={() => toggle(it.key)} label={it.title} />
          </div>
        ))}
      </section>

      <p className="note-muted">ตั้งค่าเก็บในเครื่องนี้ · การส่งจริงทาง LINE เป็นฟีเจอร์ฝั่งเซิร์ฟเวอร์ที่จะเชื่อมตามมา</p>
    </>
  );
}

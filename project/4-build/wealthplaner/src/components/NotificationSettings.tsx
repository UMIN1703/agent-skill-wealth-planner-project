'use client';

// ตั้งค่าการแจ้งเตือน — สวิตช์เปิด/ปิดจริง เก็บ localStorage (wp_notif)
// ช่องทางส่งจริงคือ LINE push (F009) — ต้องเชื่อม LINE ถึงจะส่งได้ (โชว์สถานะด้านบน)
import { useState, useEffect } from 'react';
import { MessageSquareText } from 'lucide-react';

const NOTIF_KEY = 'wp_notif';

type Prefs = { slip: boolean; rebalance: boolean; monthly: boolean };
const DEFAULTS: Prefs = { slip: true, rebalance: true, monthly: false };

const ITEMS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: 'slip', title: 'สรุปยอดเมื่อบันทึกสลิป', desc: 'ส่งการ์ดสรุปกลับทาง LINE หลังบันทึกรายการสำเร็จ' },
  { key: 'rebalance', title: 'เตือนเมื่อพอร์ตเบี่ยงจากเป้า', desc: 'แจ้งเมื่อสัดส่วนคลาสใดห่างเป้าหมายเกิน 5%' },
  { key: 'monthly', title: 'สรุปพอร์ตรายเดือน', desc: 'ส่งภาพรวมมูลค่า/กำไร-ขาดทุน ต้นเดือน' },
];

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      style={{
        width: 46, height: 28, borderRadius: 999, flexShrink: 0, cursor: 'pointer', position: 'relative',
        border: '1px solid ' + (on ? 'var(--brand)' : 'var(--border)'),
        background: on ? 'var(--brand)' : 'transparent', transition: 'background .15s, border-color .15s',
      }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 20 : 2, width: 22, height: 22, borderRadius: '50%',
        background: on ? '#fff' : 'var(--muted)', transition: 'left .15s',
      }} />
    </button>
  );
}

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
            background: lineConnected ? 'rgba(6,199,85,.14)' : 'var(--brand-tint)',
            border: '1px solid ' + (lineConnected ? '#06C755' : 'var(--border)'),
            color: lineConnected ? '#06C755' : 'var(--muted)',
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

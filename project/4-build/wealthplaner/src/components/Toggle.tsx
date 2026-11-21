'use client';

// สวิตช์เปิด/ปิด (switch) — ใช้ร่วมหน้าตั้งค่า (การแจ้งเตือน / ความเป็นส่วนตัว)
export default function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
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

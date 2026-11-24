'use client';

// แบบประเมินความเสี่ยง (F007) — หน้าแยกเต็ม (CR-WPN-015)
// กดจาก /profile → มาหน้านี้ · ตอบ → บันทึก (toast สำเร็จ) · ออกกลางคันทั้งที่ตอบแล้ว → modal เตือน unsaved
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Loader2, Check } from 'lucide-react';
import { RISK_QUESTIONS, scoreRisk, isComplete, type RiskResult } from '@/lib/risk.ts';
import { RISK_KEY } from '@/components/RiskStat.tsx';

export default function RiskForm({ initial }: { initial?: RiskResult | null }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const answered = Object.keys(answers).length;
  const dirty = answered > 0 && !toast; // ตอบแล้วอย่างน้อย 1 ข้อ และยังไม่บันทึกสำเร็จ
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // เตือนตอนปิด/รีเฟรช/ออกจากแท็บ ถ้ามีงานค้าง (SPA nav จัดการผ่านปุ่มย้อนกลับ/โมดอลเอง)
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  function goBack() {
    if (dirty) setLeaveOpen(true);
    else router.push('/profile');
  }

  async function save() {
    if (!isComplete(answers)) { setErr('กรุณาตอบให้ครบทุกข้อก่อนบันทึก'); return; }
    setErr(null);
    setSaving(true);
    const r = scoreRisk(answers);
    try { localStorage.setItem(RISK_KEY, JSON.stringify(r)); } catch { /* ignore */ }
    try {
      await fetch('/api/prefs', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk: r }),
      });
    } catch { /* best-effort — เก็บ localStorage ไว้แล้ว */ }
    setSaving(false);
    setToast(true);                               // ← dirty = false ทันที (กัน beforeunload)
    setTimeout(() => router.push('/profile'), 1200);
  }

  return (
    <main className="app">
      <div className="topbar">
        <button type="button" onClick={goBack} aria-label="กลับ" className="btn-ghost" style={{ padding: 8, borderRadius: 999 }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ flex: 1 }}>แบบประเมินความเสี่ยง</h1>
      </div>

      {initial && (
        <div className="notice warn" role="status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} /> ผลล่าสุด: ระดับ {initial.level}/5 ({initial.label}) — ตอบใหม่เพื่อประเมินซ้ำได้
        </div>
      )}

      <section className="card">
        <div className="sub" style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
          ตอบให้ครบ {RISK_QUESTIONS.length} ข้อ · ตอบแล้ว {answered}/{RISK_QUESTIONS.length}
        </div>

        {RISK_QUESTIONS.map((q, i) => (
          <div key={q.id} className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600 }}>{i + 1}. {q.q}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
              {q.options.map((o) => (
                <label key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, cursor: 'pointer' }}>
                  <input type="radio" name={q.id} checked={answers[q.id] === o.score}
                    onChange={() => { setAnswers((a) => ({ ...a, [q.id]: o.score })); setErr(null); }} />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        {err && <p className="note" style={{ color: 'var(--loss)', margin: '0 0 10px' }}>{err}</p>}

        <button type="button" className="btn-primary" disabled={!isComplete(answers) || saving} onClick={save}
          style={{ width: '100%', justifyContent: 'center' }}>
          {saving ? <><Loader2 size={18} className="spin" /> กำลังบันทึก…</> : <><ShieldCheck size={18} /> บันทึกผลประเมิน</>}
        </button>
        <p className="note-muted" style={{ marginTop: 10 }}>ผลเป็นเพียงแนวทางเบื้องต้น ไม่ใช่คำแนะนำการลงทุนตามเกณฑ์ กลต. เต็มรูป</p>
      </section>

      {/* toast สำเร็จ */}
      {toast && (
        <div role="status" style={{
          position: 'fixed', left: '50%', bottom: 88, transform: 'translateX(-50%)', zIndex: 60,
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999,
          background: 'var(--gain)', color: '#07210f', fontWeight: 700, fontSize: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,.35)',
        }}>
          <Check size={18} /> บันทึกผลประเมินแล้ว
        </div>
      )}

      {/* modal เตือน unsaved */}
      {leaveOpen && (
        <div role="dialog" aria-modal="true" onClick={() => setLeaveOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: '100%', margin: 0 }}>
            <h2 style={{ fontSize: 17, margin: '0 0 6px' }}>ยังไม่ได้บันทึก</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
              คุณทำแบบประเมินค้างไว้ ({answered}/{RISK_QUESTIONS.length} ข้อ) · ออกโดยไม่บันทึกใช่ไหม?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setLeaveOpen(false)}>
                อยู่ต่อ
              </button>
              <button type="button" className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--loss)', borderColor: 'var(--loss)' }}
                onClick={() => router.push('/profile')}>
                ออกโดยไม่บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

// แบบประเมินความเสี่ยง (F007) — แถวเมนูยุบ/กาง (accordion): ปกติเห็นแถวเดียว
// (ชื่อ + ระดับความเสี่ยง + ลูกศร) กดแล้วกาง 10 ข้อ → คำนวณระดับ → เก็บ localStorage
import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, ChevronRight } from 'lucide-react';
import { RISK_QUESTIONS, scoreRisk, isComplete, type RiskResult } from '@/lib/risk.ts';
import { RISK_KEY } from '@/components/RiskStat.tsx';

export default function RiskAssessment({ initial, defaultOpen }: { initial?: RiskResult | null; defaultOpen?: boolean }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<RiskResult | null>(initial ?? null);
  const [open, setOpen] = useState(defaultOpen ?? false); // มาจากลิงก์ ?assess=1 → กางทันที

  useEffect(() => {
    if (initial) return; // มีผลจาก server แล้ว (sync ข้ามเครื่อง)
    try { const s = localStorage.getItem(RISK_KEY); if (s) setSaved(JSON.parse(s)); } catch { /* ignore */ }
  }, [initial]);

  function submit() {
    if (!isComplete(answers)) return;
    const r = scoreRisk(answers);
    try { localStorage.setItem(RISK_KEY, JSON.stringify(r)); } catch { /* ignore */ }
    // เก็บขึ้น server ด้วย → sync ข้ามเครื่อง (best-effort, ไม่บล็อก UI)
    fetch('/api/prefs', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risk: r }),
    }).catch(() => { /* ยัง login ไม่ครบ/ออฟไลน์ → เก็บ localStorage ไว้ก่อน */ });
    setSaved(r);
    setOpen(false); // ยุบกลับเป็นแถวเดียว โชว์ผลที่หัวแถว
  }

  const status = saved ? `${saved.label} · ระดับ ${saved.level}/5` : 'ยังไม่ได้ประเมิน';

  return (
    <section className="card" aria-label="แบบประเมินความเสี่ยง" style={{ paddingTop: 6, paddingBottom: open ? 18 : 6 }}>
      {/* แถวหัว (เหมือนแถวตั้งค่า) — กดเพื่อกาง/ยุบ */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px', textAlign: 'left', font: 'inherit',
        }}
      >
        <span className="chip" style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'var(--brand-tint)',
          border: '1px solid var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldCheck size={20} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600 }}>แบบประเมินความเสี่ยง</span>
          <span className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>{status}</span>
        </span>
        <ChevronRight size={18} style={{ opacity: 0.5, flexShrink: 0, transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none' }} />
      </button>

      {/* เนื้อหากาง */}
      {open && saved && (
        <div style={{ paddingTop: 6 }} aria-live="polite">
          <div className="sub" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            คะแนน {saved.score}/40 — ใช้แนะนำสัดส่วนเป้าหมาย (F006)
          </div>
          <button type="button" className="btn-ghost" onClick={() => { setSaved(null); setAnswers({}); }}>
            <RefreshCw size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} /> ประเมินใหม่
          </button>
        </div>
      )}

      {open && !saved && (
        <div style={{ paddingTop: 6 }}>
          {RISK_QUESTIONS.map((q, i) => (
            <div key={q.id} className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600 }}>{i + 1}. {q.q}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {q.options.map((o) => (
                  <label key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, cursor: 'pointer' }}>
                    <input type="radio" name={q.id} checked={answers[q.id] === o.score} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.score }))} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button type="button" className="btn-primary" disabled={!isComplete(answers)} onClick={submit}>
            <ShieldCheck size={18} /> ประเมินความเสี่ยง
          </button>
          <p className="note-muted">ผลเป็นเพียงแนวทางเบื้องต้น ไม่ใช่คำแนะนำการลงทุนตามเกณฑ์ SEC เต็มรูป</p>
        </div>
      )}
    </section>
  );
}

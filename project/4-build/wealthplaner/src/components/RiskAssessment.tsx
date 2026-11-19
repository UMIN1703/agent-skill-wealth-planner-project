'use client';

// แบบประเมินความเสี่ยง (F007) — ตอบ 5 ข้อ → คำนวณระดับ → เก็บใน localStorage (โชว์ที่การ์ดพอร์ต)
import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { RISK_QUESTIONS, scoreRisk, isComplete, type RiskResult } from '@/lib/risk.ts';
import { RISK_KEY } from '@/components/RiskStat.tsx';

export default function RiskAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<RiskResult | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(RISK_KEY); if (s) setSaved(JSON.parse(s)); } catch { /* ignore */ }
  }, []);

  function submit() {
    if (!isComplete(answers)) return;
    const r = scoreRisk(answers);
    try { localStorage.setItem(RISK_KEY, JSON.stringify(r)); } catch { /* ignore */ }
    setSaved(r);
  }

  if (saved) {
    return (
      <section className="card" aria-live="polite">
        <h2>แบบประเมินความเสี่ยง</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="chip" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-tint)', border: '1px solid var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} />
          </span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{saved.label} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 14 }}>· ระดับ {saved.level}/5</span></div>
            <div className="sub" style={{ fontSize: 12, color: 'var(--muted)' }}>คะแนน {saved.score}/20 — ใช้แนะนำสัดส่วนเป้าหมาย (F006)</div>
          </div>
        </div>
        <button type="button" className="btn-ghost" style={{ marginTop: 14 }} onClick={() => { setSaved(null); setAnswers({}); }}>
          <RefreshCw size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} /> ประเมินใหม่
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>แบบประเมินความเสี่ยง</h2>
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
    </section>
  );
}

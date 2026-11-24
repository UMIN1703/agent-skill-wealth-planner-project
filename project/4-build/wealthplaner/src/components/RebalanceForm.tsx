'use client';

// ฟอร์มปรับสมดุล (F006) — รับ allocation "ของจริง" จาก server (CR-WPN-015 · backlog 4.1)
// gate BR-06: target รวมต้อง = 100% จึงคำนวณ gap · เป้าหมาย: ค่าที่บันทึก > โมเดลตามความเสี่ยง > โมเดลกลาง
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus, Check, Loader2 } from 'lucide-react';
import { CATEGORY_TARGETS, targetsForRisk, CATEGORY_RISK_ORDER, categoryRiskRank, type Allocation } from '@/lib/portfolio.ts';
import { computeRebalanceGap, type Target } from '@/lib/rebalance.ts';
import { AllocationDonut } from '@/components/AllocationDonut.tsx';

const pct = (n: number) => n.toFixed(1) + '%';

export default function RebalanceForm({ alloc, totalTHB, isDemo }: { alloc: Allocation[]; totalTHB: number; isDemo: boolean }) {
  // แสดงทั้งหมวดที่ถือจริง + 7 หมวดมาตรฐาน (จะได้ตั้งเป้าหมวดที่ยังไม่ถือได้) · เรียงตามความเสี่ยง
  const types = [...new Set([...alloc.map((a) => a.type), ...CATEGORY_RISK_ORDER])]
    .sort((a, b) => categoryRiskRank(a) - categoryRiskRank(b));
  const centerLabel = '฿' + (totalTHB / 1e6).toFixed(2) + 'M';

  // เติมเป้าหมายเริ่มต้นจาก CATEGORY_TARGETS (โมเดลกลาง) — ไม่ขึ้น 0 ทั้งแถว
  const [target, setTarget] = useState<Record<string, string>>(() =>
    Object.fromEntries(types.map((t) => {
      const tg = CATEGORY_TARGETS.find((c) => c.category === t);
      return [t, tg ? String(tg.percent) : ''];
    })),
  );

  const anySet = types.some((t) => (target[t] ?? '').trim() !== '');
  const targets: Target[] = types.map((t) => ({ type: t, targetPercent: Number(target[t] || 0) }));
  const sum = targets.reduce((s, t) => s + t.targetPercent, 0);
  const result = computeRebalanceGap(alloc, targets);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [riskLevel, setRiskLevel] = useState<number | null>(null);
  const setT = (type: string, v: string) => { setTarget((m) => ({ ...m, [type]: v })); setSaveState('idle'); };

  const differsFromPreset = riskLevel != null
    && targetsForRisk(riskLevel).some((t) => Number(target[t.category] || 0) !== t.percent);

  // โหลด prefs → เป้าหมายที่บันทึก > โมเดลตามความเสี่ยง > โมเดลกลาง
  useEffect(() => {
    let alive = true;
    fetch('/api/prefs')
      .then((r) => (r.ok ? r.json() : null) as Promise<{ prefs?: { targets?: Record<string, number>; risk?: { level?: number } } } | null>)
      .then((d) => {
        if (!alive || !d?.prefs) return;
        const lvl = d.prefs.risk?.level ?? null;
        setRiskLevel(lvl);
        const saved = d.prefs.targets;
        const next = saved ?? Object.fromEntries(targetsForRisk(lvl).map((t) => [t.category, t.percent]));
        setTarget((m) => {
          const o = { ...m };
          for (const [k, v] of Object.entries(next)) o[k] = String(v);
          return o;
        });
      })
      .catch(() => { /* ยัง login ไม่ครบ/ออฟไลน์ → ใช้ค่าเริ่มต้น */ });
    return () => { alive = false; };
  }, []);

  function applyRiskPreset() {
    if (riskLevel == null) return;
    const preset = Object.fromEntries(targetsForRisk(riskLevel).map((t) => [t.category, String(t.percent)]));
    setTarget((m) => ({ ...m, ...preset }));
    setSaveState('idle');
  }

  async function saveTargets() {
    if (sum !== 100) return;
    setSaveState('saving');
    const map = Object.fromEntries(types.map((t) => [t, Number(target[t] || 0)]));
    try {
      const res = await fetch('/api/prefs', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: map }),
      });
      setSaveState(res.ok ? 'saved' : 'error');
    } catch { setSaveState('error'); }
  }

  return (
    <main className="app">
      <div className="topbar">
        <h1>ปรับสัดส่วน (Rebalance)</h1>
      </div>

      {isDemo && (
        <div className="notice warn" role="note">
          กำลังแสดง<b>พอร์ตตัวอย่าง</b> — เข้าสู่ระบบและเพิ่มสินทรัพย์เพื่อปรับสมดุลพอร์ตจริงของคุณ
        </div>
      )}

      <section className="card">
        <h2>สัดส่วนปัจจุบัน</h2>
        <AllocationDonut allocation={alloc} centerLabel={centerLabel} />
      </section>

      {!anySet && (
        <div className="notice warn" role="note">
          ยังไม่ได้ตั้งเป้าหมาย allocation — กรอกเป้าด้านล่าง หรือ{' '}
          <Link href="/profile/risk" className="inlink">ทำแบบประเมินความเสี่ยง (F007)</Link> เพื่อรับสัดส่วนตัวอย่าง
        </div>
      )}

      <section className="card">
        <h2>เป้าหมายต่อคลาส (รวมต้อง = 100%)</h2>
        {riskLevel != null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {differsFromPreset && (
              <button type="button" className="btn-ghost" style={{ padding: '7px 12px' }} onClick={applyRiskPreset}>
                ↺ คืนค่าที่ระบบแนะนำ · ระดับ {riskLevel}/5
              </button>
            )}
            <span className="note" style={{ margin: 0, fontSize: 11.5, color: 'var(--muted-2)' }}>
              {differsFromPreset ? 'คุณปรับค่าเอง — กดเพื่อคืนค่าที่แนะนำตามความเสี่ยง · ' : 'สัดส่วนนี้แนะนำตามความเสี่ยงของคุณ (แก้ได้) · '}
              แนวทางเบื้องต้น ไม่ใช่คำแนะนำตามเกณฑ์ กลต.
            </span>
          </div>
        ) : (
          <p className="note" style={{ margin: '0 0 10px', fontSize: 12 }}>
            อยากได้สัดส่วนแนะนำอัตโนมัติ? <Link href="/profile/risk" className="inlink">ทำแบบประเมินความเสี่ยง</Link> ก่อน
          </p>
        )}
        {types.map((t) => (
          <div className="trow" key={t}>
            <label htmlFor={'tg-' + t} className="tname">{t}</label>
            <span className="tcur num" aria-label={'ปัจจุบัน ' + t}>
              ปัจจุบัน {pct(alloc.find((a) => a.type === t)?.percent ?? 0)}
            </span>
            <span className="tin">
              <input
                id={'tg-' + t} type="number" inputMode="decimal" step="any" min="0" max="100"
                className="input num" placeholder="0" value={target[t] ?? ''}
                onChange={(e) => setT(t, e.target.value)} aria-label={'เป้าหมาย ' + t + ' เปอร์เซ็นต์'}
              />
              <span aria-hidden="true">%</span>
            </span>
          </div>
        ))}
        <div className={'tsum num' + (anySet && sum !== 100 ? ' bad' : '')} aria-live="polite">
          รวมเป้าหมาย: {pct(sum)}{anySet && sum !== 100 ? ` — ต้องเป็น 100% (${sum > 100 ? 'เกิน' : 'ขาด'} ${pct(Math.abs(100 - sum))})` : ''}
        </div>
        <button
          type="button" className="btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
          disabled={sum !== 100 || saveState === 'saving'} onClick={saveTargets}
        >
          {saveState === 'saving' ? <><Loader2 size={18} className="spin" /> กำลังบันทึก…</>
            : saveState === 'saved' ? <><Check size={18} /> บันทึกเป้าหมายแล้ว</>
            : 'บันทึกเป้าหมาย'}
        </button>
        {saveState === 'saved' && <p className="note" style={{ textAlign: 'center', margin: '6px 0 0' }}>เป้าหมายถูกเก็บถาวร (ซิงค์ทุกเครื่อง) — แท็บ “เป้าหมาย” หน้าพอร์ตจะใช้ค่านี้</p>}
        {saveState === 'error' && <p className="note" style={{ textAlign: 'center', margin: '6px 0 0', color: 'var(--loss)' }}>บันทึกไม่สำเร็จ — ต้องเข้าสู่ระบบ แล้วลองใหม่</p>}
      </section>

      {anySet && !result.ok && (
        <div className="notice error" role="alert">
          เป้าหมายรวม {pct(result.sum)} ยังไม่เท่ากับ 100% — ปรับให้ครบ 100% ก่อน จึงจะคำนวณส่วนต่างที่ต้องปรับได้
        </div>
      )}

      {anySet && result.ok && (
        <section className="card">
          <h2>ต้องปรับอย่างไร</h2>
          {result.rows.map((r) => (
            <div className="grow" key={r.type}>
              <span className="gname">{r.type}</span>
              <span className="gnums num">{pct(r.currentPercent)} → {pct(r.targetPercent)}</span>
              <span className={'gact ' + r.action}>
                {r.action === 'increase' && <><ArrowUp size={14} /> เพิ่ม {pct(Math.abs(r.gap))}</>}
                {r.action === 'decrease' && <><ArrowDown size={14} /> ลด {pct(Math.abs(r.gap))}</>}
                {r.action === 'hold' && <><Minus size={14} /> ตรงเป้า</>}
              </span>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

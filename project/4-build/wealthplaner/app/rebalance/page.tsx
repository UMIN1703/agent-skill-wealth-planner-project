'use client';

// หน้า Allocation & rebalance (F006) — DSN-WPN-001 §5.3
// ต่อ computeRebalanceGap จริง · gate BR-06: target รวมต้อง = 100% จึงคำนวณ gap (AC-E01)
// สถานะ: ยังไม่ตั้งเป้า (ชวนตั้ง/ทำ F007) · เป้ารวม≠100 → เตือน ไม่คำนวณ · ตั้งครบ → gap ต่อคลาส
// mock data (Supabase รอ creds) · ราคาตลาดจริง F003/F004 รอ O1

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Minus, Check, Loader2 } from 'lucide-react';
import { summarizePortfolio, categoryAllocation, CATEGORY_TARGETS } from '@/lib/portfolio.ts';
import { computeRebalanceGap, type Target } from '@/lib/rebalance.ts';
import { sampleAssets } from '@/data/sampleAssets.ts';
import { AllocationDonut } from '@/components/AllocationDonut.tsx';

const pct = (n: number) => n.toFixed(1) + '%';

export default function RebalancePage() {
  const summary = summarizePortfolio(sampleAssets);
  const alloc = categoryAllocation(sampleAssets); // จัดกลุ่มตามหมวด 7 (ETF/SSF/RMF ยุบเข้าหุ้น)
  const types = alloc.map((a) => a.type);
  const centerLabel = '฿' + (summary.totalTHB / 1e6).toFixed(2) + 'M';

  // เติมเป้าหมายเริ่มต้นจาก CATEGORY_TARGETS (ตรงกับแท็บ Targets ในชีต) — ไม่ขึ้น 0 ทั้งแถว
  const [target, setTarget] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      types.map((t) => {
        const tg = CATEGORY_TARGETS.find((c) => c.category === t);
        return [t, tg ? String(tg.percent) : ''];
      }),
    ),
  );

  const anySet = types.some((t) => target[t].trim() !== '');
  const targets: Target[] = types.map((t) => ({ type: t, targetPercent: Number(target[t] || 0) }));
  const sum = targets.reduce((s, t) => s + t.targetPercent, 0);
  const result = computeRebalanceGap(alloc, targets);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const setT = (type: string, v: string) => { setTarget((m) => ({ ...m, [type]: v })); setSaveState('idle'); };

  // โหลดเป้าหมายที่ผู้ใช้เคยบันทึก (sync ข้ามเครื่อง · CR-WPN-012) → ทับค่าเริ่มต้นจากโมเดลกลาง
  useEffect(() => {
    let alive = true;
    fetch('/api/prefs')
      .then((r) => (r.ok ? r.json() : null) as Promise<{ prefs?: { targets?: Record<string, number> } } | null>)
      .then((d) => {
        const saved = d?.prefs?.targets;
        if (!alive || !saved) return;
        setTarget((m) => {
          const next = { ...m };
          for (const [k, v] of Object.entries(saved)) next[k] = String(v);
          return next;
        });
      })
      .catch(() => { /* ยัง login ไม่ครบ/ออฟไลน์ → ใช้ค่าเริ่มต้น */ });
    return () => { alive = false; };
  }, []);

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

      <section className="card">
        <h2>สัดส่วนปัจจุบัน</h2>
        <AllocationDonut allocation={alloc} centerLabel={centerLabel} />
      </section>

      {/* empty state (DSN §5.3): ยังไม่ตั้งเป้า → ชวนตั้ง/ทำแบบประเมิน F007 */}
      {!anySet && (
        <div className="notice warn" role="note">
          ยังไม่ได้ตั้งเป้าหมาย allocation — กรอกเป้าด้านล่าง หรือ{' '}
          <Link href="/profile" className="inlink">ทำแบบประเมินความเสี่ยง (F007)</Link> เพื่อรับสัดส่วนตัวอย่าง
        </div>
      )}

      <section className="card">
        <h2>เป้าหมายต่อคลาส (รวมต้อง = 100%)</h2>
        {types.map((t) => (
          <div className="trow" key={t}>
            <label htmlFor={'tg-' + t} className="tname">{t}</label>
            <span className="tcur num" aria-label={'ปัจจุบัน ' + t}>
              ปัจจุบัน {pct(alloc.find((a) => a.type === t)?.percent ?? 0)}
            </span>
            <span className="tin">
              <input
                id={'tg-' + t} type="number" inputMode="decimal" step="any" min="0" max="100"
                className="input num" placeholder="0" value={target[t]}
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

      {/* error state (F006 AC-E01): เป้ารวม ≠ 100% → ไม่คำนวณ gap */}
      {anySet && !result.ok && (
        <div className="notice error" role="alert">
          เป้าหมายรวม {pct(result.sum)} ยังไม่เท่ากับ 100% — ปรับให้ครบ 100% ก่อน จึงจะคำนวณส่วนต่างที่ต้องปรับได้
        </div>
      )}

      {/* has-data: gap ต่อคลาส + ทิศทาง (▲▼ + คำ, ไม่พึ่งสีอย่างเดียว) */}
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

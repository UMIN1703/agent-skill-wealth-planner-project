'use client';

// หน้า Allocation & rebalance (F006) — DSN-WPN-001 §5.3
// ต่อ computeRebalanceGap จริง · gate BR-06: target รวมต้อง = 100% จึงคำนวณ gap (AC-E01)
// สถานะ: ยังไม่ตั้งเป้า (ชวนตั้ง/ทำ F007) · เป้ารวม≠100 → เตือน ไม่คำนวณ · ตั้งครบ → gap ต่อคลาส
// mock data (Supabase รอ creds) · ราคาตลาดจริง F003/F004 รอ O1

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton.tsx';
import { summarizePortfolio } from '@/lib/portfolio.ts';
import { computeRebalanceGap, type Target } from '@/lib/rebalance.ts';
import { sampleAssets } from '@/data/sampleAssets.ts';
import { AllocationDonut } from '@/components/AllocationDonut.tsx';

const pct = (n: number) => n.toFixed(1) + '%';

export default function RebalancePage() {
  const summary = summarizePortfolio(sampleAssets);
  const types = summary.allocation.map((a) => a.type);
  const centerLabel = '฿' + (summary.totalTHB / 1e6).toFixed(2) + 'M';

  const [target, setTarget] = useState<Record<string, string>>(() =>
    Object.fromEntries(types.map((t) => [t, ''])),
  );

  const anySet = types.some((t) => target[t].trim() !== '');
  const targets: Target[] = types.map((t) => ({ type: t, targetPercent: Number(target[t] || 0) }));
  const sum = targets.reduce((s, t) => s + t.targetPercent, 0);
  const result = computeRebalanceGap(summary.allocation, targets);

  const setT = (type: string, v: string) => setTarget((m) => ({ ...m, [type]: v }));

  return (
    <main className="app">
      <div className="topbar">
        <Link href="/" className="iconbtn" aria-label="กลับไปหน้าพอร์ต"><ArrowLeft size={18} /></Link>
        <h1>ปรับสัดส่วน (Rebalance)</h1>
        <LogoutButton />
      </div>

      <section className="card">
        <h2>สัดส่วนปัจจุบัน</h2>
        <AllocationDonut allocation={summary.allocation} centerLabel={centerLabel} />
      </section>

      {/* empty state (DSN §5.3): ยังไม่ตั้งเป้า → ชวนตั้ง/ทำแบบประเมิน F007 */}
      {!anySet && (
        <div className="notice warn" role="note">
          ยังไม่ได้ตั้งเป้าหมาย allocation — กรอกเป้าด้านล่าง หรือ{' '}
          <Link href="/risk" className="inlink">ทำแบบประเมินความเสี่ยง (F007)</Link> เพื่อรับสัดส่วนตัวอย่าง
        </div>
      )}

      <section className="card">
        <h2>เป้าหมายต่อคลาส (รวมต้อง = 100%)</h2>
        {types.map((t) => (
          <div className="trow" key={t}>
            <label htmlFor={'tg-' + t} className="tname">{t}</label>
            <span className="tcur num" aria-label={'ปัจจุบัน ' + t}>
              ปัจจุบัน {pct(summary.allocation.find((a) => a.type === t)?.percent ?? 0)}
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

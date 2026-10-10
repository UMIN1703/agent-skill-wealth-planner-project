import type { Allocation } from '@/lib/portfolio.ts';

// สี categorical (brand-aligned, validated CVD-safe) — ตาม DSN
const COLORS: Record<string, string> = {
  'หุ้นไทย': '#7B72FF', 'หุ้น ตปท.': '#F982FB', 'ทองคำ': '#C1FD42', 'เงินสด': '#9CA3AF',
};

export function AllocationDonut({ allocation, centerLabel }: { allocation: Allocation[]; centerLabel: string }) {
  const R = 56;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = allocation.map((a) => {
    const frac = a.percent / 100;
    const draw = Math.max(frac * C - 3, 0); // เว้น gap 3
    const seg = { type: a.type, percent: a.percent, color: COLORS[a.type] ?? '#9CA3AF', dash: `${draw} ${C - draw}`, off: -acc };
    acc += frac * C;
    return seg;
  });

  return (
    <div className="donut-wrap">
      <div className="donut">
        <svg viewBox="0 0 130 130" role="img" aria-label="สัดส่วน asset allocation">
          {segs.map((s) => (
            <circle key={s.type} className="seg" cx="65" cy="65" r={R} stroke={s.color}
              strokeDasharray={s.dash} strokeDashoffset={s.off} />
          ))}
        </svg>
        <div className="ctr"><span className="k">พอร์ตรวม</span><span className="v num">{centerLabel}</span></div>
      </div>
      <div className="leg">
        {allocation.map((a) => (
          <div className="l" key={a.type}>
            <span className="sw" style={{ background: COLORS[a.type] ?? '#9CA3AF' }} />
            <span>{a.type}</span>
            <span className="p">{a.percent.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

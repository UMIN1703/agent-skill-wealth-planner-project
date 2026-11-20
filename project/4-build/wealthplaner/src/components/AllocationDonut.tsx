import type { Allocation } from '@/lib/portfolio.ts';

// สี categorical (brand-aligned) — ครอบคลุมทุกประเภทสินทรัพย์ (CR-WPN-008)
const COLORS: Record<string, string> = {
  // ประเภทย่อย
  'หุ้นไทย': '#7B72FF', 'หุ้น ตปท.': '#F982FB', 'ETF': '#4FD1C5', 'กองทุนรวม': '#60A5FA',
  'กองทุน SSF': '#38BDF8', 'กองทุน RMF': '#818CF8', 'ทองคำ': '#C1FD42', 'คริปโต': '#FB923C',
  'เงินสด': '#9CA3AF', 'ตราสารหนี้': '#34D399', 'กองทุนสำรองเลี้ยงชีพ': '#A78BFA',
  'ประกัน': '#F472B6', 'อื่นๆ': '#6B7280',
  // หมวดใหญ่ 7 (ตรงกับ AllocationTabs)
  'หุ้นต่างประเทศ': '#60A5FA', 'เกษียณ': '#4FD1C5', 'เงินสำรองฉุกเฉิน': '#34D399',
};
// fallback แบบ deterministic (ถ้ามี label นอกเหนือ map เช่น หมวด) — ไม่ซ้ำเทาทั้งหมด
const PALETTE = ['#7B72FF', '#F982FB', '#4FD1C5', '#60A5FA', '#C1FD42', '#FB923C', '#34D399', '#A78BFA', '#F472B6', '#38BDF8', '#FBBF24', '#2DD4BF'];
function colorFor(label: string): string {
  if (COLORS[label]) return COLORS[label];
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function AllocationDonut({ allocation, centerLabel }: { allocation: Allocation[]; centerLabel: string }) {
  const R = 56;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = allocation.map((a) => {
    const frac = a.percent / 100;
    const draw = Math.max(frac * C - 3, 0); // เว้น gap 3
    const seg = { type: a.type, percent: a.percent, color: colorFor(a.type), dash: `${draw} ${C - draw}`, off: -acc };
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
            <span className="sw" style={{ background: colorFor(a.type) }} />
            <span>{a.type}</span>
            <span className="p">{a.percent.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

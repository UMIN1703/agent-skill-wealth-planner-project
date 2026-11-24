// กราฟการเติบโตของพอร์ตรายเดือนทั้งปี (CR-WPN-011) — inline SVG ไม่ง้อไลบรารี
// พื้นที่ = ต้นทุนสะสม (จริงจาก createdAt) · เส้น = มูลค่าจริงจาก snapshot (เติมเต็มเมื่อเก็บข้อมูลมากขึ้น)
import type { GrowthSeries } from '@/lib/portfolio.ts';
import Amount from './Amount.tsx';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const LABEL_AT = new Set([0, 3, 6, 9, 11]); // เดือนที่โชว์ป้าย (กันแน่น)

const compact = (n: number) => {
  const a = Math.abs(n);
  return a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k'
    : new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
};

export default function GrowthChart({ series, returnPct, up }: { series: GrowthSeries; returnPct: number; up: boolean }) {
  const { points, currentMonth: cm, currentValue, year } = series;

  // พิกัดกราฟ
  const PL = 12, PR = 308, PT = 16, PB = 132;
  const xs = (m: number) => PL + (m / 11) * (PR - PL);
  const maxV = Math.max(1, ...points.flatMap((p) => [p.cost, p.value ?? 0]));
  const ys = (v: number) => PB - (v / maxV) * (PB - PT);

  const costPts = points.filter((p) => p.month <= cm);
  const areaD = `M ${xs(0)} ${PB} ` + costPts.map((p) => `L ${xs(p.month)} ${ys(p.cost)}`).join(' ') + ` L ${xs(cm)} ${PB} Z`;
  const costD = costPts.map((p, i) => `${i ? 'L' : 'M'} ${xs(p.month)} ${ys(p.cost)}`).join(' ');

  const valPts = points.filter((p) => p.value != null && p.month <= cm) as { month: number; value: number }[];
  const valD = valPts.map((p, i) => `${i ? 'L' : 'M'} ${xs(p.month)} ${ys(p.value)}`).join(' ');
  const last = valPts[valPts.length - 1];

  const grid = [0, 1, 2, 3].map((i) => PT + (i / 3) * (PB - PT));

  return (
    <section className="card" style={{ paddingBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>การเติบโตของพอร์ต · {year + 543}</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>
            ฿<Amount>{compact(currentValue)}</Amount>
          </div>
        </div>
        <span className="num" style={{
          fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap',
          color: up ? 'var(--gain)' : 'var(--loss)',
          background: up ? 'color-mix(in srgb, var(--gain) 14%, transparent)' : 'color-mix(in srgb, var(--loss) 14%, transparent)',
        }}>
          {up ? '▲' : '▼'} {up ? '+' : '−'}{Math.abs(returnPct).toFixed(1)}%
        </span>
      </div>

      <svg viewBox="0 0 320 156" role="img" aria-label={`กราฟการเติบโตของพอร์ตปี ${year + 543}`}
           style={{ width: '100%', height: 'auto', display: 'block', marginTop: 8 }}>
        {grid.map((y, i) => (
          <line key={i} x1={PL} y1={y} x2={PR} y2={y} stroke="var(--border)" strokeWidth="1" opacity="0.6" />
        ))}
        {/* ต้นทุนสะสม — พื้นที่ + เส้น */}
        <path d={areaD} fill="var(--brand)" opacity="0.14" />
        <path d={costD} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
        {/* มูลค่าจริง — เส้นเน้น + จุดล่าสุด */}
        {valPts.length > 1 && (
          <path d={valD} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {last && <circle cx={xs(last.month)} cy={ys(last.value)} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />}
        {/* ป้ายเดือน */}
        {points.filter((p) => LABEL_AT.has(p.month)).map((p) => (
          <text key={p.month} x={xs(p.month)} y="150" textAnchor="middle" fontSize="9" fill="var(--muted-2)">{MONTHS[p.month]}</text>
        ))}
      </svg>

      <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--brand)', opacity: 0.85 }} /> ต้นทุนสะสม
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} /> มูลค่าจริง
        </span>
      </div>

      {!series.hasValueHistory && (
        <p className="note" style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5 }}>
          เส้นมูลค่าจริงจะละเอียดขึ้นเมื่อระบบเก็บข้อมูลแต่ละเดือน (เริ่มเก็บแล้ววันนี้) · เส้นต้นทุนสะสมมาจากวันที่เพิ่มรายการจริง
        </p>
      )}
    </section>
  );
}

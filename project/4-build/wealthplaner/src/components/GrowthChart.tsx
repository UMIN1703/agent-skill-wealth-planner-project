'use client';

// กราฟการเติบโตของพอร์ตรายเดือนทั้งปี (CR-WPN-011 · ข้อ 8: แตะดูค่าต่อเดือน + สลับปี)
// inline SVG ไม่ง้อไลบรารี · พื้นที่ = ต้นทุนสะสม (จริงจาก createdAt) · เส้น = มูลค่าจริงจาก snapshot
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GrowthSeries } from '@/lib/portfolio.ts';
import { compact } from '@/lib/format.ts';
import Amount from './Amount.tsx';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const LABEL_AT = new Set([0, 3, 6, 9, 11]);

// พิกัดกราฟ
const PL = 12, PR = 308, PT = 16, PB = 132, VB_W = 320;
const xs = (m: number) => PL + (m / 11) * (PR - PL);

export default function GrowthChart(
  { seriesByYear, nowYear, returnPct, up }:
  { seriesByYear: GrowthSeries[]; nowYear: number; returnPct: number; up: boolean },
) {
  const [yearIdx, setYearIdx] = useState(seriesByYear.length - 1); // เริ่มที่ปีล่าสุด
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const series = seriesByYear[yearIdx];
  const { points, currentMonth: cm, year } = series;
  const isNow = year === nowYear;

  const maxV = Math.max(1, ...points.flatMap((p) => [p.cost, p.value ?? 0]));
  const ys = (v: number) => PB - (v / maxV) * (PB - PT);

  const costPts = points.filter((p) => p.month <= cm);
  const areaD = `M ${xs(0)} ${PB} ` + costPts.map((p) => `L ${xs(p.month)} ${ys(p.cost)}`).join(' ') + ` L ${xs(cm)} ${PB} Z`;
  const costD = costPts.map((p, i) => `${i ? 'L' : 'M'} ${xs(p.month)} ${ys(p.cost)}`).join(' ');

  const valPts = points.filter((p) => p.value != null && p.month <= cm) as { month: number; value: number }[];
  const valD = valPts.map((p, i) => `${i ? 'L' : 'M'} ${xs(p.month)} ${ys(p.value)}`).join(' ');
  const lastVal = valPts[valPts.length - 1];

  // มูลค่าที่โชว์หัวการ์ด = ค่าล่าสุดของปีที่เลือก (ปีนี้ = ปัจจุบัน · ปีก่อน = ปลายปี)
  const headVal = lastVal?.value ?? series.currentValue;

  const grid = [0, 1, 2, 3].map((i) => PT + (i / 3) * (PB - PT));
  const act = active != null ? points[active] : null;

  // แปลงตำแหน่งนิ้ว/เมาส์ → เดือน (0..cm)
  function pick(clientX: number) {
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vbX = ((clientX - rect.left) / rect.width) * VB_W;
    const m = Math.round(((vbX - PL) / (PR - PL)) * 11);
    setActive(Math.max(0, Math.min(cm, m)));
  }

  // ตำแหน่ง tooltip (%) — clamp กันล้นขอบ
  const tipLeft = act ? Math.max(14, Math.min(86, (xs(act.month) / VB_W) * 100)) : 50;

  return (
    <section className="card" style={{ paddingBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            การเติบโตของพอร์ต{isNow ? '' : ' · ปลายปี'}
          </div>
          <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>
            ฿<Amount>{compact(headVal)}</Amount>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {seriesByYear.length > 1 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <button type="button" aria-label="ปีก่อนหน้า" onClick={() => { setYearIdx((i) => Math.max(0, i - 1)); setActive(null); }}
                disabled={yearIdx === 0} className="icon-btn sm">
                <ChevronLeft size={16} />
              </button>
              <span className="num" style={{ fontSize: 13, minWidth: 38, textAlign: 'center' }}>{year + 543}</span>
              <button type="button" aria-label="ปีถัดไป" onClick={() => { setYearIdx((i) => Math.min(seriesByYear.length - 1, i + 1)); setActive(null); }}
                disabled={yearIdx === seriesByYear.length - 1} className="icon-btn sm">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          {isNow && (
            <span className="num" style={{
              fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap',
              color: up ? 'var(--gain)' : 'var(--loss)',
              background: up ? 'color-mix(in srgb, var(--gain) 14%, transparent)' : 'color-mix(in srgb, var(--loss) 14%, transparent)',
            }}>
              {up ? '▲' : '▼'} {up ? '+' : '−'}{Math.abs(returnPct).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 8 }}>
        {/* tooltip */}
        {act && (
          <div style={{
            position: 'absolute', top: -2, left: `${tipLeft}%`, transform: 'translateX(-50%)',
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '6px 10px', fontSize: 11.5, lineHeight: 1.5, pointerEvents: 'none', zIndex: 2, whiteSpace: 'nowrap',
            boxShadow: '0 6px 18px rgba(0,0,0,.35)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{MONTHS[act.month]} {year + 543}</div>
            <div style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--brand)' }}>●</span> ต้นทุน ฿<Amount>{compact(act.cost)}</Amount>
            </div>
            <div style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--accent)' }}>●</span> มูลค่า {act.value != null ? <>฿<Amount>{compact(act.value)}</Amount></> : '—'}
            </div>
          </div>
        )}

        <svg ref={svgRef} viewBox="0 0 320 156" role="img" aria-label={`กราฟการเติบโตของพอร์ตปี ${year + 543}`}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
          onPointerDown={(e) => pick(e.clientX)}
          onPointerMove={(e) => { if (e.buttons || e.pointerType !== 'mouse') pick(e.clientX); }}
          onPointerUp={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
          onMouseMove={(e) => pick(e.clientX)}
        >
          {grid.map((y, i) => (
            <line key={i} x1={PL} y1={y} x2={PR} y2={y} stroke="var(--border)" strokeWidth="1" opacity="0.6" />
          ))}
          <path d={areaD} fill="var(--brand)" opacity="0.14" />
          <path d={costD} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
          {valPts.length > 1 && (
            <path d={valD} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          )}
          {lastVal && <circle cx={xs(lastVal.month)} cy={ys(lastVal.value)} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />}

          {/* crosshair เดือนที่เลือก */}
          {act && (
            <>
              <line x1={xs(act.month)} y1={PT} x2={xs(act.month)} y2={PB} stroke="var(--muted-2)" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
              <circle cx={xs(act.month)} cy={ys(act.cost)} r="3.5" fill="var(--brand)" stroke="var(--surface)" strokeWidth="1.5" />
              {act.value != null && <circle cx={xs(act.month)} cy={ys(act.value)} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />}
            </>
          )}

          {points.filter((p) => LABEL_AT.has(p.month)).map((p) => (
            <text key={p.month} x={xs(p.month)} y="150" textAnchor="middle" fontSize="9" fill="var(--muted-2)">{MONTHS[p.month]}</text>
          ))}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--brand)', opacity: 0.85 }} /> ต้นทุนสะสม
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} /> มูลค่าจริง
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-2)' }}>แตะกราฟเพื่อดูค่าต่อเดือน</span>
      </div>

      {!series.hasValueHistory && (
        <p className="note" style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5 }}>
          เส้นมูลค่าจริงจะละเอียดขึ้นเมื่อระบบเก็บข้อมูลแต่ละเดือน (เริ่มเก็บแล้ววันนี้) · เส้นต้นทุนสะสมมาจากวันที่เพิ่มรายการจริง
        </p>
      )}
    </section>
  );
}

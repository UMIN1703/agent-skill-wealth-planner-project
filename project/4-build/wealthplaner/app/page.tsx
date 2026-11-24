import { summarizePortfolio, taxDeductionSummary, categoryAllocation, CATEGORY_TARGETS, categoryRiskRank, buildGrowthSeries } from '@/lib/portfolio.ts';
import AllocationTabs, { type AllocRow } from '@/components/AllocationTabs.tsx';
import RiskStat from '@/components/RiskStat.tsx';
import PortfolioHero from '@/components/PortfolioHero.tsx';
import GrowthChart from '@/components/GrowthChart.tsx';
import Amount from '@/components/Amount.tsx';
import { loadAssets } from '@/lib/portfolioData.ts';
import { listSnapshots, recordSnapshot, getPrefs } from '@/lib/supabase.ts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // ข้อมูลเฉพาะผู้ใช้ — เรนเดอร์สดทุกครั้ง

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
// ย่อเลขให้พอดีการ์ดสถิติ (฿1.58M / ฿420k / ฿9,800)
const compact = (n: number) => {
  const a = Math.abs(n);
  return a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k' : fmt(n);
};

// หน้า Portfolio (F002) — restyle · ยอดจริงจาก Supabase (CR-WPN-006) · ยังไม่ตั้งค่า → เดโม
export default async function PortfolioPage() {
  const { assets, isDemo, userKey } = await loadAssets();

  const s = summarizePortfolio(assets);
  const cost = s.totalTHB - s.totalIncomeTHB;
  const incomePct = cost > 0 ? (s.totalIncomeTHB / cost) * 100 : 0;
  const up = s.totalIncomeTHB >= 0;

  // กราฟการเติบโต (CR-WPN-011): บันทึก snapshot ของวันนี้ (ของจริงเท่านั้น) แล้วอ่านประวัติมาวาด
  const year = new Date().getFullYear();
  let growth = null;
  if (!s.isEmpty) {
    if (!isDemo && userKey) await recordSnapshot(userKey, cost, s.totalTHB); // best-effort (ไม่ throw)
    const snaps = !isDemo && userKey ? await listSnapshots(userKey) : [];
    growth = buildGrowthSeries(assets, snaps, year, cost, s.totalTHB);
  }

  const taxRows = taxDeductionSummary(assets);

  // prefs (ความเสี่ยง + เป้าหมาย) ของผู้ใช้ — sync ข้ามเครื่อง (CR-WPN-012)
  const prefs = userKey ? await getPrefs(userKey) : null;

  // สัดส่วนตามหมวด (ปัจจุบัน) + เป้าหมาย → รวมเป็นแถวให้ AllocationTabs
  // เป้าหมาย: ใช้ค่าที่ผู้ใช้บันทึกไว้ (prefs.targets) ถ้ามี, ไม่งั้นโมเดลกลาง CATEGORY_TARGETS
  const catAlloc = categoryAllocation(assets);
  const savedTargets = prefs?.targets ?? null;
  const tgt = new Map(
    savedTargets ? Object.entries(savedTargets) : CATEGORY_TARGETS.map((t) => [t.category, t.percent] as [string, number]),
  );
  const targetNames = savedTargets ? Object.keys(savedTargets) : CATEGORY_TARGETS.map((t) => t.category);
  const names = [...new Set([...catAlloc.map((a) => a.type), ...targetNames])];
  const allocRows: AllocRow[] = names
    .map((name) => {
      const a = catAlloc.find((x) => x.type === name);
      return { name, curPct: a?.percent ?? 0, curValueTHB: a?.valueTHB ?? 0, tgtPct: tgt.get(name) ?? 0 };
    })
    .sort((x, y) => categoryRiskRank(x.name) - categoryRiskRank(y.name)); // เรียงตามความเสี่ยงน้อย→มาก

  return (
    <main className="app">
      <div className="topbar">
        <h1>พอร์ตรวมทุกโบรก</h1>
      </div>

      <PortfolioHero totalTHB={s.totalTHB} incomeTHB={s.totalIncomeTHB} incomePct={incomePct} />

      <div className="pf-stats">
        <div className="pf-stat"><span className="t">ต้นทุนรวม</span><span className="p num">฿<Amount>{compact(cost)}</Amount></span></div>
        <div className="pf-stat"><span className="t">Total P&amp;L</span><span className={'p num ' + (up ? 'g' : 'l')}>{up ? '+' : '−'}฿<Amount>{compact(Math.abs(s.totalIncomeTHB))}</Amount></span></div>
        <RiskStat initial={prefs?.risk ? { level: prefs.risk.level, short: prefs.risk.short } : null} />
      </div>

      {growth && <GrowthChart series={growth} returnPct={incomePct} up={up} />}

      {!s.isEmpty && <AllocationTabs rows={allocRows} />}

      {taxRows.length > 0 && (
        <section className="card">
          <h2>สิทธิลดหย่อนภาษี (ต้นทุนที่ลงทุน)</h2>
          {taxRows.map((t) => (
            <div key={t.bucket} className="arow">
              <span className="nm">{t.bucket}</span>
              <span className="rt"><div className="price num">฿<Amount>{compact(t.costTHB)}</Amount></div></span>
            </div>
          ))}
        </section>
      )}

      {isDemo && <p className="note" style={{ textAlign: 'center' }}>ข้อมูลเดโม (ตัวอย่าง) — เพิ่มสินทรัพย์หรือนำเข้าชีตเพื่อดูพอร์ตจริงของคุณ</p>}
    </main>
  );
}

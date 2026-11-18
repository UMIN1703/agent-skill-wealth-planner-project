import { summarizePortfolio, marketValueTHB } from '@/lib/portfolio.ts';
import { computeIncomePercent } from '@/lib/finance.ts';
import { sampleAssets } from '@/data/sampleAssets.ts';
import { AllocationDonut } from '@/components/AllocationDonut.tsx';
import PortfolioHero from '@/components/PortfolioHero.tsx';
import AssetList, { type AssetRowData } from '@/components/AssetList.tsx';
import LogoutButton from '@/components/LogoutButton.tsx';
import { auth } from '@/auth.ts';
import { listHoldings, userKeyFromSession } from '@/lib/supabase.ts';

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
  const session = await auth();
  const userKey = userKeyFromSession(session);
  const real = userKey ? await listHoldings(userKey) : null;
  const assets = real ?? sampleAssets;
  const isDemo = real === null;

  const s = summarizePortfolio(assets);
  const cost = s.totalTHB - s.totalIncomeTHB;
  const incomePct = cost > 0 ? (s.totalIncomeTHB / cost) * 100 : 0;
  const up = s.totalIncomeTHB >= 0;
  const centerLabel = '฿' + compact(s.totalTHB);

  const rows: AssetRowData[] = assets.map((a) => ({
    name: a.name, broker: a.brokerChannel, type: a.type, valueTHB: marketValueTHB(a),
    pct: computeIncomePercent(a), stale: a.updatedMin > 15,
  }));

  return (
    <main className="app">
      <div className="topbar">
        <h1>พอร์ตรวมทุกโบรก</h1>
        <span className="topbar-actions"><LogoutButton /></span>
      </div>

      <PortfolioHero totalTHB={s.totalTHB} incomeTHB={s.totalIncomeTHB} incomePct={incomePct} />

      <div className="pf-stats">
        <div className="pf-stat"><span className="t">ต้นทุนรวม</span><span className="p num">฿{compact(cost)}</span></div>
        <div className="pf-stat"><span className="t">กำไร/ขาดทุน</span><span className={'p num ' + (up ? 'g' : 'l')}>{up ? '+' : '−'}฿{compact(Math.abs(s.totalIncomeTHB))}</span></div>
        <div className="pf-stat"><span className="t">สินทรัพย์</span><span className="p num">{assets.length}</span></div>
      </div>

      {!s.isEmpty && (
        <section className="card">
          <h2>สัดส่วน Asset Allocation</h2>
          <AllocationDonut allocation={s.allocation} centerLabel={centerLabel} />
        </section>
      )}

      <AssetList rows={rows} totalTHB={s.totalTHB} />

      {isDemo && <p className="note" style={{ textAlign: 'center' }}>ข้อมูลเดโม — เชื่อมฐานข้อมูลเพื่อดูยอดจริงของคุณ</p>}
    </main>
  );
}

import { Briefcase, RefreshCw } from 'lucide-react';
import { summarizePortfolio, marketValueTHB } from '@/lib/portfolio.ts';
import { computeIncomePercent } from '@/lib/finance.ts';
import { sampleAssets } from '@/data/sampleAssets.ts';
import { AllocationDonut } from '@/components/AllocationDonut.tsx';
import { AssetRow } from '@/components/AssetRow.tsx';
import { ActionButtons } from '@/components/ActionButtons.tsx';
import LogoutButton from '@/components/LogoutButton.tsx';
import { auth } from '@/auth.ts';
import { listHoldings, userKeyFromSession } from '@/lib/supabase.ts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // ข้อมูลเฉพาะผู้ใช้ — เรนเดอร์สดทุกครั้ง (ไม่ cache)

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

// หน้า Portfolio (F002) — ยอดจริงจาก Supabase ของผู้ใช้ (CR-WPN-006) · ยังไม่ตั้งค่า → sampleAssets (เดโม)
export default async function PortfolioPage() {
  const session = await auth();
  const userKey = userKeyFromSession(session);
  const real = userKey ? await listHoldings(userKey) : null; // null = ยังไม่ตั้งค่า Supabase → เดโม
  const assets = real ?? sampleAssets;
  const isDemo = real === null;

  const s = summarizePortfolio(assets);
  const cost = s.totalTHB - s.totalIncomeTHB;
  const incomePct = cost > 0 ? (s.totalIncomeTHB / cost) * 100 : 0;
  const up = s.totalIncomeTHB >= 0;
  const centerLabel = '฿' + (s.totalTHB / 1e6).toFixed(2) + 'M';

  return (
    <main className="app">
      <div className="topbar">
        <h1>พอร์ตรวมทุกโบรก</h1>
        <span className="topbar-actions">
          <button className="refresh" aria-label="รีเฟรชราคา"><RefreshCw size={16} /></button>
          <LogoutButton />
        </span>
      </div>

      <section className="balance">
        <div className="bhead">
          <span className="chip"><Briefcase size={20} /></span>
          <span className="k">มูลค่าพอร์ตรวม</span>
        </div>
        <div className="v num"><span className="cur">฿</span>{fmt(s.totalTHB)}</div>
        <span className="delta up num">
          {up ? '▲' : '▼'} {up ? '+' : '−'}฿{fmt(Math.abs(s.totalIncomeTHB))} ({up ? '+' : '−'}{Math.abs(incomePct).toFixed(2)}%)
        </span>
        <div className="status"><span className="dot" /> {isDemo ? 'ข้อมูลเดโม (ยังไม่เชื่อมฐานข้อมูล)' : 'ยอดจริงจากบัญชีคุณ'}</div>
      </section>

      <ActionButtons />

      <section className="card">
        <h2>สัดส่วน Asset Allocation</h2>
        <AllocationDonut allocation={s.allocation} centerLabel={centerLabel} />
      </section>

      <section className="card">
        <h2>สินทรัพย์ (ข้ามโบรก)</h2>
        {assets.length === 0 ? (
          <p className="empty">ยังไม่มีสินทรัพย์ — ส่งสลิปเข้า LINE หรือกด “เพิ่มสินทรัพย์” เพื่อเริ่มพอร์ต</p>
        ) : assets.map((a, i) => (
          <AssetRow
            key={a.name + a.brokerChannel + i}
            name={a.name}
            broker={a.brokerChannel}
            valueTHB={marketValueTHB(a)}
            percent={computeIncomePercent(a)}
            stale={a.updatedMin > 15}
          />
        ))}
      </section>
    </main>
  );
}

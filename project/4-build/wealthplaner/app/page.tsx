import Link from 'next/link';
import { Briefcase, RefreshCw, Plus, Scale, FileUp } from 'lucide-react';
import { summarizePortfolio, marketValueTHB } from '@/lib/portfolio.ts';
import { computeIncomePercent } from '@/lib/finance.ts';
import { sampleAssets } from '@/data/sampleAssets.ts';
import { AllocationDonut } from '@/components/AllocationDonut.tsx';
import { AssetRow } from '@/components/AssetRow.tsx';
import { ActionButtons } from '@/components/ActionButtons.tsx';
import LogoutButton from '@/components/LogoutButton.tsx';

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

// หน้า Portfolio (F002) — คำนวณจาก portfolio.ts จริง · mock data (Supabase รอ creds)
export default function PortfolioPage() {
  const s = summarizePortfolio(sampleAssets);
  const cost = s.totalTHB - s.totalIncomeTHB;
  const incomePct = cost > 0 ? (s.totalIncomeTHB / cost) * 100 : 0;
  const up = s.totalIncomeTHB >= 0;
  const centerLabel = '฿' + (s.totalTHB / 1e6).toFixed(2) + 'M';

  return (
    <main className="app">
      <div className="topbar">
        <h1>พอร์ตรวมทุกโบรก</h1>
        <span className="topbar-actions">
          <Link href="/import" className="iconbtn" aria-label="นำเข้าจากสเปรดชีต"><FileUp size={18} /></Link>
          <Link href="/rebalance" className="iconbtn" aria-label="ปรับสัดส่วน (rebalance)"><Scale size={18} /></Link>
          <Link href="/add" className="iconbtn accent" aria-label="เพิ่มสินทรัพย์"><Plus size={18} /></Link>
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
        <div className="status"><span className="dot" /> ออนไลน์ · อัปเดตแล้ว</div>
      </section>

      <ActionButtons />

      <section className="card">
        <h2>สัดส่วน Asset Allocation</h2>
        <AllocationDonut allocation={s.allocation} centerLabel={centerLabel} />
      </section>

      <section className="card">
        <h2>สินทรัพย์ (ข้ามโบรก)</h2>
        {sampleAssets.map((a) => (
          <AssetRow
            key={a.name + a.brokerChannel}
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

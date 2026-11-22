// หน้าสินทรัพย์ (F001/F002) — รายการที่ถือปัจจุบัน แยกตามหมวด (เทียบแท็บ Assets ในชีต)
// ยอดจริงจาก Supabase (CR-WPN-006) ผ่าน loadAssets · ยังไม่ตั้งค่า → พอร์ตเดโม
import Link from 'next/link';
import { FileUp } from 'lucide-react';
import { summarizePortfolio, marketValueTHB } from '@/lib/portfolio.ts';
import { computeIncomePercent } from '@/lib/finance.ts';
import AssetList, { type AssetRowData } from '@/components/AssetList.tsx';
import { loadAssets } from '@/lib/portfolioData.ts';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AssetsPage() {
  const { assets, isDemo } = await loadAssets();
  const s = summarizePortfolio(assets);

  const rows: AssetRowData[] = assets.map((a) => ({
    id: a.id, name: a.name, broker: a.brokerChannel, group: a.category ?? a.type,
    quantity: a.quantity, costPrice: a.costPrice, currentPrice: a.marketPrice, note: a.note,
    valueTHB: marketValueTHB(a), pct: computeIncomePercent(a), stale: a.updatedMin > 15,
  }));

  return (
    <main className="app">
      <div className="topbar">
        <h1>สินทรัพย์</h1>
        <span className="topbar-actions">
          <Link href="/import" className="btn-ghost" aria-label="นำเข้าจากชีต" style={{ padding: 8, borderRadius: 999 }}><FileUp size={18} /></Link>
        </span>
      </div>

      <AssetList rows={rows} totalTHB={s.totalTHB} />

      {isDemo && <p className="note" style={{ textAlign: 'center' }}>ข้อมูลเดโม (ตัวอย่าง) — เพิ่มสินทรัพย์หรือนำเข้าชีตเพื่อดูพอร์ตจริงของคุณ</p>}
    </main>
  );
}

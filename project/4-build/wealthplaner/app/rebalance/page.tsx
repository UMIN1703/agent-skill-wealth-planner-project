// หน้า Allocation & rebalance (F006) — โหลด allocation ของจริงจากพอร์ต (CR-WPN-015 · backlog 4.1)
// server: ดึงพอร์ตจริง (loadAssets) → ส่งให้ RebalanceForm (client) จัดการฟอร์มเป้าหมาย
import { loadAssets } from '@/lib/portfolioData.ts';
import { summarizePortfolio, categoryAllocation } from '@/lib/portfolio.ts';
import RebalanceForm from '@/components/RebalanceForm.tsx';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function RebalancePage() {
  const { assets, isDemo } = await loadAssets();
  const alloc = categoryAllocation(assets);
  const totalTHB = summarizePortfolio(assets).totalTHB;
  return <RebalanceForm alloc={alloc} totalTHB={totalTHB} isDemo={isDemo} />;
}

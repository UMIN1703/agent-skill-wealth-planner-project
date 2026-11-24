// โหลดสินทรัพย์ของผู้ใช้ (Supabase) หรือ fallback เป็นพอร์ตเดโม
// ใช้ร่วมกันระหว่างหน้า / (ภาพรวม) กับ /assets (รายการสินทรัพย์) — logic เดียว ไม่หลุดจากกัน
import { auth } from '@/auth.ts';
import { listHoldings, resolveUserKey } from '@/lib/supabase.ts';
import { sampleAssets, type DisplayAsset } from '@/data/sampleAssets.ts';

export async function loadAssets(): Promise<{ assets: DisplayAsset[]; isDemo: boolean; userKey: string | null }> {
  const session = await auth();
  const userKey = await resolveUserKey(session);
  const real = userKey ? await listHoldings(userKey) : null;
  // ยังไม่มีข้อมูลจริง (ยังไม่เชื่อม / ล็อกเอาต์ / พอร์ตว่าง) → ใช้พอร์ตตัวอย่าง (ป้ายเดโม)
  const useDemo = !real || real.length === 0;
  return { assets: useDemo ? sampleAssets : real, isDemo: useDemo, userKey };
}

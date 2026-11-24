// โหลดสินทรัพย์ของผู้ใช้ (Supabase) หรือ fallback เป็นพอร์ตเดโม
// ใช้ร่วมกันระหว่างหน้า / (ภาพรวม) กับ /assets (รายการสินทรัพย์) — logic เดียว ไม่หลุดจากกัน
// CR-WPN-014: เติมราคา/เรตสดให้ของจริง (FX USD/THB · คริปโต · หุ้น ตปท.) — best-effort
import { auth } from '@/auth.ts';
import { listHoldings, resolveUserKey } from '@/lib/supabase.ts';
import { sampleAssets, type DisplayAsset } from '@/data/sampleAssets.ts';
import { getUsdThb, getCryptoPrices, getStockQuotesUsd, cryptoSymbolFromName } from '@/lib/prices.ts';

const isUsd = (a: DisplayAsset) => (a.currency ?? '').toUpperCase() === 'USD';
const isCrypto = (a: DisplayAsset) => a.category === 'คริปโต' || a.type === 'คริปโต';
const isForeignStock = (a: DisplayAsset) => a.category === 'หุ้นต่างประเทศ' || (a.type ?? '').includes('ตปท');

/** เดา ticker หุ้นจากชื่อ (คอนเซอร์เวทีฟ) — ตัวพิมพ์ใหญ่ 1–5 ตัวติดกัน · ไม่พบ → null */
function tickerFromName(name: string): string | null {
  const m = name.toUpperCase().match(/\b[A-Z]{1,5}\b/);
  return m ? m[0] : null;
}

/** เติมราคา/เรตสดลงในรายการ (ไม่แก้ต้นทุน) — ล้มเหลว/ไม่มี key → คงราคาที่กรอกเอง */
async function applyLivePrices(assets: DisplayAsset[]): Promise<{ assets: DisplayAsset[]; usdThb: number | null }> {
  const cryptoSyms = assets.filter(isCrypto).map((a) => cryptoSymbolFromName(a.name)).filter((s): s is string => !!s);
  const stockSyms = assets.filter(isForeignStock).map((a) => tickerFromName(a.name)).filter((s): s is string => !!s);

  const [usdThb, cryptoPrices, stockQuotes] = await Promise.all([
    getUsdThb(),
    cryptoSyms.length ? getCryptoPrices(cryptoSyms) : Promise.resolve({} as Record<string, { usd: number; thb: number }>),
    stockSyms.length ? getStockQuotesUsd(stockSyms) : Promise.resolve({} as Record<string, number>),
  ]);

  const out = assets.map((a) => {
    const copy: DisplayAsset = { ...a };
    if (isUsd(a) && usdThb) copy.valueFx = usdThb; // มูลค่าสกุล USD → แปลงด้วยเรตสด (ต้นทุนคงเรตเดิม)

    if (isCrypto(a)) {
      const sym = cryptoSymbolFromName(a.name);
      const p = sym ? cryptoPrices[sym] : undefined;
      if (p) {
        if (isUsd(a)) { copy.marketPrice = p.usd; if (usdThb) copy.valueFx = usdThb; }
        else { copy.marketPrice = p.thb; copy.valueFx = 1; } // สกุลบาท → ราคาเป็นบาทตรง
      }
    } else if (isForeignStock(a)) {
      const sym = tickerFromName(a.name);
      const q = sym ? stockQuotes[sym] : undefined;
      if (q != null) { copy.marketPrice = q; if (usdThb) copy.valueFx = usdThb; } // Finnhub = USD
    }
    return copy;
  });
  return { assets: out, usdThb };
}

export async function loadAssets(): Promise<{ assets: DisplayAsset[]; isDemo: boolean; userKey: string | null; usdThb: number | null }> {
  const session = await auth();
  const userKey = await resolveUserKey(session);
  const real = userKey ? await listHoldings(userKey) : null;
  // ยังไม่มีข้อมูลจริง (ยังไม่เชื่อม / ล็อกเอาต์ / พอร์ตว่าง) → ใช้พอร์ตตัวอย่าง (ป้ายเดโม · ไม่ยิง API สด)
  if (!real || real.length === 0) return { assets: sampleAssets, isDemo: true, userKey, usdThb: null };

  const live = await applyLivePrices(real);
  return { assets: live.assets, isDemo: false, userKey, usdThb: live.usdThb };
}

// WealthPlanner — ดึงราคา/อัตราแลกเปลี่ยนสด (F003/F004 · CR-WPN-014)
// แหล่งฟรี: FX = frankfurter.app (ECB, ไม่ต้อง key) · คริปโต = CoinGecko (ไม่ต้อง key)
//          หุ้น/ETF ตปท. = Finnhub (ต้องมี FINNHUB_API_KEY ใน env · ไม่มี key → ข้าม)
// ทุกฟังก์ชัน best-effort: ล้มเหลว/ไม่มี key → คืน null/{} แล้ว caller fallback ราคาที่กรอกเอง
import { getVar } from './cfEnv.ts';

const REVALIDATE_FX = 3600;    // FX เปลี่ยนช้า → cache 1 ชม.
const REVALIDATE_PRICE = 300;  // ราคาสินทรัพย์ → cache 5 นาที

async function jget(url: string, revalidate: number, init?: RequestInit): Promise<unknown | null> {
  try {
    const res = await fetch(url, { ...init, next: { revalidate } } as RequestInit);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** อัตราแลกเปลี่ยน USD→THB ล่าสุด · ล้มเหลว → null */
export async function getUsdThb(): Promise<number | null> {
  const d = await jget('https://api.frankfurter.dev/v1/latest?base=USD&symbols=THB', REVALIDATE_FX) as { rates?: { THB?: number } } | null;
  const r = d?.rates?.THB;
  return typeof r === 'number' && r > 0 ? r : null;
}

// ── คริปโต (CoinGecko) ───────────────────────────────────────────────────────
// map สัญลักษณ์ยอดนิยม → coingecko id (คอนเซอร์เวทีฟ: ใช้เฉพาะที่ชัวร์)
const CRYPTO_ID: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', BNB: 'binancecoin', SOL: 'solana',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', USDC: 'usd-coin', TRX: 'tron',
  TON: 'the-open-network', DOT: 'polkadot', MATIC: 'matic-network', LTC: 'litecoin',
  AVAX: 'avalanche-2', LINK: 'chainlink', NEAR: 'near', ATOM: 'cosmos', XLM: 'stellar',
  BCH: 'bitcoin-cash', UNI: 'uniswap', APT: 'aptos', ARB: 'arbitrum', OP: 'optimism',
};
// ชื่อไทย/ยาว → สัญลักษณ์
const NAME_ALIAS: Record<string, string> = {
  'บิทคอยน์': 'BTC', 'บิตคอยน์': 'BTC', 'บิดคอย': 'BTC', 'อีเธอเรียม': 'ETH', 'อีเธอร์': 'ETH',
  'โซลานา': 'SOL', 'ริปเปิล': 'XRP', 'โดช': 'DOGE', 'ดอจ': 'DOGE',
};

/** เดาสัญลักษณ์คริปโตจากชื่อรายการ (คอนเซอร์เวทีฟ) · ไม่พบ → null */
export function cryptoSymbolFromName(name: string): string | null {
  const upper = name.toUpperCase();
  for (const sym of Object.keys(CRYPTO_ID)) {
    // ตรงเป็น "คำ" (กันจับ ETH ใน ETHER ผิด ๆ ก็ยังโอเคเพราะ map ETH อยู่แล้ว)
    if (new RegExp(`(^|[^A-Z])${sym}([^A-Z]|$)`).test(upper)) return sym;
  }
  for (const [th, sym] of Object.entries(NAME_ALIAS)) if (name.includes(th)) return sym;
  return null;
}

/** ราคาคริปโตล่าสุด (USD + THB) ตามสัญลักษณ์ · คืน { SYM: {usd,thb} } เฉพาะที่หาได้ */
export async function getCryptoPrices(symbols: string[]): Promise<Record<string, { usd: number; thb: number }>> {
  const ids = [...new Set(symbols.map((s) => CRYPTO_ID[s]).filter(Boolean))];
  if (ids.length === 0) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd,thb`;
  const d = await jget(url, REVALIDATE_PRICE) as Record<string, { usd?: number; thb?: number }> | null;
  if (!d) return {};
  const out: Record<string, { usd: number; thb: number }> = {};
  for (const sym of symbols) {
    const id = CRYPTO_ID[sym];
    const p = id ? d[id] : undefined;
    if (p && typeof p.usd === 'number' && typeof p.thb === 'number') out[sym] = { usd: p.usd, thb: p.thb };
  }
  return out;
}

// ── หุ้น/ETF ตปท. (Finnhub — ต้องมี key) ─────────────────────────────────────
/** ราคาหุ้น/ETF ล่าสุด (USD) ตาม ticker · ไม่มี FINNHUB_API_KEY → {} (ข้าม) */
export async function getStockQuotesUsd(symbols: string[]): Promise<Record<string, number>> {
  const key = getVar('FINNHUB_API_KEY');
  const uniq = [...new Set(symbols.filter(Boolean))];
  if (!key || uniq.length === 0) return {};
  const out: Record<string, number> = {};
  // Finnhub ให้ query ทีละสัญลักษณ์ → จำกัดไม่เกิน 12 ตัว/โหลด กัน rate limit
  for (const sym of uniq.slice(0, 12)) {
    const d = await jget(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${key}`, REVALIDATE_PRICE) as { c?: number } | null;
    if (d && typeof d.c === 'number' && d.c > 0) out[sym] = d.c;
  }
  return out;
}

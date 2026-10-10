// Renders a static Portfolio screen (F002) from REAL portfolio.ts output.
// Not the production Next.js page — a self-contained preview so the computed
// data + DSN tokens can be seen without scaffolding the full app.
//   run:  node scripts/build-demo.ts   →   demo/portfolio.html

import { writeFileSync, mkdirSync } from 'node:fs';
import { summarizePortfolio, marketValueTHB, type HeldAsset } from '../src/lib/portfolio.ts';
import { computeIncomePercent } from '../src/lib/finance.ts';

const assets: (HeldAsset & { source: string; updatedMin: number })[] = [
  { name: 'PTT',   type: 'หุ้นไทย',  brokerChannel: 'SCBS',   quantity: 12500, costPrice: 27.4,  marketPrice: 34.25,  fxToThb: 1,  source: 'settrade',  updatedMin: 2 },
  { name: 'BBL',   type: 'หุ้นไทย',  brokerChannel: 'KBank',  quantity: 1000,  costPrice: 150,   marketPrice: 145,    fxToThb: 1,  source: 'settrade',  updatedMin: 2 },
  { name: 'AAPL',  type: 'หุ้น ตปท.', brokerChannel: 'IBKR',  quantity: 30,    costPrice: 180,   marketPrice: 228.10, currency: 'USD', fxToThb: 35, source: 'investing', updatedMin: 3 },
  { name: 'ทองคำ 96.5%', type: 'ทองคำ', brokerChannel: 'manual', quantity: 50, costPrice: 30000, marketPrice: 32000, fxToThb: 1, source: 'manual', updatedMin: 18 },
  { name: 'เงินสด', type: 'เงินสด',  brokerChannel: 'manual', quantity: 1,     costPrice: 500000, marketPrice: 500000, fxToThb: 1, source: 'manual', updatedMin: 0 },
];

const s = summarizePortfolio(assets);
const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));
const baht = (n: number) => '฿' + fmt(n);
const pct = (n: number) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%';

const catColor = (t: string) =>
  ({ 'หุ้นไทย': '#7B72FF', 'หุ้น ตปท.': '#F982FB', 'ทองคำ': '#C1FD42', 'เงินสด': '#9CA3AF' } as Record<string, string>)[t] ?? '#9CA3AF';

const allocBars = s.allocation.map((a) => `
    <div class="al">
      <span class="al-n">${a.type}</span>
      <span class="al-track"><span class="al-fill" style="width:${a.percent.toFixed(1)}%;background:${catColor(a.type)}"></span></span>
      <span class="al-p num">${a.percent.toFixed(0)}%</span>
    </div>`).join('');

const rows = assets.map((a) => {
  const p = computeIncomePercent(a);
  const up = (p ?? 0) >= 0;
  const cls = p == null ? 'muted' : up ? 'gain' : 'loss';
  const arrow = p == null ? '' : up ? '▲ ' : '▼ ';
  const stale = a.updatedMin > 15;
  const status = a.source === 'manual' && a.name === 'ทองคำ 96.5%'
    ? `<span class="stale num">ราคาเก่า ${a.updatedMin} นาที</span>`
    : `<span class="price num">${baht(marketValueTHB(a))}</span>`;
  return `
      <tr>
        <td><span class="asset">${a.name}</span><span class="broker">${a.brokerChannel}</span></td>
        <td class="r"><span class="${cls} num">${arrow}${p == null ? '—' : pct(p)}</span></td>
        <td class="r">${status}</td>
      </tr>`;
}).join('');

const incomeUp = s.totalIncomeTHB >= 0;
const incomePct = (s.totalIncomeTHB / (s.totalTHB - s.totalIncomeTHB)) * 100;

const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>WealthPlaner — Portfolio (F002 demo)</title>
<style>
  :root{--bg:#0E0A1C;--surface:#181330;--surface-2:#221A42;--border:#2E2650;--brand:#564CF8;
    --accent:#C1FD42;--gain:#3DDC84;--loss:#FF6B6B;--warn:#8A6D00;--text:#F4F4F5;--muted:#A79FC0;
    --font:system-ui,-apple-system,"IBM Plex Sans Thai",sans-serif}
  *{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--text);font-family:var(--font);
    display:flex;justify-content:center;padding:24px 12px;-webkit-font-smoothing:antialiased}
  .num{font-variant-numeric:tabular-nums}
  .app{width:100%;max-width:430px;display:flex;flex-direction:column;gap:14px}
  .top{display:flex;align-items:center;justify-content:space-between;padding:2px 4px}
  .top h1{font-size:15px;font-weight:700}.top .re{font-size:12px;color:var(--muted);border:1px solid var(--border);
    border-radius:20px;padding:5px 12px;background:var(--surface)}
  .hero{background:var(--brand);border-radius:16px;padding:20px}
  .hero .k{font-size:12px;color:#c9c4ff}.hero .v{font-size:34px;font-weight:800;margin-top:6px;display:flex;align-items:baseline;gap:5px}.hero .v .cur{font-size:24px;font-weight:700;color:#dcd7ff}
  .hero .v small{font-size:15px;color:#c9c4ff;font-weight:600}
  .delta{display:inline-flex;gap:6px;font-size:13px;font-weight:700;padding:4px 11px;border-radius:20px;margin-top:12px;
    background:${incomeUp ? 'var(--accent)' : 'var(--loss)'};color:${incomeUp ? '#0E0A1C' : '#fff'}}
  .status{display:flex;align-items:center;gap:7px;font-size:12px;color:#c9c4ff;margin-top:14px}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--accent)}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px}
  .card h2{font-size:12px;color:var(--muted);font-weight:500;margin-bottom:14px}
  .al{display:grid;grid-template-columns:70px 1fr 40px;align-items:center;gap:10px;margin-bottom:11px;font-size:13px}
  .al:last-child{margin-bottom:0}.al-p{text-align:right;color:var(--muted)}
  .al-track{height:9px;background:var(--surface-2);border-radius:6px;overflow:hidden}
  .al-fill{display:block;height:100%;border-radius:6px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);
    font-weight:600;padding-bottom:9px;border-bottom:2px solid var(--border)}
  th.r,td.r{text-align:right}td{padding:11px 0;border-bottom:1px solid var(--border)}
  tr:last-child td{border-bottom:0}
  .asset{font-weight:700}.broker{font-size:11px;color:#c9c4ff;background:#2B2A55;padding:2px 7px;border-radius:5px;margin-left:6px}
  .gain{color:var(--gain);font-weight:700}.loss{color:var(--loss);font-weight:700}.muted{color:var(--muted)}
  .price{color:var(--text)}.stale{font-size:11px;color:#e7c24a;background:#332a10;padding:2px 7px;border-radius:5px}
  .foot{font-size:11px;color:var(--muted);text-align:center;padding:4px}
</style></head>
<body><div class="app">
  <div class="top"><h1>พอร์ตรวมทุกโบรก</h1><span class="re">↻ รีเฟรช</span></div>
  <div class="hero">
    <div class="k">มูลค่าพอร์ตรวม</div>
    <div class="v num"><span class="cur">฿</span>${fmt(s.totalTHB)}</div>
    <span class="delta num">${incomeUp ? '▲' : '▼'} ${baht(Math.abs(s.totalIncomeTHB))} (${pct(incomePct)})</span>
    <div class="status"><span class="dot"></span> ออนไลน์ · อัปเดตแล้ว</div>
  </div>
  <div class="card"><h2>สัดส่วน Asset Allocation</h2>${allocBars}</div>
  <div class="card"><h2>สินทรัพย์ (ข้ามโบรก)</h2>
    <table><thead><tr><th>สินทรัพย์</th><th class="r">กำไร/ขาดทุน</th><th class="r">มูลค่า</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </div>
  <div class="foot">คำนวณจาก portfolio.ts จริง · F002 · ${assets.length} สินทรัพย์ ${new Set(assets.map(a=>a.brokerChannel)).size} ช่องทาง</div>
</div></body></html>`;

mkdirSync(new URL('../demo/', import.meta.url), { recursive: true });
writeFileSync(new URL('../demo/portfolio.html', import.meta.url), html);
console.log(`✓ demo/portfolio.html — total ${baht(s.totalTHB)} · income ${baht(s.totalIncomeTHB)} (${pct(incomePct)})`);
console.log('  allocation:', s.allocation.map((a) => `${a.type} ${a.percent.toFixed(0)}%`).join(' · '));

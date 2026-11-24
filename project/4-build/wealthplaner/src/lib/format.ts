// ฟอร์แมตตัวเลขเงิน (ใช้ร่วมหลายหน้า · ยกมาจากที่ซ้ำใน page/GrowthChart/AllocationTabs)
export const fmt = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(n));

/** ย่อเลขให้พอดีการ์ด (฿1.58M / ฿420k / ฿9,800) */
export const compact = (n: number) => {
  const a = Math.abs(n);
  return a >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : a >= 1e4 ? Math.round(n / 1e3) + 'k' : fmt(n);
};

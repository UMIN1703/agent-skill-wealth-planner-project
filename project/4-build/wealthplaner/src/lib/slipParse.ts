// แกะข้อความ OCR จากสลิปไทย → ยอด/วันที่/หมวด (CR-WPN-003, Tesseract.js)
// pure — เทสต์ได้ · heuristic (OCR ฟรีไม่แม่น 100% ผู้ใช้ยืนยัน/แก้ต่อ)
import { type SlipCategory } from './slip.ts';

export type ParsedSlip = { amountTHB?: number; date?: string; category?: SlipCategory; channel?: string };

// ธนาคาร/วอลเล็ตไทยที่พบบ่อย → ชื่อย่อมาตรฐานสำหรับคอลัมน์ "ช่องทาง/สถาบัน"
// เรียงจากคำเฉพาะก่อน (กันชนคำกว้าง เช่น "กรุง...") · คีย์เวิร์ดครอบทั้งไทย/อังกฤษบนสลิป
const BANKS: { name: string; re: RegExp }[] = [
  { name: 'ttb', re: /ttb|ทีเอ็มบีธนชาต|ทหารไทยธนชาต/i },
  { name: 'SCB', re: /\bscb\b|ไทยพาณิชย์/i },
  { name: 'KBank', re: /kbank|k\s?plus|กสิกร/i },
  { name: 'KTB', re: /krungthai|\bktb\b|next|กรุงไทย/i },
  { name: 'BBL', re: /bangkok bank|\bbbl\b|บัวหลวง|กรุงเทพ/i },
  { name: 'Krungsri', re: /krungsri|\bbay\b|กรุงศรี/i },
  { name: 'GSB', re: /\bgsb\b|ออมสิน/i },
  { name: 'BAAC', re: /\bbaac\b|ธ\.?ก\.?ส|เพื่อการเกษตร/i },
  { name: 'TrueMoney', re: /true\s?money|ทรูมันนี/i },
  { name: 'PromptPay', re: /promptpay|พร้อมเพย์/i },
];

/** ช่องทาง/สถาบัน: จับชื่อธนาคาร/วอลเล็ตจากข้อความสลิป (ไม่พบ → undefined ให้ผู้ใช้กรอกเอง) */
export function parseChannel(text: string): string | undefined {
  for (const b of BANKS) if (b.re.test(text)) return b.name;
  return undefined;
}

const THAI_MONTHS: Record<string, number> = {
  'ม.ค': 1, 'มกราคม': 1, 'ก.พ': 2, 'กุมภาพันธ์': 2, 'มี.ค': 3, 'มีนาคม': 3,
  'เม.ย': 4, 'เมษายน': 4, 'พ.ค': 5, 'พฤษภาคม': 5, 'มิ.ย': 6, 'มิถุนายน': 6,
  'ก.ค': 7, 'กรกฎาคม': 7, 'ส.ค': 8, 'สิงหาคม': 8, 'ก.ย': 9, 'กันยายน': 9,
  'ต.ค': 10, 'ตุลาคม': 10, 'พ.ย': 11, 'พฤศจิกายน': 11, 'ธ.ค': 12, 'ธันวาคม': 12,
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** ปี พ.ศ. (เลข ≥ 2400 หรือ 2 หลักช่วง 50–99) → ค.ศ. */
function toCE(year: number): number {
  if (year >= 2400) return year - 543;
  if (year < 100) return year >= 50 ? year + 1957 : year + 2000; // 69 → 2569 → 2026
  return year;
}

/** ยอดเงิน: เลือกเลขที่มีทศนิยม 2 ตำแหน่งใกล้คำว่า "บาท"/"จำนวน" ก่อน ไม่งั้นเลขทศนิยมที่มากสุด */
export function parseAmount(text: string): number | undefined {
  const numRe = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})/g;
  const nearRe = /(?:จำนวน|ยอด|บาท)[^\d]{0,12}(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*\.\d{2})\s*บาท/;
  const near = text.match(nearRe);
  if (near) {
    const v = Number((near[1] ?? near[2]).replace(/,/g, ''));
    if (Number.isFinite(v) && v > 0) return v;
  }
  const all = [...text.matchAll(numRe)].map((m) => Number(m[1].replace(/,/g, ''))).filter((n) => n > 0);
  return all.length ? Math.max(...all) : undefined;
}

/** วันที่: รองรับ DD/MM/YYYY, DD-MM-YYYY, และ "17 พ.ย. 69/2569" */
export function parseDate(text: string): string | undefined {
  const numeric = text.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (numeric) {
    const d = +numeric[1], m = +numeric[2], y = toCE(+numeric[3]);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) return `${y}-${pad(m)}-${pad(d)}`;
  }
  const thai = text.match(/(\d{1,2})\s*([ก-๙.]+?)\.?\s*(\d{2,4})/);
  if (thai) {
    const key = thai[2].replace(/\.$/, '');
    const m = THAI_MONTHS[key] ?? THAI_MONTHS[key.replace(/\.$/, '')];
    if (m) {
      const d = +thai[1], y = toCE(+thai[3]);
      if (d >= 1 && d <= 31) return `${y}-${pad(m)}-${pad(d)}`;
    }
  }
  return undefined;
}

/** หมวด: เดาจากคำในสลิป (ไม่มั่นใจ → undefined ให้ผู้ใช้เลือก) */
export function parseCategory(text: string): SlipCategory | undefined {
  // เช็ก action หลักก่อน (โอน/ซื้อ/ขาย) แล้วค่อย fee — เพราะสลิปโอนมักมีบรรทัด "ค่าธรรมเนียม" ปนอยู่
  if (/ขาย|sell/i.test(text)) return 'sell';
  if (/ซื้อ|buy/i.test(text)) return 'buy';
  if (/โอน|ฝาก|รับเงิน|เงินเข้า|transfer|deposit/i.test(text)) return 'deposit';
  if (/ค่าธรรมเนียม|fee/i.test(text)) return 'fee';
  return undefined;
}

export function parseSlipText(text: string): ParsedSlip {
  return {
    amountTHB: parseAmount(text),
    date: parseDate(text),
    category: parseCategory(text),
    channel: parseChannel(text),
  };
}

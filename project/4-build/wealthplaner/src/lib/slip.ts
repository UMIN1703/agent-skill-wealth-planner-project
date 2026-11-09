// WealthPlaner — slip capture core (F009, CR-WPN-002)
// ส่งรูปสลิปเข้า LINE OA → ยืนยันบนเว็บ → ซิงค์ Google Drive/Sheets ของผู้ใช้
// ส่วนนี้ "บริสุทธิ์" (pure) — ไม่มี I/O จริง: ตรวจ validate, map เป็นแถว Sheets,
// กันซ้ำ, และตรวจลายเซ็น webhook ของ LINE (HMAC-SHA256 ผ่าน Web Crypto —
// ใช้ได้ทั้ง edge และ node) · การเรียก LINE/Drive/Sheets จริง = Class B (ยังไม่ wire)

export type SlipCategory = 'deposit' | 'buy' | 'sell' | 'fee' | 'other';

export const SLIP_CATEGORIES: { id: SlipCategory; label: string }[] = [
  { id: 'deposit', label: 'ฝาก/โอนเข้า' },
  { id: 'buy', label: 'ซื้อสินทรัพย์' },
  { id: 'sell', label: 'ขายสินทรัพย์' },
  { id: 'fee', label: 'ค่าธรรมเนียม' },
  { id: 'other', label: 'อื่น ๆ' },
];

const CATEGORY_LABEL = new Map(SLIP_CATEGORIES.map((c) => [c.id, c.label]));

// สลิปที่ส่งเข้ามาทาง LINE และถูกพักไว้ใน staging (Cloudflare KV+R2) รอผู้ใช้ยืนยัน
export type PendingSlip = {
  id: string;              // id ภายใน staging
  sourceMessageId: string; // messageId จาก LINE (ใช้กันซ้ำ)
  lineUserId: string;      // ไว้จับคู่กับบัญชี (= LINE Login userId ภายใต้ provider เดียวกัน)
  imageUrl: string;        // URL รูปใน staging (R2) สำหรับพรีวิว
  receivedAt: string;      // ISO
};

// สิ่งที่ผู้ใช้กรอก/ยืนยันบนเว็บ (ยังเป็น string ดิบจากฟอร์ม)
export type SlipDraft = {
  amountTHB: string;
  date: string;            // 'YYYY-MM-DD'
  category: SlipCategory | '';
  note?: string;
};

// รายการที่ยืนยันแล้ว พร้อม map ขึ้น Sheets
export type SlipEntry = {
  amountTHB: number;
  date: string;
  category: SlipCategory;
  note: string;
  slipImageUrl: string;    // URL รูปบน Google Drive หลังอัปแล้ว
  sourceMessageId: string;
  confirmedAt: string;     // ISO
};

export type SlipValidation =
  | { ok: true; entry: Pick<SlipEntry, 'amountTHB' | 'date' | 'category' | 'note'> }
  | { ok: false; errors: { amount?: string; date?: string; category?: string } };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * F009 AC-03 + guardrails — ตรวจก่อนบันทึก:
 * ยอดเงินต้องเป็นตัวเลข > 0, วันที่รูปแบบถูกและไม่เป็นอนาคต, ต้องเลือกหมวด
 */
export function validateSlipEntry(draft: SlipDraft, now: Date): SlipValidation {
  const errors: { amount?: string; date?: string; category?: string } = {};

  const amount = Number(String(draft.amountTHB).replace(/,/g, '').trim());
  if (!draft.amountTHB.trim() || !Number.isFinite(amount)) {
    errors.amount = 'กรอกยอดเงินเป็นตัวเลข';
  } else if (amount <= 0) {
    errors.amount = 'ยอดเงินต้องมากกว่า 0';
  }

  if (!DATE_RE.test(draft.date)) {
    errors.date = 'กรอกวันที่ให้ถูกรูปแบบ (ปปปป-ดด-วว)';
  } else {
    const d = new Date(draft.date + 'T00:00:00Z');
    if (Number.isNaN(d.getTime())) {
      errors.date = 'วันที่ไม่ถูกต้อง';
    } else if (d.getTime() > now.getTime()) {
      errors.date = 'วันที่ต้องไม่เป็นอนาคต';
    }
  }

  if (!draft.category) {
    errors.category = 'เลือกหมวดของรายการ';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    entry: {
      amountTHB: amount,
      date: draft.date,
      category: draft.category as SlipCategory,
      note: (draft.note ?? '').trim(),
    },
  };
}

export const SLIP_SHEET_COLUMNS = [
  'date',
  'category',
  'amount_thb',
  'note',
  'slip_image_url',
  'source_message_id',
  'confirmed_at',
] as const;

/** F009 AC-03/AC-04 — map รายการที่ยืนยันแล้วเป็นแถวเดียวสำหรับ append ลง Google Sheets */
export function slipToSheetRow(entry: SlipEntry): string[] {
  return [
    entry.date,
    CATEGORY_LABEL.get(entry.category) ?? entry.category,
    String(entry.amountTHB),
    entry.note,
    entry.slipImageUrl,
    entry.sourceMessageId,
    entry.confirmedAt,
  ];
}

/** F009 AC-E05 — กันบันทึกซ้ำด้วย messageId เดิม */
export function isDuplicateSlip(savedMessageIds: readonly string[], messageId: string): boolean {
  return savedMessageIds.includes(messageId);
}

// ── LINE webhook ──────────────────────────────────────────────────────────

type LineMessageEvent = {
  type: string;
  message?: { type: string; id: string };
  source?: { userId?: string };
};

/** F009 AC-01 — รับเฉพาะ event ที่เป็นข้อความรูปภาพ (สลิป) */
export function isSupportedSlipMessage(event: LineMessageEvent): boolean {
  return event.type === 'message' && event.message?.type === 'image';
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/**
 * F009 AC-E02 — ตรวจ x-line-signature: HMAC-SHA256 ของ raw body ด้วย channel secret
 * เทียบแบบ constant-time · คืน false เมื่อไม่มี secret/signature (ปฏิเสธคำขอ)
 */
export async function verifyLineSignature(
  channelSecret: string,
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!channelSecret || !signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  return safeEqual(toBase64(mac), signature);
}

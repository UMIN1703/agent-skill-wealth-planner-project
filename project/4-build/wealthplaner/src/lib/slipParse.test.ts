import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, parseDate, parseCategory, parseChannel, parseSlipText } from './slipParse.ts';

// ข้อความ OCR จำลองจากสลิป ttb (โอนเงินสำเร็จ 100.00)
const SLIP = `โอนเงินสำเร็จ
17 พ.ย. 69 19:00 น.
100.00
ค่าธรรมเนียม 0.00
น.ส. ยุวดี ทิพโสด
นาง อัจฉราภรณ์ รัญระนา
รหัสอ้างอิง: 26111719004816071`;

test('TC-F009-ocr-amount: จับยอด 100.00 (ไม่ใช่ค่าธรรมเนียม 0.00)', () => {
  assert.equal(parseAmount(SLIP), 100);
  assert.equal(parseAmount('จำนวน 1,250.50 บาท'), 1250.5);
  assert.equal(parseAmount('2,000.00 บาท'), 2000);
});

test('TC-F009-ocr-date: แปลงวันที่ไทย พ.ศ.→ค.ศ.', () => {
  assert.equal(parseDate(SLIP), '2026-11-17');          // 17 พ.ย. 69 → 2026-11-17
  assert.equal(parseDate('18/11/2026'), '2026-11-18');  // numeric ค.ศ.
  assert.equal(parseDate('05/01/2569'), '2026-01-05');  // numeric พ.ศ.
});

test('TC-F009-ocr-category: เดาหมวดจากคำ', () => {
  assert.equal(parseCategory(SLIP), 'deposit');          // "โอนเงิน"
  assert.equal(parseCategory('ซื้อหุ้น KBANK'), 'buy');
  assert.equal(parseCategory('ไม่มีคำบอกใบ้'), undefined);
});

test('TC-F009-ocr-channel: จับสถาบันการเงินจากข้อความ', () => {
  assert.equal(parseChannel('ธนาคารกสิกรไทย K PLUS'), 'KBank');
  assert.equal(parseChannel('SCB EASY ไทยพาณิชย์'), 'SCB');
  assert.equal(parseChannel('โอนผ่าน ttb touch'), 'ttb');
  assert.equal(parseChannel('พร้อมเพย์ PromptPay'), 'PromptPay');
  assert.equal(parseChannel('ไม่มีชื่อธนาคาร'), undefined);
});

test('TC-F009-ocr-all: parseSlipText รวม', () => {
  const r = parseSlipText(SLIP);
  assert.equal(r.amountTHB, 100);
  assert.equal(r.date, '2026-11-17');
  assert.equal(r.category, 'deposit');
});

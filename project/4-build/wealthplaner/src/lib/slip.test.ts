import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSlipEntry, slipToSheetRow, isDuplicateSlip,
  isSupportedSlipMessage, verifyLineSignature, SLIP_SHEET_COLUMNS,
  type SlipEntry,
} from './slip.ts';

const now = new Date(Date.UTC(2026, 10, 7, 3, 0, 0)); // 2026-11-07

// F009 AC-03 — กรอกครบถูกต้อง → ok + ค่าถูก parse
test('TC-F009-003: ยืนยันสลิปที่กรอกครบ → ok', () => {
  const r = validateSlipEntry({ amountTHB: '1,250.50', date: '2026-11-06', category: 'buy', note: ' ซื้อหุ้น ' }, now);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.entry.amountTHB, 1250.5); // ตัดคอมมา + เป็นตัวเลข
    assert.equal(r.entry.category, 'buy');
    assert.equal(r.entry.note, 'ซื้อหุ้น');  // trim แล้ว
  }
});

// F009 guardrails — ยอด ≤ 0 / ไม่ใช่ตัวเลข / วันที่อนาคต / ไม่เลือกหมวด
test('TC-F009-E-validate: ปฏิเสธยอด≤0, วันที่อนาคต, ไม่เลือกหมวด', () => {
  const zero = validateSlipEntry({ amountTHB: '0', date: '2026-11-06', category: 'buy' }, now);
  assert.equal(zero.ok, false);
  if (!zero.ok) assert.ok(zero.errors.amount);

  const future = validateSlipEntry({ amountTHB: '100', date: '2026-12-01', category: 'buy' }, now);
  assert.equal(future.ok, false);
  if (!future.ok) assert.ok(future.errors.date);

  const noCat = validateSlipEntry({ amountTHB: '100', date: '2026-11-06', category: '' }, now);
  assert.equal(noCat.ok, false);
  if (!noCat.ok) assert.ok(noCat.errors.category);

  const nan = validateSlipEntry({ amountTHB: 'abc', date: '2026-11-06', category: 'fee' }, now);
  assert.equal(nan.ok, false);
});

// F009 AC-03/AC-04 — map เป็นแถว Sheets ตามลำดับคอลัมน์
test('TC-F009-004: slipToSheetRow เรียงตรงกับ SLIP_SHEET_COLUMNS', () => {
  const entry: SlipEntry = {
    amountTHB: 500, date: '2026-11-06', category: 'deposit', note: 'โอนเข้า',
    slipImageUrl: 'https://drive/x', sourceMessageId: 'm123', confirmedAt: now.toISOString(),
  };
  const row = slipToSheetRow(entry);
  assert.equal(row.length, SLIP_SHEET_COLUMNS.length);
  assert.deepEqual(row, ['2026-11-06', 'ฝาก/โอนเข้า', '500', 'โอนเข้า', 'https://drive/x', 'm123', now.toISOString()]);
});

// F009 AC-E05 — กันซ้ำด้วย messageId
test('TC-F009-E05: isDuplicateSlip จับ messageId ซ้ำ', () => {
  assert.equal(isDuplicateSlip(['m1', 'm2'], 'm2'), true);
  assert.equal(isDuplicateSlip(['m1', 'm2'], 'm9'), false);
});

// F009 AC-01 / AC-E01 — รับเฉพาะ event รูปภาพ
test('TC-F009-001: isSupportedSlipMessage รับเฉพาะ image', () => {
  assert.equal(isSupportedSlipMessage({ type: 'message', message: { type: 'image', id: 'i1' } }), true);
  assert.equal(isSupportedSlipMessage({ type: 'message', message: { type: 'text', id: 't1' } }), false);
  assert.equal(isSupportedSlipMessage({ type: 'follow' }), false);
});

// F009 AC-E02 — ตรวจลายเซ็น webhook (เทียบกับค่าที่คำนวณด้วย secret เดียวกัน)
test('TC-F009-E02: verifyLineSignature ผ่านเมื่อลายเซ็นตรง และ false เมื่อไม่ตรง/ไม่มี', async () => {
  const secret = 'test-channel-secret';
  const body = JSON.stringify({ events: [] });
  // คำนวณลายเซ็นที่ถูกต้องด้วย Web Crypto เดียวกัน
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const bytes = new Uint8Array(mac);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const good = btoa(bin);

  assert.equal(await verifyLineSignature(secret, body, good), true);
  assert.equal(await verifyLineSignature(secret, body, 'wrong-signature'), false);
  assert.equal(await verifyLineSignature(secret, body, null), false);
  assert.equal(await verifyLineSignature('', body, good), false);
});

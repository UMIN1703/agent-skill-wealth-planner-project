import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importAssets } from './import.ts';

const header = ['name', 'type', 'quantity', 'costPrice', 'brokerChannel'];

// F005 AC-01 (traces TC-F005-001)
test('TC-F005-001: ไฟล์ถูกรูปแบบ → สร้างสินทรัพย์ตามแถว', () => {
  const rows = [
    ['PTT', 'หุ้นไทย', '12500', '27.4', 'SCBS'],
    ['AAPL', 'foreign_stock', '30', '180', 'IBKR'],
  ];
  const r = importAssets(header, rows);
  assert.equal(r.headerOk, true);
  assert.equal(r.imported.length, 2);
  assert.equal(r.errors.length, 0);
  assert.equal(r.imported[0].name, 'PTT');
  assert.equal(r.imported[0].type, 'th_stock'); // map ชื่อไทย → code
  assert.equal(r.imported[1].quantity, 30);
});

// F005 AC-E01 (traces TC-F005-E01) — missing column
test('TC-F005-E01: คอลัมน์ไม่ครบ → บอกคอลัมน์ที่ขาด, ไม่นำเข้า', () => {
  const r = importAssets(['name', 'type', 'quantity'], [['PTT', 'หุ้นไทย', '10']]);
  assert.equal(r.headerOk, false);
  assert.equal(r.imported.length, 0);
  assert.ok(r.errors.some((e) => e.column === 'costPrice'));
  assert.ok(r.errors.some((e) => e.column === 'brokerChannel'));
});

// F005 AC-E01 — partial: bad row reported by row+column, good rows still imported (ไม่เงียบ)
test('TC-F005-E01 (partial): แถวผิดถูกรายงาน row/column แถวดีนำเข้าได้', () => {
  const rows = [
    ['PTT', 'หุ้นไทย', '12500', '27.4', 'SCBS'],   // ok
    ['BAD', 'หุ้นไทย', '-5', '10', 'KBank'],        // quantity ติดลบ
    ['NOBRK', 'ทองคำ', '1', '30000', ''],           // ไม่มี broker
    ['ABC', 'หุ้นไทย', 'xyz', '10', 'SCBS'],         // quantity ไม่ใช่ตัวเลข
  ];
  const r = importAssets(header, rows);
  assert.equal(r.imported.length, 1); // เฉพาะ PTT
  assert.equal(r.errors.length, 3);
  assert.deepEqual(r.errors.map((e) => e.row), [2, 3, 4]);
  assert.equal(r.errors[0].column, 'quantity');
  assert.equal(r.errors[1].column, 'brokerChannel');
  assert.equal(r.errors[2].column, 'quantity');
});

// unknown asset type → error ชี้คอลัมน์ type
test('ประเภทสินทรัพย์ไม่รู้จัก → error ที่คอลัมน์ type', () => {
  const r = importAssets(header, [['X', 'คริปโต', '1', '100', 'Binance']]);
  assert.equal(r.imported.length, 0);
  assert.equal(r.errors[0].column, 'type');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importAssets, importSheetRows } from './import.ts';

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
  const r = importAssets(header, [['X', 'ที่ดิน', '1', '100', 'Binance']]); // 'ที่ดิน' ยังไม่รองรับ (คริปโตรองรับแล้ว เฟส 2)
  assert.equal(r.imported.length, 0);
  assert.equal(r.errors[0].column, 'type');
});

// CR-WPN-008 เฟส 3 — map ชีตพอร์ตจริง (ต้นทุน/หน่วย · เงินสดไม่มีหน่วย→1 · วงเล็บ=ติดลบ · tax · ข้ามแถวว่าง/ไม่มีต้นทุน)
test('เฟส3: importSheetRows map รูปแบบชีตจริง', () => {
  const sheetHeader = ['Category', 'Sub-type', 'Asset/Ticker', 'Quantity', 'Cost (Total)', 'Current Value', 'P&L', '% Return', 'Note', 'Tax Bucket'];
  const rows = [
    ['Cash', 'Bank', 'SCB', '', '454.58', '454.58', '-', '-', '', 'N/A'],
    ['หุ้นไทย', 'BANK', 'TISCO', '150.0000', '14198.81', '18825.00', '4626.19', '32.58%', '', 'Direct'],
    ['Retirement', 'PVD', 'PVD', '', '132667.28', '141060.37', '8393.09', '6.33%', 'Provident Fund', 'PVD'],
    ['หุ้นต่างประเทศ', 'SSF USA EQ', 'SSF-SP500', '', '50000', '58000', '', '', '', 'SSF'],
    ['หุ้นต่างประเทศ', 'RMF World EQ', 'RMF-World', '', '40000', '45000', '', '', '', 'RMF'],
    ['หุ้นต่างประเทศ', 'ETF', 'VOO', '5', '95000', '110000', '', '', '', 'N/A'],
    ['', '', '', '', '', '', '', '', '', ''],                       // แถวว่าง → ข้าม
    ['หุ้นไทย', 'FOOD', 'NOCOST', '10', '', '', '', '', '', ''],    // ไม่มีต้นทุน → error
  ];
  const r = importSheetRows(sheetHeader, rows);
  assert.equal(r.headerOk, true);
  assert.equal(r.imported.length, 6);

  // option 1 — sub-type กองทุนจับแบบขึ้นต้น → ประเภทถูก (หมวดมาจาก Category)
  assert.equal(r.imported.find((d) => d.name === 'SSF-SP500')!.type, 'fund_ssf');
  assert.equal(r.imported.find((d) => d.name === 'SSF-SP500')!.taxBucket, 'ssf');
  assert.equal(r.imported.find((d) => d.name === 'RMF-World')!.type, 'fund_rmf');
  assert.equal(r.imported.find((d) => d.name === 'VOO')!.type, 'etf');
  assert.equal(r.imported.find((d) => d.name === 'VOO')!.category, 'global'); // หมวดจากชีต

  const scb = r.imported.find((d) => d.name === 'SCB')!;
  assert.equal(scb.quantity, 1);           // เงินสดไม่มีหน่วย → 1
  assert.equal(scb.costPrice, 454.58);
  assert.equal(scb.type, 'cash');          // Sub-type 'Bank' → หมวด Cash → cash

  const tisco = r.imported.find((d) => d.name === 'TISCO')!;
  assert.equal(tisco.type, 'th_stock');
  assert.equal(tisco.quantity, 150);
  assert.ok(Math.abs((tisco.costPrice ?? 0) - 14198.81 / 150) < 0.01);

  const pvd = r.imported.find((d) => d.name === 'PVD')!;
  assert.equal(pvd.type, 'provident');
  assert.equal(pvd.taxBucket, 'pvd');

  assert.equal(r.errors.length, 1);        // NOCOST ไม่มีต้นทุน
});

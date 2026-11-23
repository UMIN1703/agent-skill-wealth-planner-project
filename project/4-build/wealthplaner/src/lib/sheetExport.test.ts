import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLogRows, buildSummaryRows } from './sheetExport.ts';
import type { DisplayAsset } from '../data/sampleAssets.ts';

const A: DisplayAsset[] = [
  { name: 'PTT', type: 'หุ้นไทย', brokerChannel: 'INVX', quantity: 100, costPrice: 34, marketPrice: 35, fxToThb: 1, source: 'manual', updatedMin: 0, category: 'หุ้นไทย', createdAt: '2026-11-05T00:00:00Z' },
  { name: 'SCB', type: 'เงินสด', brokerChannel: 'SCB', quantity: 1, costPrice: 1000, marketPrice: 1000, fxToThb: 1, source: 'slip', updatedMin: 0, category: 'เงินสด', createdAt: '2026-10-20T00:00:00Z' },
];

// CR-WPN-010 — แท็บ "รายการ": header + 1 แถว/สินทรัพย์ · มีคอลัมน์ เดือน · เรียงใหม่→เก่า
test('TC-export-log: header + row/asset + month column', () => {
  const r = buildLogRows(A);
  assert.equal(r[0][0], 'เดือน');
  assert.equal(r.length, 3); // header + 2
  assert.equal(r[1][0], '2026-11'); // PTT ใหม่กว่า → บนสุด
  assert.equal(r[1][2], 'PTT');
  assert.equal(r[2][0], '2026-10');
});

// CR-WPN-010 — แท็บ "สรุป": มีหัวข้อ ภาพรวม / ตามหมวด / ตามเดือน
test('TC-export-summary: overview + by-category + by-month sections', () => {
  const s = buildSummaryRows(A).map((row) => String(row[0]));
  assert.ok(s.some((x) => x.includes('รายงานพอร์ต')));
  assert.ok(s.includes('ภาพรวม'));
  assert.ok(s.includes('ตามหมวด'));
  assert.ok(s.includes('ตามเดือน'));
});

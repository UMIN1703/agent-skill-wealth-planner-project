import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPortfolioSummaryText, isSummaryRequest } from './lineSummary.ts';
import type { HeldAsset } from './portfolio.ts';

test('TC-5.1-summary: สรุปพอร์ตมีมูลค่า/กำไร/สัดส่วน', () => {
  const assets: HeldAsset[] = [
    { name: 'A', type: 'หุ้นไทย', brokerChannel: 'x', quantity: 10, costPrice: 10, marketPrice: 15, fxToThb: 1 }, // value 150, income 50
    { name: 'B', type: 'ทองคำ', brokerChannel: 'x', quantity: 1, costPrice: 50, marketPrice: 50, fxToThb: 1 },     // value 50, income 0
  ];
  const txt = buildPortfolioSummaryText(assets);
  assert.ok(txt.includes('สรุปพอร์ต'));
  assert.ok(txt.includes('฿200'));   // มูลค่ารวม 150+50
  assert.ok(txt.includes('กำไร'));   // income +50
  assert.ok(txt.includes('หุ้นไทย'));
});

test('TC-5.1-empty: พอร์ตว่าง → ข้อความชวนเพิ่ม', () => {
  assert.ok(buildPortfolioSummaryText([]).includes('ยังไม่มีรายการ'));
});

test('TC-5.1-intent: จับคำขอสรุปพอร์ต', () => {
  assert.ok(isSummaryRequest('สรุปพอร์ต'));
  assert.ok(isSummaryRequest('ขอดูพอร์ตหน่อย'));
  assert.ok(!isSummaryRequest('สวัสดี'));
});

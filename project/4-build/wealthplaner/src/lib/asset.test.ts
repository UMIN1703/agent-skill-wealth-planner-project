import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAssetDraft, isDuplicate, draftToDisplayAsset, ASSET_TYPE_LABELS, type AssetDraft } from './asset.ts';

const valid: AssetDraft = {
  name: 'PTT', type: 'th_stock', quantity: 100, costPrice: 34.25, brokerChannel: 'SCBS',
};

// F001 AC-01 (traces TC-F001-001)
test('TC-F001-001: กรอกครบ (รวม broker channel) → ผ่าน', () => {
  assert.deepEqual(validateAssetDraft(valid), { ok: true });
});

// F001 AC-E01 (traces TC-F001-E01)
test('TC-F001-E01: เว้นจำนวน → error + firstField=quantity (เพื่อ focus), ไม่บันทึก', () => {
  const r = validateAssetDraft({ ...valid, quantity: null });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.firstField, 'quantity');
    assert.ok(r.errors.some((e) => e.field === 'quantity'));
  }
});

// F001 AC-E02 (traces TC-F001-E02)
test('TC-F001-E02: จำนวนติดลบ → ปฏิเสธ', () => {
  const r = validateAssetDraft({ ...valid, quantity: -5 });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.field === 'quantity'));
});

// SRS §4.2: cost_price >= 0 (0 อนุญาต, ติดลบไม่อนุญาต) — สอดคล้อง F004 cost=0 guard
test('cost = 0 อนุญาต · cost ติดลบ ปฏิเสธ', () => {
  assert.equal(validateAssetDraft({ ...valid, costPrice: 0 }).ok, true);
  assert.equal(validateAssetDraft({ ...valid, costPrice: -1 }).ok, false);
});

// F001 AC-E04 (traces TC-F001-E04)
test('TC-F001-E04: ไม่เลือก broker channel → ปฏิเสธ (บังคับ)', () => {
  const r = validateAssetDraft({ ...valid, brokerChannel: '' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => e.field === 'brokerChannel'));
});

test('firstField = ช่องแรกที่ผิดตามลำดับ (name ก่อน)', () => {
  const r = validateAssetDraft({ name: '', type: '', quantity: null, costPrice: null, brokerChannel: '' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.firstField, 'name');
});

// F001 AC-E03 (traces TC-F001-E03)
test('TC-F001-E03: ชื่อ+broker เดียวกัน → ซ้ำ (คนละ broker ไม่ซ้ำ · ไม่สนตัวพิมพ์/ช่องว่าง)', () => {
  const existing = [{ name: 'PTT', brokerChannel: 'SCBS' }];
  assert.equal(isDuplicate({ name: 'PTT', brokerChannel: 'SCBS' }, existing), true);
  assert.equal(isDuplicate({ name: 'PTT', brokerChannel: 'KBank' }, existing), false);
  assert.equal(isDuplicate({ name: 'ptt ', brokerChannel: ' scbs' }, existing), true);
});

// F001 AC-01: ร่างที่ผ่าน validation → รายการในพอร์ต (หน้า Add asset ต่อ portfolio จริง)
test('TC-F001-001b: draft → DisplayAsset (manual · ยังไม่มีราคาตลาด · FX=1 · trim ชื่อ/broker)', () => {
  const a = draftToDisplayAsset({ ...valid, name: ' PTT ', brokerChannel: ' SCBS ' });
  assert.equal(a.name, 'PTT');
  assert.equal(a.brokerChannel, 'SCBS');
  assert.equal(a.type, ASSET_TYPE_LABELS.th_stock); // จัดกลุ่ม allocation ได้ (F002)
  assert.equal(a.marketPrice, null);                // ราคาตลาดจริงคือ F003/F004 (รอ O1)
  assert.equal(a.fxToThb, 1);
  assert.equal(a.source, 'manual');
  assert.equal(a.updatedMin, 0);
});

test('draftToDisplayAsset ปฏิเสธร่างที่ยังไม่ผ่าน validation (กันข้าม validate)', () => {
  assert.throws(() => draftToDisplayAsset({ ...valid, quantity: null }));
  assert.throws(() => draftToDisplayAsset({ ...valid, type: '' }));
});

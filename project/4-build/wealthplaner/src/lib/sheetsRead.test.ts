import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSheetRef } from './sheetsRead.ts';

// CR-WPN-008 เฟส 3 — ดึง spreadsheetId + gid จากลิงก์/ไอดีล้วน
test('parseSheetRef: แยก id + gid', () => {
  const r = parseSheetRef('https://docs.google.com/spreadsheets/d/1umYjymE5yxv-t0H0XvAEkKaIYiqdKo_oshZS9EHe5UI/edit?gid=1480109970#gid=1480109970');
  assert.equal(r?.id, '1umYjymE5yxv-t0H0XvAEkKaIYiqdKo_oshZS9EHe5UI');
  assert.equal(r?.gid, '1480109970');

  const idOnly = parseSheetRef('1umYjymE5yxv-t0H0XvAEkKaIYiqdKo_oshZS9EHe5UI');
  assert.equal(idOnly?.id, '1umYjymE5yxv-t0H0XvAEkKaIYiqdKo_oshZS9EHe5UI');
  assert.equal(idOnly?.gid, undefined);

  assert.equal(parseSheetRef('ไม่ใช่ลิงก์'), null);
});

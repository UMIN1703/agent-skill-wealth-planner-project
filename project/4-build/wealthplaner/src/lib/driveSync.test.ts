import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sheetsAppendPayload, driveSearchQuery } from './driveSync.ts';

test('sheetsAppendPayload: ห่อแถวเป็น values 2 มิติ', () => {
  assert.deepEqual(sheetsAppendPayload(['2026-11-06', 'ซื้อ', '100']), { values: [['2026-11-06', 'ซื้อ', '100']] });
});

test('driveSearchQuery: escape quote + ประกอบเงื่อนไข', () => {
  const q = driveSearchQuery("a'b", 'application/vnd.google-apps.spreadsheet');
  assert.ok(q.includes("name = 'a\\'b'"));
  assert.ok(q.includes('trashed = false'));
  assert.ok(q.includes("mimeType = 'application/vnd.google-apps.spreadsheet'"));
});

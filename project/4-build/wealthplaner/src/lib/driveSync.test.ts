import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  driveFileMetadata, sheetsAppendPayload, driveSearchQuery, buildMultipartRelated,
} from './driveSync.ts';

test('driveFileMetadata: ใส่ parents เมื่อมี, ไม่ใส่เมื่อไม่มี', () => {
  assert.deepEqual(driveFileMetadata('a', 'image/png', ['f1']), { name: 'a', mimeType: 'image/png', parents: ['f1'] });
  assert.deepEqual(driveFileMetadata('a', 'image/png'), { name: 'a', mimeType: 'image/png' });
});

test('sheetsAppendPayload: ห่อแถวเป็น values 2 มิติ', () => {
  assert.deepEqual(sheetsAppendPayload(['2026-11-06', 'ซื้อ', '100']), { values: [['2026-11-06', 'ซื้อ', '100']] });
});

test('driveSearchQuery: escape quote + ประกอบเงื่อนไข', () => {
  const q = driveSearchQuery("a'b", 'application/vnd.google-apps.folder', 'parent1');
  assert.ok(q.includes("name = 'a\\'b'"));
  assert.ok(q.includes('trashed = false'));
  assert.ok(q.includes("'parent1' in parents"));
});

test('buildMultipartRelated: มีทั้ง metadata JSON, media bytes และ boundary ปิด', () => {
  const media = new TextEncoder().encode('IMG');
  const { body, contentType } = buildMultipartRelated({ name: 'x' }, media, 'image/png', 'BND');
  const text = new TextDecoder().decode(body);
  assert.ok(contentType.includes('multipart/related; boundary=BND'));
  assert.ok(text.includes('--BND'));
  assert.ok(text.includes('"name":"x"'));
  assert.ok(text.includes('IMG'));
  assert.ok(text.trimEnd().endsWith('--BND--'));
});

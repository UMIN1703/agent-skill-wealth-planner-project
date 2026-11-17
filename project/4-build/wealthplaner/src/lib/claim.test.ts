import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.AUTH_SECRET = 'test-secret-for-claim';
const { signClaim, verifyClaim } = await import('./claim.ts');

test('TC-F009-claim: sign → verify คืนค่าเดิม', async () => {
  const token = await signClaim({ u: 'Uabc', id: 'msg123' });
  const claim = await verifyClaim(token);
  assert.equal(claim?.u, 'Uabc');
  assert.equal(claim?.id, 'msg123');
});

test('TC-F009-claim-tamper: ดัดแปลง token → verify เป็น null', async () => {
  const token = await signClaim({ u: 'Uabc', id: 'msg123' });
  const [body, sig] = token.split('.');
  assert.equal(await verifyClaim(body + '.' + sig.slice(0, -2) + 'xx'), null); // แก้ signature
  assert.equal(await verifyClaim('garbage'), null);
  assert.equal(await verifyClaim(null), null);
});

test('TC-F009-claim-expired: หมดอายุ → null', async () => {
  const token = await signClaim({ u: 'Uabc', id: 'msg123' }, -1); // ttl ติดลบ = หมดอายุแล้ว
  assert.equal(await verifyClaim(token), null);
});

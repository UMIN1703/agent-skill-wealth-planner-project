import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreRisk, isComplete, RISK_QUESTIONS } from './risk.ts';

const pick = (s: number) => Object.fromEntries(RISK_QUESTIONS.map((q) => [q.id, s]));

test('F007: scoreRisk 10 ข้อ → ระดับตามช่วง กลต. + isComplete', () => {
  assert.equal(RISK_QUESTIONS.length, 10);

  const low = scoreRisk(pick(1));   // 10 คะแนน → ระดับ 1 (≤15)
  assert.equal(low.score, 10);
  assert.equal(low.level, 1);
  assert.equal(low.short, 'ต่ำ');

  const high = scoreRisk(pick(4));  // 40 คะแนน → ระดับ 5 (≥37)
  assert.equal(high.score, 40);
  assert.equal(high.level, 5);

  // ~25 คะแนน (3×5 + 2×5) → ระดับ 3 (22–29)
  const midAns = Object.fromEntries(RISK_QUESTIONS.map((q, i) => [q.id, i < 5 ? 3 : 2]));
  const mid = scoreRisk(midAns);
  assert.equal(mid.score, 25);
  assert.equal(mid.level, 3);

  assert.equal(isComplete({}), false);
  assert.equal(isComplete(pick(2)), true);
});

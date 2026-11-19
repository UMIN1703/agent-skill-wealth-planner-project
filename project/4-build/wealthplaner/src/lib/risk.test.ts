import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreRisk, isComplete, RISK_QUESTIONS } from './risk.ts';

const pick = (s: number) => Object.fromEntries(RISK_QUESTIONS.map((q) => [q.id, s]));

test('F007: scoreRisk ระดับต่ำสุด/สูงสุด + isComplete', () => {
  const low = scoreRisk(pick(1));   // 5 คะแนน → ระดับ 1
  assert.equal(low.score, 5);
  assert.equal(low.level, 1);
  assert.equal(low.short, 'ต่ำ');

  const high = scoreRisk(pick(4));  // 20 คะแนน → ระดับ 5
  assert.equal(high.score, 20);
  assert.equal(high.level, 5);

  const mid = scoreRisk({ age: 3, horizon: 3, tolerance: 3, drawdown: 2, goal: 2 }); // 13 → ระดับ 3
  assert.equal(mid.score, 13);
  assert.equal(mid.level, 3);

  assert.equal(isComplete({}), false);
  assert.equal(isComplete(pick(2)), true);
});

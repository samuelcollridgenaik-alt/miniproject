import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { checkedOutputLimit, MAX_PROMPT_CHARACTERS, MAX_OUTPUT_TOKENS } from '../server/orchestrator/usageLimits.js';

test('remote requests enforce prompt and output bounds', () => {
  assert.equal(checkedOutputLimit('question'), MAX_OUTPUT_TOKENS);
  assert.equal(checkedOutputLimit('question', undefined, 100), 100);
  assert.equal(checkedOutputLimit('question', undefined, 99999), MAX_OUTPUT_TOKENS);
  assert.throws(() => checkedOutputLimit('x'.repeat(MAX_PROMPT_CHARACTERS), 'extra'), /too long/);
});

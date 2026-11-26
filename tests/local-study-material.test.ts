import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { localFlashcards, localSummary } from '../server/workflows/localStudyMaterial.js';
import type { DocumentChunk } from '../server/types.js';

const chunks: DocumentChunk[] = [{ id: 'a', documentId: 'doc', documentTitle: 'HTTP notes', chunkIndex: 0, pageOrSlideNumber: 1, text: 'HTTP clients send requests to a server. A server returns a response to the client.', characterCount: 80 }];
test('local cards and digest use selected source text', () => {
  const cards = localFlashcards(chunks, 6);
  assert.equal(cards.length, 2);
  assert.match(cards[0].front, /\[ … \]/);
  assert.match(cards[0].back, /HTTP clients send requests/);
  assert.match(cards[0].citation!, /HTTP notes/);
  assert.match(localSummary(chunks).coreConcepts[0].explanation, /HTTP clients/);
  assert.throws(() => localFlashcards([], 6), /No suitable sentences/);
});

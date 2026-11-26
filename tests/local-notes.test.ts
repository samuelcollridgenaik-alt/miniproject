import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { localNotesAnswer } from '../server/rag/localNotes.js';
import type { RetrievalResult } from '../server/types.js';

test('offline notes answer includes only relevant original passages with their citations', () => {
  const result = (text: string, score: number): RetrievalResult => ({
    chunk: { id: text, documentId: 'doc', documentTitle: 'Notes', chunkIndex: 0, text, characterCount: text.length },
    similarityScore: score, citation: '[Doc: "Notes", Chunk #1]',
  });
  const answer = localNotesAnswer([result('Relevant source text.', 0.8), result('Unrelated text.', 0.1)], 0.2);
  assert.match(answer, /Relevant source text/);
  assert.match(answer, /\[Doc: "Notes", Chunk #1\]/);
  assert.doesNotMatch(answer, /Unrelated text/);
  assert.match(localNotesAnswer([], 0.2), /could not find/i);
});

test('offline answer selects source sentences relevant to the question', () => {
  const source: RetrievalResult = {
    chunk: { id: 'c', documentId: 'd', documentTitle: 'HTTP', chunkIndex: 0, text: 'GET retrieves a resource. POST submits data. DELETE removes a resource.', characterCount: 70 },
    similarityScore: 0.8, citation: '[Doc: "HTTP", Page 1]',
  };
  const answer = localNotesAnswer([source], 0.2, 'What is the difference between GET and POST?');
  assert.match(answer, /GET retrieves a resource/);
  assert.match(answer, /POST submits data/);
  assert.doesNotMatch(answer, /DELETE/);
});

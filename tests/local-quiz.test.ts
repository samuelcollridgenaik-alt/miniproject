import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { localQuiz } from '../server/workflows/localStudyMaterial.js';
import type { DocumentChunk } from '../server/types.js';

const text = 'A database organizes information into tables containing rows and columns. A primary key uniquely identifies each row in a table. A foreign key references another table and enforces relationships between records. Normalization reduces redundancy and prevents common update anomalies. Transactions group operations into one reliable unit of work. Atomicity ensures that every operation succeeds or none is applied.';
const chunks: DocumentChunk[] = [{ id: 'c', documentId: 'd', documentTitle: 'Database', chunkIndex: 0, text, characterCount: text.length }];
test('offline quiz produces unique, sourced, valid answer options', () => {
  const questions = localQuiz(chunks, 5);
  assert.equal(questions.length, 5);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  for (const q of questions) {
    assert.equal(new Set(q.options.map(option => option.text.toLowerCase())).size, 4);
    const correct = q.options.find(option => option.key === q.correctAnswer)!;
    assert.ok(correct);
    assert.ok(q.explanation.includes(correct.text));
    assert.match(q.citation!, /Database/);
    assert.ok(!q.question.toLowerCase().split(/[^a-z0-9-]+/).includes(correct.text.toLowerCase()));
  }
  assert.throws(() => localQuiz([], 5));
});

test('quiz excludes lowercase fragments created by chunk overlap', () => {
  const fragment: DocumentChunk = { ...chunks[0], id: 'overlap', chunkIndex: 1, text: 'in a transaction succeed together or none are applied. Isolation controls how concurrent transactions interact.' };
  const questions = localQuiz([...chunks, fragment], 8);
  assert.ok(questions.every(question => !question.question.includes('in a [ … ] succeed')));
});

import { DocumentChunk, QuizQuestion } from '../types.js';
import { randomUUID, randomInt } from 'node:crypto';
import type { Flashcard, AcademicSummary } from './studyMaterialService.js';

function passages(chunks: DocumentChunk[]) {
  const seen = new Set<string>();
  return chunks.flatMap(chunk => (chunk.text.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [])
    .map(text => ({ text: text.trim(), chunk })))
    .filter(({ text }) => {
      const key = text.toLowerCase();
      if (text.length < 30 || text.length > 500 || /^[a-z]/.test(text) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const citation = (chunk: DocumentChunk) => `[Doc: "${chunk.documentTitle}", ${chunk.pageOrSlideNumber ? `Page/Section ${chunk.pageOrSlideNumber}` : `Chunk ${chunk.chunkIndex + 1}`}]`;

export function localFlashcards(chunks: DocumentChunk[], count: number): Flashcard[] {
  const stop = new Set(['this', 'that', 'these', 'those', 'with', 'from', 'which', 'where', 'when', 'their', 'there', 'using', 'about', 'other', 'into', 'than', 'then', 'each', 'also', 'such', 'have', 'will', 'been', 'they', 'your', 'some']);
  const cards: Flashcard[] = [];
  for (const { text, chunk } of passages(chunks)) {
    const words = text.match(/\b[A-Za-z][A-Za-z0-9-]{3,}\b/g) || [];
    const term = words.find(word => !stop.has(word.toLowerCase()));
    if (!term) continue;
    const index = text.indexOf(term);
    cards.push({ id: `local_${cards.length}`, front: `Complete the sentence: ${text.slice(0, index)}[ … ]${text.slice(index + term.length)}`, back: `${term}\n\n${text}`, topicTag: chunk.documentTitle, citation: citation(chunk) });
    if (cards.length >= count) break;
  }
  if (!cards.length) throw new Error('No suitable sentences were found. Add readable text to your notes and try again.');
  return cards;
}

export function localSummary(chunks: DocumentChunk[]): AcademicSummary {
  const selected = passages(chunks).slice(0, 8);
  if (!selected.length) throw new Error('No suitable sentences were found. Add readable text to your notes and try again.');
  const title = chunks[0].documentTitle;
  return { title: `Extracts from ${title}`, documentTitle: title,
    overview: 'Selected passages from your notes. These are extracts, not an AI-written summary.',
    coreConcepts: selected.map(({ text, chunk }, i) => ({ concept: `Passage ${i + 1}`, explanation: text, citation: citation(chunk) })),
    formulasOrRules: [], examFocusPoints: [] };
}

/** Basic recall questions, using only words and sentences from the notes. */
export function localQuiz(chunks: DocumentChunk[], count: number): QuizQuestion[] {
  const cards = localFlashcards(chunks, 1000);
  const terms = [...new Map(cards.map(card => {
    const term = card.back.split('\n')[0];
    return [term.toLowerCase(), term] as const;
  })).values()];
  if (terms.length < 4) throw new Error('These notes need at least four distinct terms in readable sentences to create a quiz.');
  const shuffle = <T>(values: T[]): T[] => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const used = new Set<string>();
  const eligible = shuffle(cards).filter(card => {
    const term = card.back.split('\n')[0].toLowerCase();
    const visibleWords = new Set(card.front.toLowerCase().match(/[a-z0-9-]+/g) || []);
    if (used.has(term) || visibleWords.has(term) || terms.filter(t => !visibleWords.has(t.toLowerCase()) && t.toLowerCase() !== term).length < 3) return false;
    used.add(term);
    return true;
  });
  if (!eligible.length) throw new Error('The notes do not have enough distinct terms for unambiguous recall questions. Add more notes and try again.');
  return eligible.slice(0, count).map(card => {
    const answer = card.back.split('\n')[0];
    const visibleWords = new Set(card.front.toLowerCase().match(/[a-z0-9-]+/g) || []);
    const choices = shuffle([answer, ...shuffle(terms.filter(term => term.toLowerCase() !== answer.toLowerCase() && !visibleWords.has(term.toLowerCase()))).slice(0, 3)]);
    const keys = ['A', 'B', 'C', 'D'] as const;
    return { id: randomUUID(), question: card.front, options: choices.map((text, i) => ({ key: keys[i], text })),
      correctAnswer: keys[choices.indexOf(answer)], explanation: `Original note: ${card.back.split('\n\n').slice(1).join('\n\n')}`,
      topicTag: card.topicTag, difficulty: 'easy', citation: card.citation };
  });
}

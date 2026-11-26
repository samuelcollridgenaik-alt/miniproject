import { RetrievalResult } from '../types.js';

/** An extractive offline baseline: show only text actually present in the notes. */
export function localNotesAnswer(results: RetrievalResult[], threshold: number, question = ''): string {
  const relevant = results.filter(result => result.similarityScore >= threshold);
  if (!relevant.length) {
    return 'I could not find a sufficiently relevant passage in your notes. Try a more specific question or upload relevant material.';
  }
  const stopWords = new Set(['what', 'when', 'where', 'which', 'who', 'why', 'how', 'the', 'and', 'for', 'with', 'from', 'between', 'difference', 'explain', 'about', 'does', 'are', 'is', 'can', 'please']);
  const terms = new Set((question.toLowerCase().match(/[a-z0-9]+/g) || []).filter(word => word.length > 1 && !stopWords.has(word)));
  const excerpt = (text: string) => {
    const sentences = text.trim().match(/[^.!?\n]+(?:[.!?]+|$)/g) || [text.trim()];
    const matching = sentences.filter(sentence => (sentence.toLowerCase().match(/[a-z0-9]+/g) || []).some(word => terms.has(word)));
    return (matching.length ? matching : sentences).map(s => s.trim()).join(' ');
  };
  return [
    '### Relevant passages from your notes',
    'This offline response extracts source text; it does not generate an explanation. Check the original notes for context.',
    ...relevant.map(result => `**${result.citation}**\n\n${excerpt(result.chunk.text)}`),
  ].join('\n\n');
}

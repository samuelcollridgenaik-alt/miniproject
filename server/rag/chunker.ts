import { DocumentChunk } from '../types.js';
import { ExtractedDocument } from './extractor.js';
import { CONFIG } from '../config.js';

export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export class DocumentChunker {
  public chunkDocument(
    doc: ExtractedDocument,
    documentId: string,
    options?: ChunkerOptions
  ): DocumentChunk[] {
    const chunkSize = options?.chunkSize || CONFIG.rag.chunkSize;
    const overlap = options?.chunkOverlap || CONFIG.rag.chunkOverlap;
    const chunks: DocumentChunk[] = [];
    let globalIndex = 0;

    for (const page of doc.pages) {
      const pageText = page.text.trim();
      if (!pageText) continue;

      if (pageText.length <= chunkSize) {
        chunks.push({
          id: `${documentId}_c${globalIndex}`,
          documentId,
          documentTitle: doc.title,
          chunkIndex: globalIndex++,
          text: pageText,
          pageOrSlideNumber: page.pageOrSlideNumber,
          characterCount: pageText.length,
        });
        continue;
      }

      // Sentence boundary splitting
      const sentences = pageText.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [pageText];
      let currentChunk = '';

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;

        if (currentChunk.length + sentence.length <= chunkSize) {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
          if (currentChunk.length > 0) {
            chunks.push({
              id: `${documentId}_c${globalIndex}`,
              documentId,
              documentTitle: doc.title,
              chunkIndex: globalIndex++,
              text: currentChunk,
              pageOrSlideNumber: page.pageOrSlideNumber,
              characterCount: currentChunk.length,
            });

            // Keep overlap from the end of currentChunk
            const words = currentChunk.split(/\s+/);
            const overlapWordCount = Math.min(words.length, Math.floor(overlap / 8));
            const overlapText = words.slice(-overlapWordCount).join(' ');
            currentChunk = overlapText + ' ' + sentence;
          } else {
            // Sentence itself exceeds chunkSize: force split
            chunks.push({
              id: `${documentId}_c${globalIndex}`,
              documentId,
              documentTitle: doc.title,
              chunkIndex: globalIndex++,
              text: sentence.substring(0, chunkSize),
              pageOrSlideNumber: page.pageOrSlideNumber,
              characterCount: Math.min(sentence.length, chunkSize),
            });
            currentChunk = sentence.substring(chunkSize - overlap);
          }
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push({
          id: `${documentId}_c${globalIndex}`,
          documentId,
          documentTitle: doc.title,
          chunkIndex: globalIndex++,
          text: currentChunk.trim(),
          pageOrSlideNumber: page.pageOrSlideNumber,
          characterCount: currentChunk.trim().length,
        });
      }
    }

    return chunks;
  }
}

export const documentChunker = new DocumentChunker();

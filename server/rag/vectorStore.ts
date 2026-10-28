import { DocumentChunk, RetrievalResult } from '../types.js';
import { geminiAdapter } from '../orchestrator/geminiAdapter.js';
import { CONFIG } from '../config.js';
import fs from 'fs';
import path from 'path';

export class VectorStore {
  private chunks: Map<string, DocumentChunk> = new Map();
  private vectorCache: Map<string, number[]> = new Map();
  private dataDir = path.resolve(process.cwd(), '.data');
  private storeFile = path.resolve(process.cwd(), '.data', 'vector_index.json');

  constructor() {
    this.ensureStorageDir();
    this.loadFromDisk();
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (err) {
        console.warn('Could not create .data directory:', err);
      }
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storeFile)) {
        const data = JSON.parse(fs.readFileSync(this.storeFile, 'utf-8'));
        if (Array.isArray(data.chunks)) {
          for (const c of data.chunks) {
            this.chunks.set(c.id, c);
            if (c.embedding && Array.isArray(c.embedding)) {
              this.vectorCache.set(c.id, c.embedding);
            }
          }
          console.log(`Loaded ${this.chunks.size} indexed chunks from persistent storage.`);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load vector index from disk:', err.message);
    }
  }

  private saveToDisk(): void {
    try {
      this.ensureStorageDir();
      const chunkList = Array.from(this.chunks.values()).map((c) => ({
        ...c,
        embedding: this.vectorCache.get(c.id),
      }));
      fs.writeFileSync(this.storeFile, JSON.stringify({ chunks: chunkList }, null, 2));
    } catch (err: any) {
      console.warn('Failed to save vector index to disk:', err.message);
    }
  }

  /**
   * Deterministic Term-Frequency / Lexical Vectorizer for fallback
   */
  private createLocalVector(text: string, vocabulary: string[]): number[] {
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
    const counts = new Map<string, number>();

    for (const t of tokens) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }

    const vector: number[] = new Array(vocabulary.length).fill(0);
    for (let i = 0; i < vocabulary.length; i++) {
      const term = vocabulary[i];
      if (counts.has(term)) {
        // Log-normalized term frequency
        vector[i] = 1 + Math.log(counts.get(term)!);
      }
    }

    // Unit normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }
    return vector;
  }

  private buildVocabulary(): string[] {
    const vocabSet = new Set<string>();
    for (const chunk of this.chunks.values()) {
      const clean = chunk.text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
      const words = clean.split(/\s+/).filter((w) => w.length > 2);
      for (const w of words) {
        vocabSet.add(w);
      }
    }
    return Array.from(vocabSet).sort();
  }

  /**
   * Cosine Similarity calculation
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Add and index chunks
   */
  public async addChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);

      // Attempt real Gemini embedding
      if (geminiAdapter.isConfigured()) {
        try {
          const emb = await geminiAdapter.generateEmbedding(chunk.text);
          if (emb) {
            this.vectorCache.set(chunk.id, emb);
            chunk.embedding = emb;
          }
        } catch (e) {
          // Will use local vectorizer
        }
      }
    }

    this.saveToDisk();
  }

  public removeDocument(documentId: string): void {
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
        this.vectorCache.delete(id);
      }
    }
    this.saveToDisk();
  }

  public getAllChunks(): DocumentChunk[] {
    return Array.from(this.chunks.values());
  }

  public getDocumentChunks(documentId: string): DocumentChunk[] {
    return Array.from(this.chunks.values()).filter((c) => c.documentId === documentId);
  }

  /**
   * Semantic search across indexed chunks
   */
  public async search(query: string, topK: number = CONFIG.rag.topK, documentIdFilter?: string): Promise<RetrievalResult[]> {
    if (this.chunks.size === 0) {
      return [];
    }

    let candidateChunks = Array.from(this.chunks.values());
    if (documentIdFilter) {
      candidateChunks = candidateChunks.filter((c) => c.documentId === documentIdFilter);
    }

    if (candidateChunks.length === 0) return [];

    let queryEmbedding: number[] | null = null;
    let isRealEmbedding = false;

    // Check if we can get a real Gemini embedding for the query
    if (geminiAdapter.isConfigured()) {
      try {
        queryEmbedding = await geminiAdapter.generateEmbedding(query);
        if (queryEmbedding) isRealEmbedding = true;
      } catch (e) {
        queryEmbedding = null;
      }
    }

    const scored: Array<{ chunk: DocumentChunk; similarity: number }> = [];

    if (isRealEmbedding && queryEmbedding) {
      for (const chunk of candidateChunks) {
        const chunkEmb = this.vectorCache.get(chunk.id);
        if (chunkEmb && chunkEmb.length === queryEmbedding.length) {
          const sim = this.cosineSimilarity(queryEmbedding, chunkEmb);
          scored.push({ chunk, similarity: sim });
        } else {
          // If chunk lacked real embedding, compute on the fly or score via fallback
          scored.push({ chunk, similarity: 0.1 });
        }
      }
    } else {
      // Local TF-IDF Vectorizer
      const vocab = this.buildVocabulary();
      const queryVec = this.createLocalVector(query, vocab);

      for (const chunk of candidateChunks) {
        const chunkVec = this.createLocalVector(chunk.text, vocab);
        const sim = this.cosineSimilarity(queryVec, chunkVec);
        scored.push({ chunk, similarity: sim });
      }
    }

    // Sort descending by similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    const topResults = scored.slice(0, topK);

    return topResults.map(({ chunk, similarity }) => {
      const pageOrSlideLabel = chunk.pageOrSlideNumber
        ? (chunk.documentTitle.toLowerCase().includes('slide') || chunk.documentTitle.toLowerCase().includes('ppt')
            ? `Slide ${chunk.pageOrSlideNumber}`
            : `Page ${chunk.pageOrSlideNumber}`)
        : `Chunk #${chunk.chunkIndex + 1}`;

      const citation = `[Doc: "${chunk.documentTitle}", ${pageOrSlideLabel}]`;

      return {
        chunk,
        similarityScore: Math.round(similarity * 1000) / 1000,
        citation,
      };
    });
  }

  public clearAll(): void {
    this.chunks.clear();
    this.vectorCache.clear();
    this.saveToDisk();
  }
}

export const vectorStore = new VectorStore();

import { GroundedAnswer, LLMProviderId, RetrievalResult } from '../types.js';
import { vectorStore } from './vectorStore.js';
import { taskRouter } from '../orchestrator/taskRouter.js';
import { CONFIG } from '../config.js';

export class RagPipeline {
  public async retrieveContext(
    question: string,
    documentIdFilter?: string,
    topK: number = CONFIG.rag.topK
  ): Promise<{ results: RetrievalResult[]; isSufficient: boolean; maxScore: number }> {
    const results = await vectorStore.search(question, topK, documentIdFilter);

    if (results.length === 0) {
      return { results: [], isSufficient: false, maxScore: 0 };
    }

    const maxScore = results[0].similarityScore;
    const isSufficient = maxScore >= CONFIG.rag.minSimilarityThreshold;

    return { results, isSufficient, maxScore };
  }

  public async answerGroundedQuestion(
    question: string,
    options?: {
      documentIdFilter?: string;
      preferredProvider?: LLMProviderId;
      topK?: number;
      apiKeyOverride?: string;
    }
  ): Promise<GroundedAnswer> {
    const topK = options?.topK || CONFIG.rag.topK;
    const { results, isSufficient, maxScore } = await this.retrieveContext(
      question,
      options?.documentIdFilter,
      topK
    );

    const providerId = options?.preferredProvider || 'gemini';

    // If context is completely insufficient or no documents indexed
    if (!isSufficient || results.length === 0) {
      return {
        requestId: `ground_${Date.now()}`,
        provider: providerId,
        model: 'rag-engine',
        latencyMs: 12,
        question,
        answer: 'INSUFFICIENT_RETRIEVED_CONTEXT: The uploaded course materials do not contain sufficient verified information to answer this question reliably. Under strict academic grounding rules, an answer cannot be synthesized without authentic source evidence.',
        isSufficientlyGrounded: false,
        groundingConfidence: Math.round(maxScore * 100) / 100,
        citations: results.map((r) => ({
          source: r.chunk.documentTitle,
          pageOrSlide: r.chunk.pageOrSlideNumber,
          quoteSnippet: r.chunk.text.substring(0, 140) + '...',
          relevanceScore: r.similarityScore,
        })),
        retrievedChunksCount: results.length,
      };
    }

    // Format retrieved passages for the LLM
    const contextBlocks = results
      .map(
        (r, idx) =>
          `[Source ${idx + 1}] Document: "${r.chunk.documentTitle}" | Location: ${
            r.chunk.pageOrSlideNumber ? `Page/Slide ${r.chunk.pageOrSlideNumber}` : `Section ${r.chunk.chunkIndex + 1}`
          } | Relevance: ${(r.similarityScore * 100).toFixed(1)}%\nContext Text:\n"${r.chunk.text}"`
      )
      .join('\n\n---\n\n');

    const systemPrompt = `You are Cognify AI's Academic Tutor, an expert educational intelligence system.
Your mission is to provide rigorous, accurate academic explanations strictly grounded in the provided document excerpts.

STRICT ACADEMIC CITATION RULES:
1. Every major fact, definition, or claim MUST cite its source using the format: [Doc: "<documentTitle>", Page/Slide: <number>].
2. NEVER fabricate page numbers, document titles, or facts not present in the excerpts.
3. If the excerpts only partially answer the question, state what is verified by the text and explicitly note what is missing.
4. Structure the explanation clearly with headings, key definitions, and bulleted concepts.
5. Finish with a brief "Verified Key Evidence" section summarizing the core citations.`;

    const userPrompt = `ACADEMIC QUESTION:
${question}

VERIFIED RETRIEVED EXCERPTS:
${contextBlocks}

Provide a comprehensive, accurate academic answer grounded strictly in these excerpts.`;

    try {
      const llmResponse = await taskRouter.executeTask('tutor', userPrompt, {
        systemInstruction: systemPrompt,
        preferredProvider: providerId,
        temperature: 0.2,
        apiKeyOverride: options?.apiKeyOverride,
      });

      return {
        requestId: llmResponse.requestId,
        provider: llmResponse.provider,
        model: llmResponse.model,
        latencyMs: llmResponse.latencyMs,
        question,
        answer: llmResponse.text,
        isSufficientlyGrounded: true,
        groundingConfidence: Math.min(1.0, Math.round((maxScore + 0.15) * 100) / 100),
        citations: results.map((r) => ({
          source: r.chunk.documentTitle,
          pageOrSlide: r.chunk.pageOrSlideNumber,
          quoteSnippet: r.chunk.text.substring(0, 160) + '...',
          relevanceScore: r.similarityScore,
        })),
        retrievedChunksCount: results.length,
        usage: llmResponse.usage,
      };
    } catch (err: any) {
      return {
        requestId: `err_${Date.now()}`,
        provider: providerId,
        model: 'unknown',
        latencyMs: 0,
        question,
        answer: `Generation failed: ${err.message}`,
        isSufficientlyGrounded: false,
        groundingConfidence: 0,
        citations: [],
        retrievedChunksCount: results.length,
      };
    }
  }
}

export const ragPipeline = new RagPipeline();

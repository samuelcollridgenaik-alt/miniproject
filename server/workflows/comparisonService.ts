import { ModelComparisonResult, LLMProviderId } from '../types.js';
import { vectorStore } from '../rag/vectorStore.js';
import { taskRouter } from '../orchestrator/taskRouter.js';
import { executionLogger } from '../orchestrator/executionLogger.js';

export class ComparisonService {
  /**
   * Run the same question and retrieved context concurrently through all 3 configured providers
   */
  public async compareModels(
    question: string,
    documentIdFilter?: string,
    userKeys?: { gemini?: string; groq?: string }
  ): Promise<ModelComparisonResult> {
    const requestId = executionLogger.generateRequestId('cmp');
    const retrieval = await vectorStore.search(question, 3, documentIdFilter);

    const contextSnippet = retrieval.length > 0
      ? retrieval.map((r, i) => `[Source ${i + 1}] (${r.chunk.documentTitle}): ${r.chunk.text}`).join('\n\n')
      : 'No reference document excerpts found.';

    const systemInstruction = 'You are an academic intelligence assistant. Answer the user question accurately based on the provided reference context. Be clear, concise, and cite concepts where applicable.';
    const prompt = `QUESTION: ${question}\n\nCONTEXT:\n${contextSnippet}\n\nAnswer:`;

    const providerList: LLMProviderId[] = ['gemini', 'groq'];

    const promises = providerList.map(async (providerId) => {
      const p = taskRouter.getProvider(providerId);
      const customKey = userKeys?.[providerId];
      const isConfigured = p.isConfigured(customKey);

      if (!isConfigured) {
        return {
          provider: providerId,
          model: p.defaultModel,
          response: `Provider ${p.name} is unconfigured. Set your API key in your Account Settings to enable live comparisons.`,
          latencyMs: 0,
          success: false,
          error: 'Unconfigured API key',
        };
      }

      try {
        const res = await p.generate(prompt, {
          systemInstruction,
          temperature: 0.3,
          maxTokens: 800,
          timeoutMs: 22000,
          apiKeyOverride: customKey,
        });

        return {
          provider: providerId,
          model: res.model,
          response: res.text,
          latencyMs: res.latencyMs,
          success: true,
          usage: res.usage,
        };
      } catch (err: any) {
        return {
          provider: providerId,
          model: p.defaultModel,
          response: `Call failed: ${err.message}`,
          latencyMs: 0,
          success: false,
          error: err.message,
        };
      }
    });

    const results = await Promise.all(promises);

    return {
      requestId,
      prompt: question,
      contextSummary: `${retrieval.length} context chunk(s) retrieved from ${new Set(retrieval.map((r) => r.chunk.documentTitle)).size} document(s).`,
      results,
    };
  }
}

export const comparisonService = new ComparisonService();

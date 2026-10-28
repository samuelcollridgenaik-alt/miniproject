import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMProviderId, LLMRequestOptions, LLMResponse } from '../types.js';
import { CONFIG } from '../config.js';
import { executionLogger } from './executionLogger.js';

export class GeminiAdapter implements LLMProvider {
  public id: LLMProviderId = 'gemini';
  public name = 'Google Gemini';
  public family = 'Gemini 3.8';
  public defaultModel = CONFIG.gemini.model;

  private getClient(apiKeyOverride?: string): GoogleGenAI | null {
    const key = apiKeyOverride || CONFIG.gemini.apiKey;
    if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
      return null;
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  public isConfigured(apiKeyOverride?: string): boolean {
    const key = apiKeyOverride || CONFIG.gemini.apiKey;
    return !!key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '';
  }

  public async ping(apiKeyOverride?: string): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const startTime = Date.now();
    if (!this.isConfigured(apiKeyOverride)) {
      return { ok: false, latencyMs: 0, message: 'Gemini API key is not configured.' };
    }

    try {
      const client = this.getClient(apiKeyOverride);
      if (!client) throw new Error('Client initialization failed');

      const pingPromise = client.models.generateContent({
        model: this.defaultModel,
        contents: 'Ping test. Reply with: PONG',
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini ping timed out after 6000ms')), 6000)
      );

      const response = await Promise.race([pingPromise, timeoutPromise]);

      const latencyMs = Date.now() - startTime;
      const text = response.text || '';
      return {
        ok: true,
        latencyMs,
        message: `Gemini reachable (${this.defaultModel}): ${text.trim().substring(0, 50)}`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        ok: false,
        latencyMs,
        message: err?.message || 'Gemini ping failed',
      };
    }
  }

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const requestId = options?.requestId || executionLogger.generateRequestId('gemini');

    if (!this.isConfigured(options?.apiKeyOverride)) {
      const err = 'Gemini API is unconfigured: Valid Gemini API key is missing.';
      executionLogger.log({
        taskType: 'tutor',
        provider: 'gemini',
        model: this.defaultModel,
        latencyMs: 0,
        success: false,
        promptSnippet: prompt.substring(0, 100),
        error: err,
      });
      throw new Error(err);
    }

    const client = this.getClient(options?.apiKeyOverride);
    if (!client) {
      throw new Error('Gemini client unavailable');
    }

    try {
      const config: any = {};
      if (options?.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (typeof options?.temperature === 'number') {
        config.temperature = options.temperature;
      }
      if (options?.jsonMode) {
        config.responseMimeType = 'application/json';
      }

      const response = await client.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const latencyMs = Date.now() - startTime;
      const outputText = response.text || '';

      // Usage metadata if provided by SDK
      const usageMetadata = (response as any).usageMetadata;
      const usage = usageMetadata ? {
        promptTokens: usageMetadata.promptTokenCount,
        completionTokens: usageMetadata.candidatesTokenCount,
        totalTokens: usageMetadata.totalTokenCount,
      } : undefined;

      executionLogger.log({
        taskType: 'tutor',
        provider: 'gemini',
        model: this.defaultModel,
        latencyMs,
        success: true,
        promptSnippet: prompt.substring(0, 100),
        responseSnippet: outputText.substring(0, 100),
        usage,
      });

      return {
        requestId,
        provider: 'gemini',
        model: this.defaultModel,
        text: outputText,
        latencyMs,
        usage,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      executionLogger.log({
        taskType: 'tutor',
        provider: 'gemini',
        model: this.defaultModel,
        latencyMs,
        success: false,
        promptSnippet: prompt.substring(0, 100),
        error: err?.message || String(err),
      });
      throw new Error(`Gemini generation failed: ${err?.message || err}`);
    }
  }

  public async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const client = this.getClient();
      if (!client) return null;

      const response = await client.models.embedContent({
        model: CONFIG.gemini.embeddingModel,
        contents: text,
      });

      const embeddingValues = (response as any)?.embedding?.values;
      if (Array.isArray(embeddingValues) && embeddingValues.length > 0) {
        return embeddingValues;
      }
      return null;
    } catch (err) {
      console.warn('Gemini embedContent failed, falling back to term vectorizer:', err);
      return null;
    }
  }
}

export const geminiAdapter = new GeminiAdapter();

import { LLMProvider, LLMProviderId, LLMRequestOptions, LLMResponse } from '../types.js';
import { CONFIG } from '../config.js';
import { executionLogger } from './executionLogger.js';

export class GroqLlamaAdapter implements LLMProvider {
  public id: LLMProviderId = 'groq';
  public name = 'Groq Llama';
  public family = 'Llama 3.3';
  public defaultModel = CONFIG.groq.model;

  public isConfigured(apiKeyOverride?: string): boolean {
    const key = apiKeyOverride || CONFIG.groq.apiKey;
    return !!key && key.trim() !== '' && !key.startsWith('MY_');
  }

  public async ping(apiKeyOverride?: string): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const startTime = Date.now();
    if (!this.isConfigured(apiKeyOverride)) {
      return { ok: false, latencyMs: 0, message: 'Groq API key is not configured.' };
    }

    const key = apiKeyOverride || CONFIG.groq.apiKey;

    try {
      const response = await fetch(CONFIG.groq.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'Ping. Reply: PONG' }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errorText = await response.text();
        return { ok: false, latencyMs, message: `Groq HTTP ${response.status}: ${errorText.substring(0, 100)}` };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return { ok: true, latencyMs, message: `Groq reachable (${this.defaultModel}): ${content.trim()}` };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - startTime, message: err?.message || 'Groq ping failed' };
    }
  }

  public async generate(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const requestId = options?.requestId || executionLogger.generateRequestId('groq');
    const key = options?.apiKeyOverride || CONFIG.groq.apiKey;

    if (!this.isConfigured(key)) {
      const err = 'Groq API is unconfigured: Valid Groq API key is missing.';
      executionLogger.log({
        taskType: 'summary',
        provider: 'groq',
        model: this.defaultModel,
        latencyMs: 0,
        success: false,
        promptSnippet: prompt.substring(0, 100),
        error: err,
      });
      throw new Error(err);
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (options?.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const payload: any = {
      model: this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.3,
    };

    if (options?.maxTokens) {
      payload.max_tokens = options.maxTokens;
    }

    if (options?.jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    let activeModel = this.defaultModel;

    try {
      let response = await fetch(CONFIG.groq.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(options?.timeoutMs || CONFIG.groq.timeoutMs),
      });

      // If rate limited or unavailable, attempt fallback model
      if (response.status === 429 || response.status === 503) {
        console.warn(`Groq ${activeModel} hit status ${response.status}, attempting fallback to ${CONFIG.groq.fallbackModel}`);
        activeModel = CONFIG.groq.fallbackModel;
        payload.model = activeModel;
        response = await fetch(CONFIG.groq.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(options?.timeoutMs || CONFIG.groq.timeoutMs),
        });
      }

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Groq API returned HTTP ${response.status}: ${errBody}`);
      }

      const result = await response.json();
      const outputText = result.choices?.[0]?.message?.content || '';

      const usage = result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      } : undefined;

      executionLogger.log({
        taskType: 'summary',
        provider: 'groq',
        model: activeModel,
        latencyMs,
        success: true,
        promptSnippet: prompt.substring(0, 100),
        responseSnippet: outputText.substring(0, 100),
        usage,
      });

      return {
        requestId,
        provider: 'groq',
        model: activeModel,
        text: outputText,
        latencyMs,
        usage,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      executionLogger.log({
        taskType: 'summary',
        provider: 'groq',
        model: activeModel,
        latencyMs,
        success: false,
        promptSnippet: prompt.substring(0, 100),
        error: err?.message || String(err),
      });
      throw new Error(`Groq generation failed: ${err?.message || err}`);
    }
  }
}

export const groqAdapter = new GroqLlamaAdapter();

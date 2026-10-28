import { ExecutionLog, LLMProviderId, LLMUsage } from '../types.js';

class ExecutionLogger {
  private logs: ExecutionLog[] = [];
  private maxLogs = 500;

  public generateRequestId(prefix: string = 'req'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public log(entry: Omit<ExecutionLog, 'id' | 'timestamp'>): ExecutionLog {
    const logItem: ExecutionLog = {
      id: this.generateRequestId('log'),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(logItem);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    return logItem;
  }

  public getRecentLogs(limit: number = 50): ExecutionLog[] {
    return this.logs.slice(0, limit);
  }

  public getProviderStats(): Record<LLMProviderId, {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
  }> {
    const stats: Record<LLMProviderId, {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      avgLatencyMs: number;
      totalPromptTokens: number;
      totalCompletionTokens: number;
      latencySum: number;
    }> = {
      gemini: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, avgLatencyMs: 0, totalPromptTokens: 0, totalCompletionTokens: 0, latencySum: 0 },
      groq: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, avgLatencyMs: 0, totalPromptTokens: 0, totalCompletionTokens: 0, latencySum: 0 },
    };

    for (const log of this.logs) {
      const p = log.provider;
      if (!stats[p]) continue;

      stats[p].totalRequests += 1;
      if (log.success) {
        stats[p].successfulRequests += 1;
        stats[p].latencySum += log.latencyMs;
      } else {
        stats[p].failedRequests += 1;
      }

      if (log.usage?.promptTokens) {
        stats[p].totalPromptTokens += log.usage.promptTokens;
      }
      if (log.usage?.completionTokens) {
        stats[p].totalCompletionTokens += log.usage.completionTokens;
      }
    }

    // Compute averages
    for (const p of (['gemini', 'groq'] as LLMProviderId[])) {
      stats[p].avgLatencyMs = stats[p].successfulRequests > 0
        ? Math.round(stats[p].latencySum / stats[p].successfulRequests)
        : 0;
    }

    return {
      gemini: { ...stats.gemini },
      groq: { ...stats.groq },
    };
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

export const executionLogger = new ExecutionLogger();

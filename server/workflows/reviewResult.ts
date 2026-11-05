import type { ContentAuditReview, LLMResponse } from "../types.js";
/** An unvalidated provider response cannot establish a successful audit. */
export function parseAuditResponse(response: LLMResponse): ContentAuditReview {
  const base = {
    requestId: response.requestId,
    auditorProvider: response.provider,
    auditorModel: response.model,
    latencyMs: response.latencyMs,
  };
  const unavailable: ContentAuditReview = {
    ...base,
    isAssessmentAvailable: false,
    verdict: "FLAGGED",
    consistencyScore: 0,
    unsupportedClaims: [],
    factualDiscrepancies: [],
    ambiguousQuestions: [],
    recommendations: [
      "No validated audit assessment is available. Configure a live provider or retry, then review the source material manually.",
    ],
  };
  if (response.provider === "cognify-curriculum") return unavailable;
  try {
    const parsed: unknown = JSON.parse(
      response.text
        .replace(/^\s*```(?:json)?\s*/, "")
        .replace(/\s*```\s*$/, "")
        .trim(),
    );
    if (!parsed || typeof parsed !== "object") return unavailable;
    const data = parsed as Record<string, unknown>;
    if (
      !["PASS", "FLAGGED", "FAIL"].includes(String(data.verdict)) ||
      typeof data.consistencyScore !== "number" ||
      !Number.isFinite(data.consistencyScore) ||
      data.consistencyScore < 0 ||
      data.consistencyScore > 100
    )
      return unavailable;
    const lists = [
      "unsupportedClaims",
      "factualDiscrepancies",
      "ambiguousQuestions",
      "recommendations",
    ] as const;
    if (
      lists.some(
        (key) =>
          !Array.isArray(data[key]) ||
          !(data[key] as unknown[]).every((item) => typeof item === "string"),
      )
    )
      return unavailable;
    return {
      ...base,
      isAssessmentAvailable: true,
      verdict: data.verdict as ContentAuditReview["verdict"],
      consistencyScore: data.consistencyScore,
      unsupportedClaims: data.unsupportedClaims as string[],
      factualDiscrepancies: data.factualDiscrepancies as string[],
      ambiguousQuestions: data.ambiguousQuestions as string[],
      recommendations: data.recommendations as string[],
    };
  } catch {
    return unavailable;
  }
}

import test from "node:test";
import assert from "node:assert/strict";
import { parseAuditResponse } from "../server/workflows/reviewResult.js";
import type { LLMResponse } from "../server/types.js";
const valid = {
  verdict: "PASS",
  consistencyScore: 92,
  unsupportedClaims: [],
  factualDiscrepancies: [],
  ambiguousQuestions: [],
  recommendations: ["Check original text."],
};
const response = (text: string): LLMResponse => ({
  requestId: "audit-test",
  provider: "gemini",
  model: "test-model",
  latencyMs: 10,
  text,
});
test("a valid structured audit preserves the reported verdict and score", () => {
  const result = parseAuditResponse(response(JSON.stringify(valid)));
  assert.equal(result.isAssessmentAvailable, true);
  assert.equal(result.verdict, "PASS");
  assert.equal(result.consistencyScore, 92);
});
test("malformed provider output never becomes a fabricated PASS", () => {
  for (const text of [
    "not JSON",
    "null",
    JSON.stringify({ ...valid, verdict: "UNKNOWN" }),
    JSON.stringify({ ...valid, consistencyScore: 101 }),
    JSON.stringify({ ...valid, recommendations: [{}] }),
  ]) {
    const result = parseAuditResponse(response(text));
    assert.equal(result.isAssessmentAvailable, false);
    assert.equal(result.verdict, "FLAGGED");
  }
});
test("bundled curriculum material cannot be presented as an independent content audit", () => {
  const result = parseAuditResponse({
    ...response(JSON.stringify(valid)),
    provider: "cognify-curriculum",
  });
  assert.equal(result.isAssessmentAvailable, false);
  assert.equal(result.verdict, "FLAGGED");
});

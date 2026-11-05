import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentsView } from "../src/components/DocumentsView.js";
import { StudyMaterialView } from "../src/components/StudyMaterialView.js";
import { QuizView } from "../src/components/QuizView.js";
import { MasteryView } from "../src/components/MasteryView.js";
import { StudyPlannerView } from "../src/components/StudyPlannerView.js";
import { ComparisonView } from "../src/components/ComparisonView.js";
import { ReviewView } from "../src/components/ReviewView.js";
import { EvaluationView } from "../src/components/EvaluationView.js";
import { LoginPage } from "../src/components/LoginPage.js";
import { ModelSettingsModal } from "../src/components/ModelSettingsModal.js";
import { apiJson } from "../src/lib/api.js";
import { scorePracticeQuiz } from "../src/lib/quiz.js";
import type { QuizQuestionData } from "../src/types.js";
const noop = () => {};
const pages = [
  [
    "documents",
    React.createElement(DocumentsView, {
      documents: [],
      onRefresh: noop,
      onSeedSample: noop,
    }),
  ],
  ["study", React.createElement(StudyMaterialView, { documents: [] })],
  [
    "quiz",
    React.createElement(QuizView, { documents: [], onQuizCompleted: noop }),
  ],
  ["mastery", React.createElement(MasteryView, {})],
  ["planner", React.createElement(StudyPlannerView, {})],
  ["comparison", React.createElement(ComparisonView, { documents: [] })],
  ["review", React.createElement(ReviewView, { documents: [] })],
  [
    "evaluation",
    React.createElement(EvaluationView, {
      providers: [],
      onRefreshProviders: noop,
    }),
  ],
  [
    "login",
    React.createElement(LoginPage, { currentUser: null, onLoginSuccess: noop }),
  ],
  [
    "settings",
    React.createElement(ModelSettingsModal, {
      isOpen: true,
      onClose: noop,
      activeProvider: "gemini",
      onSelectProvider: noop,
      geminiKey: "",
      onSaveGeminiKey: noop,
      groqKey: "",
      onSaveGroqKey: noop,
      providers: [],
      onRefreshDiagnostics: noop,
    }),
  ],
] as const;
for (const [name, element] of pages)
  test(`${name}: renders with named fields and buttons`, () => {
    const html = renderToStaticMarkup(element);
    assert.ok(html.length > 100);
    for (const match of html.matchAll(/<(input|textarea|select)\b([^>]*)>/g)) {
      if (/type="hidden"/.test(match[2])) continue;
      const id = match[2].match(/\bid="([^"]+)"/)?.[1];
      assert.ok(
        /aria-label(?:ledby)?=/.test(match[2]) ||
          (id && html.includes(`for="${id}"`)),
        `${name}: unnamed ${match[1]}`,
      );
    }
    for (const match of html.matchAll(
      /<button\b([^>]*)>([\s\S]*?)<\/button>/g,
    )) {
      const text = match[2]
        .replace(/<svg[\s\S]*?<\/svg>/g, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      assert.ok(
        text || /aria-label(?:ledby)?=|\btitle=/.test(match[1]),
        `${name}: unnamed button`,
      );
    }
  });
test("legacy academic modules use semantic class colors", () => {
  for (const name of [
    "DocumentsView",
    "StudyMaterialView",
    "QuizView",
    "MasteryView",
    "StudyPlannerView",
    "ComparisonView",
    "ReviewView",
    "EvaluationView",
    "LoginPage",
    "ModelSettingsModal",
  ]) {
    const source = readFileSync(`src/components/${name}.tsx`, "utf8");
    assert.doesNotMatch(
      source,
      /(?:bg|text|border)-(?:slate|zinc|blue|indigo|emerald|red|amber|teal|cyan)-\d+/,
      name,
    );
  }
});
function luminance(hex: string) {
  const c = hex
    .replace("#", "")
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string) {
  const l = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l[0] + 0.05) / (l[1] + 0.05);
}
test("semantic text and status token pairs meet AA contrast", () => {
  const css = readFileSync("src/design-system.css", "utf8");
  const light = css.match(/:root\s*\{([\s\S]*?)\}/)![1];
  const dark = css.match(/\.dark\s*\{([\s\S]*?)\}/)![1];
  const tokens = (block: string) =>
    Object.fromEntries(
      [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [
        m[1],
        m[2],
      ]),
    );
  for (const [theme, t, background] of [
    ["light", tokens(light), "#ffffff"],
    ["dark", tokens(dark), "#282828"],
  ] as const) {
    for (const key of ["text-secondary", "text-muted", "accent-text"])
      assert.ok(contrast(t[key], background) >= 4.5, `${theme} ${key}`);
    for (const status of ["success", "warning", "danger"])
      assert.ok(
        contrast(t[`${status}-text`], t[`${status}-soft`]) >= 4.5,
        `${theme} ${status}`,
      );
    assert.ok(
      contrast("#ffffff", t["accent-solid"]) >= 4.5,
      `${theme} primary button`,
    );
  }
});
test("quiz local grading never counts unanswered questions as option A", () => {
  const q: QuizQuestionData = {
    id: "one",
    question: "Question",
    topicTag: "Topic",
    difficulty: "easy",
    options: [
      { key: "A", text: "a" },
      { key: "B", text: "b" },
    ],
    correctAnswer: "A",
    explanation: "Explanation",
  };
  assert.equal(scorePracticeQuiz([q], {}).score, 0);
  const result = scorePracticeQuiz([q], { one: "A" });
  assert.equal(result.score, 1);
  assert.equal(result.topicBreakdown.Topic.percentage, 100);
  assert.match(result.id, /^local_attempt_/);
});
test("API helper rejects HTTP errors and non-JSON responses", async (t) => {
  const mock = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("Unavailable", { status: 503 }),
  );
  await assert.rejects(apiJson("/test"), /unreadable response/);
  mock.mock.mockImplementation(async () =>
    Response.json({ success: false, error: "Please retry" }, { status: 400 }),
  );
  await assert.rejects(apiJson("/test"), /Please retry/);
  mock.mock.mockImplementation(async () =>
    Response.json({ success: true, items: [] }),
  );
  assert.deepEqual(await apiJson("/test"), { success: true, items: [] });
});

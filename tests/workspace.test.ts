import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AnswerText from "../src/components/AnswerText.js";
import MathAnswerText from "../src/components/MathAnswerText.js";
import {
  closeWorkspace,
  loadWorkspace,
  newConversation,
} from "../src/hooks/useConversations.js";

test("closing a tab keeps its conversation and unsent draft", () => {
  const first = { ...newConversation(), draft: "Keep this unsent draft" };
  const second = newConversation();
  const result = closeWorkspace(
    {
      conversations: [first, second],
      open: [first.id, second.id],
      active: first.id,
    },
    first.id,
  );
  assert.equal(result.active, second.id);
  assert.equal(result.conversations[0].draft, "Keep this unsent draft");
  assert.deepEqual(result.open, [second.id]);
});
test("closing the last tab creates a fresh tab without deleting history", () => {
  const c = { ...newConversation(), draft: "Saved draft" };
  const result = closeWorkspace(
    { conversations: [c], open: [c.id], active: c.id },
    c.id,
  );
  assert.equal(result.conversations.length, 2);
  assert.notEqual(result.active, c.id);
  assert.equal(
    result.conversations.find((x) => x.id === c.id)?.draft,
    "Saved draft",
  );
});
test("restores the active conversation, removes stale tabs, and retains drafts", () => {
  const c = {
    ...newConversation(),
    draft: "Original draft",
    mode: "scholar" as const,
  };
  const result = loadWorkspace("user-a", {
    getItem: () =>
      JSON.stringify({ conversations: [c], open: ["missing"], active: c.id }),
  });
  assert.deepEqual(result.open, [c.id]);
  assert.equal(result.active, c.id);
  assert.equal(result.conversations[0].draft, "Original draft");
  assert.equal(result.conversations[0].mode, "scholar");
});
test("malformed or unavailable storage safely opens an empty conversation", () => {
  for (const getItem of [
    () => "{broken",
    () => JSON.stringify({ conversations: [{ id: "bad" }], open: [] }),
    () => {
      throw new Error("denied");
    },
  ]) {
    const result = loadWorkspace("user-a", { getItem });
    assert.equal(result.conversations.length, 1);
    assert.equal(result.conversations[0].turns.length, 0);
    assert.equal(result.open[0], result.active);
  }
});
test("loads only the requested account storage key", () => {
  const requested: string[] = [];
  loadWorkspace("cognify_workspace_v1_user-a", {
    getItem: (key) => {
      requested.push(key);
      return null;
    },
  });
  assert.deepEqual(requested, ["cognify_workspace_v1_user-a"]);
});
test("academic renderer handles tables, highlighted code, and math", () => {
  const html = renderToStaticMarkup(
    React.createElement(MathAnswerText, {
      text: "| A | B |\n|---|---|\n| 1 | 2 |\n\n```js\nconst n = 2;\n```\n\n$E=mc^2$",
    }),
  );
  assert.match(html, /<table>/);
  assert.match(html, /hljs-keyword/);
  assert.match(html, /katex/);
});
test("academic renderer does not execute HTML or unsafe links", () => {
  const html = renderToStaticMarkup(
    React.createElement(AnswerText, {
      text: "<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)\n\n<img src=x onerror=alert(1)>",
    }),
  );
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
});

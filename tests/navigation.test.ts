import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NotionSidebar, modules } from "../src/components/NotionSidebar.js";
import { newConversation } from "../src/hooks/useConversations.js";
const noop = () => {};
const render = (conversations = [newConversation()]) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { matchMedia: () => ({ matches: false }) },
  });
  try {
    return renderToStaticMarkup(
      React.createElement(NotionSidebar, {
        activeTab: "quiz",
        onSelectTab: noop,
        isOpen: true,
        onToggle: noop,
        currentUser: {
          id: "test",
          name: "Test Student",
          email: "student@example.test",
          role: "student",
          createdAt: "2026-01-01",
        },
        onOpenAuth: noop,
        width: 290,
        onWidth: noop,
        conversations,
        activeConversation: conversations[0].id,
        onSelectConversation: noop,
        onNew: noop,
        onRename: noop,
        onDelete: noop,
        onSettings: noop,
      }),
    );
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
};
test("all nine academic destinations are accessible in the rail, with complete tooltip names", () => {
  const markup = render();
  const rail = markup.slice(markup.indexOf("<nav"), markup.indexOf("</nav>"));
  assert.equal(modules.length, 9);
  for (const module of modules) {
    assert.ok(
      rail.includes(`aria-label="${module.label.replaceAll("&", "&amp;")}"`),
    );
    assert.ok(rail.includes(`id="rail-tooltip-${module.id}"`));
  }
  assert.match(rail, /aria-label="Adaptive Quizzer"[^>]*aria-current="page"/);
});
test("conversation sidebar contains no academic navigation or fabricated history", () => {
  const markup = render();
  const aside = markup.slice(
    markup.indexOf("<aside"),
    markup.indexOf("</aside>"),
  );
  assert.ok(aside.includes("Your conversations will appear here."));
  for (const module of modules)
    assert.ok(!aside.includes(module.label.replaceAll("&", "&amp;")));
  assert.ok(!aside.includes("Focus session"));
});
test("saved drafts appear in history with an actual conversation action disclosure", () => {
  const conversation = {
    ...newConversation(),
    title: "My saved draft",
    draft: "Explain memory paging",
  };
  const markup = render([conversation]);
  assert.match(markup, /Actions for My saved draft/);
  assert.match(markup, /aria-haspopup="true"/);
  assert.ok(!markup.includes("Your conversations will appear here."));
});

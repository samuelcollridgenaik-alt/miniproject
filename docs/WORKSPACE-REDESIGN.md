# Cognify academic workspace redesign

## Run and verify

Use Node.js 22.12 or newer (required by the installed Vite 8 tooling).

```powershell
npm ci
npm run dev
# Open http://localhost:3000
npm run lint
npm test
npm run build
```

`lint` runs TypeScript checking; there is no separate ESLint configuration. The build produces `dist/` and regenerates the existing `api/index.js` server bundle. `npm run preview` previews frontend assets only; the tutor needs the Express server. Keep the existing `.env` configuration and provider settings. No deployment was performed.

## Architecture and behavior

- `Workspace.tsx` shares the rail, sidebar, tabs, provider notice and content area across all nine existing modules. Existing module workflows and backend contracts remain in place.
- `NotionSidebar.tsx`: desktop sidebar starts at 280 px, resizes between 220 and 380 px, supports arrow-key resizing, collapse, grouped modules, searched recents, rename and confirmed deletion. On smaller screens it becomes a dismissible drawer. The profile uses the user returned by the existing API; the fabricated frontend fallback profile was removed.
- `NotionTopbar.tsx`: open conversations support switching, closure, overflow, arrow keys, Home and End. Closing a tab preserves its conversation and draft. Closing the last tab opens a fresh conversation.
- `useConversations.ts`: versioned local storage is scoped by the backend-returned user ID. Titles, turns, drafts, course context, academic mode and open tabs survive reload. Invalid data falls back safely and storage failures show a notice. Recents contain actual locally created conversations, never prefilled examples.
- `TutorView.tsx`: independent message scrolling, right-aligned questions, readable answers, source excerpts, copy, retry, regeneration, timeout and stop feedback. Enter submits, Shift+Enter inserts a newline, IME composition is respected, and duplicate sends are blocked. The existing `/api/tutor/ask` endpoint is used without changing its request/response shape. Requests are individual grounded questions; the backend has no multi-turn context or streaming contract. Stop cancels the browser request and does not guarantee cancellation of provider work already started.
- `AnswerText.tsx` and `MathAnswerText.tsx`: lazy Markdown rendering with tables, syntax highlighting, and KaTeX math. Raw HTML and unsafe link protocols are filtered. Formulas use `$...$` or `$$...$$` delimiters.
- Shared charcoal/light semantic tokens, visible keyboard focus, reduced-motion support and fixed composer placement replace the previous navy floating-card layout. Ctrl/Cmd+K opens module search; quick-ask now creates a real conversation draft.

## Dependencies

Added react-markdown, remark-gfm, remark-math, rehype-highlight, rehype-katex, highlight.js and katex. The KaTeX override follows the direct patched dependency to address the audit advisory; renderer tests cover the installed version. Updated esbuild to the compatible 0.28 line required by the existing Vite 8 dependency graph. No new router, state library or styling framework.

## Verification

Seven Node regression tests cover retained drafts when closing tabs, last-tab closure, restoring stale tab state, malformed/unavailable storage, account storage key selection, tables/code/math, and unsafe HTML/link filtering.

Browser checks exercised all nine module destinations, real tutor submission through the built-in engine, academic mode and provider selection, multiline input, tab creation/switching, draft preservation across reload, sidebar collapse and pointer/keyboard resize, theme switching and profile containment. Bounds were measured at 1920x1080, 1440x900, 1366x768, 1024x768, 768x1024 and 390x844: no document horizontal overflow; composer remained within the viewport. These are browser checks, not physical-device or mobile-keyboard certification.

## Review screenshots

- [Desktop](screenshots/workspace-desktop.png)
- [Mobile](screenshots/workspace-mobile.png)

The final production dependency audit reported zero vulnerabilities. Type checking, the seven regression tests and the production build passed. The initial application chunk is about 394 kB, with Markdown/code (331 kB) and math (270 kB) loaded separately as needed.

## Remaining deployment and data limits

- Conversation history is **local to this browser**, not synchronized or backed up to the server. Clearing browser data deletes it. It is separated in the UI by user ID; this is not an authentication or encryption boundary on a shared browser.
- The existing server uses demo identities, plaintext stored passwords, client-supplied `x-user-id` identity and shared storage state. The redesign does not replace this authentication architecture. Harden authentication, authorization and secret storage before public production use. Existing provider keys may remain in browser storage through the original settings flow.
- The existing built-in syllabus engine uses curated topic templates and can select an unrelated topic when retrieval context includes other subjects. A browser test asking about ACID returned Raft material. Built-in responses are explicitly labeled as reference material, not live AI, and their embedded reference claims must be checked against actual notes. Live Gemini/Groq quality and authenticated provider calls were not verified using new credentials.
- Document upload, quiz scoring, planning and provider comparison logic was preserved; opening their views was verified. This work did not execute every external-provider workflow or change the Python backend.

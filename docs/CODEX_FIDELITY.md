# Codex reference fidelity pass

Implemented in the existing application; no demo history or replacement backend.

## Reference and measured result

Reference: user-supplied `Screenshot 2026-11-05 212204.png`, 1366 x 704 pixels. The original navy Cognify screenshot was the before reference. The reference includes native desktop chrome and annotation rectangles; neither is reproduced in the application.

| Region | Reference approximation | Browser measured result |

| --- | --- | --- |

| Icon rail | 52 px; #202020 | 52 px; #202020 |

| Conversation sidebar | 290 px; #1b1b1b | 290 px default; #1b1b1b |

| App header | 54 px excluding native strip | 54 px |

| Conversation column | 736 px | 736 px |

| Composer | 736 x 98 px; x486; y580 | 736 x 98 px; x486; y581 |

| Composer surface | #363636 | #363636 |

| Main surface | #181818 | #181818 |

| User bubble | #173e76 | #173e76 |

[Side-by-side reference and actual captures](screenshots/fidelity/comparison.html).

## Changes

- `NotionSidebar.tsx`: all nine academic destinations exclusively in the icon rail, full keyboard/hover tooltips with Escape dismissal, conversation-only sidebar, real history filtering, overflow actions, accessible rename/delete dialogs, compact profile, constrained persisted resize and collapse.

- `NotionTopbar.tsx`: 32 px conversation tabs, overflow handling, correct module context, workspace controls with real provider status and the existing mounted focus timer.

- `Workspace.tsx`: 290 px default sidebar; removed the persistent provider banner in favor of header controls.

- `TutorView.tsx`: compact multiline composer and working send/stop control, retaining course/mode/provider selection and document access.

- `index.css` / `design-system.css`: measured shell dimensions and charcoal surfaces, centered chat alignment, compact shared headings, subtle separators, responsive rules.

- `tests/navigation.test.ts`: rail destination accessibility, conversation-only sidebar, genuine saved draft history.

## Verification

- 32 automated tests passed, including tab closure/draft preservation, rich academic rendering, unsafe markup rejection, semantic contrast, API failures and existing workflow tests.

- Passed: `npm run lint` (TypeScript; no independent ESLint script), `npm run build`, and `git diff --check`.

- Browser matrix: 54 module/viewport/theme combinations; zero main-workspace horizontal overflow. Desktop 1366 x 704 in both themes; 390 x 844 in both themes; tablet 768 x 1024 and narrow phone 320 x 568 in dark theme. See `fidelity-layout-matrix.json`.

- Browser interactions: all nine real module routes, history search, saving an unchanged existing title, delete confirmation/cancel, tooltip keyboard focus/Escape, drawer open/Escape, pointer resize from 290 to 310 px and back, keyboard resize bounds/step, real tab close/reopen retaining its unsent draft, provider controls, timer countdown across panel close/reopen.

- Delete execution was not performed against saved user conversations. No live provider request, new document upload, production deployment or external service configuration was performed in this visual pass.

## Limits

Conversation history is genuinely persisted in account-scoped browser storage, clearly marked Local. The existing backend has no conversation-history API; cross-device persistence is not implemented or claimed. Browser-storage failures retain their existing visible warning.

The academic answer content and available tools differ from Codex. Native desktop chrome, annotation borders, project groups unsupported by Cognify, voice controls, and fabricated code-change cards were not added. Hidden Codex interactions cannot be established from a screenshot. This is measured visual matching, not a claim of identical internal implementation or complete pixel parity.

Existing production blockers from the earlier audit remain: demonstration authentication/authorization, client-trusted quiz grading, and built-in template answer quality (a saved ACID question contains a Raft answer). See `UI_UX_AUDIT.md`; these were not introduced or resolved by the shell changes.

## Run

```powershell

npm install

npm run dev

# http://localhost:3000

npm run lint

npm test

npm run build

```

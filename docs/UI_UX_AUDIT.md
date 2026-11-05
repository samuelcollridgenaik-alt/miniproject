# Cognify AI UI/UX audit

Audit date: 2026-11-05 (Asia/Kolkata). Application package version: 0.0.0. Git base: `18926bbec8d6107c0249bcc01789b4e737cd08c9` plus the existing uncommitted workspace changes. This audit continued the already implemented Codex-inspired shell; it did not reset or replace that work.

## Discovery and scope

React 19 / TypeScript 7, Vite 8, Tailwind 4, Lucide icons, Express TypeScript backend and an alternate FastAPI reference backend. Navigation is React `activeTab` state inside `/`, not a URL router. Nine academic module states and standalone authentication are the ten primary page states. Account, model settings, search and document removal are four overlay workflows. The account component has four subviews. All 20 existing TSX component files were reviewed; 16 were refined and one shared primitives file was added (21 TSX files total). `Header.tsx` is legacy/unmounted; the full Pomodoro view is source-only while its compact form is mounted in the sidebar. Their source was reviewed and styles aligned without creating new routes.

No separate forgot-password, onboarding, document-preview, settings route, or custom 404 page exists. Unknown frontend paths use the existing SPA fallback. FastAPI's default `/docs` and `/redoc` are service documentation, not Cognify frontend views; the separate Python runtime was source-inspected and was not started or restyled. API endpoints, including dynamic document removal, were inventoried from `server.ts`; no new router or endpoints were introduced. The mastery module currently uses KPI/progress views, not a radar-chart implementation; no synthetic chart data was added.

## Route / component inventory

The first column below names the state at `/`; these identifiers are not fabricated URL routes. Full machine-readable inventory: [ui-route-inventory.json](ui-route-inventory.json).

| State / page | Purpose / meaningful states | Layout and shared components | Protected workflows | Priority | Status |
|---|---|---|---|---|---|
| `/` · `tutor` / Academic AI Tutor | Conversation, responses, composer, drafts, course and mode selectors | Workspace / TutorView; Rail, sidebar, tabs, Markdown renderer | RAG API, saved local history | High | Verified: default layout; existing history/rendering and unit coverage |
| `/` · `documents` / Course Notes & Vault | Upload, paste, search, sorting, table, removal confirmation | Workspace / DocumentsView; PageHeading, StatusMessage, EmptyState, ConfirmDialog | Ingestion and indexed vectors | High | Verified: TXT upload, paste indexing, search, confirmation cancellation, fixture cleanup |
| `/` · `study` / Active Recall & Cards | Bundled cards, generated cards, front/back, rating, digest | Workspace / StudyMaterialView; PageHeading, shared controls and statuses | Study generation APIs and existing cards | High | Verified: keyboard flip, protected typing, digest; generator inspected |
| `/` · `quiz` / Adaptive Quizzer | Setup, presets, generation, radio choices, submit and local/persisted results | Workspace / QuizView; PageHeading, LoadingState, StatusMessage | Assessment attempts and mastery recording | High | Verified: presets, radio arrows, incomplete validation; persistence not submitted from browser |
| `/` · `mastery` / Topic Mastery & Radar | KPI cards, topic progress, weak topics, loading/empty/error | Workspace / MasteryView; PageHeading, LoadingState, StatusMessage | Recorded assessment metrics | High | Verified: actual empty analytics and layout; populated state inspected |
| `/` · `planner` / Exam Revision Planner | Date/capacity/focus form, feasibility and daily schedule | Workspace / StudyPlannerView; PageHeading and semantic controls | Calendar dates, stored plans and allocations | High | Verified: invalid capacity, real schedules, first date and fractional hours |
| `/` · `comparison` / Multi-Model Lab | Prompt, course filter, concurrent outputs/errors and provider metrics | Workspace / ComparisonView; PageHeading, LoadingState and shared controls | Provider configuration and comparison contract | High | Verified: unconfigured providers; successful live responses unavailable |
| `/` · `review` / Fact-Check & Audit | Content/source/type form, findings, unavailable audit and errors | Workspace / ReviewView; PageHeading, StatusMessage | Source comparison and typed response contract | High | Verified: unavailable assessment; structured results covered by parser tests |
| `/` · `evaluation` / MCA Viva & Evaluator Lab | Rubric, unit tests, retrieval benchmark, execution logs | Workspace / EvaluationView; PageHeading, StatusMessage, EmptyState, shared table | Existing evaluation endpoints and execution data | High | Verified: all four subviews, 5 backend tests, actual retrieval metrics and empty logs |
| `/` · `signed-out` / Standalone authentication | Sign-in plus create/switch/keys states shared with account dialog | LoginPage outside Workspace; Overlay focus hook and shared controls | Existing authentication service | High | Verified: sign-out/demo restoration and sign-in layout; account subviews checked separately |
| `/` · `account` / Account dialog | Sign in, registration, switch account, API key vault | LoginPage modal; useOverlayFocus, semantic surfaces | Account identity, credentials and session controls | High | Verified: four subviews in two themes/seven widths; focus wrap; required fields |
| `/` · `model-settings` / Model settings dialog | Provider draft selection, keys, validation and apply/cancel | ModelSettingsModal; useOverlayFocus and shared controls | Stored provider/key preferences | High | Verified: layout, Escape, cancellation preserves selection; no real keys entered |
| `/` · `search` / Command palette | Module search, keyboard navigation and tutor handoff | CommandPalette overlay; useOverlayFocus and shared controls | Keyboard shortcuts and navigation | Medium | Verified: layouts, spaces in input, keyboard navigation/escape |
| `/` · `document-confirmation` / Document removal dialog | Explicit confirmation and cancellation | ConfirmDialog / DocumentsView; ConfirmDialog, useOverlayFocus, buttons | Avoid unintended removal | High | Verified: open/cancel; affirmative endpoint used only to clean audit fixtures |

## Findings and corrective actions

Findings are grouped by user-visible failure/root cause, not by every affected element. Baseline security/content risks are explicitly separated from regressions introduced by UI work.

Critical: 3; High: 13; Medium: 9; Low: 2. Total: 27. Fixed: 24. Open pre-existing risks: 3.

| ID | Severity | Problem | Root cause | Correction | Status | Owning files |
|---|---|---|---|---|---|---|
| C01 | Critical | Legacy cards were unreadable in dark mode | White-only surfaces and dark-only foregrounds were mixed with shell overrides | Migrated owning source to semantic theme utilities | Fixed | src/design-system.css; academic views; LoginPage |
| C02 | Critical | Existing demo authentication is not production isolation | Client identity header, default identities and plaintext credential storage | Documented; authentication replacement is outside this UI audit | Open (pre-existing) | server.ts; server/storage/db.ts |
| C03 | Critical | Existing quiz endpoint trusts supplied answer keys | Client supplies correctAnswer when submitting an assessment | Documented production hardening requirement; kept API behavior | Open (pre-existing) | server.ts /api/quiz/submit |
| H01 | High | Competing color and component systems across modules | Duplicated slate/navy/indigo/teal classes and floating-card conventions | Central semantic colors and shared primitives; removed broad module overrides | Fixed | src/design-system.css; src/index.css; legacy views |
| H02 | High | Account content clipped on short/mobile viewports | Body max-height ignored fixed header/footer | Viewport-bounded flex dialog with a scrollable body and wrapped tabs | Fixed | LoginPage.tsx |
| H03 | High | Flashcard shortcuts intercepted typing and dialog input | Window listener processed events from text fields and controls | Exclude editable/interactive targets; add explicit keyboard card action | Fixed | StudyMaterialView.tsx |
| H04 | High | Unanswered quiz items were assigned A | Submission replaced missing answers with a real choice | Require completion; radio semantics and arrow-key selection | Fixed | QuizView.tsx; src/lib/quiz.ts |
| H05 | High | Unsaved local quiz results were described as persisted | Fallback results reused unconditional database success copy | Track server persistence and offer retry saving; local scores labelled clearly | Fixed | QuizView.tsx |
| H06 | High | Evaluation claimed verification without evidence | Hardcoded VERIFIED badges and faithfulness metric | Capability checklist; on-demand evaluations; fixed faithfulness value excluded | Fixed | EvaluationView.tsx |
| H07 | High | Document errors looked successful and failed deletion was ignored | One success-styled status; unchecked HTTP response | Typed status notices, validated outcomes, timeout and safe refresh action | Fixed | DocumentsView.tsx; src/lib/api.ts |
| H08 | High | Analytics/evaluator failures disappeared silently | Catch blocks only logged to console | Visible error feedback, retries and truthful empty/loading states | Fixed | MasteryView.tsx; EvaluationView.tsx |
| H09 | High | Fields and controls lacked accessible names and choice semantics | Unassociated labels, SVG-only buttons and click-only quiz choices | Named fields/buttons, radio groups, progress semantics and keyboard behavior | Fixed | Academic views; LoginPage; ModelSettingsModal |
| H10 | High | Comparison submit overlay crowded the prompt on mobile | Absolute button and fixed right padding | Responsive inline form that stacks on narrow screens | Fixed | ComparisonView.tsx; src/design-system.css |
| H11 | High | Built-in curriculum content and reference claims can be inaccurate | Template/topic heuristics are not independent factual evaluation | Truthful built-in labels and unavailable fact-check; general content quality remains open | Open (pre-existing) | server/orchestrator/cognifyCurriculumAdapter.ts |
| H12 | High | Malformed or bundled provider output became an audit PASS | Audit parser invented PASS and scores on missing/invalid data | Validate complete result schema; return availability=false and hide invented score/verdict | Fixed | server/workflows/reviewResult.ts; reviewService.ts; ReviewView.tsx |
| H13 | High | Planner presented incorrect dates and budgets | UTC formatting of local midnight, 15-minute floor, full-horizon totals on capped preview | Calendar-only dates, exact weighted-minute allocation, preview-accurate totals and fractional-hour labels | Fixed | planningMath.ts; studyPlannerService.ts; StudyPlannerView.tsx |
| M01 | Medium | Document library lacked find/sort and useful empty feedback | Unfiltered file table | Real title/filename search, sorting and empty search/library states | Fixed | DocumentsView.tsx |
| M02 | Medium | Page headings and section density varied | Per-page heading markup and independent dimensions | Shared PageHeading, panel/control scales and responsive sizing | Fixed | ui/Primitives.tsx; academic views |
| M03 | Medium | Provider labels and result statuses overstated operation | Hardcoded versions, Online/Unconfigured assumptions and zero-ms failure metrics | Backend-returned model identity, request outcomes and Not measured latency | Fixed | ComparisonView.tsx; ModelSettingsModal.tsx |
| M04 | Medium | Modal/mobile focus escaped or returned inconsistently | No shared boundary for account/sidebar and incomplete focusable selector | Overlay focus trap/restoration, mobile media-query handling and skip link | Fixed | useOverlayFocus.ts; useMediaQuery.ts; NotionSidebar.tsx; Workspace.tsx |
| M05 | Medium | Planner controls accepted unusable parameters | Click handler bypassed native form validation | Validate future dates, finite capacity and course focus; preserve blank numeric edits | Fixed | StudyPlannerView.tsx |
| M06 | Medium | Card ratings implied a persisted review schedule | Date labels had no scheduling service behind them | Session-only ratings, honest copy and all-cards-rated feedback | Fixed | StudyMaterialView.tsx |
| M07 | Medium | Timer started with invented completed sessions | Hardcoded counter initialized to two | Initialize at zero, identify this-session counts, and retain the mounted timer while navigation is collapsed | Fixed | PomodoroTimer.tsx |
| M08 | Medium | A view-render failure could take down the entire shell | No module recovery boundary | Boundary preserves shell and offers reopening/retry | Fixed | ui/Primitives.tsx; Workspace.tsx |
| M09 | Medium | Settings cancel discarded keys but applied provider immediately | Provider changes called the parent before Apply | Draft provider/key state; sync on reopen; commit only on Apply | Fixed | ModelSettingsModal.tsx |
| L01 | Low | Control radius, hover and focus treatments varied | Repeated visual decisions in individual JSX | Limited radius/spacing scales, semantic focus/status rules and reduced-motion preservation | Fixed | src/design-system.css; components |
| L02 | Low | No repeatable UI consistency evidence | Only earlier chat regression tests and ad hoc screenshots | Render/name/color/contrast/API/calendar/audit tests; measured matrices and screenshot catalogue | Fixed | tests; docs |

## Engineering boundaries

Source-level semantic utility migration replaced legacy color classes; no global override of unrelated Tailwind classes was added. Existing React state navigation, module API paths, document contracts, local conversation storage and provider configuration were retained. Existing dependencies were reused; this audit added no runtime packages.

Two backend changes were essential to prevent misleading UI: validation of content-audit results and corrections to calendar/budget arithmetic. The audit response adds optional `isAssessmentAvailable`; the planner request accepts optional `timeZone` so date-only arithmetic follows the student device across server time zones. Existing request/response fields remain. Invalid/unavailable assessments carry a non-PASS flag and the frontend suppresses score/verdict presentation. Deploy client and server together using the existing build command. Planner response fields remain unchanged; dates and allocated totals now represent the actual displayed schedule. The 30-day preview boundary remains explicit. No database migration is required.

## Verification and remaining limits

Baseline: 7 tests and TypeScript passed before these refinements. Current checks and exact scope are recorded in [UI_UX_VERIFICATION.md](UI_UX_VERIFICATION.md), with screenshots in [UI_SCREENSHOTS.md](UI_SCREENSHOTS.md). Semantic tokens/primitives are documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

C02/C03/H11 remain production blockers: the demo auth/credential/identity model, client-trusted quiz answer keys, and built-in content/citation quality. Browser-local chat is not server-backed sync or encrypted account isolation. Real provider credentials and successful live Gemini/Groq workflows were not supplied/tested. Do not describe this project as production-ready or the audit as complete WCAG certification.

Conversation rename and deletion still use the existing native browser prompt/confirmation. Their owning source was inspected; they are not separately themed application routes. Native prompt acceptance was not exercised during this audit. Document removal uses the new shared application dialog.

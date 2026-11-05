# Cognify AI design system

Updated 2026-11-05. Sources: `src/index.css`, `src/design-system.css`, and `src/components/ui/Primitives.tsx`.

## Foundation and themes

The established rail/sidebar/tab shell remains the common workspace. Theme preference is stored by the existing `cognify_theme` key; dark mode uses the root `.dark` class. Tailwind's dark variant targets that class. Colors are semantic utilities defined with `@utility`, applied directly in component source. Legacy component color classes were migrated rather than overridden globally.

| Purpose | Light | Dark | Token / utility |
|---|---|---|---|
| Workspace | #fafafa | #191919 | `--notion-bg` |
| Sidebar | #f1f1f1 | #1d1d1d | `--notion-sidebar` |
| Panel | #ffffff | #222222 | `--surface` / `bg-surface` |
| Input / subtle surface | #f7f7f8 | #282828 | `--input-bg` / `bg-subtle` |
| Elevated surface | #f0f0f0 | #2b2b2b | `--elevated` / `bg-elevated` |
| Primary text | #242424 | #ededed | `text-primary` |
| Secondary text | #4d4d55 | #cdcdcf | `text-secondary` |
| Metadata / placeholder | #64646c | #ababaf | `text-muted` / `placeholder-muted` |
| Primary button | #2459c3 | #2459c3 | `bg-accent-solid` + `text-on-accent` |
| Accent text / selection | #2457b7 / #e9effc | #a5c5ff / #23334e | `text-accent` / `bg-accent-soft` |
| Input boundary | #7d7d85 | #80808a | `--field-border` |

Success, warning and danger have separate foreground, soft background, border and solid-fill tokens. Status must also have a text label/icon; color alone does not convey pass/fail, selected answers or provider failures. Token-pair tests cover normal text contrast of 4.5:1 for the semantic text/status/button pairs. This is not a certification of every rendered pixel/state.

## Type, spacing and geometry

Use the existing Inter/system stack and monospace only for code, identifiers or numeric metadata. Page headings use 22 px (20 px on mobile), 600 weight and 1.3 line-height. Section headings use 16 px; main form/body text uses 14 px; metadata uses 12 px. The tutor's conversational column retains its readable body scale. Mobile form controls use 16 px to avoid input zoom.

Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 px (`--space-*`). Panel padding is 24 px, reduced to 16 px on mobile. Control radius is 8 px; panel radius 12 px; heading icon 10 px; chat/composer retain their larger established radii. Shadows are restrained. No per-module decorative gradients or global blur effects are added.

## Used primitives

- `PageHeading`: consistent Lucide identity icon, one page heading and a short description.
- `StatusMessage`: info/error/success variants with status or alert semantics.
- `EmptyState`: title, explanatory copy and an optional working action.
- `LoadingState`: shared spinner and accessible progress description.
- `ModuleErrorBoundary`: local view recovery without discarding saved shell/history state.
- `ConfirmDialog`: viewport-bounded removal confirmation, cancel-first focus, Escape and focus restoration. The document endpoint is called only after the final action.
- `ui-panel`, `ui-control`, `ui-field`, `ui-button`, `ui-tabs`, `ui-table-scroll`, `ui-module-header`, `ui-data-row`: shared surface, control and layout classes actually used by the views.

Buttons have focus/hover/disabled states and processing feedback. Icon-only controls need an accessible name. Use `aria-pressed` for toggles, radio semantics for quiz answers, and an accessible name/range for progress bars. Text fields need an associated label or explicit accessible name. Tables keep semantic headers/captions and horizontal scrolling in a keyboard-focusable region.

## Shell and responsive rules

Primary rail: 52 px on desktop / 44 px on mobile. Desktop sidebar: default 280 px, constrained to 220–380 px. Drag and arrow-key resize keep the stored width. Below 1024 px, the secondary navigation is a dismissible, focus-contained overlay. Profile text truncates inside the available width.

The shared top bar retains conversation tabs, overflow handling and real settings/search/theme controls. Chat has an independent scrolling column and stable composer. Non-chat modules use the scrollable module workspace; most views fit within 1080 px and the focused study-card view uses a narrower 896 px column. Different page purposes keep different content structures.

Below 768 px, form rows stack where needed, controls wrap and tables scroll inside their own region. Dialogs bound their complete header/body/footer to the dynamic viewport; the body scrolls independently. Standalone authentication has its own viewport scrolling container. Do not set a large body max-height that ignores modal header/footer height.

## Interaction and accessibility conventions

A skip link targets the workspace. Shared overlay focus handling supports Tab/Shift+Tab wrapping, Escape and trigger restoration; mobile navigation uses the same boundary. Flashcard global shortcuts ignore text fields, buttons, links and dialogs. Quiz options support arrows/Home/End and expose selection through radio semantics. Enter/Shift+Enter/IME behavior in the existing tutor is retained. Reduced-motion preferences remain respected.

Errors must be visible and recoverable. Local quiz scores are explicitly unsaved until the server acknowledges them. A source match, provider completion or assessment PASS is not independent proof of truth. Built-in curriculum material must not masquerade as a live model or validated audit. Provider status/model identity is taken from returned diagnostics/results; unsuccessful requests have no fabricated latency measurement.

Settings edits remain drafts until Apply. Cancel must not change the active provider or stored credentials. Card ratings are session-only; do not show future review dates without an implemented schedule service. Pomodoro counts are this-session counts beginning at zero.

## Maintaining consistency

Run `npm test` and `npm run lint` after edits. `tests/design-system.test.ts` renders the module/account/settings entry states, checks field/button names, detects recurring legacy color classes, and verifies selected semantic contrast pairs. Other regression tests cover API failures, quiz scoring, conversation persistence, audit response validation and date/minute allocation. Browser matrices and screenshots supplement these checks; they do not replace human interaction review or assistive-technology testing.

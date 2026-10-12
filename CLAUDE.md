# DeutschLab

Native macOS German-learning app for one user.

## Stack
- Tauri v2
- React
- TypeScript
- Tailwind CSS v4
- lucide-react
- SQLite via @tauri-apps/plugin-sql
- Local-only; no auth/backend/cloud
- Vitest + React Testing Library + Playwright (dev only)

## Goal
Teach German from A0 toward C1 for eventual Physics study at ETH Zürich.
Current scope: Unit 1 only, A0 → strong A1, Oct 2026–Jan 2027.

## Current architecture
- `src/App.tsx`: main dashboard/navigation and lesson routing
- `src/data/unit1.ts`: Unit 1 curriculum + starter tasks
- `src/data/lessons/week1Vocabulary.ts`: Week 1 vocabulary
- `src/components/VocabularyLesson.tsx`: working vocabulary lesson
- `src/lib/db.ts`: SQLite initialization, task progress, lesson attempts

## Current working behavior
- Dashboard and Unit 1 curriculum UI work
- SQLite persistence works across restarts
- `vocab-001` opens a real lesson
- Vocabulary lesson flow:
  intro → learn → quiz → results
- Passing score is 80%
- Attempts are saved
- Passed lesson is persisted as complete

## Development rules
- Keep UI minimal, clean, monochrome, macOS-like
- Preserve existing working behavior
- Avoid unrelated refactors
- Prefer reusable lesson primitives over duplicated logic
- Keep everything local/offline unless explicitly requested
- No Supabase/auth/server
- Do not add packages unless necessary
- TypeScript must compile cleanly
- Keep Tailwind IntelliSense warnings clean where practical

## Learning design
Use:
teach → contextualise → recall → assess

Do not build a Duolingo clone.
Prioritise explanation, production, listening, speaking, and mistake-aware review.
## Testing

Commands:
- `npm run test:unit` (or `npm test`): Vitest. Logic, content integrity, DB (real SQL via `node:sqlite`) and React component tests live next to the code as `*.test.ts(x)`.
- `npm run test:e2e`: Playwright smoke tests in `e2e/`, against the production bundle served by `vite preview`.
- `npm run test:all`: `tsc --noEmit` → Vitest → `vite build` → Playwright. This is the full gate.

Rules for every feature, before committing:
1. Write or update tests for the change, and run the relevant focused tests (e.g. `npx vitest run src/lib/dailyPlanner.test.ts`).
2. Run `npm run test:all`.
3. Fix failures caused by the change. Do not weaken or delete a test to make it pass unless the product behaviour was deliberately changed.
4. Only then commit and push.

Reporting honestly:
- Do not claim a feature is tested unless the relevant automated test actually ran in this session. Quote the pass/fail counts.
- Distinguish **automated test passed** from **native Tauri runtime manually verified**. Automated tests do not verify the native app.
- Native-only, never covered by automation (list these as "needs manual check" when a change touches them): the real Tauri SQL plugin and on-disk `deutschlab.db`, WKWebView rendering, real macOS German speech voices and `speechSynthesis` audio, window/menu behaviour.

Test conventions:
- Speech is faked (`src/test/fakeSpeech.ts`); tests must never depend on a real macOS voice. Use `removeGermanVoices()` to test the no-voice path.
- DB tests mock only `@tauri-apps/plugin-sql` with `src/test/fakeSqlPlugin.ts` (Node SQLite, in-memory). Production queries run for real.
- E2E replaces only the Tauri IPC boundary (`e2e/fixtures.ts`) with an in-memory SQLite database.
- Review shuffles items with `Math.random`; component tests pin it. Anything randomised in production code should be seedable or pinned in tests.
- Generated output (`test-results/`, `playwright-report/`) is gitignored. Never commit it.

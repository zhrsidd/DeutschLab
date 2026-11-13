# DeutschLab — Claude Code Instructions

## Project
DeutschLab is a **local-first macOS German-learning app** built with **Tauri v2, React, TypeScript, Tailwind CSS v4, and SQLite** (`@tauri-apps/plugin-sql`). No account, cloud backend, or AI service is required for core learning.

**Learner goal:** A0 → strong A1 on a 16-week path starting 15 November 2026 (planning end: 6 March 2027); eventual C1 and academic German for Physics at ETH Zürich by March 2028. Keep workload realistic alongside school.

**Optional AI (v1.1):** Gemini-backed writing/speaking feedback and the "Deutsch mit KI" tutor. Off by default,
advisory only, never required for core learning. See **AI** below.

**Current implementation:** Weeks **1–4** of Unit 1 (Foundations, the v1.0 scope) are implemented, including lessons, checkpoints, mistakes, active-recall spaced review, and the daily planner. Week 4 ends with `checkpoint-004` (the Foundations Checkpoint); Weeks 5–16 are planned only. An implemented feature is **not** automatically verified in the native macOS window.

## How it is built
- **Frontend:** React 19 + TypeScript (strict) + Vite 8, Tailwind v4 with tokens in `src/index.css` (`@theme`).
  Motion for React is used only for layout animation; brand motion is CSS keyframes.
- **Native shell:** Tauri v2 (`src-tauri/`, Rust). Plugins: SQL (SQLite), updater, process, opener.
- **Storage:** one SQLite database, created and migrated in `initialiseDatabase()` in `src/lib/db.ts`
  (`CREATE TABLE IF NOT EXISTS` plus guarded `ALTER TABLE`). Tables: `task_progress`, `app_state`,
  `lesson_attempts`, `mistakes`, `review_items`, `checkpoint_attempts`, `study_events`, and the `ai_*` tables.
- **Content is data.** `src/data/unit1.ts` lists every task with a stable ID; `src/data/lessons/*.ts` holds the
  lesson content; `src/App.tsx` maps task IDs to lesson components (`LESSONS`) and checkpoints (`CHECKPOINTS`).
- **Tests replace only the Tauri boundary.** `src/test/fakeSqlPlugin.ts` runs the real SQL against Node's
  built-in `node:sqlite`; `e2e/fixtures.ts` does the same in the browser suite; speech and AI are faked.
- **Releases** are signed by the Tauri updater. Pushing a `vX.Y.Z` tag makes GitHub Actions build a signed
  **draft** release, which the owner publishes by hand (`.github/workflows/release.yml`, `docs/UPDATING.md`).
  Ordinary commits publish nothing.

## Folder map
| Path | Contents |
|---|---|
| `src/App.tsx` | Navigation, lesson registry, checkpoint registry, dashboard/Today |
| `src/data/` | `unit1.ts` (tasks and stable IDs), `course.ts`, `reviewTypes.ts`, `lessons/` (one file per lesson or checkpoint, `weekN…`) |
| `src/components/` | One lesson UI per lesson type at the top level, plus `shell/` (AppShell, Intro, Atmosphere, Brand, Loaders), `home/`, `course/`, `practice/`, `progress/`, `settings/` (+ `DataView.tsx`), `review/`, `checkpoint/`, `grammar/`, `vocabulary/`, `lesson/` (shared primitives, `KineticSentence`), `celebrate/`, `charts/`, `ai/`, `update/` |
| `src/hooks/` | `useGermanSpeech`, `useCountdown`, `useRecorder` |
| `src/lib/` | `db.ts`, `reviewScheduler.ts`, `dailyPlanner.ts`, `checkpointScoring.ts`, `progress.ts`, `backup.ts`, `vocabResume.ts`, `celebration.ts`, `updater.ts`, answer grading, and `ai/` |
| `src/test/` | `setup.ts`, `fakeSqlPlugin.ts`, `fakeSpeech.ts`, `fakeAI.ts` |
| `e2e/` | Playwright specs against the production bundle with mocked Tauri SQL |
| `src-tauri/` | `src/lib.rs`, `src/ai.rs`, `tauri.conf.json`, `capabilities/`, `icons/`, Rust tests |
| `brand/` | Logomark, wordmark and app-icon sources; `build.py` regenerates them (design-time only) |
| `scripts/` | `test-agent.sh` (the gate), `native-selftest.sh`, `bump-version.mjs`, `check-version.mjs` |
| `docs/` | AI architecture/assessment/privacy, `UPDATING.md`, `QUALITY_AUDIT.md`, `V1_RELEASE_REPORT.md`, `CHANGELOG.md`, `UI_REDESIGN_REPORT.md` |
| `CURRICULUM.md`, `DESIGN.md` | The two authoritative references (below) |

Discover exact paths from the repo before assuming a file exists.

## Commands
Use **Node 24 or later**. The database tests import `node:sqlite`, and Vitest can only resolve it on a Node
version that lists it as a built-in; on Node 22 six test files fail with "Cannot bundle Node.js built-in
node:sqlite". That is the wrong Node version, not a product bug.

```bash
npm ci
npm run dev                 # Vite only, http://localhost:1420 (no native window)
npm run tauri dev           # native macOS app (needs Rust and the Tauri prerequisites)
npm run build               # tsc && vite build
npm run tauri build         # native bundle

npx vitest run src/lib/reviewScheduler.test.ts    # one focused test file
npm run test:unit           # all Vitest
npm run test:e2e            # Playwright (builds, then serves on :1420)
bash scripts/test-agent.sh  # the full gate, quiet: tsc, Vitest, build, Playwright

cd src-tauri && cargo test  # Rust checks (the real-Keychain test is --ignored)
bash scripts/native-selftest.sh          # opt-in native self-test in a temporary HOME
node scripts/check-version.mjs           # package.json, tauri.conf.json and Cargo.toml must agree
node scripts/bump-version.mjs <version>  # bump all three together
```

Port 1420 must be free for `npm run test:e2e`; it does not reuse a running server.

## Curriculum: source of truth
- **`CURRICULUM.md` is authoritative** for scope, sequence, prerequisites, vocabulary targets, mastery, and longer-term progression.
- Before editing lesson content, **read only the relevant sections** of `CURRICULUM.md`. **Do not import or preload the entire file** into this `CLAUDE.md`.
- Do not casually teach concepts assigned to later weeks. Reuse previously taught language where possible.
- When changing curriculum scope, lesson order, IDs, or implementation status, update `CURRICULUM.md` in the same change and explain the reason.
- Keep German natural and accurate: check conjugation, V2/question order, articles, plurals, spelling, umlauts, and formal **Sie**.
- Prefer **teach → contextualise → recall → assess → review**, with meaningful typed production rather than only multiple choice.
- Writing/speaking self-checks are honest self-assessment; **never claim automatic linguistic grading** without a real grader.

## Design system: DESIGN.md
- **`DESIGN.md` is authoritative for all UI** (Editorial Motion × Neo-Swiss, **Schwarzrot** identity: obsidian ×
  crimson × gold, the geometric ü mark, Neo-Swiss grid,
  tokens, motion, feedback, celebrations, charts, accessibility). Read the relevant section before UI work
  and update it in the same change when the system changes.
- Energy levels: **Home = cinematic, Learning = playful, Assessment = focused.** Don't bring Home's
  atmosphere into lessons or checkpoints.
- New markup uses semantic tokens (`bg-elevated`, `text-fg-2`, `bg-accent text-on-accent`). Legacy light
  utilities in lessons are remapped in `src/index.css` (DESIGN.md §3.4); `text-neutral-900` is crimson there.
- Colour roles never swap: **crimson = action and progress** (one crimson action per view), **gold = now and
  attention** (current position, German articles, the focus ring), **stone = data**. **Red text means an error
  and nothing else.** Correct answers get a green ring, not a brand colour.
- One `nc-luminous` block per screen at most. No glassmorphism, no mascot, no flags or national symbols, no XP,
  streak pressure or CEFR percentages, no fake loading progress.
- Reuse the existing feedback classes (`.dl-press`, `.dl-correct`, `.dl-wrong`, `.dl-feedback`, `.dl-check`), the
  loaders in `shell/Loaders.tsx` and `Celebration`. The umlaut dots move only in the ways DESIGN.md §11.1 lists.
- Animate `transform` and `opacity` only. Animations never delay input or saving. Reduced motion shows the final
  state. No GSAP, Rive, Lottie, chart or UI-kit libraries.
- Completion moments appear only after a saved, first-time completion (`src/lib/celebration.ts`).
- Accessibility: every action reachable by keyboard, visible gold focus, AA contrast (§3.3), feedback stated in
  words, decorative layers `aria-hidden`. Verify at the 760 × 560 minimum window.
- `docs/UI_REDESIGN_REPORT.md` records the earlier Nocturne (violet) redesign; Schwarzrot superseded its colour.
- `brand/` holds the logomark, wordmark and app-icon sources (`brand/build.py` regenerates them). Loaders live in
  `src/components/shell/Loaders.tsx`; colour roles: crimson = action/progress, gold = now/attention, red text = errors only.

## Key code locations
- `src/App.tsx` — navigation, lesson routing, dashboard/Today
- `src/data/unit1.ts` — curriculum tasks and stable IDs
- `src/data/lessons/` — lesson content and assessment data
- `src/components/` — lesson UIs, Review, checkpoints
- `src/components/lesson/` — shared presentation primitives
- `src/hooks/` — German speech and timers
- `src/lib/` — SQLite, scoring, answer grading, planner, review scheduler, backup (`backup.ts`), resume state (`vocabResume.ts`)
- `src/components/shell/` (AppShell, Intro, Atmosphere, Brand), `home/`, `course/`, `practice/`, `progress/`,
  `settings/` (+ `DataView.tsx`), `ReviewView.tsx` — the six sections; `App.tsx` holds the lesson registry
- `src/components/celebrate/`, `charts/`, `lesson/KineticSentence.tsx`, `vocabulary/GermanWord.tsx` — brand
  moments, charts and educational motion
- `src-tauri/` — native Tauri integration
- Existing Vitest/Testing Library and Playwright tests — product regression suite

## AI (v1.1): docs/AI_ARCHITECTURE.md, AI_ASSESSMENT.md, AI_PRIVACY.md
- `src-tauri/src/ai.rs` is the only code that sees the Gemini key (macOS Keychain) or calls Google: six
  narrow commands, fixed host, key in `x-goog-api-key`, `store: false`, model allowlist. Never add a
  generic HTTP proxy, never return the key, never store it in SQLite/app_state/localStorage/logs.
- `src/lib/ai/`: `models.ts` (capability registry, must match Rust lists; free-tier models only),
  `request.ts` (enabled/consent/daily-limit guard + usage log; no auto-retry, no provider/model fallback),
  `schemas.ts` (structured-output schemas + runtime validation), `prompts.ts`, `context.ts` (curriculum
  context), `assessment.ts`, `tutor.ts`, `store.ts` (ai_* tables). UI: `src/components/ai/`,
  `settings/AISettings.tsx`, `hooks/useRecorder.ts`.
- AI output is untrusted: corrections must quote the learner's text; lesson ids must exist and be in scope;
  no CEFR claims; **no pronunciation score** (speaking is transcript-based). AI never changes attempts,
  completion, checkpoints, mastery, mistakes or Review/SRS.
- Tests mock the native layer (`src/test/fakeAI.ts`); never require a real key. The live examiner
  evaluation (`src/lib/ai/liveEval.test.ts`) is opt-in via `DEUTSCHLAB_LIVE_EVAL=1 GEMINI_API_KEY=…`.
- Rust checks: `cd src-tauri && cargo test` (the real-Keychain test is `--ignored`).

## Non-negotiable engineering rules
1. Preserve existing learner progress, completion records, review/mistake history, and writing drafts.
2. **Never recycle or rename existing lesson/item IDs** without an explicit backward-compatible migration.
3. SQLite migrations must be additive, idempotent, and safe on existing on-disk databases.
4. Keep Review creation structured and compatible with legacy review items; don't change SRS intervals without approval.
5. Keep the Today planner deterministic; persist preferences and learning data, **not** a generated daily plan.
6. Remain local/offline for core features; no new cloud services, dependencies, or major abstractions without clear need.
   The optional Gemini AI layer is the only cloud integration; core features must never depend on it.
7. Preserve working lessons and UI. Avoid unrelated refactors and broad formatting churn.
8. Follow the current minimal, consistent macOS-style UI and accessible keyboard interactions.

## Mistakes a weaker model makes here, and how to avoid each
| Mistake | Why it is wrong here | Do this instead |
|---|---|---|
| Renaming or reusing a task or item ID (`vocab-003`, `checkpoint-004`, a word's id) to tidy up | Progress, attempts, mistakes and review items on the learner's disk are keyed by it | Add new IDs; keep old ones, or write a backward-compatible migration and test it in `dbMigration.test.ts` |
| Changing a `CREATE TABLE` statement, or dropping and recreating a table | The table already exists on the learner's machine, so `IF NOT EXISTS` skips the change, or data is lost | Add a guarded `ALTER TABLE … ADD COLUMN` after a `PRAGMA table_info` check, as `review_items.exercise_json` does |
| Teaching Week 5+ grammar (modals, dative, Perfekt) in a Foundations lesson because it reads naturally | The sequence in `CURRICULUM.md` is deliberate | Use only language taught up to that week |
| Writing German from memory: a guessed article, plural, or verb form | A wrong noun gender taught once is hard to unlearn | Check against a reference; add the noun to `src/lib/contentAudit.test.ts`; flag anything uncertain instead of guessing |
| Naming an informal variant in a note but not accepting it | The learner types it and is marked wrong | Add it to `acceptedGerman` (a test enforces this) |
| Presenting a self-check or AI score as a grade, a CEFR level or a pronunciation mark | There is no grader that supports the claim | "Practice marks", "advisory", "Pronunciation not formally assessed" |
| Letting AI output mark a lesson complete, create mistakes or alter review scheduling | AI is advisory and untrusted | AI results live only in `ai_*` tables |
| Calling Gemini from TypeScript, or passing the key to the webview | The key must stay in the Keychain behind `ai.rs` | Add or extend a narrow Rust command |
| Storing a generated daily plan | The planner must be deterministic from saved data | Persist preferences and learning data only |
| Using `text-neutral-900` for text, or `text-white` on a card | In the compatibility layer the first is crimson and the second is the on-accent colour | Semantic tokens: `text-fg`, `text-fg-2`, `bg-elevated` |
| A second crimson button, gold as a fill, or red for emphasis | Breaks the three colour roles | One crimson action; gold only for "now"; red text only for errors |
| Home's atmosphere, glow or celebration inside a lesson or checkpoint | Assessment is the Focused energy level | Decide the energy level first (DESIGN.md §1) |
| A celebration on every completion, or before the save resolves | It must mark a real, saved, first-time completion | Go through `src/lib/celebration.ts` |
| Adding XP, streaks, a mascot, a chart library or an animation library | DESIGN.md rules these out | Use the existing components and CSS |
| Running `npm run test:all` and pasting the log | It floods the context | `bash scripts/test-agent.sh`; read only the summary, or the excerpt on failure |
| Running the tests on Node 22 and "fixing" the `node:sqlite` error by editing the test double | The fake database is correct; the Node version is wrong | Switch to Node 24 or later |
| Saying a feature "works on macOS" after browser tests pass | SQLite, speech and the window are mocked in tests | Report "automated tests passed"; native verification is separate and manual |
| Bumping the version in one file, or pushing a `v*` tag | Three files must agree, and a tag builds a signed draft release that reaches installed copies once published | `scripts/bump-version.mjs`; tag only when the user asks for a release |
| Committing the updater private key, a local `.db`, `dist/`, `src-tauri/target/` or test artefacts | Secrets and generated output | Inspect staged files before every commit |
| A broad refactor or reformat alongside a lesson change | Lessons are long, working files; churn hides the real change | Touch only what the task needs |

## Token-efficient working style
- Start with `git status` and identify the smallest set of relevant files.
- Prefer targeted search, symbol/reference navigation (Serena if available), and small file ranges over reading entire large files.
- Read a whole file when genuinely needed; prefer normal reads for small lesson-data files.
- Use Context7/on-demand documentation **only** for uncertain or changing APIs. Don't fetch docs by default.
- Avoid printing whole files, full diffs, or passing test logs into conversation context.
- Keep implementation focused; avoid speculative framework-building.
- Respect existing ECC, context reducer, and model-router configuration; don't install overlapping memory/router tools unless requested.
- After finishing a milestone, provide a concise summary rather than code dumps.

## Content accuracy guards
- `src/lib/contentAudit.test.ts` holds an independent reference of every Week 2–4 noun's article and plural. When you add a noun, add it there too, or the "references every noun" test fails. Verify gender and plural against a German reference; flag uncertain claims instead of guessing.
- Informal variants named in a note (for example "Informal: Oma.") must also be in `acceptedGerman`; that test enforces it.
- `docs/QUALITY_AUDIT.md` records the v0.8 audit (content, performance, data safety, native status) and the ranked recommendations.
- `bash scripts/native-selftest.sh` runs the opt-in native self-test of the bundled app in a temporary HOME (never the live database).
- `docs/V1_RELEASE_REPORT.md` records the v1.0 state (verification levels, limitations, manual native checklist); `docs/CHANGELOG.md` lists milestones.

## Testing: mandatory gate
During development, run **focused tests** for changed behavior. Add/update regression tests for any product bug found.

Before committing, run the existing full gate **through the quiet wrapper**:

```bash
bash scripts/test-agent.sh
```

If the `test:agent` npm alias is configured, `npm run test:agent` is equivalent. This wrapper executes **`npm run test:all`** (TypeScript, Vitest, production build, Playwright) and writes full output to a temporary log.

- **Do not** run the noisy `npm run test:all` directly unless debugging the runner itself.
- On success, use the short summary; **do not read the full log**.
- On failure, inspect the excerpt, run the smallest relevant focused test, fix, then rerun the full gate. Read more of the log only if necessary.
- **Do not commit or push unless the full gate exits 0.**
- Do not delete or weaken useful tests merely to obtain a pass.
- Report actual Vitest/Playwright totals. Distinguish **automated tests passed** from **native Tauri runtime verified**; mocked SQLite, speech, and browser tests are not native verification.
- If the gate fails for an environment reason (wrong Node version, no Playwright browser installed), fix the
  environment rather than the code, and say in the report exactly which stages ran and how.

## Git and delivery
- Canonical repository: **`zhrsidd/DeutschLab`**, remote **`origin`**, usual branch **`main`**.
- Inspect status/remotes and fetch/pull safely. Preserve uncommitted user changes; never discard or overwrite them.
- Never force-push or rewrite shared history.
- Before commit, inspect the diff and staged files. Never commit secrets, `node_modules`, `dist`, `src-tauri/target`, local SQLite databases, or Playwright/Vitest artifacts.
- Commit and push only when the user/task explicitly requests it **and** validation passes.
- Final report: concise changed-file/behavior summary, exact test counts, commit/push status (if applicable), and any native-runtime caveat.

## Modular curriculum revision (13 November 2026)
- Unit 1 uses Sunday–Saturday study windows, 15 November 2026 – 6 March 2027, grouped into four thematic blocks.
- `src/data/learningModules.ts` and `docs/MODULE_CURRICULUM.md` define **planned authoring recipes**, not runnable lessons or new mastery rules.
- Module IDs are separate from existing persisted task/item IDs. Preserve all legacy progress.
- The next runtime work is the Week 3 possessions pilot in the modular teaching plan; Weeks 5–16 remain unimplemented.

## Before saying a task is done
- [ ] `git status` shows only the files this task should touch.
- [ ] Lesson content changed: the relevant `CURRICULUM.md` section was read; nothing from a later week is taught;
      German checked for articles, plurals, conjugation, word order, umlauts and formal Sie; new nouns added to
      `contentAudit.test.ts`; informal variants accepted.
- [ ] No existing lesson or item ID was renamed or reused; `CURRICULUM.md` updated if scope, order, IDs or
      status changed.
- [ ] Database changed: additive, idempotent, and tested against an existing database (`dbMigration.test.ts`).
- [ ] UI changed: semantic tokens only; one crimson action per view; the right energy level; keyboard reachable
      with visible focus; checked at 760 px wide and under reduced motion; `DESIGN.md` updated if the system changed.
- [ ] AI touched: key never leaves `ai.rs`; output validated; no effect on progress, mastery or Review; Rust and
      TypeScript model lists still match; `cargo test` run.
- [ ] A regression test exists for any bug fixed.
- [ ] `bash scripts/test-agent.sh` exits 0 on Node 24 or later, and the report gives the Vitest and Playwright totals.
- [ ] The report separates "automated tests passed" from "verified in the native macOS window", and lists
      anything not verified.

## Next curriculum work
Weeks **1–4 (Foundations) are implementation-complete** for v1.0. Before implementing Week 5 (modal verbs), consult its section of `CURRICULUM.md`. Do not jump ahead or silently alter earlier mastery rules.

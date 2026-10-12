# DeutschLab — Claude Code Instructions

## Project
DeutschLab is a **local-first macOS German-learning app** built with **Tauri v2, React, TypeScript, Tailwind CSS v4, and SQLite** (`@tauri-apps/plugin-sql`). No account, cloud backend, or AI service is required for core learning.

**Learner goal:** A0 → strong A1 by January 2027; eventual C1 and academic German for Physics at ETH Zürich by March 2028. Keep workload realistic alongside school.

**Current implementation:** Weeks **1, 2 and 3** of Unit 1 are implemented, including lessons, checkpoints, mistakes, active-recall spaced review, and the daily planner. Week 3 ends with `checkpoint-003`; Week 4 has not been started. An implemented feature is **not** automatically verified in the native macOS window.

## Curriculum: source of truth
- **`CURRICULUM.md` is authoritative** for scope, sequence, prerequisites, vocabulary targets, mastery, and longer-term progression.
- Before editing lesson content, **read only the relevant sections** of `CURRICULUM.md`. **Do not import or preload the entire file** into this `CLAUDE.md`.
- Do not casually teach concepts assigned to later weeks. Reuse previously taught language where possible.
- When changing curriculum scope, lesson order, IDs, or implementation status, update `CURRICULUM.md` in the same change and explain the reason.
- Keep German natural and accurate: check conjugation, V2/question order, articles, plurals, spelling, umlauts, and formal **Sie**.
- Prefer **teach → contextualise → recall → assess → review**, with meaningful typed production rather than only multiple choice.
- Writing/speaking self-checks are honest self-assessment; **never claim automatic linguistic grading** without a real grader.

## Key code locations
- `src/App.tsx` — navigation, lesson routing, dashboard/Today
- `src/data/unit1.ts` — curriculum tasks and stable IDs
- `src/data/lessons/` — lesson content and assessment data
- `src/components/` — lesson UIs, Review, checkpoints
- `src/components/lesson/` — shared presentation primitives
- `src/hooks/` — German speech and timers
- `src/lib/` — SQLite, scoring, answer grading, planner, review scheduler
- `src-tauri/` — native Tauri integration
- Existing Vitest/Testing Library and Playwright tests — product regression suite

Discover exact paths from the repo before assuming a file exists.

## Non-negotiable engineering rules
1. Preserve existing learner progress, completion records, review/mistake history, and writing drafts.
2. **Never recycle or rename existing lesson/item IDs** without an explicit backward-compatible migration.
3. SQLite migrations must be additive, idempotent, and safe on existing on-disk databases.
4. Keep Review creation structured and compatible with legacy review items; don't change SRS intervals without approval.
5. Keep the Today planner deterministic; persist preferences and learning data, **not** a generated daily plan.
6. Remain local/offline for core features; no new cloud services, dependencies, or major abstractions without clear need.
7. Preserve working lessons and UI. Avoid unrelated refactors and broad formatting churn.
8. Follow the current minimal, consistent macOS-style UI and accessible keyboard interactions.

## Token-efficient working style
- Start with `git status` and identify the smallest set of relevant files.
- Prefer targeted search, symbol/reference navigation (Serena if available), and small file ranges over reading entire large files.
- Read a whole file when genuinely needed; prefer normal reads for small lesson-data files.
- Use Context7/on-demand documentation **only** for uncertain or changing APIs. Don't fetch docs by default.
- Avoid printing whole files, full diffs, or passing test logs into conversation context.
- Keep implementation focused; avoid speculative framework-building.
- Respect existing ECC, context reducer, and model-router configuration; don't install overlapping memory/router tools unless requested.
- After finishing a milestone, provide a concise summary rather than code dumps.

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

## Git and delivery
- Canonical repository: **`zhrsidd/DeutschLab`**, remote **`origin`**, usual branch **`main`**.
- Inspect status/remotes and fetch/pull safely. Preserve uncommitted user changes; never discard or overwrite them.
- Never force-push or rewrite shared history.
- Before commit, inspect the diff and staged files. Never commit secrets, `node_modules`, `dist`, `src-tauri/target`, local SQLite databases, or Playwright/Vitest artifacts.
- Commit and push only when the user/task explicitly requests it **and** validation passes.
- Final report: concise changed-file/behavior summary, exact test counts, commit/push status (if applicable), and any native-runtime caveat.

## Next curriculum work
Weeks **1, 2 and 3 are implementation-complete**. Before implementing Week 4 (accusative consolidation and irregular verbs), consult its section of `CURRICULUM.md`. Do not jump ahead or silently alter earlier mastery rules. Do not jump ahead or silently alter earlier mastery rules.

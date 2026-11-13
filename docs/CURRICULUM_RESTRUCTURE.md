# Curriculum restructuring — Sunday start

Implemented 13 November 2026 on branch curriculum/sunday-modular-start.

- Start Sunday 15 November 2026; Unit 1 ends Saturday 6 March 2027.
- Four thematic blocks replace the old October–January grouping.
- Thirty-five **planned** module recipes carry outcomes, prior-module relationships, existing lesson mappings and changed-context practice.
- Course displays dates, can-do outcomes and expandable module outlines.
- Existing lessons remain runnable. Module recipes have no completion marks and do not imply a new teaching runner is built.
- Existing lesson IDs, task order, completion records, drafts, checkpoints, Review and scheduler are preserved.
- The former October Foundations milestone is displayed as Foundations.
- First-week teaching guide and cumulative retrieval plan live in CURRICULUM.md.
- Later unit windows preserve their planned lengths, with final certification preparation ending 4 March 2028. They remain provisional.

See [curriculum](../CURRICULUM.md), [module catalogue](MODULE_CURRICULUM.md) and [runtime implementation plan](superpowers/plans/2026-11-13-modular-german-teaching.md).

This is a curriculum and roadmap increment. The next implementation is the bounded possessions module runner, not a new bank of fixed quizzes. Instructor content review and delayed-transfer learner evaluation are still required before describing the new teaching flow as validated.

Learner clarification: [adaptive practice](ADAPTIVE_PRACTICE.md) is mandatory for the runtime pilot: valid sentence formation, different answer modes, evidence-based adaptation and recent-repeat avoidance. This increment documents that contract; it does not implement the generator.

## Verification

13 November 2026: bash scripts/test-agent.sh exited 0. TypeScript and production build passed;
Vitest: 74 files passed, 1 skipped; 995 tests passed, 1 skipped. Playwright: 63 passed.
Focused roadmap tests were observed failing before implementation and passing afterwards.
Additional checks verified all 31 legacy task IDs/order, sixteen Sunday–Saturday ranges,
catalogue alignment and local document links. Independent code review found no actionable issues.

The first baseline browser run could not launch because Chromium was missing. The test browser was
installed and the final full gate passed. Tests use mocked Tauri services; native macOS runtime,
instructor review and learner outcomes were not verified. No commit or push was made.

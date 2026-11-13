# Modular German Teaching Implementation Plan

> For agentic workers: use superpowers:executing-plans to implement this plan task by task. This document proposes future product work; this research task does not implement it.

**Goal:** Pilot reusable instruction and targeted practice for Week 3 accusative without losing existing learner data or changing current mastery authority.

**Architecture:** Keep legacy lessons as the default. Add a small, pure module model and runner, reviewed item variants and append-only evidence. An explicit pilot preference exposes a parallel practice route; recommendations remain advisory.

**Tech stack:** Existing React, TypeScript, Tauri v2, SQLite, Vitest and Playwright. No new runtime dependencies or cloud services.

**Spec:** [German teaching research and proposed design](../../research/GERMAN_TEACHING_REPORT.md). Proposed defaults below are engineering/product decisions for review, not approved curriculum changes.

## Global constraints

- Core learning remains offline; AI feedback remains optional and advisory.
- Preserve all existing lesson/item IDs, attempts, drafts, completion, mistakes and review history.
- Keep reviewScheduler.ts intervals and current checkpoint/mastery rules unchanged.
- SQLite changes are additive and idempotent; include new learner tables in backup/export.
- CURRICULUM.md remains authoritative; the pilot uses Weeks 1–3 taught language only.
- DESIGN.md remains authoritative for UI; consult relevant sections before implementing.
- Do not commit or push without an explicit request and a passing full gate.

## Review focus

- Existing databases and backups retain all legacy data; new evidence does not overwrite mastery.
- A restarted or interrupted module resumes consistently without duplicating an attempt.
- Valid German variants and case-sensitive spelling targets receive appropriate scoring.
- Missing audio, unsupported item formats and unavailable AI do not strand the learner.
- Sparse or ambiguous evidence yields support or a neutral recommendation, not a diagnosis.

## Delivery boundary

This is a proposed pilot, followed by conditional expansion. It does not author Weeks 5–16, rewrite the app, add an adaptive cloud service, replace SRS or certify proficiency. Estimates: roughly 3–5 engineering weeks plus German content review and at least 21 days of learner follow-up; not a deadline or measured effort. Each task below is a reviewable increment. Confirm design choices before product implementation.

## File map

Existing:
- src/data/lessons/grammarCourseTypes.ts and week3Accusative.ts: reusable assets and legacy mapping.
- src/components/grammar/GrammarCourseLesson.tsx: preserve default flow.
- src/App.tsx: opt-in route.
- src/lib/db.ts and src/lib/backup.ts: additive persistence and export integration.
- src/lib/dailyPlanner.ts: later advisory recommendation integration.
- CURRICULUM.md: pilot mapping and status, with unchanged sequence/mastery.
- docs/AI_ASSESSMENT.md: preserve authority boundaries.

Proposed:
- src/data/modules/types.ts: module, activity, result and evidence contracts.
- src/data/modules/possessions.ts: reviewed pilot content and variants.
- src/lib/moduleValidation.ts: curriculum/scope and content validation.
- src/lib/moduleSession.ts: deterministic transitions and support bounds.
- src/lib/moduleEvidence.ts: transactional session/evidence persistence.
- src/lib/moduleRecommendations.ts: transparent advisory selection.
- src/components/modules/ModuleLesson.tsx: orchestration using existing presentation primitives.
- Focused tests alongside each new module; e2e/modular-teaching.spec.ts for full flow.

Exact existing integration points should be rechecked at implementation time; baseline files were inspected for this report, but no product patch was made.

## Required addition: adaptive practice and sentence formation

Read [ADAPTIVE_PRACTICE.md](../../ADAPTIVE_PRACTICE.md) alongside the research report. This requirement comes directly from the learner's 13 November clarification. A shuffled static bank does not fulfil it.

- Task 1 contracts must distinguish construction/family ID, exact-prompt signature, sentence signature, response mode, support, lexical IDs and target skill.
- Task 2 must author reusable morphology/lexical compatibility data and constrained sentence constructions, with varied answer modes; the three reviewed examples per family are review fixtures, not the entire permanent question pool.
- Task 3 must generate eligible sentences locally, choose a response mode based on evidence, and exclude recent exact/equivalent prompts. Selection must be bounded and reproducible, with explicit pool-exhaustion handling.
- Task 4 must preserve presentation history and selected prompts across restart, separating independent and repaired answers.
- Task 5 must render the different answer modes and show when an activity is a model/repair/repeat rather than fresh assessment.
- Tasks 6–7 must verify adaptation (including successful gaps leading to production), independent transfer and all ten acceptance cases in the adaptive-practice specification.
- Do not change legacy SRS source records or due dates to implement variation.

## Task 1: Define and validate a bounded module

**Consumes:** Existing TeachingPage, CourseQuestion and curriculum task IDs.
**Produces:** ModuleDefinition and validateModule(module, scope): ValidationIssue[].

A ModuleDefinition has id, version, legacyTaskIds, objective, skillIds, prerequisiteSkillIds, allowedLexemeIds, teachingAssets, activities and evaluationFamilyIds. An ActivityDefinition has id, familyId, skillIds, mode, stimulus, supportLevel, scoringAuthority and accepted answers/rubric as appropriate.

Scoring authority is deterministic, self-check, human or advisory-ai. No unrestricted output is represented as deterministically correct. Define support as model/guided/independent; delayed transfer is an evidence context, not a fourth type of automated grade.

- [ ] Write validation tests for duplicate IDs, missing references, unknown prerequisite skills, cyclic prerequisites and vocabulary outside authorised scope.
- [ ] Add types and validation, reusing existing question/presentation shapes where appropriate rather than creating another quiz language.
- [ ] Require explicit content versions and distinct training/evaluation families.
- [ ] Run npx vitest run src/lib/moduleValidation.test.ts.
- [ ] Review schema against one real legacy lesson before extending it.

**Acceptance:** Invalid content is rejected with actionable author diagnostics; no existing route changes.

## Task 2: Author and review the possessions pilot

**Consumes:** Task 1 contracts and Week 3 accusative content.
**Produces:** possessionsModule: ModuleDefinition with reviewed item families.

- [ ] Map grammar-007 assets and IDs to specific skills: identify object, retrieve noun gender, select accusative article, produce possession sentence.
- [ ] Author masculine changes plus feminine/neuter non-change contrasts using existing taught words.
- [ ] Provide at least three distinct reviewed examples per closed activity family and separate held-out transfer examples; variation must be semantically and morphologically valid.
- [ ] Add a short communicative output task, visible criteria, model response and self-check label.
- [ ] Have a qualified German instructor check forms, naturalness, scope and accepted variants; record reviewer/date and unresolved issues.
- [ ] Add content-validation cases for “Ich habe einen Stift”, rejected indefinite “Ich habe ein Stift”, and a feminine example that must not become masculine.
- [ ] Run focused content tests and the existing src/lib/contentAudit.test.ts if noun content changes.
- [ ] Update CURRICULUM.md with the proposed pilot mapping, preserving week order, existing IDs and all mastery thresholds.

**Acceptance:** A content reviewer can trace every taught item to its source/scope; test items are held out from teaching. If review is unavailable, label the content unreviewed and do not enable the pilot by default.

## Task 3: Implement deterministic teaching transitions

**Consumes:** Valid ModuleDefinition and learner actions.
**Produces:** createModuleSession(module, seed): ModuleSession and advanceModuleSession(session, action): ModuleSession.

Session state includes content version, current activity, selected item IDs, first-attempt result, support used and repair count. Use a saved seed and explicit stable sort for item selection; different restarts must not reshuffle completed work.

- [ ] Write transition tests for model → guided → independent activity and selection of a different reviewed item after repair.
- [ ] Test wrong accusative with known gender routes to a case hint; ambiguous gender/case error routes to a gender probe.
- [ ] Implement authored branches with a maximum of two guided repairs before a worked example and pause option.
- [ ] Test that a repaired answer remains assisted evidence and cannot overwrite the first attempt.
- [ ] Test missing/unsupported content returns a recoverable state, with no silent substitution of a scoring mode.
- [ ] Run npx vitest run src/lib/moduleSession.test.ts.

**Acceptance:** Same content, seed and actions produce the same state; no AI or scheduler calls occur.

## Task 4: Persist sessions and evidence safely

**Consumes:** Session transitions and ActivityResult.
**Produces:** saveModuleTransition(transitionId, session, evidence): Promise<void> and loadModuleSession(moduleId): Promise<ModuleSession | null>.

Proposed additive tables: module_sessions (module ID, version, state JSON, updated time), module_evidence (event ID, module/version, activity/family, skill IDs, outcome, support, authority, timestamp). Retain append-only first-attempt and revision events. Do not backfill inferred skill mastery from old scores.

- [ ] Write database tests starting from a populated pre-pilot database; assert all legacy row values survive migration and repeated initialisation.
- [ ] Implement atomic state-plus-evidence saves and unique transition IDs so retries do not duplicate evidence.
- [ ] Include schema/version metadata; if content version changes, offer restart without deleting previous evidence.
- [ ] Extend backup/export coverage, including LEARNER_TABLES where needed, and check restore compatibility.
- [ ] Test interrupted writes, retry, reload, export and original legacy review rendering.
- [ ] Run focused module-evidence, database and backup tests through the existing mocked SQLite setup.

**Acceptance:** Resume is consistent and recoverable; existing progress and SRS results are byte/value equivalent where applicable.

## Task 5: Add an opt-in module route

**Consumes:** ModuleDefinition, session engine and persistence.
**Produces:** ModuleLesson and an explicit default-off pilot preference/route.

- [ ] Read relevant DESIGN.md sections and reuse LessonShell, existing question components and replay controls.
- [ ] Build the complete module flow with objective, support controls, feedback, pause and resume.
- [ ] Save before displaying completion; make save failure retryable and avoid implying that pilot completion passes grammar-007.
- [ ] Test keyboard operation, focus after feedback, reduced motion, screen-reader labels and unavailable speech.
- [ ] Add Playwright coverage: start → incorrect attempt → probe/hint → repair → output self-check → save → restart/resume.
- [ ] Verify original grammar-007 route and all checkpoint routes still work when the pilot is disabled.
- [ ] Keep AI suggestions in existing advisory UI; never promote them into module correctness evidence.
- [ ] Run focused component tests and e2e/modular-teaching.spec.ts.

**Acceptance:** Entire flow works without network or a Gemini key; learner can stop or resume at a clear boundary.

## Task 6: Make evidence useful without altering mastery

**Consumes:** ModuleEvidence[], available modules, curriculum scope and study budget.
**Produces:** recommendModule(input): ModuleRecommendation | null, with an explicit reason.

- [ ] Write tests for no evidence, recognition-only success, assisted success, repeated independent errors and out-of-scope prerequisites.
- [ ] Implement a deterministic advisory rule: prioritise an authored repair after repeated comparable errors; otherwise recommend the next in-scope practice opportunity.
- [ ] Require at least two comparable errors before a targeted recommendation; label this threshold a pilot heuristic, not a clinical diagnosis.
- [ ] Distinguish insufficient evidence from demonstrated difficulty; do not call either “not mastered”.
- [ ] Integrate one optional recommendation into Today within the existing budget; never displace due review or change its intervals.
- [ ] Test 15/30/45/60 minute budgets, repeated calls, sparse evidence and disabled pilot fallback in dailyPlanner tests.
- [ ] Display why a module is suggested and permit dismissal.

**Acceptance:** Same inputs produce the same recommendation; completion/mastery/checkpoint tables remain untouched by this feature.

## Task 7: Verify and evaluate before expansion

- [ ] Review product diff for unintended curriculum, privacy, grading or scheduler changes.
- [ ] Run bash scripts/test-agent.sh; record actual TypeScript, Vitest, build and Playwright outcomes. Investigate failures without weakening tests.
- [ ] On native macOS, verify migrations against a backup copy, offline audio/fallback, recording, restart/resume and export. Linux/browser mocks are not native verification.
- [ ] Collect equal-time baseline, immediate and approximately day-7/day-21 held-out transfer results, noting supports, exposure and missing sessions.
- [ ] Report raw outcomes and instructor review; do not claim causal improvement from one learner.
- [ ] Expand only if content is trustworthy, data preservation is verified and delayed transfer/workload support expansion.

## Conditional next work

If the pilot is useful, convert V2/questions and noun article/plural practice next, using existing material. Add listening-response and writing modules after reviewing the pilot's evidence model. Preserve a mix of comprehension, production and cumulative tasks.

Broader changes—new mastery thresholds, changed SRS intervals, proficiency labels, a new curriculum sequence or AI-generated runtime lessons—require a separate proposal with evidence and migration implications. No such change is enacted by this plan.

## Plan self-review

The pilot covers the report's module model, bounded variation, support fading, advisory evidence, persistence, offline use and delayed evaluation. Academic German and full-course conversion are deliberately deferred. All five review-focus risks have explicit checks above. Proposed interfaces share the same module/session/evidence vocabulary; implementation should define exact TypeScript field types in Task 1 before later tasks consume them.

## Execution update — 13 November 2026

The follow-up request authorises starting with **curriculum restructuring anchored on Sunday 15 November 2026**. This increment revises the authoritative curriculum, adds 35 planned module recipes and their legacy-asset/prerequisite mappings, rebases the six-unit roadmap, and displays outcomes/dates/planned modules in Course. It renames the October milestone to Foundations without changing IDs.

Decision: preserve sixteen A1 weeks, ending 6 March 2027; retain later phase lengths and shift their provisional windows. Cost: less contingency before the March 2028 aspiration, so readiness and exam timing must be reassessed rather than promised.

Decision: curriculum recipes are metadata, not the runtime ModuleDefinition/activity/scoring model in Task 1. Their status stays planned; this increment does not claim Tasks 1–7 complete. Cost: existing lesson routes still use their original teaching flow until the runner pilot is implemented.

Decision: do not reset legacy progress or use dates as unlock rules. Do not change SRS, mastery thresholds or AI authority.

Decision: optional late-A1 extensions do not become prerequisite blockers for the core transfer module.

Next runtime deliverable remains the Week 3 possessions pilot described above. The original research report is retained as a dated baseline; current dates and status come from CURRICULUM.md.

Learner clarification: adaptive sentence formation and varied response modes are mandatory for the runtime pilot; see docs/ADAPTIVE_PRACTICE.md. The curriculum/roadmap increment does not claim these behaviours are already implemented.

Validation of the curriculum increment: full quiet gate exited 0 on 13 November 2026 (995 Vitest tests passed, 1 skipped; 63 Playwright tests passed; TypeScript/build passed). Independent review found no actionable issues. No native macOS verification, runtime module implementation, commit or push is claimed.

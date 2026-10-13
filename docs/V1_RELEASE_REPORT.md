# DeutschLab v1.0 release report

**Release:** DeutschLab 1.0.0, *the first complete October Foundations learning app*.
**Not:** a complete A1 course or CEFR certification, nor all of Unit 1 or A1–C1.
**Date:** 2026-10-13. **Commits:** `26dc637` (Week 4), `e2279e0` (data safety, scaling, interface), plus this report.
**Recommendation:** **READY as a release candidate** (section 11), with one manual native check to do before relying on it day to day.

Verification levels used throughout:

| Level | Meaning |
|---|---|
| Automated (mocked) | Vitest/Testing Library and Playwright in Chromium with Tauri SQL replaced by `node:sqlite`. |
| Native runtime launched | The real `.app` bundle started, loaded its frontend from `tauri://localhost` and opened a database through the real SQL plugin. |
| Native SQL verified | Effects of the native SQL stack checked in the database file afterwards. |
| Native UI interacted with | Clicking in the real window. **Not done** in this session. |
| Audio personally verified | A person heard macOS German voices. **Not done.** |

## 1. Implemented curriculum

Weeks 1–4 of Unit 1 (October Foundations), 31 tasks. Weeks 5–16 are planned in `CURRICULUM.md` only and
appear as "Planned" in the app.

| Week | Tasks | Mastery |
|---|---|---|
| 1 | vocab-001, pronunciation-001, grammar-001–003, listening-001, speaking-001, checkpoint-001 | checkpoint-001 |
| 2 | vocab-002, grammar-004–005, writing-001, reading-001, listening-002, checkpoint-002 | checkpoint-002 |
| 3 | vocab-003, grammar-006–008, reading-002, listening-003, writing-002, checkpoint-003 | checkpoint-003 |
| 4 | vocab-004, grammar-009–010, reading-003, listening-004, writing-003, speaking-002, checkpoint-004 | checkpoint-004 (also October Foundations) |

**Week 4 in numbers:** 84 new vocabulary items (16 verbs, 37 nouns, 13 adjectives, 18 expressions and
small words) in 9 batches. Cumulative introduced vocabulary is **296** items: introduced, not mastered.
The two grammar lessons have 16 questions each (pass 13/16), reading and listening have 8 each (pass 7/8),
writing has a 6-point self-check (pass 5/6) and speaking a 5-point self-check (pass 4/5).
`checkpoint-004` has 39 marks and passes at 32/39 with minimums of vocabulary 6/8, grammar 9/12,
listening 2/4, writing 4/6 and speaking 3/5. Full detail is in `CURRICULUM.md` → Week 4.

## 2. Architecture

Unchanged in kind: Tauri v2, React 19, TypeScript, Tailwind v4, SQLite through `@tauri-apps/plugin-sql`.
Everything runs offline. No new npm or Rust dependencies were added.

- **Lesson content** is data (`src/data/lessons/`), rendered by shared engines: the vocabulary lesson, the
  grammar course, the comprehension lesson, and the writing, speaking and checkpoint flows. Week 4 added
  data files and thin wrappers, not new engines. The speaking lesson and the checkpoint speaking section
  became config-driven (Week 1 is the unchanged default).
- **Routing:** `App.tsx` now uses one lesson/checkpoint registry instead of 31 `if` branches.
  Dashboard views live in `src/components/today/`, `CurriculumView` and `DataView`.
- **Persistence:** `src/lib/db.ts` (SQLite), `src/lib/vocabResume.ts` (resume position),
  `src/lib/backup.ts` (export/snapshot). Two native commands in `src-tauri/src/lib.rs` handle backup files.
- **Review concepts** are distinct: vocabulary meaning, `#article`, `#plural`, accusative, negation,
  pronoun, verb_form and word_order. The SRS intervals are unchanged (1 → 3 → 7 → 14 → 30 → 60 days).

## 3. Features completed in v1.0

- The complete Week 4 curriculum and the October Foundations checkpoint, with weakest-section
  recommendations after a pass and links to lessons and Review.
- Today prioritises Week 4 after Week 3 mastery and shows `checkpoint-004` after the Week 4 lessons
  (opening it early gives a warning, not a lock). After mastery it shows a completion state and keeps
  offering due reviews; no fake Week 5 tasks appear.
- "Your data" screen: a JSON export and a database snapshot.
- Vocabulary resume is stored in SQLite.
- A content correction now reaches items already in Review.
- A responsive dashboard, current-week header, October progress grid, foldable mastered weeks, keyboard
  focus rings, reduced-motion support, and a database error state with retry.
- Fixed bugs (each has a regression test):
  1. Missed accusative/negation reading/listening questions were stored in Mistakes as
     "What is the plural of …" (`describeReviewConcept`).
  2. Mixed vocabulary sets would ask a verb for its article (guarded before Week 4 shipped).
  3. The Activities column collapsed to about 30 px wide below about 900 px.
  4. A failed "Finish lesson" save left the lesson stuck on "Finishing…".
  5. A database start-up failure left the app on "Opening DeutschLab…" forever.

## 4. Known limitations

1. **No in-app restore.** The SQL plugin runs statements on an sqlx connection pool, so a multi-table
   replace issued from JavaScript cannot be made atomic. Restoring a snapshot is manual (steps are shown on
   the "Your data" screen): quit the app, move `deutschlab.db`, `-wal` and `-shm` aside, copy the snapshot in
   as `deutschlab.db`, then reopen. A JSON export is validated (`validateBackup`) but not importable yet.
2. Native UI interaction, speech, and backup file writing in the real app are not verified (section 9).
3. Writing and speaking are honest self-assessments. There is no recording, speech recognition or
   automatic grammar grading.
4. Noun capitalisation is not graded strictly (v0.8 S4); early chunks (*Ich mag*, *mein*, dative phrases,
   and now *zu Hause*) remain deliberate, documented exceptions.
5. No Content-Security-Policy is set (`csp: null`). The app loads no remote content; setting a CSP should
   wait for a native smoke test.
6. The window is 1200 × 820 with a minimum of 760 × 560. The interface is checked automatically at 760,
   1024 and 1440 px in Chromium, not in WKWebView.

## 5. Linguistic audit (Week 4)

- **Method:** every Week 4 noun's gender and plural was checked against de.wiktionary.org (37/37 agree)
  and added to the independent reference in `contentAudit.test.ts`. The repository-wide scanner for
  article/gender contradictions passes. Verb tables are checked against standard paradigms in tests.
  Explanations that quote a reading or listening line are checked against the text automatically; this
  caught and fixed two misquotes during development.
- **Judgment calls (not errors):** *Frühstück* has the rare plural *Frühstücke*. *Butter, Tee, Fleisch,
  Obst, Schokolade, Geld* and *Kleidung* are taught as having "no ordinary plural", following the existing
  mass-noun policy: *Gelder* means funds and *Kleidungen* is rare. *die Butter* is taught, with a note that
  some regions use a masculine form. *gern* is taught as an adverb so learners can say what they like
  before *mögen* (Week 6).
- **Scope:** no modal verbs, dative pronouns, possessives, Perfekt, separable verbs or subordinate clauses
  appear in Week 4 content (enforced by tests). Adjectives appear only after *sein*.
- **Limits:** this is model review plus mechanical checks, not review by a native speaker or teacher.
  A German speaker should still review Weeks 1–4.

## 6. Data safety and backup

| Learner state | Store | Survives restart | In backups |
|---|---|---|---|
| Task completion, lesson attempts, checkpoint attempts | SQLite | yes | JSON + snapshot |
| Review items, mistakes | SQLite | yes | JSON + snapshot |
| Writing drafts, study-time preference | SQLite `app_state` | yes | JSON + snapshot |
| Vocabulary resume position | SQLite `app_state` (v1.0), copied from localStorage | yes | JSON + snapshot (and any legacy localStorage keys in JSON) |
| Dismissed weak areas | memory (by design: today only) | no | – |

- Migrations remain additive and idempotent. v1.0 added **no schema change**; new state uses `app_state`
  keys.
- Every checkpoint attempt is inserted (a retry adds a row), and completion still requires a pass and
  **Finish**. Earlier checkpoint histories are verified unchanged by tests.
- Exporting only reads. It is validated before it is written; native writes go into
  `<app data>/backups`, refuse unsafe names and never overwrite a file. Snapshots use `VACUUM INTO`,
  a consistent copy that includes WAL content and refuses existing files (tested on real SQLite).
- The live database at `~/Library/Application Support/com.deutschlab.app/deutschlab.db` was only read
  (MD5 `d5379f2a1d0137173ff42c67b0a347ad`, mtime 09:18) and was identical after every native run.

## 7. Performance

Same environment as v0.8: Apple Silicon, production build, headless Chromium with mocked IPC, and
`node:sqlite` for query timings. These are not WKWebView timings.

| Measure | v0.8 | v1.0 |
|---|---|---|
| JS bundle (raw / gzip) | 537 / 141 kB | 617 / 165 kB |
| CSS (raw / gzip) | 21 / 5 kB | 27 / 6 kB |
| Today's plan visible, fresh profile (warm) | 72–74 ms | 52–79 ms |
| Today's plan visible, 10,000 reviews + 5,000 mistakes | not measured | **194–249 ms → 70–79 ms** after the planner fix |
| Script execution after load | 18 ms | ~5 ms (warm), 30–56 ms cold |
| Lesson open from Today | – | 24–32 ms |
| `getPlannerData` IPC payload at 10k / 100k rows | 816 KB / 8.3 MB | **26 KB / 26 KB** |
| `getPlannerData` SQL time at 10k / 100k | 3.9 / 50.6 ms | 4.2 / 45 ms |
| Debug `.app` bundle | – | 39 MB |

**Decisions:**
- **No code-splitting.** Script evaluation is about 5 ms, so lazy-loading lessons would save almost
  nothing for a local app. `db.ts` also pulls in lesson data through Review, so a split would need a
  larger refactor. Revisit at about 1–2 MB of content, as in v0.8.
- **Bounded the planner query.** The real cost at scale was IPC payload, not SQL time. A test proves
  the plan is identical to the old unbounded data, and the query uses the unique review-item index.
- **Capped the Review mistakes list** at 100 rows. The counts stay exact.

## 8. Automated tests (final gate: `npm run test:agent` → `npm run test:all`, exit 0)

- TypeScript: pass. Production build: pass.
- **Vitest: 801 passed in 52 files** (v0.8: 630 in 39).
- **Playwright: 53 passed** (v0.8: 39).
- Rust: `cargo check` and `cargo test` pass (2 tests for the backup file-name guard).

New suites: `week4Vocabulary`, `week4Grammar`, `week4Comprehension`, `week4Checkpoint`,
`week4Review.db`, `vocabResume.db`, `backup.db`, `plannerData.db`, `progress`, `appInfo`, component
tests for the Week 4 lessons and `checkpoint-004`, and e2e `week4.spec.ts` and `v1.spec.ts` (responsive
layout, folding weeks, keyboard opening, and a real JSON export download).

## 9. Native verification

| Check | Result | Level |
|---|---|---|
| `cargo check`, `cargo test` | pass | build |
| `tauri build --debug --bundles app` | DeutschLab.app (39 MB) built | build |
| The bundled app launches and loads its frontend from `tauri://localhost` | yes (twice), no panics or errors logged | native runtime launched |
| The real SQL plugin opens and migrates an existing database (isolated copy of the live DB) | yes: WAL opened, integrity ok, 2 tasks and 2 attempts intact after quit and relaunch | native SQL verified |
| Live database untouched | MD5 and mtime identical | verified |
| Week 4 screens, checkpoint save, draft restore, vocab resume, Your data buttons in the native window | **not verified**: no UI automation was available | – |
| German voices, Play / Slower | **not verified** | – |

**Manual checklist (about 15 minutes, on the real app):**
1. Open DeutschLab. Today shows your current week and the October grid, and the window resizes down to its
   minimum without anything being cut off.
2. Open `vocab-004`, finish one batch, quit (⌘Q), reopen: "Resume at batch 2" is offered.
3. Open `writing-003`, type a sentence, quit, reopen: the draft is restored.
4. Open `listening-004`: Play and Slower speak German, nothing plays automatically, and the transcript
   stays hidden until you answer.
5. Open `checkpoint-004` early: the warning shows. Take it; after the results, check that a row was added
   (Your data → Export backup, then look at `checkpoint_attempts`).
6. Your data → Export backup and Save snapshot. Both report a path in `…/com.deutschlab.app/backups`,
   and "Show in Finder" opens it.

## 10. Outstanding risks

1. No native UI or audio verification yet (section 9).
2. No native-speaker review of Weeks 1–4.
3. Restore is manual, so a mistake while copying files could lose data. The app itself never overwrites.
4. Mixed-origin localStorage (dev vs bundle) only affects legacy resume positions, which are now
   migrated into SQLite.
5. No CSP.

## 11. Release recommendation

**READY as the v1.0 release candidate.** Every critical criterion holds:

- The full automated gate passes.
- No data-loss bug is known; migrations are unchanged and additive.
- The Week 1–4 lesson flows, progression, checkpoints and mastery are covered end to end.
- Backward compatibility is tested: legacy review items, earlier checkpoints, Week 1–3 grading.
- Every linguistic error found was corrected.
- Runtime limitations are documented above.

Before calling it done for daily use, run the section 9 checklist once in the native app. No Git tag or
GitHub release has been created, and no packaged app has been distributed; that needs your approval.

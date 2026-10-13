# DeutschLab v1.0 release report

**Release:** DeutschLab 1.0.0, *the first complete October Foundations learning app*.
**Not:** a complete A1 course or CEFR certification, nor all of Unit 1 or A1–C1.
**Date:** 2026-10-13. **Commits:** `26dc637` (Week 4), `e2279e0` (data safety, scaling, interface), `d161b96` (report), plus the final-acceptance commit (section 12).
**Status:** **ACCEPTED for daily use** after final acceptance (section 12). Only audible speech and a person's look-and-feel pass remain manual.

Verification levels used throughout:

| Level | Meaning |
|---|---|
| Automated (mocked) | Vitest/Testing Library and Playwright in Chromium with Tauri SQL replaced by `node:sqlite`. |
| Native runtime launched | The real `.app` bundle started, loaded its frontend from `tauri://localhost` and opened a database through the real SQL plugin. |
| Native SQL verified | Effects of the native SQL stack checked in the database file afterwards. |
| Native UI interacted with | The real UI driven inside WKWebView by the opt-in native self-test (DOM events, no OS automation). **Done** (section 12). Mouse/keyboard by a person: not done. |
| Audio personally verified | A person heard macOS German voices. **Not done** (voices were enumerated natively, nothing was spoken). |

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
   as `deutschlab.db`, then reopen. These steps were executed natively on disposable data (section 12).
   A JSON export is validated (`validateBackup`) but not importable yet.
2. Speech was enumerated natively (German voice "Anna (de-DE)" present) but never played; Play/Slower
   audio and a person's hands-on pass remain manual (section 12).
3. Writing and speaking are honest self-assessments. There is no recording, speech recognition or
   automatic grammar grading.
4. Noun capitalisation is not graded strictly (v0.8 S4); early chunks (*Ich mag*, *mein*, dative phrases,
   and now *zu Hause*) remain deliberate, documented exceptions.
5. No Content-Security-Policy is set (`csp: null`). The app loads no remote content; setting a CSP should
   wait for a native smoke test.
6. The window is 1200 × 820 with a minimum of 760 × 560. Narrow widths (760, 1024, 1440 px) are checked
   in Chromium; in WKWebView only the default 1200 × 788 viewport was checked (no overflow).

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
  `<app data>/backups`, refuse unsafe names, never overwrite a file and are fsynced.
- **Snapshots are consistent in WAL mode.** They use `VACUUM INTO` on the app's own SQL connection: SQLite
  reads one transaction, so commits still in `deutschlab.db-wal` are included. The app never copies the
  `.db` file. Because SQLite does not fsync the `VACUUM INTO` output, the native `seal_backup_file` command
  checks the SQLite header and whole-page length and fsyncs the file before "Saved" is shown (added in
  final acceptance). Evidence is in section 12.
- The JSON export covers every table in the schema, every row and every column (enforced by a test that
  compares against `sqlite_master`).
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

Final acceptance run (2026-10-13, log `test-all-20261013-194550.log`):

- TypeScript: pass. Production build: pass.
- **Vitest: 810 passed in 54 files** (v0.8: 630 in 39).
- **Playwright: 53 passed** (v0.8: 39).
- **Rust:** `cargo check` passes; `cargo test` runs 5 tests and all pass. They cover the backup file-name
  guard (2), snapshot sealing (2), and `tests/snapshot_wal.rs` (1), which drives the WAL scenario through
  sqlx and its bundled SQLite, the same stack as tauri-plugin-sql. sqlx and tokio are **dev-only**
  dependencies; they were already in the lockfile, so no new crates were added.

New suites: `week4Vocabulary`, `week4Grammar`, `week4Comprehension`, `week4Checkpoint`,
`week4Review.db`, `vocabResume.db`, `backup.db`, `backupWal.db`, `selfTestGuard.db`, `plannerData.db`,
`progress`, `appInfo`, component tests for the Week 4 lessons and `checkpoint-004`, and e2e
`week4.spec.ts` and `v1.spec.ts`.

## 9. Native verification

All native runs used a temporary `HOME`. The live database
(`~/Library/Application Support/com.deutschlab.app/deutschlab.db`) was only read, and its MD5
`d5379f2a1d0137173ff42c67b0a347ad` and mtime 09:18:24 were identical before and after every run. An `lsof`
check of a running app showed it holding only the isolated database and nothing under the real
`~/Library/Application Support/com.deutschlab.app`.

| Check | Result | Level |
|---|---|---|
| `tauri build --debug --bundles app` / `tauri build --bundles app` (release) | 39 MB / **6.1 MB** `.app`, both built | build |
| The bundled app launches from `tauri://localhost` on an isolated copy of the live DB | yes; quit and relaunch kept the data; integrity ok; no panics | native runtime launched |
| **Native self-test** (`scripts/native-selftest.sh`), debug and release | **17/17 pass**; the release run took 4.4 s including launch | native SQL verified; native UI interacted with (in-webview) |
| Native snapshots with uncheckpointed WAL commits | integrity ok; record-for-record equal (section 12) | native SQL verified |
| Documented manual restore, on disposable data | the app reopened on the restored file with identical data (section 12) | native runtime |
| German voice availability | 70 voices; German: "Anna (de-DE)" | native (enumerated) |
| Play / Slower audible output | not done: nothing was spoken | manual |

**The native self-test.** It runs only when the app is started with `DEUTSCHLAB_SELFTEST_OUT`. It switches
to `deutschlab-selftest.db` before any database opens (`useSelfTestDatabase` refuses once the learner DB is
open), drives the real app inside WKWebView with DOM events, writes a JSON report and quits. It needs no
Accessibility or Screen Recording permission. Its checks:

1. Migrations run twice (idempotent).
2. Journal mode is WAL.
3. 24 completed tasks persist.
4. A lesson attempt is saved.
5. A wrong answer creates a grammar-009 mistake and a pronoun review item.
6. SRS: 1 → 3 → 7 days, and the mistake is resolved.
7. Two checkpoint-004 attempts are inserted (26/39 failed, 32/39 passed).
8. The writing draft, resume position (4) and study time (45) persist.
9. Planner data loads.
10. A snapshot is taken while 4.1 MB of commits are in the WAL (`backup_path` → `VACUUM INTO` → `seal_backup_file`).
11. The JSON export is written by the native command.
12. German voices are enumerated.
13. Today renders with "Week 4" as the current week.
14. No horizontal overflow at 1200 × 788.
15. Plan → lesson → teaching page → back.
16. Your data → **Save snapshot** button → status shows the backups path.
17. Unit 1 shows November as "Planned".

**Still manual (about 10 minutes):**
1. Listen: in `listening-004`, Play and Slower are audible German at normal and slower speed, and nothing
   autoplays.
2. Resize the window to its minimum (760 × 560): nothing is cut off. Narrow layouts were verified in
   Chromium only.
3. Use the mouse, trackpad and keyboard: Tab focus rings, Enter submits answers, and typing umlauts works.
4. With your real data: complete one batch of `vocab-004`, quit with ⌘Q, reopen, and "Resume at batch 2"
   is offered. Then use Your data → Save snapshot and Show in Finder.

## 10. Outstanding risks

1. Speech output and the hands-on feel are not verified by a person (section 9).
2. No native-speaker review of Weeks 1–4.
3. Restore is manual, so a mistake while copying files could lose data. The app itself never overwrites,
   and the steps were rehearsed successfully.
4. No CSP (`csp: null`); the app loads no remote content.

## 11. Release recommendation

**v1.0 is accepted for daily use.** Every critical criterion holds and the native evidence now goes beyond
"it launches":

- The full gate and the Rust tests pass.
- Learner data is persisted and backed up consistently, with WAL commits proven to be captured.
- Restore was rehearsed and works.
- The real app passes 17 native checks.
- The live database was never modified.

Do the four manual checks in section 9 in your first session; none of them can lose data. No Git tag or
GitHub release has been created, and no packaged app has been distributed.

## 12. Final acceptance evidence (2026-10-13)

**1. Snapshot method.** It is `VACUUM INTO ?` on the app's SQL connection (`snapshotDatabase` in `db.ts`),
not a file copy; the Rust `backup_path` command only returns a fresh path. The one gap found was that SQLite
does not fsync the `VACUUM INTO` output. It is fixed: `seal_backup_file` verifies the header and whole-page
length, fsyncs, and runs before the UI reports success. JSON exports are fsynced too.

**2. Snapshots against databases with recent uncheckpointed writes.**

| Test | WAL pending | Plain `.db` copy | Snapshot |
|---|---|---|---|
| Vitest `backupWal.db` (node:sqlite, the app's db.ts) | > 100 KB, 300 commits | missing commits | integrity ok; all 6 tables equal (app connection and a second "pooled" connection) |
| Rust `snapshot_wal.rs` (sqlx + bundled SQLite) | > 50 KB, 500 commits | missing commits | integrity ok; 500/500 records equal; refuses to overwrite |
| Copy of the live DB held open by another process | 6.75 MB, 400 reviews + task + draft | **0 of 400** recent reviews | integrity ok; all 6 tables equal |
| Native app (self-test, debug and release) | 4.13 MB | – | 2 snapshots (API and UI button): integrity ok; counts equal to the moment of the snapshot; records equal |

**3. JSON export and manual restore.** The export covers every schema table, row and column (test against
`sqlite_master`). The native export validated with `validateBackup` (24 tasks, 1 attempt, 2 checkpoint
attempts, 301 reviews, 301 mistakes, 3 settings).

The documented restore steps were executed on disposable data, both in a test and natively:

1. Quit the app.
2. Move `deutschlab.db`, `-wal` and `-shm` aside.
3. Copy a native snapshot in as `deutschlab.db`.
4. Reopen the real app.

Result: `lsof` confirmed the app had the restored file open; integrity ok; records equal to the snapshot;
indexes present; the draft intact; the snapshot file unchanged. Restoring from JSON remains unsupported.

**4. Versions and leftovers.** `package.json` and `package-lock.json` (root entries only) are now 1.0.0,
matching `tauri.conf.json`, `Cargo.toml` and `APP_VERSION`; a test enforces this. Your uncommitted `motion`
dependency was kept as it is and not committed: it is imported nowhere and is tree-shaken out, and the v1.0
UI uses CSS transitions. `src/App.css` was never committed, is referenced nowhere, and is the
create-tauri-app template stylesheet (`.logo.vite`, `#greet-input`). It is dead code but was left in place
for you to decide.

**5. Native interaction.** See section 9. Computer-use tools were not available, and OS-level UI scripting
was not used because it requires Accessibility permission.

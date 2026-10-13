# DeutschLab quality audit (v0.8)

Scope: Weeks 1–3 of Unit 1 (23 tasks, 212 vocabulary items). No Week 4 content was created.
Date of audit: 2026-10-13. Repository state audited: `main` after "Complete Week 3 curriculum".

This audit separates **verified** facts (measured or reproduced in this session) from **assumptions**
and **recommendations**. Nothing here claims more than was run.

## 1. Summary

| Area | Result |
|---|---|
| Linguistic accuracy | No wrong gender, plural or conjugation was found in 212 vocabulary items or the grammar, reading, listening, writing and checkpoint content. Five real content/grading defects were found and fixed (section 2.2). Four scope observations are flagged for a decision (section 2.3). |
| Frontend performance | 537 kB JS (141 kB gzip) in one chunk. Today's plan was visible 72 ms after navigation in headless Chromium, with 4 MB JS heap. No optimisation needed now. |
| SQLite performance | At 10,000 review items every query ran in under 10 ms. Two additive indexes were added as a preventive measure (they matter from about 100,000 rows). |
| Data safety | Migrations are additive and idempotent. A copy of the real on-disk database was migrated by the real native stack with no data change. |
| Native Tauri | A controlled `tauri dev` run on a **copy** of the live database worked: WKWebView loaded the app, the real SQL plugin ran the migration. UI interaction, speech and the production bundle were **not** verified. |
| Tests | `npm run test:agent`: Vitest 630 passed (39 files), Playwright 39 passed, exit 0. |

## 2. Linguistic audit

### 2.1 Method

1. Read every German learning content file for Weeks 1–3: vocabulary (212 items), sein, regular verbs, questions, pronunciation,
   haben, common verbs, articles/plurals, accusative, negation, all reading, listening, writing and checkpoint content.
2. Mechanical scan of all lesson text for an article that contradicts a noun's gender (der/die/das, ein/eine, kein/keine and
   their accusative forms, with dative-after-preposition chunks excluded). Result: 0 unintended contradictions. The three hits
   were deliberate (`in den USA`, twice, and the wrong multiple-choice option `die Stift`).
3. Checked every vocabulary item's accepted English and German variants for collisions. All overlaps were intended
   (for example `Hello` shared by Hallo and Guten Tag, `teacher` shared by Lehrer and Lehrerin).
4. Reviewed the verb tables against the standard paradigms (sein, haben, regelmäßige Verben, sprechen/essen/lesen/schlafen,
   arbeiten with the extra *e*).
5. Cross-checked the reading and listening explanations against the passage text (every explanation quotes a real line).

Limits: this is a careful read by the model plus mechanical checks, **not** a review by a native speaker or teacher.
The reference table in `src/lib/contentAudit.test.ts` was written from the same knowledge and protects against accidental
edits, not against a shared misunderstanding. A native-speaker pass over Weeks 1–3 is still recommended (section 7).

### 2.2 Defects found and fixed

| # | Finding | Evidence | Fix | Regression test |
|---|---|---|---|---|
| L1 | Informal variants that the notes teach were rejected as answers: `Mama`, `Papa`, `Oma`, `Opa` (Week 2) and `der Kuli` (Week 3). Also `die Couch`, `der Monitor` and `das Smartphone` for Week 3 nouns. | Before the fix, English → German grading of `Oma`, `die Oma`, `Opa`, `Mama`, `Papa`, `die Couch`, `der Kuli` returned *incorrect* (`Uni` was already accepted). | Added them to `acceptedGerman`. Week 3 variants keep the article requirement (`die Couch` accepted, `Couch` rejected). | `contentAudit.test.ts` parses every "Informal: …" note and checks it is accepted. |
| L2 | Week 3 listening clip contradicted itself: "Die Bücher sind neu. Das Buch ist nicht neu." (the books are new, the book is not). | Read of `week3Listening.ts`. | Now "Die Bücher sind neu. Das Heft ist nicht neu."; translation and question updated. | `contentAudit.test.ts` |
| L3 | Missing common English answers for German → English (US/UK and casual forms such as `chalkboard`, `closet`, `mug`, `veggies`, `lounge`, `light`, `pen` for Kugelschreiber). | Were not in the accepted lists (not individually re-graded before the change). | Added to `acceptedEnglish`. | `contentAudit.test.ts` |
| L4 | `reading-001` text had a comma splice: "Heute schlafe ich, ich trinke Wasser und ich esse." | Read. | "Heute schlafe ich. Ich trinke Wasser, und ich esse." (the question explanation still quotes a real line). | existing `week2Comprehension` tests |
| L5 | Two small scope/wording issues: the Week 2 *schnell* example used *das Auto* (a Week 3 noun), and the `haben` note said articles like *einen* "come later" (Week 3 now explains it). | Read. | Example is now "Das Kind ist schnell."; note now says Week 3 explains *einen*. | – (wording) |

### 2.3 Flagged for a decision (not changed)

| # | Observation | Why it is flagged |
|---|---|---|
| S1 | `Ich mag …` is used from Week 1 (speaking frames, listening, reading, writing samples) although `mögen` is planned for Week 6. | It works as a high-frequency chunk and is translated in the frames, but `CURRICULUM.md` does not list it before Week 6. Decide: add it to the Week 1 chunk list, or avoid it until Week 6. |
| S2 | `writing-002` offers *Das ist mein Zimmer.* (possessive *mein*, planned for Week 15). | It was requested explicitly and is presented as a fixed phrase, but it is another early chunk. |
| S3 | Dative chunks appear early: *in der Schule*, *in der Schweiz*, *aus der Schweiz*, *nach Hause*, *in den USA*. | Each is marked as "learn as a chunk" in the lesson, which is consistent with the curriculum (dative is Week 9). Listed so it is a conscious choice. |
| S4 | Grading ignores capitalisation (`tisch` is accepted for `der Tisch`). A "Preferred spelling" note is shown. | Noun capitalisation is a real German rule. Marking it correct with a note is lenient by design; a stricter mode could be added later. |

### 2.4 Uncertain linguistic claims (judgment calls, not errors)

- `das Gemüse`, `der Käse`: treated as having no ordinary plural. Dictionaries list rare plural forms for kinds (*Käsesorten*, *Gemüsesorten*). Choosing "no plural" is the standard A1 teaching position.
- `der Saft → die Säfte`, `das Brot → die Brote`: valid plurals (kinds of juice, loaves), with a note in the lesson.
- `die Treppe` and `die Schere` are translated with the English plural (*stairs*, *scissors*); notes explain that German uses the singular.
- English meanings such as `Uhr = clock / watch`, `Boden = floor` (accepted `ground`) are simplifications suitable for A1.

## 3. Performance audit

Environment for all numbers: Apple Silicon Mac, Node 26, headless Chromium (Playwright) and `node:sqlite` on an on-disk WAL
database. These are **not** WKWebView or sqlx-over-IPC numbers; they show scale and shape, not native timings.

### 3.1 Production bundle

Single chunk, built with `vite build` (Rolldown).

| File | Raw | Gzip |
|---|---|---|
| `index-*.js` | 537 kB | 141 kB |
| `index-*.css` | 21 kB | 5 kB |

Attribution of the JS bytes (from the source map, mapped segments):

| Source | Share |
|---|---|
| react-dom | 39.1% |
| `src/data/lessons` (all lesson content) | 24.8% (131 kB) |
| `src/components` | 23.2% |
| `src/lib` + `App.tsx` | 7.9% |
| lucide-react | 1.4% |
| everything else | ~3.6% |

### 3.2 Load time (production build, 3 runs after warm-up)

| Metric | Value |
|---|---|
| "Today's plan" visible after navigation | 72–74 ms (155 ms on a cold first run) |
| First contentful paint | 52 ms |
| Script execution | 18 ms (33 ms cold) |
| JS heap | 3.8–4.3 MB |

Conclusion: the Vite warning about a 500 kB chunk is not a problem for a local app that loads from disk. All lesson content is
imported eagerly; this costs about 131 kB of the bundle and is not measurable in load time today.

### 3.3 SQLite (real `db.ts` code, 10,000 review items, 5,000 mistakes, 20,000 lesson attempts)

Median of 15 runs, milliseconds. "Indexed" is with the two v0.8 indexes.

| Operation | 10k, no index | 10k, indexed | 100k, no index | 100k, indexed |
|---|---|---|---|---|
| `getDueReviewItems(20)` | 1.78 | 0.06 | 8.55 | 0.06 |
| `getReviewStats` | 1.66 | 0.08 | 18.13 | 0.61 |
| `getPlannerData` | 5.23 | 3.86 | 55.40 | 50.64 |
| `getMistakes` (all rows) | 6.95 | 7.19 | 86.95 | 89.03 |
| `recordAnswer` (wrong, upsert) | 0.24 | 0.18 | 2.17 | 0.15 |
| `applyReviewResult` | 0.18 | 0.06 | 2.19 | 0.07 |

Query plans before the change: `SCAN review_items` for the due list and count, `SCAN mistakes` for the open-mistake lookup.
After: `SEARCH … USING (COVERING) INDEX` for all of them.

Reading the numbers:

- At a realistic ceiling of about 10,000 review items, **nothing is slow with or without indexes**. The indexes are preventive.
- `getPlannerData` and `getMistakes` stay proportional to row count even with indexes, because they return every due key and every
  mistake row to JavaScript. They are the next thing to bound if the database grows toward 100,000 rows (see recommendations).
- Pure functions are cheap: a daily plan with 10,000 due keys and 5,000 mistakes took 0.4 ms; building 212 vocabulary review
  exercises took 4.3 ms in total; building the Week 3 final quiz took 0.3 ms.

### 3.4 Growth projection (extrapolation, not a measurement)

Lesson content is about 44 kB minified per week (131 kB for three weeks). That gives roughly 0.7 MB for Unit 1 (16 weeks) and a few
MB through B2/C1 if the content density stays the same. Script evaluation is currently 18 ms; it would grow roughly linearly with
content. Splitting lesson content by unit with dynamic `import()` becomes worthwhile around 1–2 MB of content, not before.
Review volume is bounded by the number of concepts (about 212 words × up to 3 concepts plus grammar questions today), so 10,000
items already covers a far larger curriculum than exists.

## 4. Data safety

### 4.1 What was checked

| Check | Result |
|---|---|
| Migrations additive and idempotent | Yes: `CREATE TABLE/INDEX IF NOT EXISTS`, and a guarded `ALTER TABLE … ADD COLUMN exercise_json`. No `DROP`, no data rewrite. |
| Migration of a legacy (v0.3-shaped) database | New tests: all rows in all six tables are unchanged, the review row only gains a NULL `exercise_json`, repeated starts add nothing, and legacy rows still load. |
| Migration of the **real** on-disk database | Done natively on a copy (section 5). Integrity check `ok`, tasks intact, both indexes created. |
| Stable IDs | Lesson IDs, review source IDs (`<id>`, `<id>#article`, `<id>#plural`, `acc-…`, `neg-…`, `c3-…`) and `task_progress` IDs were not changed. |
| Writing drafts | Stored in SQLite `app_state` (`writing_draft:<task>`). Component and e2e tests cover save, restore after reload, and clear. |
| Week 3 vocabulary resume state | Stored in `localStorage` key `deutschlab:vocab-resume:vocab-003`. Component tests cover resume, corrupt values, and clearing on finish. |
| Destructive statements | Only `markTaskIncomplete` and `clearWritingDraft` delete rows, both by explicit key. |

The live database at `~/Library/Application Support/com.deutschlab.app/deutschlab.db` was only **copied** (read-only). Its checksum
and modification time were identical before and after the native run. At audit time it held 2 completed tasks (vocab-001,
pronunciation-001), 0 review items, 0 mistakes, journal mode WAL, `user_version` 0.

### 4.2 Findings

- **No migration version.** The schema relies on introspection (`PRAGMA table_info`). It is correct today, but a `PRAGMA user_version`
  counter would make future migrations easier to reason about and test.
- **Stored exercises win over rebuilt ones.** `resolveExercise` prefers the `exercise_json` saved with a review item. That keeps
  old items working, but a later correction to lesson content (for example an accepted answer) will **not** reach items already in
  Review. This matters the first time a content error is fixed.
- **Unknown IDs fall back to Week 1.** `lessonIdFor` / `vocabularySetForItem` default to `vocab-001` / `grammar-001` for an ID that no
  longer exists, so an orphaned review item would be attributed to Week 1 in weak-area suggestions.
- **`localStorage` for resume state.** It works, but it lives in the WebKit data store, separate from the SQLite file. A backup of
  `deutschlab.db` would not include it, and the dev server (`http://localhost:1420`) and a bundled app (`tauri://localhost`) use
  different origins, so state does not carry between them. It is a convenience feature, so the risk is low. Moving it to `app_state`
  would put all learner state in one place; this was deliberately **not** done in this audit.
- **Completion timestamp is overwritten.** Finishing an already-completed lesson again updates `completed_at` (`ON CONFLICT DO UPDATE`).
  Nothing reads the timestamp today.
- **WAL mode.** The database uses WAL. A file-level backup must include `deutschlab.db-wal` and `-shm` (or checkpoint first).

## 5. Native Tauri status

### 5.1 Verified natively

Method: a copy of the live database was placed in an isolated home directory (`HOME` overridden), then `npm run tauri dev` was run
(Rust offline, debug build). The live database path was never opened.

| Item | Result |
|---|---|
| `cargo check` (offline) | passes |
| `tauri dev` starts the Rust binary and the Vite dev server | yes, exit 0 after the process was stopped; no panic or error lines in the log |
| WKWebView loads the app and runs its JavaScript | **yes**, evidenced by the next two rows |
| Real `tauri-plugin-sql` / sqlx executes `initialiseDatabase` against an existing database | **yes**: both v0.8 indexes were created in the copy |
| Data preserved by the native migration | yes: `PRAGMA integrity_check` = ok, both completed tasks present, journal mode WAL |
| Live database untouched | yes: identical MD5 before and after, modification time unchanged |

### 5.2 Not verified (needs a person at the Mac)

- Any UI interaction or rendering in the native window (no UI automation was available in this session).
- German speech: `speechSynthesis` voices, Play and Slower, and the no-voice message.
- The production bundle (`tauri build` / the `.app`), including `tauri://localhost` asset loading and the separate `localStorage` origin.
- Draft restore and vocabulary resume after quitting and reopening the real app.
- Window behaviour (default size is 800 × 600 with no minimum size) and menus.
- The checkpoint-003 and other attempts being written to the real `deutschlab.db`.

### 5.3 Native configuration observations

- `app.security.csp` is `null` (no Content Security Policy). The app loads no remote content, so the risk is low, but a CSP would be
  good hygiene once the production bundle is tested.
- The capability grants `sql:default` and `sql:allow-execute`, which let the webview run arbitrary SQL. This is expected for the current design
  (all SQL is issued from the frontend).
- The template `greet` command is still registered in `src-tauri/src/lib.rs` and unused.
- `tauri.conf.json` still has `version: 0.1.0`, product name `deutschlab`, and the generic description "A Tauri App".

## 6. Fixes made in this change

- `acceptedGerman` / `acceptedEnglish` additions (L1, L3) and corrected content (L2, L4, L5).
- `src/lib/db.ts`: `idx_review_items_due` on `review_items(due_at)` and a partial `idx_mistakes_open_key` on `mistakes(item_key)`
  where `resolved_at IS NULL`. Both `CREATE INDEX IF NOT EXISTS`.
- New tests: `src/lib/dbMigration.test.ts` (6) and `src/lib/contentAudit.test.ts` (9).
- `CLAUDE.md`: a short "Content accuracy guards" section.
- Validation: Vitest 630 passed (39 files), Playwright 39 passed, `npm run test:agent` exit 0.

## 7. Outstanding risks

1. Content has had no native-speaker review. The model-written reference table can share a mistake with the content.
2. The native UI, speech and production bundle are unverified (section 5.2).
3. Fixing a content error will not update review items that already stored the old exercise (section 4.2).
4. `getMistakes` and `getPlannerData` return unbounded row sets.
5. No CSP, and the unused `greet` command remains.
6. Early chunks (`Ich mag`, `mein`, dative phrases) are ahead of the curriculum's stated order (section 2.3).

## 8. Recommendations (ranked)

| Priority | Recommendation | Why |
|---|---|---|
| 1 | Run a manual native smoke test of the bundled app: a vocabulary lesson, listening with real voices, a writing draft across a restart, and a checkpoint attempt, then confirm the rows in the real database. | Closes everything in section 5.2. |
| 2 | Have a German speaker review Weeks 1–3 (especially example sentences, accepted answers and the explanations). | Section 2.1 limits. |
| 3 | Make `resolveExercise` prefer a fresh rebuild when the source item still exists, falling back to the stored JSON. | Lets content corrections reach existing Review items (section 4.2). |
| 4 | Decide on the early chunks (S1–S3) and record the decision in `CURRICULUM.md`. | Keeps scope rules honest. |
| 5 | Add `PRAGMA user_version` and a numbered migration list. | Makes future schema changes testable. |
| 6 | Move the vocabulary resume state from `localStorage` to `app_state`. | One store for learner state, covered by the database file; small change. |
| 7 | Set a CSP and remove the `greet` command once the production bundle has been smoke-tested. | Hygiene. |
| 8 | Paginate or cap `getMistakes` (and limit what `getPlannerData` returns) if the data ever approaches 50,000 rows. | Only these two queries grow linearly with data. |
| 9 | Split lesson content by unit with dynamic imports when content passes about 1–2 MB. | Not needed today (section 3.4). |
| 10 | Consider an optional strict-capitalisation mode for noun answers (S4). | Teaching value, not a defect. |

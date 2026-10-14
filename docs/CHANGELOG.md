# DeutschLab changelog

Newest first. Versions before 1.0 were internal milestones; dates are commit dates.
Details of each audit live in `docs/QUALITY_AUDIT.md` (v0.8) and `docs/V1_RELEASE_REPORT.md` (v1.0).

## Unreleased — DeutschLab AI v1.1 foundations (2026-10-14)

Optional, advisory AI. No curriculum, grading, checkpoint, mastery, SRS or planner changes. Details:
`docs/AI_ARCHITECTURE.md`, `docs/AI_ASSESSMENT.md`, `docs/AI_PRIVACY.md`.

- **Gemini provider in Rust** (`src-tauri/src/ai.rs`): key in the macOS Keychain, six narrow commands,
  Interactions API with `store: false`, free-tier model allowlist (3.5 Flash-Lite, 3.8 Flash, 3.5 Transcribe).
- **AI Writing Examiner** in writing lessons: 4 × 0–5 rubric, validated corrections, revision and reassessment.
- **AI Speaking Examiner** in speaking lessons: record, play back, transcribe, edit the transcript, assess;
  pronunciation explicitly not assessed.
- **Deutsch mit KI** tutor in Practice: guided and free modes, curriculum-aware, immediate or delayed
  corrections, turn-based voice, saved sessions with summaries.
- **Safeguards:** off by default, consent notice, daily request / tutor turn / recording limits, local usage
  log, no automatic retry or fallback; Settings → AI feedback; Delete AI history.
- **Data:** additive `ai_assessments`, `ai_tutor_sessions`, `ai_usage` tables; backup format 3 (1–2 still valid).
- **Quality:** 27-case German evaluation set; opt-in live evaluation.

## Unreleased — Schwarzrot brand identity (2026-10-14)

Brand identity and motion only: no curriculum, grading, scoring, SRS or persistence changes. The system:
`DESIGN.md` §2, §3, §10–12; assets and explorations: `brand/`.

- **Logomark:** a geometric ü (round left, square foot right) with crimson and gold umlaut dots, chosen
  from three explorations (`brand/gallery.html`). Mono, light, dark, lockup and app-icon SVGs.
- **Wordmark:** "Deutsch" 700 / "Lab" 300, one colour.
- **Colour:** violet Nocturne replaced by Schwarzrot tokens (obsidian, charcoal, warm off-white, crimson,
  gold, oxblood light) with three fixed roles; warning moved to orange-amber, correct-answer ring to green.
- **Opening:** the dots emerge, travel and the ü is constructed; fast-forwarded when data is ready early,
  loops when slow; never delays readiness.
- **Loaders:** `BrandLoader`, `SectionLoader`, `InlineLoader`, `ButtonLoader`, `StartupLoader`, all in
  one dot language, delayed to avoid flashes, with status text and a reduced-motion variant.
- **App icon:** regenerated from `brand/app-icon.svg`; previous icons kept in `brand/icon-backup-tauri-default/`.

## Nocturne redesign (2026-10-13)

Interface and interaction redesign only: no new curriculum, no change to grading, checkpoint scoring,
SRS intervals or mistake resolution. Details, verification and limitations: `docs/UI_REDESIGN_REPORT.md`;
the system itself: `DESIGN.md`.

- **Nocturne identity:** obsidian surfaces, electric violet accent, Bricolage Grotesque / DM Sans /
  Instrument Serif (bundled). Legacy lesson utilities are remapped in `src/index.css`, so every lesson
  is dark without rewriting its markup. No white flash: `index.html` and the native window paint
  `#09080D` first.
- **Six-section shell** (Home, Course, Practice, Review, Progress, Settings) with a springing violet
  marker; side rail from 960 px, top bar below.
- **Opening sequence:** violet light, the Umlaut mark and a kinetic wordmark that split open the moment
  the database is ready; no minimum duration, honest slow and error states, once per launch.
- **Home:** atmospheric light that leans toward the pointer, a kinetic German greeting, the week as a
  numeral, one luminous next-activity block, lighter activity charts.
- **Learning feedback:** spring and drawn check on correct answers, a gentle nudge plus the answer and
  explanation on wrong ones, animated lesson progress; articles in violet and a singular → plural shift on
  vocabulary cards.
- **Completion moments:** lesson ("Geschafft!"), week mastered ("Woche N geschafft.") and October
  Foundations ("Oktober geschafft."), shown only after a saved, first-time completion.
- **Educational motion:** replayable V2 word order (grammar-010) and der → den (grammar-007)
  demonstrations, with written captions.
- **Course:** current week emphasised, planned units compact. **Review** restyled. **Progress/Settings**
  spacing and colour fixes.
- Fixed: horizontal overflow caused by visually hidden chart tables and `1fr` grid columns; the obsolete
  template `src/App.css` removed.
- Tests: E2E selectors updated for the six-section shell; new unit, component and E2E tests for the
  opening, celebrations, kinetic sentences, dark first paint, navigation, reduced motion and
  completion-after-persistence. The native self-test covers the new shell.

## 1.0.0 — October Foundations (2026-10-13)

The first complete October Foundations learning app: Weeks 1–4 of Unit 1. Not a complete A1
course, not Unit 1, and not a CEFR certificate.

**Week 4 curriculum** (`26dc637`)
- `vocab-004` Everyday German in context: 84 words and phrases in 9 resumable batches (296 introduced
  October items in total).
- `grammar-009` accusative pronouns; `grammar-010` sehen, nehmen, treffen, fahren, tragen plus
  accusative consolidation and V2.
- `reading-003`, `listening-004`, `writing-003` (60–80 words, self-check) and `speaking-002`
  (2–3 minute guided talk, self-check).
- `checkpoint-004`, the October Foundations Checkpoint: 39 marks, pass 32/39 with section minimums;
  `isWeek4Mastered`.
- Review keeps accusative pronoun, irregular verb form and word order as separate concepts.
- Fixed: missed accusative/negation reading and listening questions were stored in Mistakes as
  "What is the plural of …".

**Data safety, scaling and interface** (`e2279e0`)
- Vocabulary resume position stored in SQLite, migrated from localStorage without deleting it.
- "Your data": validated, versioned JSON export and exact database snapshots in
  `<app data>/backups`. Restore is manual (documented); there is no in-app restore.
- Review shows current lesson content for existing items (content corrections now reach Review).
- Today's planner query bounded in SQL (same plans; ~30× smaller payload at 10,000 reviews);
  Review lists the 100 most important mistakes.
- Responsive shell, current-week header, October progress grid, foldable mastered weeks,
  focus rings, reduced-motion support, database start-up error state.
- Native app named DeutschLab 1.0.0 with a 1200 × 820 window and a minimum size.

## 0.8 — Quality audit (2026-10-13, `3523fdb`)

Linguistic, performance and data-safety audit of Weeks 1–3; five content/grading defects fixed;
preventive SQLite indexes; independent gender/plural reference test.

## Week 3 — Articles, plurals, accusative, negation (2026-10-12 → 13)

`8803b46`, `7cd4512`, `39663f9`: article-aware vocabulary (65 nouns), `grammar-006`–`008`,
reading, listening, writing and `checkpoint-003`.

## Week 2 — haben and daily life (2026-10-12)

`4923c84`, `889804d`: vocabulary, haben, common verbs, first writing task, reading, listening and
`checkpoint-002`.

## Review and SRS (2026-10-12)

`38c15e7`, `1dbfc9e`, `82a7c71`: mistakes, spaced review (1 → 3 → 7 → 14 → 30 → 60 days, two
correct reviews resolve a mistake) and typed active-recall exercises.

## Checkpoints and planner (2026-10-12)

`9f2e32e` daily planner with a study-time budget; `d0e69e1` Week 1 mastery checkpoint with section
minimums; `d9fb365` automated test suite (Vitest, Testing Library, Playwright).

## Week 1 — Sounds, introductions, sein (2026-10-12)

`fcc6f0e`, `d46058b`, `d0e671a`, `273404e`: vocabulary, pronunciation, sein, regular verbs, questions,
listening and speaking.

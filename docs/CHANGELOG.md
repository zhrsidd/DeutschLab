# DeutschLab changelog

Newest first. Versions before 1.0 were internal milestones; dates are commit dates.
Details of each audit live in `docs/QUALITY_AUDIT.md` (v0.8) and `docs/V1_RELEASE_REPORT.md` (v1.0).

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

# DeutschLab Nocturne redesign: report

Date: 2026-10-13. Scope: interface, interaction and motion for the implemented app (Weeks 1–4 of Unit 1).
No curriculum was added, and grading, checkpoint scoring, SRS intervals (1 → 3 → 7 → 14 → 30 → 60 days)
and mistake resolution are unchanged. The design system itself is documented in `DESIGN.md`.

## 1. Starting point and approved direction

The work continued an uncommitted "Editorial Motion × Neo-Swiss" redesign left at `cd7f391` by an earlier
session (fonts, tokens, six-section navigation, Home/Course/Practice/Progress/Settings screens, SVG charts,
Motion infrastructure, the `study_events` table and backup format v2). That work was kept: its structure,
data layer and components were reused, and a snapshot of every uncommitted file was taken before editing.
Baseline state: TypeScript and Vitest passed (825 tests), and 24 of 53 Playwright tests failed on selectors
that still pointed at the old Today/curriculum dashboard.

**Direction: NOCTURNE**, obsidian black × electric violet × kinetic editorial, on a Neo-Swiss grid. It
replaces the warm-white/chartreuse palette. Three energy levels: **Home cinematic, Learning playful,
Assessment focused** (DESIGN.md §2).

## 2. Visual references

Live browsing of Awwwards, Godly, Recent, Mobbin, motion.dev and Duolingo was not done in this session;
the work followed the brief's described principles and is documented in DESIGN.md "Research notes".
Nothing was copied: no layouts, assets, sounds, exact animations or mascot.

## 3. Screens

| Screen | What changed |
|---|---|
| Shell | Rail from 960 px (new `rail` breakpoint; the old 768 px switch left an 8 px band above the 760 px minimum), top bar below. The Umlaut wordmark; active item with a surface fill and a glowing violet bar, or a violet underline in the top bar, springing between items; current week with a progress line. |
| Home | Full-bleed hero with atmospheric light, kinetic "Guten Morgen/Tag/Abend.", the week's phrase in German quotation marks on its own line (fixes the awkward wrap), and the week as a 9.5 rem numeral filling the formerly empty upper right. One luminous next-activity block with the only violet button. Quiet "Alles erledigt." when nothing is due. Activity bars are slim (≤ 12 px), at 60% violet with today full-strength. |
| Course | Month dots show now / built / planned; the current week has a violet edge, display title and "Current" chip; mastered weeks fold; planned units 02–06 are one compact row each (previously ~100 px each). |
| Practice | Inherits the system; double hairline under the header removed. |
| Review | Rebuilt overview (page header, two stat rules, violet "Start Review", hairline mistake list with Resolved/Unresolved chips) and a focused session frame with live progress text and a large "n/m" result. |
| Progress | Spacing between stacked figures fixed (`m-0` on `figure` was cancelling `space-y`). Data unchanged. |
| Settings | Selected study time and "Export backup" use the violet primary style instead of a bright white block. |
| Lessons | All lesson screens become dark through the compatibility layer (DESIGN.md §3.4) without markup rewrites; sticky blurred header with the wordmark; violet primary buttons; calm surfaces. |

## 4. Reusable components and primitives

`shell/Atmosphere.tsx`, `shell/Intro.tsx`, `shell/Brand.tsx` (UmlautMark, Wordmark),
`celebrate/Celebration.tsx` + `lib/celebration.ts`, `lesson/KineticSentence.tsx`,
`vocabulary/GermanWord.tsx` (GermanWord, PluralShift), updated `review/ReviewFeedback.tsx`,
`lesson/LessonParts.tsx` (ProgressBar) and `charts/Charts.tsx`. CSS primitives: `.nc-atmosphere`,
`.nc-light`, `.nc-grain`, `.nc-luminous`, `.dl-correct`, `.dl-wrong`, `.dl-feedback`, `.dl-check`,
`.dl-progress-fill`, `.dl-letter`, `.dl-plural*`, `.dl-intro*`, `.dl-celebrate*`.

## 5. Cinematic opening

Obsidian first paint (inline in `index.html`, plus `backgroundColor` and `theme: Dark` on the Tauri
window), then violet light, the Umlaut dots landing on their bar, "DeutschLab" rising letter by letter and a
light line. When the database is ready or fails, the stage splits along its centre line in 760 ms and
reveals the already-rendered app; pointer events pass through as soon as it starts leaving. There is no
minimum duration and no percentage; after 1.6 s it says "Opening your study data…". It plays once per
launch (a same-session reload gets the short reveal), is `aria-hidden`, and disappears at once under
reduced motion. The existing error alert and "Try again" are unchanged.

## 6. Gradient and lighting system

Three radial-gradient light layers and a static grain inside a contained hero, fading up once. On a fine
pointer they lean up to ~28 px toward the cursor (rAF-throttled, transform only, listeners on the hero,
cleaned up on unmount). No blur filters, loops, `will-change` or blend modes. Gradients are otherwise limited
to the luminous border, light lines, the opening and milestones (DESIGN.md §8).

## 7. Answer feedback (Duolingo-inspired, original)

- Correct: spring scale with a fading violet glow ring (320 ms), the check mark draws itself, success
  tint, "Correct." with *Richtig*.
- Not quite: a small sideways nudge (300 ms), soft coral tint, the answer and explanation stated,
  *Fast* ("almost").
- Applied at every grading surface (vocabulary recall, grammar practice, listening, pronunciation,
  checkpoint comprehension, Review typed/audio/choice) by adding classes to the existing graded states, so
  grading and saving code paths are untouched. Feedback panels are polite live regions.
- Lesson progress springs forward by transform as real questions are answered.

## 8. Vocabulary and educational motion

- Articles in violet on headwords, letters rising in per card; a singular → plural shift marking only the
  changed article and noun ending or umlaut (computed, not hand-entered).
- Kinetic sentences (new `kinetic` teaching block): grammar-010 V2 (Ich lerne heute Deutsch → Heute lerne
  ich Deutsch → Heute Abend lerne ich Deutsch, showing that position 1 is a constituent) and grammar-007
  der → den (Der Tisch ist groß → Ich sehe den Tisch). Learner-triggered, captioned, replayable, no effect
  on scoring. German checked: verb second in every step; Tisch is masculine; only the article changes.

## 9. Milestone feedback

| Level | Treatment |
|---|---|
| Answer | CSS spring and drawn check |
| Lesson | "Geschafft!" / "Sehr gut!" / "Weiter so!", real week progress moving from before to after; leaves after 2 s; click, Escape or Enter skips |
| Week mastered | "Woche N / geschafft.", Umlaut mark, light line, then results; waits for "Weiter" |
| October Foundations | Bigger light, "Oktober / geschafft." with a violet → orchid letter ramp, results, "not a CEFR certificate"; waits for "Weiter" |

Shown only after `markTaskComplete` resolves, only for a task that was not complete before, and never on
reopening a finished lesson. Mastery comes from the app's existing rules (`lib/progress.ts`).

## 10. Screenshots and visual review

Screenshots were taken of the production build with mocked SQLite (Playwright), waiting for every running
animation to finish before capturing, so no frame is caught mid-fade. Reviewed: opening (mid and settled),
Home, Course, Practice, Review (overview, question, correct, not quite), Progress, Settings, vocabulary
(intro and card), grammar teaching with the V2 demo (before and after a step), reading, writing,
checkpoint intro, and the lesson, week and October moments, at 1440 / 1200 / 1024 / 960 / 959 / 900 / 760 px.
The screenshots are not committed.

Findings fixed during review:
- October "geschafft." was invisible (`background-clip: text` does not paint transformed inline-block
  letters), replaced with a per-letter colour ramp.
- Horizontal overflow of 67 px (Home at 1024) and up to 179 px (Course at 960): the visually hidden chart
  tables (tables ignore `.sr-only`'s 1 px width) and `1fr` grid columns holding truncated text. This was
  also the source of the earlier "1 px overflow at 1200". Now zero overflow on all six screens at every
  width listed above.
- Course "Current" chip had lost its fill; planned units were oversized.
- Settings selection and export button rendered as bright white blocks.
- Double hairlines under page headers; cramped Progress figures; kinetic demo touching the next table.
- "Alles erledigt." at statistic size competed with the primary action.

## 11. Accessibility

Measured contrast (DESIGN.md §3.3): body text 15–18:1, secondary 7.8–9.2:1, muted ≥ 5.3:1, violet text
≥ 6.2:1, text on violet 7.0:1, focus ring ≥ 10:1, chart marks 3.3:1. Visible 2 px focus everywhere; one
`nav`, one `main`; decorative layers `aria-hidden`; milestone dialogs focus "Weiter" and close with
Escape; no focus traps; feedback and captions are polite live regions; correctness is always stated in
words. Reduced motion: all CSS animation and transition durations collapse, Motion uses
`reducedMotion="user"`, the pointer light is off, the opening disappears at once, and moments show their
final state (covered by an E2E test). Known gap: input borders are faint hairlines; inputs are identified by
their elevated fill and labels rather than a 3:1 border.

## 12. Responsive checks

Automated overflow checks at 1440, 1200, 1024, 960, 959, 900 and 760 px for all six screens (QA harness)
and in the E2E suite at 760, 1024 and 1440 for Home and Course. 760 × 560 is the Tauri minimum.

## 13. Performance

Method: production builds of the pre-session tree (rebuilt from `cd7f391` plus the snapshot; bundle
hashes identical to the original baseline build) and the Nocturne tree; mocked SQLite seeded with
10,000 review items and 5,000 mistakes; Chromium at 1200 × 860.

| Measure | Before | After |
|---|---|---|
| JS (main) | 682.0 kB / 188.3 kB gzip | 702.9 kB / 194.2 kB gzip |
| Motion features (lazy chunk) | 86.2 kB / 28.6 kB gzip | 86.2 kB / 28.6 kB gzip |
| CSS | 40.0 kB / 8.2 kB gzip | 57.8 kB / 11.6 kB gzip |
| Home load: layouts / style recalcs (deterministic) | 14 / 40 | 17 / 48 |
| Home "Today's plan" visible, warm, 10k reviews (first pair, lightest load) | 38–62 ms (median 42) | 43–54 ms (median 47) |
| Review overview visible, same run | 52–61 ms (median 56) | 55–75 ms (median 66) |
| Same, final three alternating pairs (load average 20–35), medians | Home 82 / 79 / 350*, Review 125 / 103 / 464* | Home 141 / 80 / 129, Review 149 / 101 / 106 |

\* a run disturbed by the external load spike (maxima of 673 ms and 2.6 s).

The historical v1.0 reference (Today 42–45 ms, Review 51–56 ms warm) matches the lightest-load baseline run
here, so those runs are comparable. Within the measurement noise there is no material regression; the
lightest-load pair suggests at most ~5–10 ms more on Home and Review.

The machine was under heavy unrelated load during parts of the session (load average 30–50 from processes
outside this project), so wall-clock and CPU timings are given as ranges from alternating runs and should
be re-measured on an idle machine. The added work on Home is the opening overlay and the hero; Review is
unchanged in layout and style work.

## 14. Data and migration verification

- `study_events`: `CREATE TABLE/INDEX IF NOT EXISTS`, nothing existing read, changed or backfilled; one row
  per review answer; covered by `dbMigration.test.ts` (idempotent restarts, legacy rows preserved, query
  results unchanged) and `progressData.db.test.ts`.
- Backup format v2 adds `study_events` and still accepts v1 files (`backup.db.test.ts`).
- The redesign added no schema changes. `reviewScheduler.ts`, checkpoint scoring and answer normalisation
  are untouched. The native self-test re-checks migrations, persistence, SRS (3 then 7 days) and snapshots
  against an isolated database.

## 15. Tests

Final gate (`npm run test:agent` → `npm run test:all`): TypeScript passed; **Vitest 60 files, 840 tests
passed** (was 56 / 825); production build passed; **Playwright 61 passed** (was 29 passed / 24 failed of 53).
These are browser and jsdom tests with mocked SQLite and speech; they are not native verification.

New tests: `lib/celebration.test.ts`, `celebrate/Celebration.test.tsx`, `shell/Intro.test.tsx`,
`lesson/KineticSentence.test.tsx`, `e2e/nocturne.spec.ts` (dark first paint with app assets blocked, opening
leaves and never replays, one active nav item, keyboard focus ring, reduced motion), `e2e/completion.spec.ts`
(a lesson moment appears only after the completion row exists, does not replay, and does not appear when
the save fails). Updated: every E2E spec that used the old Today/curriculum layout now navigates through
the shell (`goTo`, `openWeek` helpers); assertions were kept (for example the study-time test now checks
`aria-pressed` instead of a colour class).

## 16. Native testing

`bash scripts/native-selftest.sh` built the debug app bundle and ran it in WKWebView (`tauri://localhost`)
with a temporary HOME and a separate self-test database; the live learner database was never opened.
**All 20 checks passed**, including the updated UI checks: Nocturne background (`rgb(9, 8, 13)`) in
WKWebView, Home renders with Week 4, the opening leaves once the database is ready, no horizontal overflow
at 1200 × 788, every main section opens without overflow (Course, Practice, Review, Progress, Settings,
Home all 0 px), plan → lesson → teaching page → back, Settings → Save snapshot, Course shows Weeks 5–16 as
planned. Data checks also passed: idempotent migrations, WAL journal, persistence, mistakes and structured
review items, SRS 3 then 7 days, append-only checkpoint attempts, drafts/resume/study time, snapshot and
JSON export. German voices available: Anna (de-DE).

Not verified natively: what the opening, atmosphere and celebrations look like in motion inside the
native window (the checks are DOM-level), and audible speech. See §18.

## 17. Known limitations

- External design references were not browsed live (see §2).
- Timings were measured under heavy unrelated machine load (see §13).
- Week and October moments were reviewed in an isolated component preview and covered by component
  tests; reaching them through a full checkpoint in the browser was not automated.
- Speech output was not listened to; voice availability is reported by the native self-test only.
- The lesson moment covers Home for up to 2 s (any click dismisses it).
- Input borders are hairlines (see §11).

## 18. Remaining manual checks (native window)

1. Launch from Finder: no white frame before the opening; the split reveals Home.
2. Move the pointer over the Home hero: the light leans slightly and settles back.
3. With System Settings → Accessibility → Display → Reduce motion on: the app opens directly and nothing
   moves except instant state changes.
4. Finish any unfinished lesson: "Geschafft!" (or a variant) appears once and leaves; finish it again: no
   moment.
5. Pass a checkpoint for an unmastered week: the week moment holds until "Weiter"; Escape also closes it.
6. grammar-010 → "Verb in position 2": step the demonstration; grammar-007: der → den.
7. Resize to the 760 px minimum: top bar navigation, no horizontal scrolling.
8. Play a German word in a vocabulary lesson and confirm a German voice is heard.

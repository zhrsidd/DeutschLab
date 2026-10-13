# DeutschLab design system: NOCTURNE

The authoritative visual reference for DeutschLab. Read it before any UI work, and follow it for every
future A1–C1 feature. Tokens live in `src/index.css` (`@theme`); this document explains how to use them.
If the two disagree, fix one of them in the same change.

**Direction: Obsidian black × electric violet × kinetic editorial**, on a Neo-Swiss grid. Cinematic when the
app opens, playful while learning, calm while concentrating.

---

## 1. Brand philosophy

DeutschLab is a serious tool for reaching C1 German: a place to study every day for two years. The design
has one job: make that daily practice feel intentional and enjoyable without getting in its way.

1. **Learning comes first.** The next learning action is always the most obvious thing on screen.
2. **Every animation has a purpose.** It confirms, explains, orients or celebrates something real.
3. **Honest data only.** Nothing is invented: no XP, no streak pressure, no CEFR percentages, no fake
   loading progress. Completion is never presented as fluency.
4. **Mistakes are constructive.** Wrong answers get the right answer and a reason, never a punishment.
5. **Personality comes from language and type,** not a mascot: German words, the Umlaut mark, kinetic
   letters.
6. **Accessible and offline by default.** Keyboard first, AA contrast, reduced motion respected, no
   network needed for anything you see.

## 2. The Nocturne direction and its three energy levels

Neo-Swiss discipline (grid, hierarchy, hairlines, asymmetric composition, negative space) with a layer of
cinematic light and motion. The energy level depends on what the learner is doing:

| Level | Where | Character |
|---|---|---|
| **Cinematic** | Opening sequence, Home hero, week and October milestones | Atmospheric violet light, display type at full size, kinetic words, the week as a numeral |
| **Playful** | Lessons: vocabulary, grammar teaching, exercises, lesson completion | Spring feedback on answers, letters rising in, plural shifts, kinetic grammar demonstrations |
| **Focused** | Checkpoints, Review sessions, reading passages, writing | Calm dark surfaces, no atmosphere, no decorative motion behind questions; celebration only after a saved completion |

Never apply Home's energy to a lesson, or a lesson's to an assessment.

## 3. Colour

### 3.1 Palette (semantic tokens)

| Spec role | Token (Tailwind name) | Hex | Use |
|---|---|---|---|
| background | `canvas` | `#09080D` | App background |
| background-elevated | `elevated` | `#15121D` | Cards, inputs, the one bordered block per screen |
| surface | `surface` | `#211A2C` | Tracks, quiet fills, active nav fill |
| surface-interactive | `surface-hover` | `#2A2138` | Hover and pressed fills |
| border | `line` | `#352B42` | Hairlines |
| border-strong | `line-strong` | `#54466A` | Stat rules, outlines of secondary buttons |
| text-primary | `fg` | `#F5F2FF` | Body and headings |
| text-secondary | `fg-2` | `#B4ADC5` | Supporting text |
| text-muted | `fg-3` | `#958CA8` | Kickers, axis labels, metadata |
| accent | `accent` | `#A78BFA` | Electric violet: the primary action, "now", data marks |
| accent-hover / -active | `accent-hover` / `accent-active` | `#BBA5FC` / `#9273F5` | Primary button states |
| text on accent | `on-accent` | `#120D1C` | Text on violet fills |
| (light source) | `ultraviolet` | `#7C3AED` | Gradients and glows only, never text |
| (light source) | `orchid` | `#D946EF` | Gradient partner; emphasis only |
| focus-ring | `focus` | `#C4B5FD` | 2 px focus outline |
| success | `success` / `success-soft` | `#6EE7B7` / `#0F2A20` | Correct answers, mastered |
| error | `error` / `error-soft` | `#FFA3A3` / `#2C1418` | Wrong answers, failures (soft coral, never alarm red) |
| warning | `warning` / `warning-soft` | `#F5C56B` / `#2A2010` | Early-access and caution notes |

### 3.2 Distribution

About **70–80%** of any screen is obsidian and dark neutrals, **15–20%** violet-tinted surfaces and details,
and **5–10%** strong violet or orchid. Strong violet marks one thing per view: the primary action, the
current position, or a data mark. Purple is not a state colour: success and error stay green and coral.

### 3.3 Contrast (measured, WCAG 2.x)

| Text | on canvas | on elevated | on surface |
|---|---|---|---|
| `fg` | 18.1 | 16.7 | 15.2 |
| `fg-2` | 9.2 | 8.6 | 7.8 |
| `fg-3` | 6.3 | 5.8 | 5.3 |
| `accent` | 7.3 | 6.8 | 6.2 |

`on-accent` on `accent` is 7.0:1 (9.0 on hover). Success text on its tint is 11.9, error 10.5, warning 11.5.
The focus ring is ≥ 10:1 against every surface. Chart bars at 60% violet are 3.3:1 against the canvas.
`line` and `line-strong` are decorative hairlines; controls are also identified by their fill.

### 3.4 Compatibility layer for v1.0 lesson markup

The lessons were written with Tailwind's light utilities. Instead of rewriting twenty lesson files,
`@theme` remaps those scales so the same markup renders in Nocturne:

| Legacy utility | Becomes | Effect |
|---|---|---|
| `bg-white` | `#15121D` | Cards render as elevated surfaces |
| `text-white` (on primary buttons) | `#15121D` | Dark text on the violet fill |
| `black/5`, `black/10` | light ink at 5 / 10% | Faint light hairlines |
| `neutral-50 … 200` | dark fills and lines | Quiet surfaces |
| `neutral-400 … 700` | muted → light text | AA text on dark |
| `neutral-800` / `neutral-900` | accent hover / accent | `bg-neutral-900` primary buttons turn violet |
| `red-*`, `emerald-*`, `amber-*` | dark error / success / warning tints | Feedback keeps its meaning |

**New code uses the semantic tokens** (`bg-elevated`, `text-fg-2`, `bg-accent text-on-accent`), never the
legacy names. Do not use `text-neutral-900` for text: it is violet in this layer.

## 4. Surface hierarchy

1. `canvas`: the room. Every page sits on it.
2. `elevated`: things you act on as a unit (a question, the next activity, a form, an input).
3. `surface`: tracks, quiet fills, selected or hovered rows.
4. `nc-luminous`: a 1 px border lit from one corner (violet → orchid → line). **One per screen at most**:
   Home's next activity or the "done for today" block.
5. Overlays: the opening sequence and completion moments (`canvas` at 82–94%).

No glassmorphism. One backdrop blur exists: the sticky top bar and lesson header, so content scrolling
underneath stays legible.

## 5. Typography

| Family | Role | Use for | Never for |
|---|---|---|---|
| **Bricolage Grotesque** (`font-display`, 200–800) | Display | Greetings, page titles, week numerals, statistics, milestones, vocabulary headwords | Body, buttons, instructions |
| **DM Sans** (`font-sans`, default) | Interface | Navigation, lessons, tables, instructions, forms, buttons, reading passages | Large display |
| **Instrument Serif** (`font-serif`, italic) | Editorial accent | The week's German phrase on Home, English glosses in moments, "Richtig" / "Fast" in feedback | UI chrome, numbers, long text |

Bundled locally (`src/assets/fonts`, SIL OFL 1.1, licences beside the files), Latin + Latin Extended, so
`ä ö ü ß Ä Ö Ü` render in every face. Nothing is fetched at runtime.

**Scale.** Interface text uses Tailwind sizes. Display tokens: `text-display-xl` 80/0.92 (Home greeting,
milestones), `text-display-lg` 56/0.98 (page titles on wide windows), `text-display-md` 40/1.02,
`text-display-sm` 28/1.1, `text-stat` 36/1. The Home week numeral is Bricolage 200 at 9.5 rem.

Rules:
- Display headlines take −0.02 em tracking or tighter; light weights (200) only at numeral sizes.
- The kicker: `text-[11px] uppercase tracking-[0.12em] text-fg-3`, optionally led by a 4 px violet dot.
- Data uses `.tabular`.
- German quotations use German quotation marks: „Ich sehe ihn.“
- Reading measure `max-w-reading` (42 rem ≈ 70 characters), line height ≥ 1.6.
- `h1–h3` use `overflow-wrap: break-word; hyphens: auto`, so long compounds wrap instead of overflowing.
- Use at most two families in one component.

## 6. Grid, spacing and layout

- 4 px spacing scale; common steps 2, 3, 4, 6, 8, 10, 12. Sections are separated by a hairline and
  `mt-10 md:mt-12`.
- Page frame: `max-w-page` (72 rem), gutters `px-5` / `md:px-10`.
- Home: full-bleed hero, then a 12-column grid with an asymmetric 7/5 split (`lg`). The hero splits 8/4:
  greeting left, the week numeral right.
- **Grid columns that hold truncating text use `minmax(0,1fr)`, never `1fr`** (a bare `1fr` cannot shrink
  below its content's min-content width and causes horizontal overflow).
- Rules over cards: a group opens with `border-t border-line` and a kicker.
- Radii: `sm` 4, `md` 6, `lg` 8 (the larger Tailwind radii are tightened). New work uses `md` for controls,
  `lg` for containers, `rounded-full` only for chips, tracks and dots.

## 7. Component patterns

- **Shell** (`shell/AppShell.tsx`): from 960 px (`rail:` breakpoint) a 224–240 px left rail with the
  wordmark, six numbered destinations (01 Home … 06 Settings) and the current week with a progress line;
  below 960 px a sticky top bar. The active item has a `surface` fill and a glowing 2 px violet bar on
  the rail, or a violet underline in the top bar, springing between items (Motion `layoutId`).
- **Wordmark** (`shell/Brand.tsx`): the Umlaut mark (two dots over a bar) and "DeutschLab".
- **PageHeader / Section / Page**: kicker, display title, one sentence; hairline sections.
- **Next activity** (Home): `nc-luminous` block, title in display, reason, minutes and the only violet
  button on the screen ("Continue learning").
- **Buttons**: primary `bg-accent text-on-accent hover:bg-accent-hover`; secondary
  `border border-line-strong bg-elevated hover:border-accent`; tertiary underlined text. All take
  `.dl-press` (140 ms scale 0.98). Disabled: 30–40% opacity and `cursor-not-allowed`.
- **Chips**: Mastered `bg-success-soft text-success`; Current `bg-accent text-on-accent`; Planned outline
  `ring-1 ring-line text-fg-3`; Unresolved `ring-accent/60 text-accent`.
- **Course timeline** (`course/CourseView.tsx`): a vertical hairline with a dot per month (glowing violet
  for the current month, light for built months, hollow for planned ones). The current week has a violet
  edge, a display-face title and is open; mastered weeks fold; planned weeks list their topics with a
  "Planned" chip; later units are one compact row each.
- **Kinetic sentence** (`lesson/KineticSentence.tsx`): see §14.

## 8. Gradients

Gradients are **light, not decoration**. Allowed:
- radial violet/orchid light in the atmosphere, the opening and milestones;
- the 1 px luminous border (`nc-luminous`);
- the hairline under the wordmark and milestones (violet → orchid, fading at both ends);
- the per-letter violet → orchid ramp on "geschafft." in the October moment.

Not allowed: rainbow or rotating gradients, gradients behind lesson text, gradient buttons, gradient text
on headings or metrics (solid colours carry text).

## 9. Lighting effects

`<Atmosphere>` (`shell/Atmosphere.tsx`, CSS `.nc-atmosphere`): three radial-gradient layers (violet top
right, orchid near it, a faint low light bottom left) and a static film grain at 3.5% opacity, inside a
`contain: strict; overflow: hidden` box. It fades up once (1.2 s) on mount. On a fine pointer it leans a few
pixels toward the cursor: pointer events on the hero only, one update per animation frame, `transform`
only, eased by a 900 ms transition. No blur filters, no `will-change`, no blend modes, no loops. Disabled
under reduced motion and on coarse pointers. **Home only.**

## 10. Opening sequence (loader)

`shell/Intro.tsx` with `.dl-intro` styles.

1. `index.html` paints `#09080D` inline before any JS or CSS, and the native window has
   `backgroundColor: #09080D` and `theme: Dark` (`tauri.conf.json`): no white flash.
2. A violet light grows (1.4 s), the Umlaut dots drop onto their bar one after the other (spring), and
   "DeutschLab" rises letter by letter from behind a mask, "Lab" in violet; a violet → orchid line draws
   under it.
3. **The moment the database is ready (or fails), the stage splits along its centre line** (two panels,
   760 ms, expo in-out) and reveals the app, which is already rendered underneath. As soon as it starts
   leaving, the overlay stops taking pointer events.

Rules: no minimum duration and no fake progress. After 1.6 s without a database it says "Opening your
study data…". On failure it leaves at once and the existing error alert with "Try again" shows. It plays
once per launch; a reload in the same session gets only the reveal. It is `aria-hidden` (the app's own
status and alert carry the state) and never holds focus. Under reduced motion it disappears immediately.

## 11. Motion tokens

| Token | Value | Use |
|---|---|---|
| `--duration-press` | 140 ms | Button press scale |
| `--duration-base` | 220 ms | Hover, colour, collapse, nav |
| `--duration-feedback` | 320 ms | Correct-answer spring |
| `--duration-page` | 300 ms | Page entrance (opacity + 6 px rise) |
| `--duration-chart` | 450 ms | Chart marks growing in |
| `--duration-reveal` | 520 ms | Kinetic words |
| `--ease-out-quint` | cubic-bezier(.22,1,.36,1) | Entrances |
| `--ease-standard` | cubic-bezier(.2,.7,.2,1) | Colour and small moves |
| `--ease-in-out-expo` | cubic-bezier(.87,0,.13,1) | The opening split |
| `--ease-spring` | CSS `linear()` spring, ≈ 3% overshoot | Feedback, letters, progress |

Motion for React (`motion/react`) is used only where layout animation is needed: the nav indicator and
kinetic sentences. It loads through `LazyMotion` with async features (`components/motion.tsx`), wraps the
whole app (lessons included) and uses `reducedMotion="user"`. Everything else is CSS.

Technical rules: animate `transform` and `opacity` (plus `grid-template-rows` for collapse); no unbounded
loops; clean up listeners and frames; one overlay at a time; animations never delay input or saving.

## 12. Microinteraction states and answer feedback

| State | Treatment |
|---|---|
| Press | `.dl-press`: scale 0.98 for 140 ms |
| Hover | Colour shift 220 ms (violet text or border), arrow nudges 2 px |
| Focus | 2 px `focus` outline, 2 px offset |
| Selected | Violet outline or fill (`aria-pressed` / `aria-checked` / `aria-current` always set) |
| **Correct** | `.dl-correct`: a 1.2% spring scale and a violet glow ring that fades (320 ms); the check mark draws itself (`.dl-check`, 360 ms); panel tint success-green; text "Correct." with *Richtig* |
| **Not quite** | `.dl-wrong`: a 4 px → 3 px → 1 px sideways nudge (300 ms), soft coral tint; the panel states the answer and the explanation, with *Fast* ("almost") |
| Feedback panel | `.dl-feedback` rises 4 px into place (220 ms), `aria-live="polite"` |
| Lesson progress | `ProgressBar`: a violet line that springs forward by `scaleX` (480 ms) as real questions are completed |

Feedback classes are applied when the grade arrives, so they play once, after grading. Grading logic, saving
and keyboard flow are unchanged. Words carry the meaning; colour and motion only reinforce it.

## 13. Completion celebrations

Four levels, each distinct. Moments appear **only after `markTaskComplete` has succeeded** and **only the
first time** a task is completed (`lib/celebration.ts`, `celebrate/Celebration.tsx`).

| Achievement | Moment | Length | Dismissal |
|---|---|---|---|
| Answer | `.dl-correct` spring and drawn check | ~0.3 s | n/a |
| Lesson | "Geschafft!" / "Sehr gut!" / "Weiter so!" rises letter by letter over a violet glow; the week's real progress line moves from before to after | 2 s, then leaves by itself | Click, Escape or Enter |
| Week mastered | The Umlaut mark lands, "Woche N / geschafft." in two lines, a light line draws, then results (activities, checkpoint passed) | ~1.8 s to results, then waits | "Weiter", Escape |
| October Foundations | Larger light (violet and orchid), "Oktober / geschafft." with a violet → orchid letter ramp, then results and the note that this is the app's milestone, **not a CEFR certificate** | ~2.3 s to results, then waits | "Weiter", Escape |

The lesson level is a `role="status"` announcement; week and October are labelled dialogs that focus
"Weiter". Under reduced motion every level shows its final state at once.

## 14. Vocabulary typography and educational motion

- **Headwords** (`vocabulary/GermanWord.tsx`): the article is set in violet (`der Tisch`), and letters rise
  in 22 ms apart on a spring when the card changes. A screen-reader copy keeps the word whole.
- **Plural shift**: "der Stift → die Stift**e**", "das Buch → die B**ücher**": the article change and
  the changed part of the noun (computed from the shared start) are marked, and the mark glows once. The
  plain "Plural: die Stifte" line stays available to assistive tech.
- **Kinetic sentences** (`lesson/KineticSentence.tsx`, teaching block `type: "kinetic"`): parts keep an id
  across steps and Motion moves each part to its new place; each step has a written caption announced
  politely; "Show the change" / "Replay" are learner-triggered; nothing autoplays or affects scoring.
  - grammar-010, *Verb in position 2*: Ich lerne heute Deutsch → Heute lerne ich Deutsch → **Heute Abend**
    lerne ich Deutsch (position 1 is one part of the sentence, not one word).
  - grammar-007, *der, die, das in the accusative*: Der Tisch ist groß → Ich sehe **den** Tisch (only the
    masculine article changes; the noun and its gender stay the same).
  Add a demonstration only where motion explains structure better than a table. A few good ones beat many.

## 15. Chart conventions

Hand-built SVG/HTML in `charts/Charts.tsx`, no chart library.
- Marks are violet: the current mark at full strength with a soft glow and a dot under its label, the rest
  at 60% (3.3:1). Bars are slim (≤ 12 px, rounded tops); segment meters are 8 px pills (done violet, next
  violet outline, to do surface).
- Zero baselines, round maxima, `line` dashed gridlines, `fg-3` 11 px tabular axis text.
- Each chart is a `figure` with a kicker title, a one-line description of what is counted, an explicit
  empty state, and a visually hidden data table. Hide a table by wrapping it in `.sr-only` (tables ignore
  the 1 px width of `.sr-only`). Marks are focusable with tooltips on hover and focus.
- Data is persisted, never mocked. Activity counts events, not time.

## 16. Accessibility

- Landmarks: one `nav[aria-label=Main]`, one `main`, labelled sections.
- Keyboard: every action reachable with Tab, visible focus everywhere, no traps (dialogs focus their action
  and close with Escape), Enter submits answers.
- Contrast per §3.3; meaningful non-text marks ≥ 3:1.
- Feedback states the answer in words; colour and motion are never the only signal.
- Live regions: answer feedback, kinetic captions and lesson completion are polite announcements.
- Decorative layers (atmosphere, intro, Umlaut mark, letter copies) are `aria-hidden`.
- Reduced motion: CSS sets every animation and transition to ~0 ms, Motion uses `reducedMotion="user"`,
  the pointer light is off, and every moment shows its final state.
- Text scaling: rem units, wrapping layouts, no fixed-height text boxes.

## 17. Responsiveness

The native window is 1200 × 820 by default, **760 × 560 minimum**. Reviewed at 1440, 1200, 1024, 960, 959,
900 and 760 px with zero horizontal overflow on every main screen. Below 960 px the rail becomes a top bar;
below `lg` (1024) Home stacks and hides the week numeral; Course's unit column collapses below `md`.

## 18. Performance

- Prefer CSS; Motion only for layout animation, loaded lazily (its 86 kB chunk stays out of startup).
- The atmosphere uses gradients, not blur; it is contained and repaints only when the pointer moves.
- No WebGL, canvas, video, chart or UI-kit libraries.
- Keep SQL bounded (the planner and Progress queries are already bounded); design never adds queries.
- Re-measure bundle and the 10,000-review Home/Review timings after visual changes
  (`docs/UI_REDESIGN_REPORT.md` §11 has the method).

## 19. Offline

Fonts, icons (lucide, bundled), gradients, grain (an inline SVG data URI) and motion are all local. The
opening and celebrations never wait on a network. Speech uses the Mac's installed voices.

## 20. Governance for future features

1. Decide the energy level first (§2) and stay inside it.
2. Use semantic tokens; add a token here before adding a colour, radius or duration.
3. One violet primary action per view; one `nc-luminous` block at most.
4. New feedback reuses `.dl-correct`, `.dl-wrong`, `.dl-feedback`, `.dl-check`.
5. New milestones reuse `Celebration`; add a level only for a genuinely larger achievement (for example a
   unit or CEFR-aligned course milestone), and never for streaks or volume.
6. Charts follow §15; never show estimates as measurements.
7. Verify at 760 px and under reduced motion, add a test for new behaviour, and update this file in the
   same change.

### Research notes (design references)

External sites (Awwwards, Godly, Recent, Mobbin, motion.dev, Duolingo) were not browsed live for this
milestone. The principles below come from the brief and established practice; no layouts, assets, sounds
or animations were copied, and there is no mascot.

- **Cinematic studio sites (Awwwards / Godly):** a short typographic preloader that hands off to the page
  along a line or split; atmosphere from large soft light rather than imagery; one oversized element
  (here, the week numeral) anchoring an asymmetric composition.
- **Duolingo's learning feedback:** immediate, physical feedback on every answer; correct answers feel like
  a small "click into place", wrong answers stay encouraging and show the fix; completion gets its own
  short moment; bigger milestones feel bigger. DeutschLab keeps these interaction qualities and leaves out
  XP, streaks, hearts and the mascot.
- **Mobbin-style conventions:** a persistent left rail with numbered sections, one primary action per
  screen, progress shown where work happens.
- **Motion:** springs for physical feedback, layout animation for things that move position (the nav
  marker, sentence parts), `reducedMotion="user"`, no animation queues that delay input.

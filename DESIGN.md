# DeutschLab design system: EDITORIAL MOTION × NEO-SWISS — SCHWARZROT

The authoritative visual reference for DeutschLab. Read it before any UI work, and follow it for every
future A1–C1 feature. Tokens live in `src/index.css` (`@theme`); brand assets live in `brand/`. This
document explains how to use them. If they disagree, fix one of them in the same change.

**Philosophy: Editorial Motion × Neo-Swiss Learning.** A grid, hierarchy, hairlines and asymmetric
composition, animated with purpose.
**Visual identity: Schwarzrot.** Obsidian black, warm off-white, crimson and muted gold, carried by a
geometric **ü**. German character comes from colour, typography, geometry and language, never from
flags, eagles or national symbols.

> Supersedes **Nocturne** (obsidian × electric violet, v1.0 redesign, see `docs/UI_REDESIGN_REPORT.md`).
> Its layout, typography, grid, motion durations, feedback and celebration structure carry over
> unchanged; only the colour, the mark and the brand motion changed. Violet, ultraviolet and orchid tokens
> no longer exist.

---

## 1. Philosophy and energy levels

DeutschLab is a serious tool for reaching C1 German: a place to study every day for two years. The design
has one job: make that daily practice feel intentional and enjoyable without getting in its way.

1. **Learning comes first.** The next learning action is always the most obvious thing on screen.
2. **Every animation has a purpose.** It confirms, explains, orients or celebrates something real.
3. **Honest data only.** No XP, no streak pressure, no CEFR percentages, no fake loading progress.
   Completion is never presented as fluency.
4. **Mistakes are constructive.** Wrong answers get the right answer and a reason, never a punishment.
5. **Personality comes from language, type and two dots.** No mascot: the umlaut dots of the ü are the
   only "character", and they express it only through motion.
6. **Accessible and offline by default.** Keyboard first, AA contrast, reduced motion respected, no
   network needed for anything you see.

| Level | Where | Character |
|---|---|---|
| **Cinematic** | Opening sequence, Home hero, week and October milestones | Low crimson light, display type at full size, the week as a numeral, the mark in motion |
| **Playful** | Lessons: vocabulary, grammar teaching, exercises, lesson completion | Spring feedback on answers, letters rising in, plural shifts, kinetic grammar demonstrations |
| **Focused** | Checkpoints, Review sessions, reading passages, writing | Calm dark surfaces, no atmosphere, no decorative motion behind questions; celebration only after a saved completion |

Never apply Home's energy to a lesson, or a lesson's to an assessment.

## 2. Brand identity

### 2.1 Concept: the geometric ü

The logomark is a lowercase **ü** built like architecture: **round on the left, square on the right.**
The left half is a perfect bowl; the right stem drops straight to the baseline and ends in a square
foot, the skeleton of the geometric ü in the Futura tradition, read as a building block. Above it sit
the two umlaut dots, the one letterform German has and English doesn't: **crimson** on the left,
**gold** on the right. They are typographic dots, not eyes: solid, as wide as the stroke, spaced over
the stems, never given pupils or expressions.

Three explorations are preserved in `brand/explorations/` and compared in `brand/gallery.html`
(screenshot `brand/screenshots/01-explorations.png`):

| | A · Geometric | B · Expressive | **C · Hybrid (chosen)** |
|---|---|---|---|
| Form | Symmetric U, flat stems | Round terminals, raised right dot | A's construction + square foot |
| Recognisable | Clean but generic | Charming large | **Ownable silhouette** |
| 16 px | Good | Offset dot reads as an error; drifts toward a smiley | **Good: the square foot survives** |
| German association | Generic Ü | Generic Ü | **ü skeleton, German type lineage** |
| Animation | Good | Good | **Good: same dot rest positions as A** |

### 2.2 Construction (64-unit grid)

- Stroke **12**. Bowl centred at (32, 38): outer radius **24**, inner **12**.
- Left stem x 8–20, right stem x 44–56, both starting at y 22. The right stem continues to the baseline
  (y 62) and closes with a **square foot** from x 32 to 56.
- Dots: circles of radius **6** (one stroke wide) at (14, 10) and (50, 10), centred over the stems,
  one stroke-width above them.
- Path: `M8 22H20V38A12 12 0 0 0 44 38V22H56V62H32A24 24 0 0 1 8 38Z`
  (`LOGO_U` in `shell/Brand.tsx`; the same constants are in `brand/build.py`).

### 2.3 Usage rules

- The mark works **without gradients, glows or lighting**. Never add bevels, 3D, shadows or gradient
  fills to the mark itself.
- Colourways: **on dark:** off-white Ü, crimson + gold dots (primary). **On light:** obsidian Ü,
  crimson + deep gold `#B0821F` dots (muted gold vanishes on paper). **Mono:** one colour for all three
  shapes (`logomark-mono.svg` uses `currentColor`).
- The crimson dot is always left and the gold dot always right at rest. Only motion moves them.
- Clear space: one stroke (12 units) on every side. Minimum size: 16 px (mark), 96 px wide (lockup).
- Don't recolour the Ü red or gold, swap the dots, rotate, stretch, outline, or set the mark inside text.
- In the app, the mark is decorative (`aria-hidden`) unless it stands alone, when it takes `title`.

### 2.4 Wordmark

**"Deutsch"** Bricolage Grotesque **700** + **"Lab"** Bricolage **300**, tracking −0.03 em, one colour.
Weight contrast instead of colour: crimson "Lab" measured 3.1:1 (illegible at rail size) and sat beside
the crimson dot; gold "Lab" competed with the gold dot. With the wordmark in one colour, the dots carry
all the brand colour and the lockup works in mono.

Lockup: mark left, text right, sharing the baseline of the Ü's foot; cap height ≈ the Ü's height; gap
≈ 1 stroke. In the app: `Wordmark` (`shell/Brand.tsx`, live text from the bundled font). Exported:
`brand/wordmark-lockup.svg` / `-light.svg` (glyphs converted to outlines, no font needed).

### 2.5 App icon

`brand/app-icon.svg` → `npx tauri icon brand/app-icon.svg` (then delete the generated `android/`,
`ios/` and `64x64.png`, which the macOS app doesn't use). macOS grid: an 824 px body inset 100 px in a
1024 canvas, radius 185; near-flat obsidian (`#1C1817` → `#090909`), a 6% light hairline edge; the
mark at 56% of the body height, centred optically. No internal detail, no lighting: the silhouette has to
read at 16 px. The previous default Tauri icons are kept in `brand/icon-backup-tauri-default/`.

### 2.6 Asset files (`brand/`)

| File | Use |
|---|---|
| `logomark.svg` | Primary mark, for dark backgrounds (also `public/logomark.svg`, the favicon) |
| `logomark-mono.svg` | One colour (`currentColor`) |
| `logomark-on-dark.svg` / `logomark-on-light.svg` | Mark on an obsidian / paper tile |
| `wordmark-lockup.svg` / `wordmark-lockup-light.svg` | Full lockup |
| `app-icon.svg` | Source for every platform icon |
| `explorations/`, `gallery.html`, `assets.html`, `screenshots/` | Exploration record and previews |
| `build.py` | Regenerates every SVG from the constants (fontTools + HarfBuzz; see its header) |

## 3. Colour

### 3.1 Roles: three that never swap

| Role | Colour | Used for | Never for |
|---|---|---|---|
| **Action and progress** | Crimson `accent` | Primary buttons, selected controls, the nav marker, progress fills, the "done" segment | Body text, error states, decoration |
| **Now and attention** | Gold `highlight` | The current position (chart mark, month, week number), German articles, kinetic emphasis, unresolved/due counts, the focus ring | Large fills, backgrounds, buttons |
| **Data** | Stone `fg-3` | Chart bars, axis text, metadata | Emphasis |

**Red text is reserved for errors.** Brand crimson only appears as a fill, a rule or a mark; error is a
light salmon text on a dark tint. Red and gold never compete: one crimson action per view, gold only
where something is "now".

### 3.2 Palette (semantic tokens)

| Token (Tailwind name) | Hex | Use |
|---|---|---|
| `canvas` | `#090909` | Obsidian: app background |
| `elevated` | `#161414` | Charcoal: cards, inputs, the rail |
| `surface` / `surface-hover` | `#1E1B1A` / `#282423` | Tracks, quiet fills, hover |
| `line` / `line-strong` | `#2D2827` / `#4A4341` | Hairlines / rules and outlines |
| `fg` / `fg-2` / `fg-3` | `#F5F1EA` / `#B8B0A6` / `#978F86` | Warm off-white text, secondary, stone |
| `accent` (+ `-hover` / `-active`) | `#B52532` (`#C42F3D` / `#9C1F2B`) | Crimson fill |
| `progress` | `#CC3644` | Crimson for progress marks: lesson bars, done segments, the nav marker (≥ 3:1 on every surface) |
| `on-accent` | `#F5F1EA` | Text on crimson |
| `highlight` / `on-highlight` | `#D6A437` / `#090909` | Gold ink |
| `focus` | `#E6BE5A` | 2 px focus ring |
| `oxblood` · `crimson` · `gold` | `#751B25` · `#B52532` · `#D6A437` | Brand primitives: the mark, light, gradients |
| `success` / `-soft` | `#74D9A8` / `#0E2419` | Correct answers, completed weeks |
| `error` / `-soft` | `#FF9C94` / `#2B1311` | Wrong answers, failures |
| `warning` / `-soft` | `#EFA35C` / `#2A1B0D` | Caution (orange-amber, kept clear of gold) |

Distribution: **75–80%** obsidian and charcoal, the rest warm neutrals; crimson and gold together stay
under ~5% of any screen. Oxblood appears only as light (atmosphere, glows, the luminous border's fade).

### 3.3 Contrast (measured, WCAG 2.x)

| Text | on canvas | on elevated | on surface |
|---|---|---|---|
| `fg` | 17.7 | 16.3 | 15.2 |
| `fg-2` | 9.3 | 8.6 | 8.0 |
| `fg-3` | 6.2 | 5.8 | 5.4 |
| `highlight` (gold) | 8.7 | 8.1 | 7.5 |
| `focus` | 11.3 | 10.4 | 9.7 |
| `crimson` (marks only) | 3.1 | 2.9 | 2.7 |

`on-accent` on crimson: 5.7:1 (4.9 hover, 7.1 active). Success on its tint 9.5, error 8.7, warning 8.0.
Crimson is never text. Button crimson (`accent`) is a fill behind text; **progress indicators use
`progress` (`#CC3644`)**: 4.0 canvas, 3.7 elevated, 3.4 surface, 3.1 surface-hover, so every progress mark
meets 3:1 on its own. Chart data uses stone and gold, both ≥ 5:1.

### 3.4 Compatibility layer for v1.0 lesson markup

The lessons were written with Tailwind's light utilities. `@theme` remaps those scales so the same markup
renders in Schwarzrot:

| Legacy utility | Becomes | Effect |
|---|---|---|
| `bg-white` | `#161414` | Cards render as charcoal surfaces |
| `text-white` (only ever on primary buttons) | `on-accent` | Off-white on crimson. An unlayered `.text-white` rule in `index.css` re-points it, because `white` itself is the card colour |
| `black/5`, `black/10` | light ink at 5 / 10% | Faint light hairlines |
| `neutral-50 … 200` | dark fills and lines | Quiet surfaces |
| `neutral-400 … 700` | stone → light text | AA text on dark |
| `neutral-800` / `neutral-900` | crimson hover / crimson | `bg-neutral-900` primary buttons and progress bars turn crimson |
| `red-*`, `emerald-*`, `amber-*` | dark error / success / warning tints | Feedback keeps its meaning (legacy error text 7.9:1) |

**New code uses the semantic tokens** (`bg-elevated`, `text-fg-2`, `bg-accent text-on-accent`,
`text-highlight`), never the legacy names. Don't use `text-neutral-900` for text: it is crimson in this
layer.

## 4. Surface hierarchy

1. `canvas`: the room. Every page sits on it.
2. `elevated`: things you act on as a unit (a question, the next activity, a form, an input).
3. `surface`: tracks, quiet fills, selected or hovered rows.
4. `nc-luminous`: a 1 px border lit from one corner (crimson → oxblood → line). **One per screen at
   most**: Home's next activity or the "done for today" block.
5. Overlays: the opening sequence and completion moments (`canvas` at 84–95%).

No glassmorphism. One backdrop blur exists: the sticky top bar and lesson header.

## 5. Typography

| Family | Role | Use for | Never for |
|---|---|---|---|
| **Bricolage Grotesque** (`font-display`, 200–800) | Display, wordmark | Greetings, page titles, week numerals, statistics, milestones, vocabulary headwords, the wordmark | Body, buttons, instructions |
| **DM Sans** (`font-sans`, default) | Interface | Navigation, lessons, tables, instructions, forms, buttons, reading passages | Large display |
| **Instrument Serif** (`font-serif`, italic) | Editorial accent | The week's German phrase on Home, English glosses in moments, "Richtig" / "Fast" in feedback | UI chrome, numbers, long text |

The typography system is unchanged by Schwarzrot. The wordmark's weight contrast (§2.4) is the only new
typographic device. Bundled locally (`src/assets/fonts`, SIL OFL 1.1), Latin + Latin Extended, so
`ä ö ü ß Ä Ö Ü` render in every face.

**Scale.** Display tokens: `text-display-xl` 80/0.92, `text-display-lg` 56/0.98, `text-display-md`
40/1.02, `text-display-sm` 28/1.1, `text-stat` 36/1. Home week numeral: Bricolage 200 at 9.5 rem, in
`fg` (the crimson on Home belongs to the primary action).

Rules: display tracking −0.02 em or tighter; light weights only at numeral sizes; the kicker is
`text-[11px] uppercase tracking-[0.12em] text-fg-3`; data uses `.tabular`; German quotations use „…“;
reading measure `max-w-reading`; `h1–h3` hyphenate; at most two families per component.

## 6. Grid, spacing and layout

- 4 px spacing scale; common steps 2, 3, 4, 6, 8, 10, 12. Sections are separated by a hairline and
  `mt-10 md:mt-12`.
- Page frame: `max-w-page` (72 rem), gutters `px-5` / `md:px-10`.
- Home: full-bleed hero, then a 12-column grid with an asymmetric 7/5 split (`lg`).
- **Grid columns that hold truncating text use `minmax(0,1fr)`, never `1fr`.**
- Rules over cards: a group opens with `border-t border-line` and a kicker.
- Radii: `sm` 4, `md` 6, `lg` 8. `md` for controls, `lg` for containers, `rounded-full` only for chips,
  tracks and dots.

## 7. Component patterns

- **Shell** (`shell/AppShell.tsx`): from 960 px a left rail with the wordmark, six numbered destinations
  and the current week; below 960 px a sticky top bar. The active item has a `surface` fill and a solid
  2 px **crimson** bar (rail) or crimson underline (top bar), springing between items (Motion
  `layoutId`). No glow.
- **Wordmark / Logomark** (`shell/Brand.tsx`): see §2. `Logomark` takes `state` (`idle`, `loading`,
  `success`) and `mono`.
- **Next activity** (Home): `nc-luminous` block, "01" in gold, title in display, and the only crimson
  button on the screen ("Continue learning"); on hover a faint crimson shadow.
- **Buttons**: primary `bg-accent text-on-accent hover:bg-accent-hover`; secondary
  `border border-line-strong bg-elevated hover:border-accent`; tertiary underlined text. All take
  `.dl-press`. Disabled: 30–40% opacity and `cursor-not-allowed`.
- **Chips**: Completed (week checkpoint passed; "completed", not "mastered": one checkpoint is
  evidence of completion, not of mastery) `bg-success-soft text-success`; **Current** gold outline
  `text-highlight ring-1 ring-highlight/60`; Planned `ring-1 ring-line text-fg-3`; Unresolved
  `text-highlight ring-highlight/60`. No filled crimson badges: they read as alerts.
- **Course timeline**: a gold dot for the current month (a soft gold halo, no glow), light dots for
  built months, hollow for planned; the current week has a crimson edge rule and a gold week number.
- **Loading**: see §12.1.

## 8. Gradients

Gradients are **light, not decoration**. Allowed:
- radial crimson/oxblood light in the atmosphere, the opening and milestones (gold only as a faint trace);
- the 1 px luminous border (`nc-luminous`);
- the crimson → gold hairline under the opening wordmark and milestones;
- the per-letter crimson → gold ramp on "geschafft." in the October moment.

Not allowed: red-and-gold gradients on surfaces, gradient buttons, gradient text on headings or metrics,
gradients in the mark, rainbow or rotating gradients.

## 9. Lighting effects

`<Atmosphere>` (`shell/Atmosphere.tsx`, `.nc-atmosphere`): a low crimson light top right
(`.nc-light--crimson`), a trace of gold beside it at 7% (`.nc-light--gold`), a faint oxblood light bottom
left, and a static film grain at 3.5%, in a `contain: strict` box. Fades up once; leans a few pixels toward
a fine pointer (transform only, one update per frame); off under reduced motion and coarse pointers.
**Home only.**

## 10. Opening sequence (StartupLoader)

`shell/Intro.tsx` (exported as `Intro` and `StartupLoader`), styles under "opening sequence" in
`index.css`. It is an **overlay, not a splash window**: the app renders underneath immediately, so no
extra native window or IPC is needed.

0. **No white flash.** `index.html` paints `#090909` inline before any JS/CSS; the native window has
   `backgroundColor: #090909` and `theme: Dark`.
1. **Emergence (0–260 ms).** Two points of light, crimson and gold, appear inside the Ü's counter.
2. **Movement (200–960 ms).** Each rises and travels outward to its stem: x eases in-out, y rises on a
   spring, so the path curves (crimson leads, gold follows 60 ms behind).
3. **Formation (360–1100 ms).** The bowl draws along its centreline (a 12-unit stroke is exactly the
   glyph's round part); the square foot is then set like a block.
4. **Identity (600–1340 ms).** The dots settle; "DeutschLab" rises letter by letter from behind its
   baseline; a crimson → gold hairline draws.
5. **Transition.** The stage splits along its centre line (640 ms, expo in-out) onto Home, which is
   already rendered.

**Readiness rules.**
- The overlay stops taking pointer events **the instant data is ready** (`data-ready`).
- Ready **during** the sequence: the choreography plays to its end (`FULL_MS`, ~1.35 s: the minimum
  visible opening), then exits. No fast-forward. Initialisation is never delayed: the app is rendered
  underneath and takes input from the moment its data is ready.
- Ready **after** ~1.35 s: exits at once. While waiting, the dots fall into the loading loop (§11.1);
  after 1.6 s it says "Opening your study data…". No percentages.
- Failure: exits at once and the existing error alert with "Try again" shows.
- Once per launch; a same-session reload gets only the reveal. `aria-hidden` (the app's `BrandLoader`
  status and alert carry the state); never holds focus. Under reduced motion it shows the finished mark
  and leaves as soon as the app is ready.

## 11. Motion

| Token | Value | Use |
|---|---|---|
| `--duration-press` | 140 ms | Button press scale |
| `--duration-base` | 220 ms | Hover, colour, collapse, nav |
| `--duration-feedback` | 320 ms | Correct-answer spring |
| `--duration-page` | 300 ms | Page entrance |
| `--duration-chart` | 450 ms | Chart marks growing in |
| `--duration-reveal` | 520 ms | Kinetic words |
| `--ease-out-quint` | cubic-bezier(.22,1,.36,1) | Entrances |
| `--ease-standard` | cubic-bezier(.2,.7,.2,1) | Colour and small moves |
| `--ease-in-out-expo` | cubic-bezier(.87,0,.13,1) | The opening split |
| `--ease-spring` | CSS `linear()` spring, ≈ 3% overshoot | Feedback, letters, dots settling |

### 11.1 The dot language (brand motion)

The two umlaut dots are DeutschLab's motion identity. One loop, used by every loader:
**the dots leave alignment, crimson arcs over while gold dips under, they trade places, hold, and come
back** (1.8 s, ~15% holds at each rest so it reads as intention, not a spinner). Each dot rides two
nested transforms (x eased in-out, y eased out then in), giving a true curve without `offset-path`.
`--span`, `--lift` and `--dip` scale it from the 64-unit mark down to button text.

| State | Mark behaviour |
|---|---|
| Idle | Static |
| Loading | The loop (on the mark, gold dips into the Ü's open counter) |
| Success | The dots drop 7 units and settle once on the spring (week/October moments, lesson completion) |

Not allowed: bouncing, squash and stretch, eyes or expressions, particles, continuous glows.

### 11.2 Technology

Brand motion, the opening and loaders are **CSS keyframes** (transform and opacity only): they must run
in the first frames, before the lazily loaded Motion features arrive, and CSS honours the reduced-motion
override for free. Motion for React (`motion/react`, `LazyMotion` + async features,
`reducedMotion="user"`) remains only for layout animation: the nav indicator and kinetic sentences. No
GSAP, Rive or Lottie.

Technical rules: animate `transform` and `opacity` (plus `grid-template-rows` for collapse); infinite loops
only on loaders, which unmount when work ends; one overlay at a time; animations never delay input or
saving.

## 12. Microinteraction states and answer feedback

| State | Treatment |
|---|---|
| Press | `.dl-press`: scale 0.98 for 140 ms |
| Hover | Colour shift 220 ms (gold ink or crimson border), arrow nudges 2 px |
| Focus | 2 px gold `focus` outline, 2 px offset |
| Selected | Crimson fill or outline (`aria-pressed` / `aria-checked` / `aria-current` always set) |
| **Correct** | `.dl-correct`: a 1.2% spring scale and a **green** ring that fades (320 ms); the check draws itself; success tint; "Correct." with *Richtig* |
| **Not quite** | `.dl-wrong`: a 4 → 3 → 1 px sideways nudge (300 ms), salmon on a dark tint; the answer and the explanation, with *Fast* |
| Feedback panel | `.dl-feedback` rises 4 px into place (220 ms), `aria-live="polite"` |
| Lesson progress | `ProgressBar`: a crimson line that springs forward by `scaleX` (480 ms) |

Correctness is a semantic state, so its ring is green, not a brand colour.

### 12.1 Loading components (`shell/Loaders.tsx`)

| Component | Looks like | Use for | Examples in the app |
|---|---|---|---|
| `StartupLoader` | The opening sequence | App launch | `Intro.tsx` |
| `BrandLoader` | The mark in its loading state + a sentence | A whole view with nothing to show yet | App-level "Opening DeutschLab…" |
| `SectionLoader` | 8 px dots + a sentence | One region of a page | Progress records, the writing draft |
| `InlineLoader` | Text-size dots inside a line | A short wait inside text | Practice "Needs attention", checkpoint and comprehension saving |
| `ButtonLoader` | Single-colour dots beside the button's busy label | A button doing work | Export backup, Save snapshot, Start Review ("Preparing" a 10 k-item queue) |

Rules:
- **No flash.** Loaders appear only after `LOADER_DELAY_MS` (300 ms; 150 ms in buttons) and fade in;
  quick work shows nothing.
- **Words always.** Every loader is `role="status"` with a sentence (present for screen readers from the
  first frame); `ButtonLoader` is `aria-hidden` and relies on the button's own label (`aria-busy` set).
- **Keep content.** Don't replace visible content with a loader. Where layout matters, show the real
  layout with placeholders (Review shows its stat rules with "–" until counts arrive).
- **Fit the context.** Never a large mark for a small button; never a loader for instant work (answer
  saving in lessons keeps its plain "Saving…" label).

## 13. Completion celebrations

Moments appear **only after `markTaskComplete` has succeeded** and **only the first time**
(`lib/celebration.ts`, `celebrate/Celebration.tsx`).

| Achievement | Moment | Length | Dismissal |
|---|---|---|---|
| Answer | `.dl-correct` spring and drawn check | ~0.3 s | n/a |
| Lesson | The mark's dots settle (success); "Geschafft!" / "Sehr gut!" / "Weiter so!" rises over a low crimson light; the week's real progress line moves | 2 s, then leaves by itself | Click, Escape or Enter |
| Week completed | The mark settles, "Woche N" / "geschafft." (gold), a crimson → gold line draws, then results | ~1.8 s to results, then waits | "Weiter", Escape |
| October Foundations | Larger crimson light with a trace of gold, "Oktober" / "geschafft." with a crimson → gold letter ramp, then results and the note that this is **not a CEFR certificate** | ~2.3 s to results, then waits | "Weiter", Escape |

The lesson level is a `role="status"` announcement; week and October are labelled dialogs that focus
"Weiter". Under reduced motion every level shows its final state at once.

## 14. Vocabulary typography and educational motion

- **Headwords** (`vocabulary/GermanWord.tsx`): the article is set in **gold** (`der Tisch`); letters
  rise in 22 ms apart on a spring. A screen-reader copy keeps the word whole.
- **Plural shift**: the article change and the changed part of the noun are marked in gold, and the mark
  glows once (gold 40% → 14%).
- **Kinetic sentences** (`lesson/KineticSentence.tsx`): emphasised parts are gold with a gold/15 fill;
  learner-triggered, captioned, never autoplay. Current demonstrations: grammar-010 (verb in position
  2), grammar-007 (accusative article).

## 15. Chart conventions

Hand-built SVG/HTML in `charts/Charts.tsx`, no chart library.
- **Stone for data, gold for now**: bars are `fg-3` (6.2:1, `fg-2` on hover); the current bar is gold
  with a gold dot under its label. No glows. Bars ≤ 12 px with rounded tops.
- Segment meters: completed = `progress` crimson, current = gold outline on a gold/25 fill, upcoming =
  `surface` with a `line-strong` outline, with a visible legend (Completed · Current · Upcoming).
- Zero baselines, round maxima, dashed `line` gridlines, `fg-3` 11 px tabular axis text.
- Each chart is a `figure` with a kicker, a one-line description, an empty state (optionally an honest
  scaffold via `emptyHint`, e.g. Home's seven day labels with no values) and a visually hidden data table; marks are focusable with tooltips. Data is persisted, never mocked.

## 16. Accessibility

- Landmarks: one `nav[aria-label=Main]`, one `main`, labelled sections.
- Keyboard: every action reachable with Tab, visible gold focus everywhere, no traps.
- Contrast per §3.3; meaningful non-text marks ≥ 3:1 or backed by text.
- Feedback states the answer in words; colour and motion are never the only signal (red text means
  error, but the words "Not quite" always say so).
- Live regions: answer feedback, kinetic captions, lesson completion and loaders are polite statuses.
- Decorative layers (atmosphere, intro, the mark, letter copies, loader dots) are `aria-hidden`.
- **Reduced motion**: CSS sets every animation and transition to ~0 ms, so the mark, the intro and every
  moment show their final state; **loaders switch from travelling dots to dots that breathe in opacity**
  (1.8 s), so waiting is still visible without movement; Motion uses `reducedMotion="user"`.
- Text scaling: rem units, wrapping layouts, no fixed-height text boxes.

## 17. Responsiveness

Native window 1200 × 820 by default, **760 × 560 minimum**. Below 960 px the rail becomes a top bar;
below `lg` (1024) Home stacks and hides the week numeral. The opening scales with the viewport (mark
6.25 rem, wordmark `clamp(2.25rem, 5vw, 3.75rem)`).

## 18. Performance

- Brand motion is CSS transforms on a handful of SVG groups; the opening adds no JS animation frames and
  no new dependency. `brand/build.py` is a design-time tool, not shipped.
- Loader loops run only while mounted and only after their delay.
- The atmosphere uses gradients, not blur; no WebGL, canvas, video, chart or UI-kit libraries.
- Design never adds SQL queries.

## 19. Offline

Fonts, icons, the mark, gradients, grain and motion are all local. The opening and celebrations never
wait on a network.

## 20. Governance for future features

1. Decide the energy level first (§1) and stay inside it.
2. Use semantic tokens; add a token here before adding a colour, radius or duration.
3. Respect the colour roles (§3.1): one crimson action per view, gold only for "now", red text only for
   errors; one `nc-luminous` block at most.
4. New feedback reuses `.dl-correct`, `.dl-wrong`, `.dl-feedback`, `.dl-check`; new waits reuse the
   loaders in §12.1; the dots move only in the ways listed in §11.1.
5. New milestones reuse `Celebration`; add a level only for a genuinely larger achievement.
6. Charts follow §15; never show estimates as measurements.
7. Verify at 760 px and under reduced motion, add a test for new behaviour, and update this file in the
   same change.

### Research notes (design references)

External galleries (Awwwards, Godly, Recent) were not browsed live for this sprint; the principles below
come from the brief and established practice, and no identity, layout or animation was copied.

- **Bauhaus and Swiss/German typography**: construction from circle and square; geometric sans
  skeletons (the Futura ü) for the mark; weight contrast rather than colour in the wordmark; asymmetric
  grids, hairlines and numerals as composition.
- **Contemporary German graphic design**: black-dominant, restrained palettes where one strong colour
  does the work; red as structure (rules, actions) rather than decoration.
- **Studio preloaders**: a short typographic opening that hands off to the page along a line or split,
  the identity constructed rather than faded in, and never a fake progress bar.

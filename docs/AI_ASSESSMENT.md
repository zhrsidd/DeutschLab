# DeutschLab AI assessment (v1.1)

AI feedback is **formative and advisory**. The deterministic lessons, self-checks and checkpoints stay
authoritative. AI results are stored only in `ai_assessments` and never change lesson attempts,
completion, checkpoint attempts, mastery, mistakes or Review items.

## Rubric (`dl-rubric-1`): DeutschLab practice marks, not a CEFR grade

| Category | 0–5 |
|---|---|
| Grammar accuracy | 5 no errors in taught grammar · 4 one or two slips · 3 several errors, meaning clear · 2 frequent, meaning sometimes unclear · 1 very little control · 0 nothing assessable |
| Vocabulary | 5 varied and accurate for the taught topics · 3 basic but adequate · 1 isolated words |
| Task completion | 5 full answer, cues covered, near the length target · 3 partly / clearly short · 1 barely related |
| Coherence and sentence structure | 5 complete sentences, sensible order, simple linking · 3 understandable with fragments · 1 disconnected words |

Total /20 is **computed locally** from the four category scores; a model-supplied total is ignored.
Scores are judged against what the learner has been taught (curriculum context), not native writing.

## Corrections

Each correction has original text, suggestion, explanation, grammar concept, category and severity:

- category `grammar`, `spelling`, `word_order`: objectively incorrect;
- `word_choice`: understandable but wrong or unnatural;
- `style`: optional improvement to correct text (severity `suggestion`, shown as "Optional");
- severity `error`, `minor` ("Small slip"), `suggestion`.

The prompt tells the examiner that valid alternatives (time word first + V2, different correct words,
short sentences, correct use of untaught grammar) are not mistakes, and to leave the list empty when
there is nothing wrong.

## Validation (`lib/ai/schemas.ts`)

Gemini returns JSON constrained by a schema; DeutschLab still treats it as untrusted:

- category scores must be integers 0–5 (otherwise the whole answer is rejected, nothing is saved);
- **a correction whose `original` does not appear in the learner's text is removed** (normalised for
  case, spacing, quotes and trailing punctuation) and the learner is told; no-op corrections are dropped;
- recommended lessons must exist in the task registry and be in the learner's scope;
- statements about CEFR levels or certificates are removed;
- for speaking, any comment on pronunciation, accent or intonation is removed;
- text lengths are bounded; everything is rendered as plain React text, never HTML.

## Speaking and pronunciation

Speaking feedback assesses a **transcript** with the same four categories. The examiner is told it
cannot hear audio, that punctuation came from the transcriber, that fillers are normal, and to put
suspected mishearings in uncertainty notes. The UI always shows **"Pronunciation not formally
assessed."** No pronunciation score exists in the schema, the validator, the database or the UI.
The transcript is labelled as model transcript, edited by the learner (the original is kept and shown)
or typed; an edited transcript is never presented as evidence of pronunciation.

## Evaluation set (`lib/ai/evaluation.ts`)

27 hand-checked A1 examples (25 writing, 2 speaking): correct texts, article gender, accusative
(including feminine/neuter traps where nothing should change), conjugation and stem changes, V2 and
question order, nicht vs kein (errors and correct uses), valid alternatives (time-first V2, correct
untaught dative), unnatural but understandable text, a far-too-short answer, English sentences and
words, ambiguous `sie`, capitalisation/umlaut, and a filler-laden transcript. **13 cases contain no
error**: any error-level correction on them is a failure.

- Deterministic (every test run): the set's integrity, the scorer, and that a fabricated correction
  is removed from every error-free case (`evaluation.test.ts`, `schemas.test.ts`).
- Live (opt-in, never in CI): `DEUTSCHLAB_LIVE_EVAL=1 GEMINI_API_KEY=… npx vitest run
  src/lib/ai/liveEval.test.ts` runs all cases against a model and reports pass/fail per case
  (missed errors, false corrections, low grammar for error-free text, task completion bounds).
  It uses about 27 requests on your own key.

**Status:** the live evaluation has **not been run** for v1.1 (it needs your key and permission).
Model quality is therefore unverified; treat feedback as a second opinion until it has been run.

## Known weaknesses

- The validator can remove invented quotes but cannot detect a false correction of text that really
  is in the learner's work; only the live evaluation measures that.
- Severity and category are the model's judgement; borderline cases (e.g. `Ich bin 15 Jahre`) vary.
- Rubric marks are not calibrated against a human examiner yet.
- Transcription accuracy for accented beginner German is unmeasured; the learner can correct it.

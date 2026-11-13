# Restructuring German teaching in DeutschLab

Research date: 13 November 2026. Status: recommendation for review, not an implemented curriculum revision.
Companion: [implementation plan](../superpowers/plans/2026-11-13-modular-german-teaching.md), [skills guide](SKILLS.md).

## Recommendation

Make the unit of teaching a reusable, observable language ability, rather than a fixed lesson followed by a fixed array of questions. Keep the current reviewed material, offline execution, stable IDs, checkpoints and review scheduler. Recompose these assets into short modules that connect meaning, explanation, supported practice, independent production and delayed transfer.

Example: “I can say what I have and do not have” combines a familiar scene, noun gender, accusative articles, haben and negation. It is more useful than an endless sequence of article gaps, but the gaps remain valuable as one practice mode.

Do not replace the course with unrestricted AI conversation or randomly generated sentences. Modular teaching needs a controlled curriculum, trustworthy feedback and an explicit record of what a response actually demonstrates. AI can assist authors and offer optional formative feedback; it should not become the course's examiner or prerequisite engine.

## Scope and research method

This is a targeted evidence review and code audit, not a systematic review or a trial of DeutschLab. Search focused on second-language spacing, feedback, explicit instruction, task-based learning, CEFR guidance and reusable agent skills. Priority went to research syntheses, an app-based experiment and official language frameworks. Publisher abstracts and publicly available text were inspected; no claim is made to have reviewed all underlying studies.

Recommendations are divided into established principles, reasonable applications and product hypotheses. Most studies are not specifically about German, this learner or this desktop app. There is no empirical basis here for promising a particular CEFR gain, a universal optimal session length or the effectiveness of the complete proposed architecture.

The repo targets a Year 12 student studying several demanding subjects: 4.5–6 hours per normal school week, strong A1 by January 2027 and eventual academic German for Physics at ETH Zürich. The later goal needs periodic independent reassessment. A dated roadmap is an aspiration, not proof of proficiency or verification of university entry requirements.

## What the repo actually does

Audit baseline: the checkout's existing Weeks 1–4 implementation. These are source observations, not native macOS runtime verification.

| Evidence | Current strength | Limitation / restructuring opportunity |
|---|---|---|
| CURRICULUM.md §§2, 5 and Weeks 1–4 | Sustainable workload; teach → contextualise → recall → assess → review; production already intended | Calendar weeks still organise progression; represent prerequisites and communicative outcomes explicitly without silently changing the sequence |
| src/data/lessons/grammarCourseTypes.ts | TeachingPage/TeachingBlock separate content from presentation; choice, fill, typed and reorder are supported | GrammarCourse owns pages and a fixed questions array; concepts are comparatively broad |
| src/components/grammar/GrammarCourseLesson.tsx | Shared renderer, attempt persistence and explicit teaching | Intro → all teaching pages → fixed practice → results; 80% lesson threshold; subsequent question is index + 1 |
| src/data/lessons/week3Accusative.ts | Reviewed explanations, stable item IDs, carefully bounded scope | Role recognition and article transformations exist, but fixed items can become memorised; split role, gender and case evidence |
| src/data/reviewTypes.ts; src/lib/reviewExercises.ts | Structured review reconstruction and typed recall; not merely passive flashcards | Review evidence tracks source items and broad concepts; this is not yet a general model of transferable ability |
| src/lib/reviewScheduler.ts | Predictable offline spacing, explicit failure reset | Current ladder is a design choice, not a research-proven optimum; retain it during the pilot |
| src/lib/dailyPlanner.ts | Deterministic, budgeted reviews → weakness → unfinished lessons; 15/30/45/60 minute options | Weakness can route back to a whole lesson; shorter targeted modules could reduce unnecessary repetition |
| src/lib/db.ts | Attempts, mistakes, review history, writing drafts, checkpoints and backup support | New evidence must be additive; historical completion cannot be reinterpreted as new skill mastery |
| docs/AI_ASSESSMENT.md | Advisory-only feedback, validated structure, no CEFR or pronunciation claims | Live model evaluation and human calibration remain unverified; do not make this the new grading authority |

DeutschLab is therefore not simply a multiple-choice app. The useful change is composability and instructional response, building on existing recall and assessment work.

## Evidence and what it means here

| Principle | Evidence and confidence | Application | Limit |
|---|---|---|---|
| Space practice across days | Kim & Webb (2022), 48 experiments / 3,411 participants [S1]; relatively strong L2 synthesis | Revisit abilities through existing SRS; include changed contexts later | Equal and expanding schedules were statistically comparable; evidence does not select DeutschLab's exact intervals |
| Retrieve, then receive useful correction | Belardi et al. (2021), app experiment with 79 participants [S2] | Require an attempt before revealing the model; explain the relevant error and offer repair | Vocabulary experiment; its reported gain is not a prediction for this app or conversational proficiency |
| Give focused explicit instruction | Thirty-five-year form-focused instruction synthesis [S3]; explicit instruction synthesis [S4] | Short rule, contrasting examples, then use in context; retain grammar explanations | Test format and instructional target influence results; rule-test performance is not spontaneous speech |
| Organise around meaningful action | Council of Europe CEFR classroom guidance and Companion Volume [S5, S6] | Define observable can-do outcomes; include reception, production, interaction and mediation | Normative framework, not an experiment proving this product design; task completion is not CEFR certification |
| Use feedback to change the next teaching move | L2 corrective-feedback synthesis [S7], plus formative-loop design principles | Distinguish known error patterns, supply relevant help, then use a different item | A single incorrect response cannot reliably diagnose a misconception |
| Use tasks alongside focused practice | TBLT implementation synthesis [S8], with methodological challenge [S9] | Rehearse everyday communication and assess novel transfer | Definitions and comparators vary; do not claim TBLT universally outperforms every alternative |
| Fade support as competence develops | General instructional-design rationale; installed cognitive-load skill, not German-specific outcome evidence | Model → partially supported sentence → independent production | This particular sequence, duration and branching policy require a pilot |

There is no single ideal method. A defensible blend is meaningful input, explicit attention to selected form, supported output, feedback, retrieval, spaced reuse and transfer. Avoid “learning styles” matching, punitive timers, streaks as learning evidence and exposure counts as vocabulary mastery.

## German-specific teaching design

### Vocabulary: learn usable entries

A noun entry needs article, singular, plural, meaning, audio source and a short useful context. Learn “der Tisch – die Tische” with “Ich habe einen Tisch”, rather than “Tisch = table” alone. Score meaning, gender, plural and contextual use separately. One correct translation cannot establish all four.

Verbs need useful argument patterns and taught forms: haben + accusative, then later the structures authorised by the curriculum. Tag lexical items with earliest permitted module and verified forms. Use standard German as the core target; introduce Swiss usage as labelled variants when relevant to the later goal, without demanding dialect imitation.

### Grammar: contrast meaning and form

For accusative, establish who does what and identify the object before requiring article change. Contrast masculine with feminine/neuter examples where the article does not change. Separate “wrong noun gender” from “knows gender but used nominative for the object”.

Teach V2 as the finite verb in the second constituent, not “the second word”. Contrast “Ich lerne heute Deutsch” with “Heute lerne ich Deutsch” only in authorised scope. Treat accepted word orders as legitimate alternatives, not errors.

Do not mechanically swap any noun into any template. Gender, number, verb valency, morphology, meaning and prior vocabulary constrain combinations. A small reviewed set of valid combinations is preferable to a large unreliable generator.

### Listening and reading

Give a reason to understand: identify what someone owns, choose the relevant message, retrieve a detail, or summarise a simple meaning. For listening, attempt gist first, replay for detail, then reveal transcript/translation on request; record whether support was used. Replays are a support signal, not an automatic failure.

Keep audio replayable and retain a static explanation for motion-based examples. Verify installed German speech availability and provide an honest fallback. Synthetic audio is useful but should not be the sole evidence of understanding natural speech. Add human-recorded or appropriately licensed authentic excerpts as the course develops; do not copy Goethe/DW assets without permission.

### Speaking, writing and interaction

Use a progression from substitution in a model to a short personal response and a changed situation. Speaking should include listening and responding, not just timed monologues. Provide local scripts, branching dialogue cards and record/playback self-checks without requiring cloud AI.

A guided writing task might ask for three true statements about possessions. Show success criteria before the attempt, a model afterwards and a revision opportunity. Label self-assessment as self-assessment. Closed exercises may use deterministic grading; unrestricted writing cannot honestly receive exhaustive local correctness grading through answer-string matching.

Pronunciation practice should target intelligibility: relevant vowel contrasts, stress and rhythm, with a listening distinction followed by recording and comparison. A transcript cannot measure those properties. No accent or pronunciation grade should be inferred from transcription.

### Scope and workload

Use existing Weeks 1–4 vocabulary and structures for the first pilot. Do not introduce modals, dative or subordinate clauses just to make a scenario richer. Later academic preparation should gradually add explaining relationships, interpreting diagrams, summarising and seminar interaction once language prerequisites permit.

Keep the current weekly scope as an authoring constraint and a suggested path, not a forced date-based learner label. Propose 8–12 minute modules and shorter repair activities as pilot defaults, not research-established optima. A 30-minute session can contain existing review, one focused module and brief output; a 15-minute busy-day plan should still offer an achievable stopping point.

## Proposed modular model

Separate six concerns, using the existing TypeScript data-driven pattern:

1. **Skill:** observable ability, prerequisites and allowed language. Split receptive and productive evidence.
2. **Teaching asset:** reusable explanation, contrast, audio scene or worked example.
3. **Activity:** task format, stimulus, support, scoring mode and diagnostic tags.
4. **Item family:** reviewed related items with bounded variation and accepted alternatives.
5. **Module recipe:** an objective and sequence/branching rules that assemble assets and activities.
6. **Evidence event:** actual attempt, content version, support used, scoring authority and outcome.

Illustrative recipe, not an enacted curriculum change:

| Stage | Possessions module | Teaching purpose |
|---|---|---|
| Orient | “Say what you have”; use familiar nouns from the current word list | Give meaning and boundaries |
| Notice | Hear/read “Ich habe einen Stift” and “Ich habe eine Tasche” | Connect message to article choice |
| Explain | Identify subject/object; show masculine change and unchanged contrast | Make the pattern visible |
| Guided practice | Complete the article with a gender cue | Isolate case selection |
| Independent practice | Type a whole sentence with a reviewed noun | Remove the scaffold |
| Use | Say/write three true possessions; rubric and model comparison | Personal communicative purpose |
| Transfer | Describe different familiar possessions in a later session | Test reuse beyond memorised wording |

For a closed prompt requiring indefinite article + Stift, “Ich habe ein Stift” warrants an accusative hint. “Ich habe eine Stift” does not uniquely distinguish a gender gap from a case gap: ask a gender probe before selecting remediation. Offer at most two guided repairs before a short worked example and an option to pause. These bounds are product hypotheses to test, not validated learning thresholds.

A correct repaired answer must remain distinct from an unassisted first attempt. In the pilot, use skill evidence for explanations and recommendations only. Keep current completion/mastery rules authoritative. Any future progression policy must distinguish recognition, supported production, independent production and delayed transfer; propose thresholds only after observing pilot evidence.

## Options and tradeoffs

| Option | Benefit | Cost / risk | Judgment |
|---|---|---|---|
| Larger static question banks | Fastest content expansion | Limited change to the teaching flow; more maintenance | Useful supporting work |
| Reusable reviewed modules with bounded variation | Offline, auditable, targeted practice; reuses current investment | Requires content metadata, evidence events and a modest runner | Recommended pilot |
| Open-ended AI-first tutor | Flexible conversation and rich variation | Unreliable grading, cost, privacy, network dependence, curriculum drift | Optional supplement only |

Do not build a full adaptive knowledge-tracing platform before establishing that one modular lesson teaches better. Start with grammar-007 and a small possession scenario, keeping the existing route available.

## Evaluation: learning first

Compare equivalent unfamiliar prompts before instruction, immediately afterwards and after roughly 7 and 21 days. Use separate reviewed item families for teaching and evaluation. Match vocabulary/difficulty; log prior exposure. These dates are pragmatic pilot choices, not alterations to SRS.

Primary evidence: unassisted accuracy on unseen closed transfer items and human-reviewed communicative task quality. Secondary evidence: hint dependence, repeated error patterns, completion/abandonment, learner-rated effort and actual study time. Keep self-checks, AI suggestions and deterministic scores separate.

For this single learner, alternate matched modules or run a small within-person pilot; topic difficulty, practice effects and small samples limit causal claims. Report raw correct/total counts, supports and missing follow-ups. Do not infer statistical superiority from a few attempts or equate increased engagement with proficiency.

For a broader evaluation, predefine an equal-time comparison, delayed outcomes, allocation, attrition reporting and sample-size analysis. Have a qualified German instructor review a sample of acceptable alternatives and free output without seeing the condition.

Ship a pilot only after content review, data-preservation checks and native offline verification. Expand when delayed transfer is at least maintained, support dependence decreases and study remains sustainable. These are decision criteria, not measured results: no learner trial was run for this report.

## Sources and access notes

All links checked/researched 13 November 2026. “Abstract” means the claim relies on the public abstract/record rather than complete appraisal of all methods.

- **S1:** Kim, S. K., & Webb, S. (2022), *The Effects of Spaced Practice on Second Language Learning: A Meta-Analysis*. Language Learning. Publisher abstract inspected. https://doi.org/10.1111/lang.12479
- **S2:** Belardi, A., Pedrett, S., Rothen, N., & Reber, T. (2021), *Spacing, Feedback, and Testing Boost Vocabulary Learning in a Web Application*. Public full text inspected. https://pmc.ncbi.nlm.nih.gov/articles/PMC8638698/
- **S3:** *Thirty-five years of ISLA on form-focused instruction: A meta-analysis*. Public research record/abstract. https://doi.org/10.1177/1362168818776671
- **S4:** *Effects of different forms of explicit instruction on L2 development: A meta-analysis*. Publisher abstract inspected. https://doi.org/10.1111/flan.12726
- **S5:** Council of Europe, *The CEFR in the classroom*. Official guidance inspected. https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-in-the-classroom
- **S6:** Council of Europe (2020), *CEFR Companion Volume*, official publication index. https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions
- **S7:** *The Effectiveness of Corrective Feedback in SLA: A Meta-Analysis*. ERIC search record inspected; direct opening timed out. https://eric.ed.gov/?id=EJ883422
- **S8:** *TBLT implementation and evaluation: A meta-analysis*. Public record/abstract. https://doi.org/10.1177/1362168817744389
- **S9:** *Meta-Analysis to Estimate the Relative Effectiveness of TBLT Programs: Are We There Yet?* ERIC search record inspected; direct opening timed out. Methodological counterpoint, not evidence that tasks are ineffective. https://eric.ed.gov/?id=EJ1500344
- **S10:** Goethe-Institut, CEFR alignment and German levels. Official reference, not a validated grammar-per-week syllabus. https://www.goethe.de/ins/de/en/uun/dln/ger.html

Skill catalogues were used for discovery, not as scientific authority. Skill claims and evidence labels require the same scrutiny as generated advice.

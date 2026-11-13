# Adaptive practice: vary the language and the response

Requirement added 13 November 2026 following the learner's clarification:
“I don’t want the same questions repeated again and again … adapt the questions, form sentences, and ask me to answer … in different ways.”

This is a required behaviour for the planned module runner. The current Course roadmap and module recipes do not implement it yet. Shuffling fixed questions, shuffling answer options or changing a person's name is not sufficient.

## What must vary

Separate the **ability being retrieved** from the **question shown**:

- Skill: selecting an accusative article in a meaningful possession sentence.
- Sentence: subject, taught verb form, appropriate object and coherent context.
- Task: understand meaning, complete a form, produce a sentence, answer a question, ask a question, transform or repair.
- Support: model/cues → limited cue → independent response.
- Context: a personal inventory, another person's belongings, or a short information-gap exchange.

Vary these dimensions deliberately. Keep enough common ground to diagnose learning; do not change subject, vocabulary, grammar, modality and instruction all at once for a struggling beginner.

Closed tasks use local, reviewed morphology and accepted responses. Personal/free responses use explicit criteria and honest self-checks, instructor review or optional advisory AI. Do not claim a finite answer list exhaustively grades arbitrary German.

## Worked example: Week 3 possessions

All examples use previously taught language. These illustrate different task demands, not a list to cycle through indefinitely. Production of negation is reserved for the subsequent negation module; it is not introduced by a random generator before it is taught.

| Way to answer | Example prompt | Expected evidence |
|---|---|---|
| Identify meaning | “Die Lehrerin hat einen Stift.” Which object does she have? | Comprehension, not case production |
| Fill one form | “Ich habe ___ Stift.” Use an indefinite article. | einen |
| Produce a phrase | Give the indefinite direct-object phrase for **der Stift** after haben. | einen Stift |
| Build a sentence | With **ich / haben / ein Stift**, write the possession sentence. | Ich habe einen Stift. |
| Answer a question | “Hast du einen Stift?” Give a positive full-sentence answer. | Ja, ich habe einen Stift. / Ich habe einen Stift. |
| Ask a question | Ask another learner whether they have a book. | Hast du ein Buch? |
| Change the subject | Change “Ich habe eine Tasche.” so that the teacher has the bag instead. | Die Lehrerin hat eine Tasche. / Der Lehrer hat eine Tasche. |
| Find and repair an error | Correct the article in “Ich habe ein Stift.” | Ich habe einen Stift. |
| Make an unchanged-form contrast | Describe owning **eine Tasche** and **ein Buch**, one sentence each. | Feminine/neuter articles remain unchanged |
| Interpret audio | Hear a fresh possession statement; identify the object before revealing the transcript. | Listening evidence, separate from reading |
| Use personal meaning | Say three true things you have, using familiar nouns. | Self-check/human review of meaning, article choice and sentence structure |
| Transfer later | Use a different familiar inventory and a different response mode in a later session. | Delayed transfer, not memorisation of the old wording |

Allow valid alternatives when they meet the task. Capitalisation, punctuation and umlaut handling follow the scoring target; do not normalise away an error that the activity is specifically assessing. Optional style improvements are not grammatical errors.

## Offline sentence formation

Generate from **reviewed language data and constrained constructions**, not arbitrary word substitutions:

1. Read the learner's taught vocabulary/grammar scope.
2. Choose an eligible semantic frame (for the pilot: possession with haben).
3. Select a reviewed combination of subject, object, article definiteness and intended message.
4. Inflect finite verb and noun phrase from verified data; enforce gender, number, case and verb valency.
5. Select a response mode suited to the learner's evidence and recent modes.
6. Produce the prompt, accepted responses or rubric, explanation, diagnostic tags and a stable signature.
7. Reject any candidate without a valid in-scope solution.

Store lexical IDs and sentence structure separately from display strings. The same sentence in different fonts, with reordered multiple-choice options, or with punctuation changes remains the same exposure. Test correct verb agreement and article formation across every supported combination; constrain semantics with reviewed compatibility rules.

A seed makes selection reproducible for debugging, but a session counter/history changes the selection across real sessions. Persist the selected item before presenting it so restart/resume does not silently change the question.

## Adaptation rules

- **Correct independently:** move toward another mode or a changed context. Do not require the same literal response again to prove the same thing.
- **Correct after a hint:** record assisted success; later use a fresh item with less support.
- **Known gender, wrong case:** retain familiar vocabulary, give a case cue, then try a different reviewed object.
- **Ambiguous gender/case error:** probe gender first. Do not diagnose from one response.
- **Repeated difficulty:** reduce one demand, show a contrasting example, then try a fresh supported item. Stop the repair loop after the configured bound.
- **Strong closed-item performance, weak output:** recommend production practice; more multiple choice is not a substitute.
- **Insufficient evidence:** offer balanced familiar practice rather than declaring a weakness.
- **User choice:** allow a preferred task mode when supported, while explaining which skills need another modality.

Response time alone does not imply knowledge or difficulty. No speed penalty or pronunciation score is inferred.

## Repeat policy

Proposed pilot defaults, configurable after evaluation:

- Exclude the last **20 exact prompt signatures** for the target skill and exact prompts from the previous **3 sessions**. Both windows apply.
- Prefer a different response mode after **2 consecutive tasks** in one mode, when an eligible alternative exists.
- Avoid equivalent sentence signatures within a session even when the response mode changes. Deliberate contrasts may reuse structure with a clearly labelled teaching purpose.
- Permit an immediate learner-requested replay, explicitly labelled worked example or repair; do not count this as fresh independent evidence.
- Keep SRS timing unchanged. The next scheduled skill/item review may use a fresh equivalent variant; do not mutate the legacy source item or silently rewrite its history.
- If the eligible pool is exhausted, expand only through valid reviewed combinations. Otherwise offer another in-scope skill, a clearly labelled optional repeat or an end to the session. Never bypass scope or quietly claim a repeated question is new.

The exact windows are product starting points, not findings from learning research. Distinguish literal novelty from useful variation: twenty superficially different recognition items still do not establish productive skill.

## Evidence and acceptance criteria

Every presentation records module/content version, construction/family ID, exact prompt signature, sentence signature, response mode, seed, lexical IDs, target skill, support used and first-attempt outcome. Preserve self-check/AI/human/deterministic authority labels.

The future runner must pass:

1. Two ordinary sessions for the same learner and skill produce different eligible prompts when enough variants exist; restart resumes the original selected prompt.
2. A learner who repeatedly answers article gaps correctly receives a fresh sentence-production or question-response task, not only more gaps.
3. A case error and a gender error select different authored support paths; each fresh retry uses an eligible different item.
4. No generated combination violates subject–verb agreement, article/case rules, lexical compatibility or taught scope.
5. Finite-pool exhaustion has the explicit behaviour above; no infinite loop or silent repeat.
6. Equivalent prompts with shuffled options or punctuation have the same repeat signature.
7. A repaired answer never overwrites independent first-attempt evidence.
8. Open output is not automatically failed merely because it differs from a model answer.
9. Changed response modes and contexts remain separate from the held-out evaluation pool.
10. Existing SRS due dates, task IDs, saved progress and authoritative checkpoint scoring remain unchanged.

Review delayed transfer and learner effort, as well as repetition counts. Novelty is a teaching tool, not the success metric.

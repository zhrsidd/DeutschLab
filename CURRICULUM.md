# DeutschLab Curriculum

> **Purpose:** This file is the curriculum source of truth for DeutschLab.
>
> Product code should follow this curriculum rather than inventing lesson order or language scope ad hoc.
> Later units may be refined as the learner progresses, but any change should be deliberate and reflected here first.

---

## 1. Long-term goal

**Target:** Be ready to study Physics at ETH Zürich in German by **March 2028**.

By the target date, the learner should aim to:

- function at approximately **C1 German**
- follow university-style explanations and lectures
- read technical and academic German with reasonable independence
- discuss Physics and Mathematics clearly
- write structured academic responses
- understand everyday German-speaking university life
- be prepared for a recognised C1-level certification attempt before the final deadline

This is a long-term academic-language project, not a speed-run through CEFR labels.

---

## 2. Learner profile and workload

The learner is a Year 12 student also studying:

- Mathematics
- Further Mathematics
- Physics
- Economics

German therefore needs to remain sustainable alongside school.

### Normal school weeks

**Target:** approximately **4.5–6 hours/week** during A1/A2.

### Summer / lighter academic periods

German can increase to approximately **8–12 hours/week**.

### Busy weeks

The priority is maintaining contact with German rather than stopping completely.

Minimum viable contact can include:

- spaced review
- 10–20 minutes of listening
- short speaking practice
- one small grammar or vocabulary review

---

## 3. Overall roadmap

| Phase | Dates | Target | Typical workload |
|---|---|---:|---:|
| Unit 1 | Oct 2026 – Jan 2027 | A0 → strong A1 | 4.5–5.5 h/week |
| Unit 2 | Feb – May 2027 | strong A1 → strong A2 | 5–6 h/week |
| Unit 3 | Jun – Aug 2027 | A2 → B1 | 8–12 h/week |
| Unit 4 | Sep – Nov 2027 | B1 → B2 | 7–9 h/week |
| Unit 5 | Dec 2027 | B2 → C1 bridge | 8–10 h/week |
| Unit 6 | Jan – Feb 2028 | C1 + certification preparation | 8–10 h/week |
| Buffer | Mar 2028 | Consolidation + ETH Physics German | variable |

**Preferred certification timing:** first serious attempt around **February 2028**, leaving March as a buffer.

---

# UNIT 1 — A0 → STRONG A1

## 4. Unit 1 objective

**Dates:** October 2026 – January 2027

By the end of Unit 1, the learner should:

- understand and produce simple everyday German
- hold a basic 7–10 minute conversation on familiar topics
- write approximately 100–130 words on familiar A1 topics
- understand slow, clear beginner audio
- have a strong command of basic German sentence structure
- know approximately **800–1,000 useful words and expressions**
- be ready to begin A2 without major A1 gaps

### Unit 1 end benchmark

Target performance:

- Vocabulary: **85%**
- Grammar: **80%**
- Reading: **80%**
- Listening: **75%+**
- Speaking: comfortable A1 interaction
- Writing: 100–130 words with generally accurate basic grammar

---

## 5. Unit 1 learning principles

DeutschLab should teach through:

**teach → contextualise → recall → assess → review**

Each week should combine:

- vocabulary
- grammar
- listening
- pronunciation where relevant
- speaking
- writing
- spaced review

The app should not rely primarily on recognition-based multiple choice.

Production should progressively increase through:

- typed vocabulary
- fill-in grammar
- sentence construction
- translation
- guided writing
- timed speaking

---

# OCTOBER 2026 — FOUNDATIONS

## Week 1 — Sounds, introductions, sein, basic word order

### Core objectives

#### Pronunciation

Teach:

- ä
- ö
- ü
- ß
- ch
- sch
- z
- w / v
- ei
- ie
- eu

Learner should begin recognising and producing common German sound-spelling patterns.

#### Grammar

Teach:

- personal pronouns
- **sein**
- basic regular present-tense verbs
- verb-second word order
- yes/no questions
- basic W-questions

#### Vocabulary

Core Week 1 vocabulary areas:

- greetings and politeness
- introductions
- countries
- languages
- school subjects
- numbers

Target: approximately **70–80 initial items**.

#### Speaking

Learner should produce a **1–2 minute basic self-introduction**.

### Current DeutschLab implementation

| ID | Lesson |
|---|---|
| `vocab-001` | Week 1 vocabulary |
| `pronunciation-001` | German sounds |
| `grammar-001` | Personal pronouns + sein |
| `grammar-002` | Regular verbs + word order |
| `grammar-003` | Questions in German |
| `listening-001` | Week 1 listening |
| `speaking-001` | Week 1 speaking |
| `checkpoint-001` | Week 1 mastery checkpoint |

### Week 1 mastery rule

Week 1 is mastered when:

`checkpoint-001` is passed.

---

## Week 2 — haben, common present-tense verbs, daily life

### Grammar

Teach:

- **haben**
- regular present tense consolidation
- common high-frequency verbs
- selected stem-changing present-tense forms
- continued V2 practice
- continued question formation

Key verbs include:

- haben
- gehen
- arbeiten
- spielen
- trinken
- hören
- sprechen
- essen
- lesen
- schlafen

### Vocabulary

Target approximately **60–75 new items** across:

- family
- daily activities
- places
- basic adjectives
- days
- months
- basic time words

Articles should begin to be learned **with nouns as lexical chunks**, without formally teaching case grammar yet.

### Writing

Introduce first dedicated short writing task:

**40–50 words about the learner and daily life**

### Current / planned DeutschLab implementation

| ID | Lesson | Status |
|---|---|---|
| `vocab-002` | Week 2 vocabulary | Implemented |
| `grammar-004` | haben | Implemented |
| `grammar-005` | Common present-tense verbs | Implemented |
| `writing-001` | My daily life | Implemented |
| `reading-001` | Week 2 reading | Implemented |
| `listening-002` | Week 2 listening | Implemented |
| `checkpoint-002` | Week 2 checkpoint | Implemented |

Week 2 order in the app: `vocab-002` → `grammar-004` → `grammar-005` → `writing-001` → `reading-001` → `listening-002` → `checkpoint-002`.

Week 2 is mastered when:

`checkpoint-002` is passed.

Implementation notes (deliberate, recorded so code and curriculum stay aligned):

- Week 2 has **no separate speaking lesson or speaking section**; spoken production returns in later weeks. `checkpoint-002` therefore assesses vocabulary (8), grammar (10), reading (4), listening (4) and a writing self-check (6): **32 marks**, pass at 80% plus section minimums (vocabulary 6/8, grammar 7/10, listening 2/4, writing 4/6; no reading minimum).
- `writing-001` is self-assessed (6 points, pass 5/6) and keeps the learner's draft locally; it never creates mistakes or Review items.
- `reading-001` (2 texts, 8 questions) and `listening-002` (4 clips, 8 questions) create Review items only for questions that map to a reusable word or grammar item.
- Reading and listening texts avoid structures not yet taught (for example `nicht`, `aber`, contractions such as `im`).

---

## Week 3 — Articles, plurals, nominative, accusative introduction

### Grammar

Teach:

- definite articles: der / die / das
- indefinite articles: ein / eine
- plural awareness
- nominative case
- accusative introduction
- masculine change:
  - der → den
  - ein → einen
- basic direct-object concept
- **nicht vs kein**

Do not overload the learner with full case tables.

### Vocabulary

Focus on:

- school objects
- room / home
- food and drink
- common household nouns

From this point onward, nouns should normally be learned with:

- article
- plural where useful
- meaning
- example sentence

### Production

Learner should begin producing sentences such as:

- Ich habe einen Bruder.
- Ich sehe den Lehrer.
- Ich habe kein Buch.
- Das ist nicht schwer.

### Suggested DeutschLab tasks

- `vocab-003`
- `grammar-006` — der/die/das + ein/eine
- `grammar-007` — accusative introduction
- `grammar-008` — nicht vs kein
- `reading-002`
- `listening-003`
- `writing-002`
- `checkpoint-003`

### Current / planned DeutschLab implementation

| ID | Lesson | Status |
|---|---|---|
| `vocab-003` | School, home and everyday objects | Implemented |
| `grammar-006` | Nouns, articles and plurals | Implemented |
| `grammar-007` | Accusative introduction | Planned |
| `grammar-008` | nicht vs kein | Planned |
| `reading-002` | Week 3 reading | Planned |
| `listening-003` | Week 3 listening | Planned |
| `writing-002` | Week 3 writing | Planned |
| `checkpoint-003` | Week 3 checkpoint | Planned |

Week 3 order in the app so far: `vocab-003` → `grammar-006`. New Week 3 content is offered on Today once Week 2 is mastered (`checkpoint-002` passed); there is no Week 3 mastery rule yet.

Implementation notes:

- **Week 3 begins systematic article-aware vocabulary learning.** Every `vocab-003` noun carries its article, its written-out plural (or an explicit "no ordinary plural" status for mass nouns such as `die Milch`) and `requireArticle`. Typed German answers and Review for these nouns must include the correct article; Week 1 and 2 vocabulary still accepts bare nouns.
- `vocab-003` has 65 new nouns in 7 batches (school objects, computers and everyday things, rooms, furniture, food and the table, drinks and mass nouns, people). Its 20-question final quiz rotates meaning, noun + article, article, plural and typed noun + article (pass 16/20). The lesson remembers the batch position so it can be resumed.
- Review keeps meaning/noun recall (`<id>`), article (`<id>#article`) and plural (`<id>#plural`) as separate concepts using the existing scheduler.
- `grammar-006` teaches gender, der/die/das, ein/eine, the nominative as "the subject" and plurals. It has 16 questions (pass 13/16) and does **not** teach der → den or ein → einen; those belong to `grammar-007`.

---

## Week 4 — Accusative consolidation + irregular verbs

### Grammar

Consolidate:

- accusative
- direct objects
- basic accusative pronouns
- selected irregular present-tense verbs
- sentence-building with known cases

### Vocabulary

Expand:

- food
- school
- home
- everyday actions
- descriptions

### End-of-October target

Learner should be able to:

- introduce themselves for **2–3 minutes**
- use sein and haben
- conjugate common present-tense verbs
- build basic V2 sentences
- ask simple questions
- use basic nominative/accusative patterns
- recognise article patterns
- use approximately **300+ active words/expressions**

---

# NOVEMBER 2026 — MODALS, ROUTINE, TIME

## Week 5 — können, müssen, wollen

### Grammar

Teach modal structure:

- conjugated modal in position 2
- main verb infinitive at the end

Teach:

- können
- müssen
- wollen

Examples:

- Ich kann Deutsch sprechen.
- Ich muss lernen.
- Ich will Physik studieren.

### Vocabulary

- abilities
- school
- responsibilities
- study
- free time

---

## Week 6 — dürfen, sollen, mögen, möchten

### Grammar

Teach:

- dürfen
- sollen
- mögen
- möchten

Focus particularly on useful everyday requests and preferences.

### Vocabulary

- hobbies
- school
- university
- free time
- likes/dislikes

### Speaking

Target approximately **3 minutes** on familiar topics.

---

## Week 7 — Separable verbs + routine

### Grammar

Introduce common separable verbs:

- aufstehen
- anfangen
- einkaufen
- anrufen
- mitkommen
- fernsehen

Teach present-tense separation clearly.

Example:

- Ich stehe um sieben Uhr auf.

### Vocabulary

- daily routine
- clock time
- timetable
- school day

---

## Week 8 — Frequency + routine consolidation

### Vocabulary / adverbs

Teach:

- immer
- oft
- manchmal
- selten
- nie
- morgens
- mittags
- abends
- heute
- morgen
- gestern

### Writing

**80–100 words: Mein Schultag**

### Speaking

Target:

**4–5 minutes describing routine**

### End-of-November vocabulary target

Approximately **500–550 active words/expressions**.

---

# DECEMBER 2026 — DATIVE + PAST

## Week 9 — Dative introduction

### Grammar

Introduce dative articles:

- dem
- der
- den
- einem
- einer

Keep the initial focus practical rather than exhaustive.

---

## Week 10 — Common prepositions

### Dative prepositions

Teach:

- aus
- bei
- mit
- nach
- seit
- von
- zu

### Accusative prepositions

Teach:

- durch
- für
- gegen
- ohne
- um

Focus on high-frequency examples.

---

## Week 11 — Perfekt introduction

### Grammar

Teach conversational past with:

- haben + participle
- sein + participle

Introduce common participle formation and common high-frequency irregular participles.

Do not attempt to teach every exception.

---

## Week 12 — Past-tense consolidation

### Speaking

2–3 minutes about:

- yesterday
- last weekend
- a recent activity

### Writing

Short past-tense paragraph.

### End-of-December vocabulary target

Approximately **700 useful words/expressions**.

---

# JANUARY 2027 — STRONG A1 CONSOLIDATION

## Week 13 — weil

### Grammar

Teach:

- weil
- subordinate-clause verb-final position

Example:

- Ich lerne Deutsch, weil ich in Zürich studieren möchte.

Keep subordinate-clause use controlled.

---

## Week 14 — dass + longer sentences

### Grammar

Teach:

- dass
- verb-final subordinate clauses
- combining short clauses into longer ideas

---

## Week 15 — Possessives + reflexive introduction

### Grammar

Teach:

- mein
- dein
- sein
- ihr
- unser
- euer

Introduce common reflexive structures, especially:

- sich interessieren für

Avoid overloading the learner with full reflexive-pronoun paradigms at this stage.

---

## Week 16 — Unit 1 consolidation

Review:

- pronunciation
- present tense
- sein / haben
- modal verbs
- V2
- questions
- nominative / accusative
- dative introduction
- prepositions
- separable verbs
- Perfekt
- weil / dass
- possessives
- high-frequency vocabulary

### Final writing

**100–130 words**

### Final speaking

**7–10 minute conversation**

### Final assessment

Full strong-A1 checkpoint / mock.

### Unit 1 vocabulary target

Approximately **800–1,000 well-known words and expressions**.

---

# UNIT 2 — STRONG A1 → STRONG A2

## 6. February – May 2027

**Target:** secure A2 by the end of May.

Approximate workload:

**5–6 hours/week**

Unit 2 should move from isolated beginner sentences toward connected everyday communication.

### February 2027 — Cases + everyday interaction

Primary goals:

- strengthen nominative / accusative / dative
- common two-way prepositions
- position vs movement
- personal pronouns across cases
- article accuracy
- practical everyday conversations

Themes:

- home
- shopping
- transport
- school
- appointments
- food
- directions

### March 2027 — Past narration + comparison

Primary grammar:

- Perfekt consolidation
- more irregular participles
- sein vs haben in Perfekt
- Präteritum of high-frequency verbs where natural:
  - war
  - hatte
- comparative and superlative
- adjective use
- time sequencing

Writing:

structured past narrative of approximately **120–150 words**.

### April 2027 — More complex sentence structure

Primary grammar:

- subordinate clauses
- weil / dass consolidation
- wenn
- obwohl introduction if appropriate
- relative-clause introduction
- infinitive structures where useful
- word-order consolidation

Communication:

- giving reasons
- explaining preferences
- comparing options
- making plans
- solving everyday problems

### May 2027 — A2 consolidation

Focus:

- integrated listening
- longer reading
- conversation
- writing
- grammar repair
- high-frequency vocabulary gaps

### End-of-A2 target

Learner should be able to:

- hold a **10–15 minute conversation** on familiar topics
- understand the main points of clear everyday German
- write approximately **120–150 words**
- control core A1/A2 grammar reliably
- know approximately **1,800–2,200 useful words and expressions**
- reach approximately **75–80% on a representative A2 mock**

---

# UNIT 3 — A2 → B1

## 7. June – August 2027

**Workload:** approximately **8–12 hours/week**

Summer is the main acceleration period.

### Major goals

- transition from learner German to independent everyday German
- greatly increase listening volume
- read longer authentic/semi-authentic texts
- write connected arguments and narratives
- increase spontaneous speaking
- begin serious **Physics German**

### June 2027 — B1 bridge + Physics German begins

General German:

- sentence-combining
- clause control
- narrative fluency
- relative clauses
- adjective endings introduction/consolidation
- broader preposition control

Physics German begins systematically.

Initial technical themes:

- quantities and units
- motion
- force
- energy
- equations
- graphs
- describing trends
- basic experimental language

### July 2027 — B1 expansion

General German:

- longer listening
- structured conversation
- opinion language
- explanations
- formal vs informal register
- practical problem-solving

Physics German:

- mechanics
- waves
- electricity
- data interpretation
- describing methods
- explaining calculations

### August 2027 — Secure B1

Focus:

- B1 exam-style integrated skills
- longer spontaneous speaking
- 180–220 word writing
- authentic audio exposure
- error reduction

Target:

**secure B1 by end of August 2027**.

---

# UNIT 4 — B1 → B2

## 8. September – November 2027

**Workload:** approximately **7–9 hours/week**

### September 2027 — B1+ academic transition

Focus:

- academic connectors
- structured explanations
- more precise tense control
- passive voice
- relative clauses
- adjective endings
- formal register

### October 2027 — B2 development

Grammar / style:

- passive expansion
- Konjunktiv II
- complex subordinate clauses
- nominalisation introduction
- formal written style
- paraphrasing

Physics:

- mechanics and fields
- electricity and magnetism
- waves
- thermal physics
- practical/lab language

### November 2027 — Secure B2

Focus:

- longer lectures
- authentic articles
- note-taking
- summarisation
- argumentation
- technical reading speed

Target:

**functional B2 by end of November 2027**.

---

# UNIT 5 — B2 → C1 BRIDGE

## 9. December 2027

**Workload:** approximately **8–10 hours/week**

Primary goals:

- academic precision
- vocabulary depth
- listening endurance
- formal writing
- spoken fluency under pressure

Language:

- advanced connectors
- nominal style
- passive constructions
- paraphrase
- nuance
- register
- idiomatic academic phrasing

Physics:

- university-style explanations
- technical definitions
- extended derivations
- describing assumptions
- evaluating methods
- uncertainty and error

---

# UNIT 6 — C1 + CERTIFICATION

## 10. January – February 2028

**Workload:** approximately **8–10 hours/week**

Primary goals:

- C1 exam readiness
- academic German fluency
- close remaining grammar gaps
- improve speed and endurance

Weekly work should contain:

- long-form listening
- academic reading
- timed writing
- speaking
- vocabulary review
- error-log repair
- Physics German

### Certification

Preferred first serious certification attempt:

**February 2028**

Exact exam should be selected based on ETH requirements and availability at the time.

DeutschLab should support exam-style practice without hard-coding an outdated certification requirement.

---

# MARCH 2028 — BUFFER + ETH READINESS

## 11. Final buffer

Use March for:

- certification retake if necessary
- remaining weak areas
- lecture listening
- technical Physics vocabulary
- university administration German
- academic writing
- speaking fluency

Final target:

The learner should be capable of beginning Physics study in a German-speaking academic environment with a strong base for continued improvement.

---

# 12. Review and spaced repetition strategy

Current simple schedule:

- wrong → 1 day
- correct → 3 days
- correct again → 7 days
- then → 14 days
- then → 30 days
- then → 60 days

Review types should reflect the skill.

### Vocabulary

- German → English
- English → German
- typed recall
- audio where useful

### Grammar

- conjugation
- fill-in
- sentence production
- word order

### Pronunciation

- audio recognition
- sound-rule identification

### Listening

- audio comprehension
- transcript hidden until response

### Writing / speaking

Do not create fake objective mistakes from honest self-assessment.

---

# 13. Weekly checkpoint philosophy

Each completed instructional week should eventually have a checkpoint.

Recommended sections:

- vocabulary
- grammar
- reading
- listening
- writing
- speaking

Mastery should require both:

- a strong overall score
- minimum section thresholds

---

# 14. Daily study design

DeutschLab's Today plan should prioritise:

1. due / overdue review
2. unresolved weak areas
3. next unfinished curriculum lesson
4. additional new work only if time remains

Available study-time options:

- 15 min
- 30 min
- 45 min
- 60 min

The generated plan should be recomputed from current state rather than stored as a static daily schedule.

---

# 15. Skill balance by CEFR phase

## A1

Priority:

- pronunciation
- basic vocabulary
- sentence structure
- controlled production
- listening to slow clear speech
- basic speaking confidence

## A2

Priority:

- case control
- everyday communication
- connected writing
- past narration
- longer listening
- spontaneous familiar-topic speaking

## B1

Priority:

- independent communication
- longer reading/listening
- explanation
- opinion
- connected argument
- introduction of academic and Physics German

## B2

Priority:

- academic register
- precision
- authentic input
- complex syntax
- technical discussion
- formal writing

## C1

Priority:

- speed
- nuance
- academic independence
- lecture comprehension
- technical fluency
- exam performance

---

# 16. Physics German progression

### A1

Only occasional personally relevant terms:

- Mathematik
- Physik
- lernen
- Schule
- Universität

### A2

Light subject-related vocabulary and simple descriptions.

### B1

Serious Physics German begins:

- technical vocabulary
- graph description
- experiments
- calculations
- short textbook passages
- oral explanations

### B2

Physics becomes a major source of reading, listening, writing and speaking practice.

### C1

DeutschLab should support:

- lecture comprehension
- note-taking
- textbook reading
- extended technical explanation
- formal scientific writing
- oral reasoning

---

# 17. Lesson-ID convention

Use stable ids.

### Vocabulary

`vocab-001`, `vocab-002`, ...

### Grammar

`grammar-001`, `grammar-002`, ...

### Pronunciation

`pronunciation-001`, ...

### Listening

`listening-001`, `listening-002`, ...

### Reading

`reading-001`, ...

### Writing

`writing-001`, ...

### Speaking

`speaking-001`, ...

### Checkpoints

`checkpoint-001`, `checkpoint-002`, ...

Never recycle an existing id for different content.

Existing completion, review and mistake records may depend on ids permanently.

---

# 18. Curriculum implementation rules

Before adding a new lesson:

1. Identify its location in this curriculum.
2. Confirm prerequisite grammar/vocabulary already exists.
3. Avoid introducing later-unit concepts casually.
4. Reuse already learned language where possible.
5. Define objective learning outcomes.
6. Define appropriate practice types.
7. Integrate assessed concepts with Review.
8. Add/update automated tests.
9. Run `npm run test:all`.
10. Commit only when the full automated gate passes.

---

# 19. Content-status convention

When maintaining this file, label curriculum items as:

- **Implemented**
- **Planned**
- **Deferred**
- **Revised**

Do not silently change curriculum scope in code without updating this file.

---

# 20. Current implementation status

## Implemented

### Week 1

- `vocab-001`
- `pronunciation-001`
- `grammar-001`
- `grammar-002`
- `grammar-003`
- `listening-001`
- `speaking-001`
- `checkpoint-001`

### Week 2

- `vocab-002`
- `grammar-004`
- `grammar-005`
- `writing-001`
- `reading-001`
- `listening-002`
- `checkpoint-002`

### Platform

- local SQLite persistence
- mistakes
- spaced review
- active-recall Review
- dynamic daily planner
- Week 1 and Week 2 mastery checkpoints
- local writing drafts
- automated Vitest / React / Playwright test suite

## Next planned

- Week 3 — articles, plurals, nominative and accusative introduction (not started)

---

# 21. Change-control rule

This document is the curriculum source of truth.

If a future implementation discovers that the curriculum should change:

- do not silently change code only
- update this file
- explain why the sequence changed
- preserve compatibility with existing progress whenever possible

The goal is not merely to complete CEFR levels quickly.

The goal is to build German that is:

- accurate
- usable
- retained
- increasingly independent
- ultimately strong enough for Physics study at ETH Zürich

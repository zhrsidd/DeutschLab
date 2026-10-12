import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-005: common present-tense verbs.
 * Consolidates regular endings and introduces the stem-changing verbs
 * sprechen, essen, lesen and schlafen. Question ids start with "cv-".
 */

export const week2CommonVerbsQuiz: CourseQuestion[] = [
  // Pronoun → correct form (multiple choice)
  {
    id: "cv-c-er-essen",
    kind: "choice",
    prompt: "Er ___ in der Schule. (essen)",
    options: ["isst", "esst", "esse", "essen"],
    answer: "isst",
    explanation: "essen changes e → i with er/sie/es: er isst.",
  },
  {
    id: "cv-c-ihr-lesen",
    kind: "choice",
    prompt: "Ihr ___ heute. (lesen)",
    options: ["lest", "liest", "lesen", "lese"],
    answer: "lest",
    explanation: "ihr keeps the familiar stem: ihr lest. Only du and er/sie/es change.",
  },
  {
    id: "cv-c-match",
    kind: "choice",
    prompt: "Which pronoun goes with schläfst?",
    options: ["du", "er", "ihr", "wir"],
    answer: "du",
    explanation: "du schläfst: schlafen changes a → ä with du and er/sie/es.",
  },
  {
    id: "cv-c-arbeiten",
    kind: "choice",
    prompt: "Which form of arbeiten goes with du?",
    options: ["arbeitest", "arbeitst", "arbeite", "arbeitet"],
    answer: "arbeitest",
    explanation: "arbeiten adds an extra e in du and er forms so it is easy to say: du arbeitest.",
  },
  // Fill in the blank
  {
    id: "cv-f-du-sprechen",
    kind: "fill",
    sentence: "Du ___ Deutsch.",
    hint: "(sprechen)",
    accepted: ["sprichst"],
    explanation: "sprechen changes e → i: du sprichst.",
  },
  {
    id: "cv-f-er-lesen",
    kind: "fill",
    sentence: "Er ___ ein Buch.",
    hint: "(lesen)",
    accepted: ["liest"],
    explanation: "lesen changes e → ie: er liest.",
  },
  {
    id: "cv-f-wir-trinken",
    kind: "fill",
    sentence: "Wir ___ Wasser.",
    hint: "(trinken)",
    accepted: ["trinken"],
    explanation: "wir uses the familiar form: wir trinken.",
  },
  {
    id: "cv-f-sie-arbeiten",
    kind: "fill",
    sentence: "Sie ___ heute.",
    hint: "(arbeiten · she)",
    accepted: ["arbeitet"],
    explanation: "sie (she) → arbeiten + extra e: sie arbeitet.",
  },
  {
    id: "cv-f-du-schlafen",
    kind: "fill",
    sentence: "Du ___ heute.",
    hint: "(schlafen)",
    accepted: ["schläfst"],
    explanation: "schlafen changes a → ä: du schläfst.",
  },
  // Typed production / English → German
  {
    id: "cv-t-ich-sprechen",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "I speak German.",
    accepted: ["Ich spreche Deutsch."],
    explanation: "ich keeps the familiar stem: Ich spreche Deutsch.",
  },
  {
    id: "cv-t-sie-schlafen",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "She sleeps.",
    accepted: ["Sie schläft."],
    explanation: "sie (she) → schläft (a → ä).",
  },
  {
    id: "cv-t-er-essen",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "He eats at school.",
    accepted: ["Er isst in der Schule."],
    explanation: "er isst. Learn in der Schule as a phrase for now.",
  },
  // Simple word order
  {
    id: "cv-r-heute-gehen",
    kind: "reorder",
    words: ["Heute", "ich", "nach", "Hause", "gehe"],
    accepted: ["Heute gehe ich nach Hause.", "Ich gehe heute nach Hause."],
    explanation: "The verb stays in position 2: Heute gehe ich nach Hause.",
  },
  {
    id: "cv-r-doha-arbeiten",
    kind: "reorder",
    words: ["In", "Doha", "arbeitet", "er"],
    accepted: ["In Doha arbeitet er.", "Er arbeitet in Doha."],
    explanation: "Starting with In Doha puts the verb second: In Doha arbeitet er.",
  },
];

/** Forms taught in this lesson, used by the lesson tables and the tests. */
export const commonVerbForms: Record<string, string[]> = {
  // ich, du, er/sie/es, wir, ihr, sie/Sie
  gehen: ["gehe", "gehst", "geht", "gehen", "geht", "gehen"],
  arbeiten: ["arbeite", "arbeitest", "arbeitet", "arbeiten", "arbeitet", "arbeiten"],
  spielen: ["spiele", "spielst", "spielt", "spielen", "spielt", "spielen"],
  trinken: ["trinke", "trinkst", "trinkt", "trinken", "trinkt", "trinken"],
  hören: ["höre", "hörst", "hört", "hören", "hört", "hören"],
  sprechen: ["spreche", "sprichst", "spricht", "sprechen", "sprecht", "sprechen"],
  essen: ["esse", "isst", "isst", "essen", "esst", "essen"],
  lesen: ["lese", "liest", "liest", "lesen", "lest", "lesen"],
  schlafen: ["schlafe", "schläfst", "schläft", "schlafen", "schlaft", "schlafen"],
};

const pronounRows = ["ich", "du", "er / sie / es", "wir", "ihr", "sie / Sie"];

const tableRows = (verbs: string[]) =>
  pronounRows.map((pronoun, row) => [
    pronoun,
    ...verbs.map((verb) => commonVerbForms[verb][row]),
  ]);

export const commonVerbsCourse: GrammarCourse = {
  taskId: "grammar-005",
  kicker: "Week 2 · Grammar",
  title: "Common present-tense verbs",
  summary:
    "Most verbs use the endings you already know. A few important verbs change their vowel with du and er/sie/es.",
  goal: "Score at least 12/14 to complete this lesson.",
  questions: week2CommonVerbsQuiz,
  passMessage:
    "You can use the most common present-tense verbs, including the vowel changes. This is the toolkit for your Week 2 writing.",
  failMessage:
    "You need at least 12/14 before this lesson is marked complete. Review the vowel changes in du and er/sie/es, then try again.",
  pages: [
    {
      id: "reminder",
      heading: "The regular pattern, again",
      blocks: [
        {
          type: "text",
          text: "The endings stay the same: -e, -st, -t, -en, -t, -en. Take the stem (gehen → geh-) and add the ending that matches the pronoun.",
        },
        {
          type: "table",
          headers: ["", "gehen", "spielen", "trinken", "hören"],
          rows: tableRows(["gehen", "spielen", "trinken", "hören"]),
        },
        {
          type: "text",
          text: "arbeiten is regular too, but a stem ending in -t needs an extra e in du and er/sie/es and in ihr, so it is easy to say: du arbeitest, er arbeitet, ihr arbeitet.",
        },
        {
          type: "table",
          headers: ["Pronoun", "arbeiten"],
          rows: tableRows(["arbeiten"]),
        },
      ],
    },
    {
      id: "stem",
      heading: "Verbs that change their vowel",
      blocks: [
        {
          type: "text",
          text: "Some very common verbs change the stem vowel, but only with du and er/sie/es. The other forms keep the familiar stem. The endings are still the ones you know.",
        },
        {
          type: "table",
          headers: ["", "sprechen e→i", "essen e→i", "lesen e→ie", "schlafen a→ä"],
          rows: tableRows(["sprechen", "essen", "lesen", "schlafen"]),
        },
        {
          type: "callout",
          title: "Look at the pattern",
          text: "Only du and er/sie/es change. ich, wir, ihr and sie/Sie keep the stem. essen: du isst and er isst (the s and the ending merge), but ihr esst.",
        },
      ],
    },
    {
      id: "examples",
      heading: "Conjugation in sentences",
      blocks: [
        {
          type: "examples",
          items: [
            { german: "Ich spreche Deutsch.", english: "I speak German." },
            { german: "Du sprichst Englisch.", english: "You speak English." },
            { german: "Er liest ein Buch.", english: "He reads a book." },
            { german: "Wir trinken Wasser.", english: "We drink water." },
            { german: "Sie schläft heute.", english: "She sleeps today." },
            { german: "Ihr esst in der Schule.", english: "You (all) eat at school." },
            { german: "Sie arbeitet in Doha.", english: "She works in Doha." },
          ],
        },
      ],
    },
    {
      id: "compare",
      heading: "Guided comparison",
      blocks: [
        {
          type: "text",
          text: "Compare the changing and the unchanging forms of one verb. The vowel change appears in exactly two places.",
        },
        {
          type: "table",
          headers: ["Pronoun", "sprechen", "same stem?"],
          rows: [
            ["ich", "spreche", "yes"],
            ["du", "sprichst", "changes"],
            ["er / sie / es", "spricht", "changes"],
            ["wir", "sprechen", "yes"],
            ["ihr", "sprecht", "yes"],
            ["sie / Sie", "sprechen", "yes"],
          ],
        },
        {
          type: "callout",
          title: "Word order stays the same",
          text: "The verb is still in position 2: Heute gehe ich nach Hause. In Doha arbeitet er.",
        },
      ],
    },
  ],
};

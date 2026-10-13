import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-010: five more stem-changing present-tense verbs (sehen, nehmen,
 * treffen, fahren, tragen), then a consolidation of the accusative: der →
 * den, ein → einen, accusative pronouns and V2 word order. Week 2 already
 * taught sprechen, essen, lesen and schlafen; they are only recalled.
 *
 * Ids start with "iv-". Each question carries the concept it trains
 * (verb_form, accusative, pronoun or word_order) so Review keeps them apart.
 */

export const IRREGULAR_VERB_TABLE: Record<
  "sehen" | "nehmen" | "treffen" | "fahren" | "tragen",
  [string, string, string, string, string, string]
> = {
  // ich, du, er/sie/es, wir, ihr, sie/Sie
  sehen: ["sehe", "siehst", "sieht", "sehen", "seht", "sehen"],
  nehmen: ["nehme", "nimmst", "nimmt", "nehmen", "nehmt", "nehmen"],
  treffen: ["treffe", "triffst", "trifft", "treffen", "trefft", "treffen"],
  fahren: ["fahre", "fährst", "fährt", "fahren", "fahrt", "fahren"],
  tragen: ["trage", "trägst", "trägt", "tragen", "tragt", "tragen"],
};

export const week4IrregularVerbsQuiz: CourseQuestion[] = [
  // A. conjugation
  {
    id: "iv-c-siehst",
    kind: "choice",
    concept: "verb_form",
    prompt: "Du ___ den Lehrer. (sehen)",
    options: ["sehst", "siehst", "sieht", "sehen"],
    answer: "siehst",
    explanation: "sehen changes e → ie with du and er/sie/es: du siehst.",
  },
  {
    id: "iv-c-nimmt",
    kind: "choice",
    concept: "verb_form",
    prompt: "Er ___ einen Apfel. (nehmen)",
    options: ["nehmt", "nimmt", "nimmst", "nehmen"],
    answer: "nimmt",
    explanation: "nehmen changes to nimm- with du and er/sie/es: er nimmt.",
  },
  {
    id: "iv-c-nimmst",
    kind: "choice",
    concept: "verb_form",
    prompt: "___ du einen Apfel? (nehmen)",
    options: ["Nimmst", "Nehmst", "Nimmt", "Nehmen"],
    answer: "Nimmst",
    explanation: "A yes/no question starts with the verb. With du, nehmen becomes nimmst: Nimmst du einen Apfel?",
  },
  {
    id: "iv-f-faehrst",
    kind: "fill",
    concept: "verb_form",
    sentence: "Du ___ heute Fahrrad.",
    hint: "(fahren)",
    accepted: ["fährst"],
    explanation: "fahren adds an umlaut with du and er/sie/es: du fährst.",
  },
  {
    id: "iv-f-traegt",
    kind: "fill",
    concept: "verb_form",
    sentence: "Sie ___ eine Brille.",
    hint: "(tragen)",
    accepted: ["trägt"],
    explanation: "tragen adds an umlaut with du and er/sie/es: sie trägt.",
  },
  {
    id: "iv-f-trifft",
    kind: "fill",
    concept: "verb_form",
    sentence: "Er ___ einen Freund.",
    hint: "(treffen)",
    accepted: ["trifft"],
    explanation: "treffen changes e → i with du and er/sie/es: er trifft.",
  },
  {
    id: "iv-c-ihr-fahrt",
    kind: "choice",
    concept: "verb_form",
    prompt: "Ihr ___ heute. (fahren)",
    options: ["fahrt", "fährt", "fahren", "fährst"],
    answer: "fahrt",
    explanation: "The vowel only changes with du and er/sie/es. With ihr there is no umlaut: ihr fahrt.",
  },
  // B. accusative articles
  {
    id: "iv-c-den-rucksack",
    kind: "choice",
    concept: "accusative",
    prompt: "Er trägt ___ Rucksack.",
    options: ["der", "den", "das"],
    answer: "den",
    explanation: "Rucksack is masculine and the direct object of trägt, so der becomes den.",
  },
  {
    id: "iv-c-einen-salat",
    kind: "choice",
    concept: "accusative",
    prompt: "Sie nimmt ___ Salat.",
    options: ["ein", "eine", "einen"],
    answer: "einen",
    explanation: "Salat is masculine (der Salat) and the direct object: ein becomes einen.",
  },
  {
    id: "iv-c-eine-jacke",
    kind: "choice",
    concept: "accusative",
    prompt: "Du trägst ___ Jacke.",
    options: ["ein", "eine", "einen"],
    answer: "eine",
    explanation: "Jacke is feminine (die Jacke). Feminine articles do not change: eine Jacke.",
  },
  // C. pronoun substitution
  {
    id: "iv-f-ihn-hund",
    kind: "fill",
    concept: "pronoun",
    sentence: "Siehst du den Hund? – Ja, ich sehe ___.",
    accepted: ["ihn"],
    explanation: "den Hund is a masculine direct object, so the pronoun is ihn.",
  },
  {
    id: "iv-t-es-broetchen",
    kind: "typed",
    concept: "pronoun",
    instruction: "Replace the noun with a pronoun.",
    prompt: "Lena nimmt das Brötchen.",
    accepted: ["Lena nimmt es."],
    explanation: "das Brötchen is neuter, so it becomes es: Lena nimmt es.",
  },
  {
    id: "iv-t-siehst-du-ihn",
    kind: "typed",
    concept: "pronoun",
    instruction: "Write this in German.",
    prompt: "Do you see him? (du)",
    accepted: ["Siehst du ihn?"],
    explanation: "A yes/no question starts with the verb: Siehst du …? him as a direct object is ihn.",
  },
  // D. word order
  {
    id: "iv-r-heute-trifft",
    kind: "reorder",
    concept: "word_order",
    words: ["Heute", "trifft", "Omar", "einen", "Freund"],
    accepted: [
      "Heute trifft Omar einen Freund.",
      "Omar trifft heute einen Freund.",
      "Einen Freund trifft Omar heute.",
    ],
    explanation: "The verb is always in position 2. If Heute comes first, the subject Omar follows the verb: Heute trifft Omar einen Freund.",
  },
  {
    id: "iv-r-siehst-du",
    kind: "reorder",
    concept: "word_order",
    words: ["Siehst", "du", "den", "Lehrer"],
    accepted: ["Siehst du den Lehrer?"],
    explanation: "A yes/no question starts with the verb, then the subject: Siehst du den Lehrer?",
  },
  // E. production
  {
    id: "iv-t-jacke",
    kind: "typed",
    concept: "verb_form",
    instruction: "Write this in German.",
    prompt: "He is wearing a jacket.",
    accepted: ["Er trägt eine Jacke."],
    explanation: "tragen → er trägt (umlaut), and Jacke is feminine: eine Jacke.",
  },
];

export const irregularVerbsCourse: GrammarCourse = {
  taskId: "grammar-010",
  kicker: "Week 4 · Grammar",
  title: "Irregular verbs and the accusative",
  summary:
    "Learn five more verbs that change their vowel (sehen, nehmen, treffen, fahren, tragen), then put everything together: verb forms, den and einen, accusative pronouns and the verb in position 2.",
  goal: "Score at least 13/16 to complete this lesson.",
  questions: week4IrregularVerbsQuiz,
  passMessage:
    "You can use the new verb forms and build complete sentences with a direct object. That is the core of October's grammar.",
  failMessage:
    "You need at least 13/16 before this lesson is marked complete. Check which verbs change with du and er/sie/es, remember der → den and er → ihn, and try again.",
  pages: [
    {
      id: "recall",
      heading: "Verbs that change their vowel",
      blocks: [
        {
          type: "text",
          text: "In Week 2 you met verbs that change their vowel: du sprichst, er isst, sie liest, er schläft. The change only happens with du and er/sie/es. ich, wir, ihr and sie/Sie stay regular.",
        },
        {
          type: "table",
          headers: ["Change", "Week 2", "New this week"],
          rows: [
            ["e → i / ie", "sprechen → du sprichst, lesen → er liest", "sehen, nehmen, treffen"],
            ["a → ä", "schlafen → du schläfst", "fahren, tragen"],
          ],
        },
      ],
    },
    {
      id: "e-verbs",
      heading: "sehen, nehmen, treffen",
      blocks: [
        {
          type: "table",
          headers: ["", "sehen", "nehmen", "treffen"],
          rows: [
            ["ich", "sehe", "nehme", "treffe"],
            ["du", "siehst", "nimmst", "triffst"],
            ["er / sie / es", "sieht", "nimmt", "trifft"],
            ["wir", "sehen", "nehmen", "treffen"],
            ["ihr", "seht", "nehmt", "trefft"],
            ["sie / Sie", "sehen", "nehmen", "treffen"],
          ],
        },
        {
          type: "callout",
          title: "Watch nehmen",
          text: "nehmen changes more than the vowel: the h disappears and the m doubles. du nimmst, er nimmt.",
        },
      ],
    },
    {
      id: "a-verbs",
      heading: "fahren and tragen",
      blocks: [
        {
          type: "table",
          headers: ["", "fahren", "tragen"],
          rows: [
            ["ich", "fahre", "trage"],
            ["du", "fährst", "trägst"],
            ["er / sie / es", "fährt", "trägt"],
            ["wir", "fahren", "tragen"],
            ["ihr", "fahrt", "tragt"],
            ["sie / Sie", "fahren", "tragen"],
          ],
        },
        {
          type: "callout",
          title: "No umlaut with ihr",
          text: "ihr fahrt and ihr tragt have no umlaut. Only du and er/sie/es change.",
        },
      ],
    },
    {
      id: "compare",
      heading: "Regular or irregular?",
      blocks: [
        {
          type: "table",
          headers: ["", "kaufen (regular)", "nehmen (irregular)"],
          rows: [
            ["ich", "kaufe", "nehme"],
            ["du", "kaufst", "nimmst"],
            ["er / sie / es", "kauft", "nimmt"],
          ],
        },
        {
          type: "examples",
          items: [
            { german: "Ich sehe den Mann. Du siehst den Mann.", english: "I see the man. You see the man." },
            { german: "Ich fahre Fahrrad. Er fährt Fahrrad.", english: "I ride a bike. He rides a bike." },
          ],
        },
      ],
    },
    {
      id: "accusative",
      heading: "The direct object, all together",
      blocks: [
        {
          type: "table",
          headers: ["", "Subject", "Direct object", "Pronoun (object)"],
          rows: [
            ["masculine", "der / ein / kein", "den / einen / keinen", "ihn"],
            ["feminine", "die / eine / keine", "die / eine / keine", "sie"],
            ["neuter", "das / ein / kein", "das / ein / kein", "es"],
            ["plural", "die / keine", "die / keine", "sie"],
          ],
        },
        {
          type: "examples",
          items: [
            { german: "Ich sehe den Mann. → Ich sehe ihn.", english: "I see the man. → I see him." },
            { german: "Sie nimmt einen Stift.", english: "She takes a pen." },
            { german: "Ich trage den Rucksack. → Ich trage ihn.", english: "I carry the backpack. → I carry it." },
          ],
        },
      ],
    },
    {
      id: "word-order",
      heading: "Verb in position 2",
      blocks: [
        {
          type: "text",
          text: "The rules from Week 1 still apply. In a statement the verb is in position 2, even when another word comes first. In a yes/no question the verb comes first.",
        },
        {
          type: "table",
          headers: ["Position 1", "Verb", "Rest"],
          rows: [
            ["Er", "fährt", "heute."],
            ["Heute", "fährt", "er."],
            ["Morgen", "trifft", "Lena einen Freund."],
          ],
        },
        {
          type: "examples",
          items: [
            { german: "Siehst du den Lehrer?", english: "Do you see the teacher?" },
            { german: "Was trägst du heute?", english: "What are you wearing today?" },
          ],
        },
      ],
    },
  ],
};

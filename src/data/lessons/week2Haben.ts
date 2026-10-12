import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-004: haben (to have).
 * Examples use no article + noun, so no accusative-case teaching is needed.
 * Question ids start with "hb-" so reviews trace back to this lesson.
 */

export const week2HabenQuiz: CourseQuestion[] = [
  // A. choose the correct form
  {
    id: "hb-c-er",
    kind: "choice",
    prompt: "Er ___ Physik. (haben)",
    options: ["hat", "habe", "hast", "haben"],
    answer: "hat",
    explanation: "er → hat (irregular): Er hat Physik.",
  },
  {
    id: "hb-c-wir",
    kind: "choice",
    prompt: "Wir ___ Zeit. (haben)",
    options: ["haben", "habt", "habe", "hat"],
    answer: "haben",
    explanation: "wir → haben: Wir haben Zeit.",
  },
  // C. pronoun → form matching
  {
    id: "hb-c-ihr",
    kind: "choice",
    prompt: "Which form of haben goes with ihr?",
    options: ["habt", "haben", "hat", "hast"],
    answer: "habt",
    explanation: "ihr → habt: Ihr habt Mathematik.",
  },
  {
    id: "hb-c-hast",
    kind: "choice",
    prompt: "Which pronoun goes with hast?",
    options: ["du", "ich", "er", "ihr"],
    answer: "du",
    explanation: "du hast. Remember: du hast, er/sie/es hat.",
  },
  // B. fill in the blank
  {
    id: "hb-f-ich",
    kind: "fill",
    sentence: "Ich ___ Zeit.",
    hint: "(haben)",
    accepted: ["habe"],
    explanation: "ich → habe: Ich habe Zeit.",
  },
  {
    id: "hb-f-du",
    kind: "fill",
    sentence: "Du ___ Physik.",
    hint: "(haben)",
    accepted: ["hast"],
    explanation: "du → hast (irregular): Du hast Physik.",
  },
  {
    id: "hb-f-sie",
    kind: "fill",
    sentence: "Sie ___ Schule.",
    hint: "(haben · she)",
    accepted: ["hat"],
    explanation: "sie (she) → hat (irregular): Sie hat Schule.",
  },
  {
    id: "hb-f-ihr",
    kind: "fill",
    sentence: "Ihr ___ Mathematik.",
    hint: "(haben)",
    accepted: ["habt"],
    explanation: "ihr → habt: Ihr habt Mathematik.",
  },
  // D. short typed production
  {
    id: "hb-t-ich-zeit",
    kind: "typed",
    instruction: "Write a sentence with haben.",
    prompt: "ich + Zeit",
    accepted: ["Ich habe Zeit."],
    explanation: "ich → habe: Ich habe Zeit.",
  },
  {
    id: "hb-t-du-physik",
    kind: "typed",
    instruction: "Write a sentence with haben.",
    prompt: "du + Physik",
    accepted: ["Du hast Physik."],
    explanation: "du → hast: Du hast Physik.",
  },
  // E. English → German
  {
    id: "hb-e-wir",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "We have German.",
    accepted: ["Wir haben Deutsch."],
    explanation: "wir → haben: Wir haben Deutsch.",
  },
  {
    id: "hb-e-sie",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "She has school.",
    accepted: ["Sie hat Schule."],
    explanation: "sie (she) → hat: Sie hat Schule.",
  },
];

export const habenCourse: GrammarCourse = {
  taskId: "grammar-004",
  kicker: "Week 2 · Grammar",
  title: "haben",
  summary:
    "haben means “to have”. It is one of the most common German verbs, and two of its forms are irregular.",
  goal: "Score at least 10/12 to complete this lesson.",
  questions: week2HabenQuiz,
  passMessage:
    "You can use haben with every pronoun. It will come up constantly from here on.",
  failMessage:
    "You need at least 10/12 before this lesson is marked complete. Review the table, especially du hast and er hat, and try again.",
  pages: [
    {
      id: "meaning",
      heading: "haben = to have",
      blocks: [
        {
          type: "text",
          text: "haben means “to have”. You'll use it to talk about time, subjects, school and family. It is a different verb from sein (to be): Ich bin Schüler, but Ich habe Zeit.",
        },
        {
          type: "examples",
          items: [
            { german: "Ich habe Zeit.", english: "I have time." },
            { german: "Wir haben Deutsch.", english: "We have German (class)." },
          ],
        },
      ],
    },
    {
      id: "table",
      heading: "haben in the present tense",
      blocks: [
        {
          type: "table",
          headers: ["Pronoun", "haben", "English"],
          rows: [
            ["ich", "habe", "I have"],
            ["du", "hast", "you have"],
            ["er / sie / es", "hat", "he / she / it has"],
            ["wir", "haben", "we have"],
            ["ihr", "habt", "you (all) have"],
            ["sie / Sie", "haben", "they have / you (formal) have"],
          ],
        },
        {
          type: "callout",
          title: "Remember these two",
          text: "du hast and er/sie/es hat are irregular: the b of the stem disappears. Learn them as they are. The other forms follow the usual endings.",
        },
      ],
    },
    {
      id: "examples",
      heading: "Guided examples",
      blocks: [
        {
          type: "examples",
          items: [
            { german: "Ich habe Zeit.", english: "I have time." },
            { german: "Du hast Deutsch.", english: "You have German (class)." },
            { german: "Er hat Physik.", english: "He has physics." },
            { german: "Sie hat Schule.", english: "She has school." },
            { german: "Wir haben Englisch.", english: "We have English (class)." },
            { german: "Ihr habt Mathematik.", english: "You (all) have maths." },
            { german: "Sie haben Zeit.", english: "They / you (formal) have time." },
            {
              german: "Ich habe einen Bruder.",
              english: "I have a brother.",
              note: "A useful phrase to learn as it is for now. Articles like einen come later.",
            },
          ],
        },
      ],
    },
  ],
};

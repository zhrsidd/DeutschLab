import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-008: negation with nicht and kein.
 * kein is taught in the nominative and accusative only. Question ids start
 * with "neg-" so reviews trace back to this lesson.
 */

export const week3NegationQuiz: CourseQuestion[] = [
  // A. nicht vs kein, and the right kein form
  {
    id: "neg-c-zeit",
    kind: "choice",
    concept: "negation",
    prompt: "Ich habe ___ Zeit.",
    options: ["nicht", "kein", "keine", "keinen"],
    answer: "keine",
    explanation: "Zeit is a feminine noun, so use keine: Ich habe keine Zeit.",
  },
  {
    id: "neg-c-buch",
    kind: "choice",
    concept: "negation",
    prompt: "Das ist ___ Buch.",
    options: ["nicht", "kein", "keine", "keinen"],
    answer: "kein",
    explanation: "Buch is neuter: Das ist ein Buch → Das ist kein Buch.",
  },
  {
    id: "neg-c-stift",
    kind: "choice",
    concept: "negation",
    prompt: "Ich habe ___ Stift.",
    options: ["kein", "keine", "keinen"],
    answer: "keinen",
    explanation: "Stift is masculine and a direct object: ein → einen, so kein → keinen.",
  },
  {
    id: "neg-c-adjective",
    kind: "choice",
    concept: "negation",
    prompt: "Das Buch ist ___ neu.",
    options: ["nicht", "kein", "keine"],
    answer: "nicht",
    explanation: "neu is an adjective, not a noun, so use nicht: Das Buch ist nicht neu.",
  },
  {
    id: "neg-c-verb",
    kind: "choice",
    concept: "negation",
    prompt: "Ich lerne ___.",
    options: ["nicht", "kein", "keine"],
    answer: "nicht",
    explanation: "To negate the verb itself, use nicht: Ich lerne nicht.",
  },
  {
    id: "neg-c-lampe",
    kind: "choice",
    concept: "negation",
    prompt: "Das ist eine Lampe. → Das ist ___ Lampe.",
    options: ["nicht", "kein", "keine"],
    answer: "keine",
    explanation: "eine Lampe becomes keine Lampe: Das ist keine Lampe.",
  },
  {
    id: "neg-c-plural",
    kind: "choice",
    concept: "negation",
    prompt: "Wir haben ___ Bücher.",
    options: ["kein", "keine", "keinen"],
    answer: "keine",
    explanation: "The plural always uses keine: Wir haben keine Bücher.",
  },
  // B. sentence transformation
  {
    id: "neg-t-buch",
    kind: "typed",
    concept: "negation",
    instruction: "Make the sentence negative.",
    prompt: "Das ist ein Buch.",
    accepted: ["Das ist kein Buch."],
    explanation: "ein Buch → kein Buch: Das ist kein Buch.",
  },
  {
    id: "neg-t-stift",
    kind: "typed",
    concept: "negation",
    instruction: "Make the sentence negative.",
    prompt: "Ich habe einen Stift.",
    accepted: ["Ich habe keinen Stift."],
    explanation: "einen Stift → keinen Stift: Ich habe keinen Stift.",
  },
  {
    id: "neg-t-interessant",
    kind: "typed",
    concept: "negation",
    instruction: "Make the sentence negative.",
    prompt: "Das Buch ist interessant.",
    accepted: ["Das Buch ist nicht interessant."],
    explanation: "An adjective is negated with nicht: Das Buch ist nicht interessant.",
  },
  // C. fill in the blank
  {
    id: "neg-f-tasche",
    kind: "fill",
    concept: "negation",
    sentence: "Ich habe ___ Tasche.",
    hint: "(kein)",
    accepted: ["keine"],
    explanation: "Tasche is feminine: Ich habe keine Tasche.",
  },
  {
    id: "neg-f-lampe-nicht",
    kind: "fill",
    concept: "negation",
    sentence: "Die Lampe ist ___ neu.",
    accepted: ["nicht"],
    explanation: "Adjectives are negated with nicht: Die Lampe ist nicht neu.",
  },
  // D. English → German
  {
    id: "neg-e-zeit",
    kind: "typed",
    concept: "negation",
    instruction: "Write this in German.",
    prompt: "I have no time.",
    accepted: ["Ich habe keine Zeit."],
    explanation: "no time = keine Zeit: Ich habe keine Zeit.",
  },
  {
    id: "neg-e-schwierig",
    kind: "typed",
    concept: "negation",
    instruction: "Write this in German.",
    prompt: "The book is not difficult.",
    accepted: ["Das Buch ist nicht schwierig."],
    explanation: "Use nicht with an adjective: Das Buch ist nicht schwierig.",
  },
];

export const negationCourse: GrammarCourse = {
  taskId: "grammar-008",
  kicker: "Week 3 · Grammar",
  title: "Negation — nicht and kein",
  summary:
    "German has two ways to say no. Use kein with a noun, and nicht with everything else, such as verbs and adjectives.",
  goal: "Score at least 12/14 to complete this lesson.",
  questions: week3NegationQuiz,
  passMessage:
    "You can tell nicht and kein apart and choose the right form of kein. Keep using them in your own sentences.",
  failMessage:
    "You need at least 12/14 before this lesson is marked complete. Review when to use kein and nicht, and try again.",
  pages: [
    {
      id: "two-ways",
      heading: "Two ways to say no",
      blocks: [
        {
          type: "text",
          text: "German uses kein to negate a noun that would have ein/eine, or no article at all. It uses nicht for everything else: verbs, adjectives and other parts of the sentence.",
        },
        {
          type: "table",
          headers: ["Use", "When", "Example"],
          rows: [
            ["kein", "a noun with ein/eine or no article", "Ich habe keine Zeit."],
            ["nicht", "verbs, adjectives, other words", "Das Buch ist nicht neu."],
          ],
        },
      ],
    },
    {
      id: "nicht",
      heading: "nicht",
      blocks: [
        {
          type: "text",
          text: "nicht stays the same whatever the gender. For now, put it after the verb, and before an adjective.",
        },
        {
          type: "examples",
          items: [
            { german: "Ich lerne nicht.", english: "I am not studying." },
            { german: "Ich spreche nicht.", english: "I am not speaking." },
            { german: "Das Buch ist nicht neu.", english: "The book is not new." },
          ],
        },
      ],
    },
    {
      id: "kein",
      heading: "kein, keine, keinen",
      blocks: [
        {
          type: "text",
          text: "kein works exactly like ein and eine. It follows the same pattern you have just learned, including the masculine change in the accusative. The plural always uses keine.",
        },
        {
          type: "table",
          headers: ["Gender", "Nominative", "Accusative"],
          rows: [
            ["masculine", "kein", "keinen"],
            ["feminine", "keine", "keine"],
            ["neuter", "kein", "kein"],
            ["plural", "keine", "keine"],
          ],
        },
        {
          type: "examples",
          items: [
            { german: "Das ist kein Buch.", english: "That is not a book." },
            { german: "Ich habe keine Zeit.", english: "I have no time." },
            { german: "Ich habe keinen Stift.", english: "I do not have a pen." },
            { german: "Wir haben keine Bücher.", english: "We have no books." },
          ],
        },
      ],
    },
    {
      id: "compare",
      heading: "Making a sentence negative",
      blocks: [
        {
          type: "table",
          headers: ["Positive", "Negative"],
          rows: [
            ["Das ist ein Buch.", "Das ist kein Buch."],
            ["Ich habe einen Stift.", "Ich habe keinen Stift."],
            ["Ich habe Zeit.", "Ich habe keine Zeit."],
            ["Das Buch ist interessant.", "Das Buch ist nicht interessant."],
          ],
        },
        {
          type: "callout",
          title: "A quick test",
          text: "Ask yourself: is there a noun with ein, eine or no article? Then use kein. Otherwise use nicht.",
        },
      ],
    },
  ],
};

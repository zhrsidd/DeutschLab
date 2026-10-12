import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-007: the accusative case (direct object).
 * Only the article changes are taught: der → den and ein → einen.
 * Pronouns, dative and prepositions are out of scope.
 * Question ids start with "acc-" so reviews trace back to this lesson and
 * stay separate from the vocabulary "#article" concept.
 */

export const week3AccusativeQuiz: CourseQuestion[] = [
  // A. subject / direct object
  {
    id: "acc-c-obj-buch",
    kind: "choice",
    concept: "accusative",
    prompt: "Der Junge liest das Buch. Which words are the direct object?",
    options: ["Der Junge", "liest", "das Buch"],
    answer: "das Buch",
    explanation: "The boy (der Junge) is the subject. The book (das Buch) is what he reads: the direct object.",
  },
  {
    id: "acc-c-subj-apfel",
    kind: "choice",
    concept: "accusative",
    prompt: "Ich esse den Apfel. Which words are the subject?",
    options: ["Ich", "esse", "den Apfel"],
    answer: "Ich",
    explanation: "Ich does the eating, so it is the subject. den Apfel is the direct object.",
  },
  {
    id: "acc-c-obj-stift",
    kind: "choice",
    concept: "accusative",
    prompt: "Die Lehrerin hat einen Stift. Which words are the direct object?",
    options: ["Die Lehrerin", "hat", "einen Stift"],
    answer: "einen Stift",
    explanation: "The teacher is the subject. einen Stift is the direct object of hat.",
  },
  // B. article selection
  {
    id: "acc-c-den-tisch",
    kind: "choice",
    concept: "accusative",
    prompt: "Ich habe ___ Tisch.",
    options: ["der", "den", "die", "das"],
    answer: "den",
    explanation: "Tisch is masculine and a direct object here, so der becomes den: Ich habe den Tisch.",
  },
  {
    id: "acc-c-die-lampe",
    kind: "choice",
    concept: "accusative",
    prompt: "Ich habe ___ Lampe.",
    options: ["der", "den", "die"],
    answer: "die",
    explanation: "Feminine nouns do not change: die Lampe stays die Lampe.",
  },
  {
    id: "acc-c-einen-rucksack",
    kind: "choice",
    concept: "accusative",
    prompt: "Ich habe ___ Rucksack.",
    options: ["ein", "eine", "einen"],
    answer: "einen",
    explanation: "Rucksack is masculine, so ein becomes einen: Ich habe einen Rucksack.",
  },
  {
    id: "acc-c-correct-sentence",
    kind: "choice",
    concept: "accusative",
    prompt: "Which sentence is correct?",
    options: ["Ich habe der Stift.", "Ich habe den Stift.", "Ich habe die Stift."],
    answer: "Ich habe den Stift.",
    explanation: "Stift is masculine and the direct object: den Stift.",
  },
  // C. sentence completion
  {
    id: "acc-f-einen-stift",
    kind: "fill",
    concept: "accusative",
    sentence: "Ich habe ___ Stift.",
    hint: "(ein)",
    accepted: ["einen"],
    explanation: "Masculine direct object: ein → einen. Ich habe einen Stift.",
  },
  {
    id: "acc-f-das-buch",
    kind: "fill",
    concept: "accusative",
    sentence: "Ich lese ___ Buch.",
    hint: "(das)",
    accepted: ["das"],
    explanation: "Neuter nouns do not change: Ich lese das Buch.",
  },
  {
    id: "acc-f-eine-tasche",
    kind: "fill",
    concept: "accusative",
    sentence: "Ich habe ___ Tasche.",
    hint: "(ein)",
    accepted: ["eine"],
    explanation: "Feminine nouns do not change: Ich habe eine Tasche.",
  },
  {
    id: "acc-f-den-apfel",
    kind: "fill",
    concept: "accusative",
    sentence: "Ich esse ___ Apfel.",
    hint: "(der)",
    accepted: ["den"],
    explanation: "Masculine direct object: der → den. Ich esse den Apfel.",
  },
  // D. nominative → accusative conversion
  {
    id: "acc-t-convert-stift",
    kind: "typed",
    concept: "accusative",
    instruction: "Use the pen as the direct object.",
    prompt: "Der Stift ist neu. → I have the pen.",
    accepted: ["Ich habe den Stift."],
    explanation: "Der Stift (subject) becomes den Stift (direct object): Ich habe den Stift.",
  },
  // E. English → German
  {
    id: "acc-t-bruder",
    kind: "typed",
    concept: "accusative",
    instruction: "Write this in German.",
    prompt: "I have a brother.",
    accepted: ["Ich habe einen Bruder."],
    explanation: "Bruder is masculine: Ich habe einen Bruder.",
  },
  {
    id: "acc-t-tasche",
    kind: "typed",
    concept: "accusative",
    instruction: "Write this in German.",
    prompt: "I have the bag.",
    accepted: ["Ich habe die Tasche."],
    explanation: "Tasche is feminine, so die stays die: Ich habe die Tasche.",
  },
  {
    id: "acc-t-buch",
    kind: "typed",
    concept: "accusative",
    instruction: "Write this in German.",
    prompt: "I read the book.",
    accepted: ["Ich lese das Buch."],
    explanation: "Buch is neuter, so das stays das: Ich lese das Buch.",
  },
];

export const accusativeCourse: GrammarCourse = {
  taskId: "grammar-007",
  kicker: "Week 3 · Grammar",
  title: "The accusative case",
  summary:
    "When a noun is the direct object of a sentence, the masculine article changes: der becomes den, and ein becomes einen. Everything else stays the same.",
  goal: "Score at least 12/15 to complete this lesson.",
  questions: week3AccusativeQuiz,
  passMessage:
    "You can mark a direct object with den and einen. Watch for masculine nouns every time you say what you have, read or eat.",
  failMessage:
    "You need at least 12/15 before this lesson is marked complete. Review the tables, remember that only masculine articles change, and try again.",
  pages: [
    {
      id: "subject-object",
      heading: "Subject and direct object",
      blocks: [
        {
          type: "text",
          text: "Most sentences have a subject, who or what does the action, and often a direct object, who or what the action affects. The subject is in the nominative. The direct object is in the accusative.",
        },
        {
          type: "table",
          headers: ["Der Junge", "liest", "das Buch"],
          rows: [["subject (nominative)", "verb", "direct object (accusative)"]],
        },
        {
          type: "examples",
          items: [
            { german: "Der Junge liest das Buch.", english: "The boy reads the book." },
            { german: "Ich habe einen Stift.", english: "I have a pen.", note: "Ich = subject, einen Stift = direct object." },
          ],
        },
      ],
    },
    {
      id: "definite",
      heading: "der, die, das in the accusative",
      blocks: [
        {
          type: "table",
          headers: ["Gender", "Nominative", "Accusative"],
          rows: [
            ["masculine", "der", "den"],
            ["feminine", "die", "die"],
            ["neuter", "das", "das"],
            ["plural", "die", "die"],
          ],
        },
        {
          type: "callout",
          title: "Only masculine changes",
          text: "Feminine, neuter and plural articles look exactly the same in the accusative. Only der becomes den.",
        },
      ],
    },
    {
      id: "indefinite",
      heading: "ein and eine in the accusative",
      blocks: [
        {
          type: "table",
          headers: ["Gender", "Nominative", "Accusative"],
          rows: [
            ["masculine", "ein", "einen"],
            ["feminine", "eine", "eine"],
            ["neuter", "ein", "ein"],
          ],
        },
        {
          type: "examples",
          items: [
            { german: "Ich habe einen Stift.", english: "I have a pen." },
            { german: "Ich habe eine Tasche.", english: "I have a bag." },
            { german: "Ich lese ein Buch.", english: "I am reading a book." },
          ],
        },
      ],
    },
    {
      id: "compare",
      heading: "Side by side",
      blocks: [
        {
          type: "text",
          text: "Compare the same noun as a subject and as a direct object. Only the masculine noun changes its article.",
        },
        {
          type: "table",
          headers: ["Subject (nominative)", "Direct object (accusative)"],
          rows: [
            ["Der Stift ist neu.", "Ich habe den Stift."],
            ["Ein Stift ist hier.", "Ich habe einen Stift."],
            ["Die Tasche ist groß.", "Ich habe die Tasche."],
            ["Das Buch ist interessant.", "Ich lese das Buch."],
          ],
        },
        {
          type: "callout",
          title: "Keep gender and case apart",
          text: "Knowing that Tisch is masculine (der Tisch) is one skill. Remembering to say den Tisch as a direct object is another. Practise both.",
        },
      ],
    },
  ],
};

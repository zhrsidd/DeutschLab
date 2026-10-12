import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-006: nouns, articles and plurals (nominative only).
 * Question ids start with "art-" so reviews trace back to this lesson.
 * Accusative (den, einen) and nicht/kein belong to later lessons.
 */

export const week3ArticlesQuiz: CourseQuestion[] = [
  // A. identify grammatical gender
  {
    id: "art-c-gender-lampe",
    kind: "choice",
    prompt: "What is the grammatical gender of die Lampe?",
    options: ["masculine", "feminine", "neuter"],
    answer: "feminine",
    explanation: "die goes with feminine nouns: die Lampe.",
  },
  {
    id: "art-c-gender-buch",
    kind: "choice",
    prompt: "What is the grammatical gender of das Buch?",
    options: ["masculine", "feminine", "neuter"],
    answer: "neuter",
    explanation: "das goes with neuter nouns: das Buch.",
  },
  // B. choose der / die / das
  {
    id: "art-c-tisch",
    kind: "choice",
    prompt: "Choose the correct article: ___ Tisch ist groß.",
    options: ["Der", "Die", "Das"],
    answer: "Der",
    explanation: "Tisch is masculine: der Tisch. Der Tisch ist groß.",
  },
  {
    id: "art-c-fenster",
    kind: "choice",
    prompt: "Choose the correct article: ___ Fenster ist neu.",
    options: ["Der", "Die", "Das"],
    answer: "Das",
    explanation: "Fenster is neuter: das Fenster. Das Fenster ist neu.",
  },
  // C. choose ein / eine
  {
    id: "art-c-ein-lampe",
    kind: "choice",
    prompt: "Das ist ___ Lampe.",
    options: ["ein", "eine"],
    answer: "eine",
    explanation: "Lampe is feminine, so it takes eine: eine Lampe.",
  },
  {
    id: "art-c-ein-buch",
    kind: "choice",
    prompt: "Das ist ___ Buch.",
    options: ["ein", "eine"],
    answer: "ein",
    explanation: "Buch is neuter, so it takes ein: ein Buch.",
  },
  // D. singular vs plural
  {
    id: "art-c-which-plural",
    kind: "choice",
    prompt: "Which of these is plural?",
    options: ["der Tisch", "die Tische", "die Lampe", "das Buch"],
    answer: "die Tische",
    explanation: "Tische is the plural of Tisch. Plural nouns use die.",
  },
  {
    id: "art-c-plural-buch",
    kind: "choice",
    prompt: "What is the plural of das Buch?",
    options: ["die Bücher", "die Buchs", "die Büchen", "die Bucher"],
    answer: "die Bücher",
    explanation: "das Buch → die Bücher (umlaut and -er).",
  },
  {
    id: "art-c-plural-article",
    kind: "choice",
    prompt: "Which article goes with every plural noun?",
    options: ["der", "die", "das", "ein"],
    answer: "die",
    explanation: "All plural nouns take die: die Tische, die Lampen, die Bücher.",
  },
  // E. nominative subject
  {
    id: "art-c-subject",
    kind: "choice",
    prompt: "Which words are the subject? Die Lampe ist neu.",
    options: ["Die Lampe", "ist", "neu"],
    answer: "Die Lampe",
    explanation: "The subject is what the sentence is about: die Lampe, in the nominative.",
  },
  // F. sentence completion
  {
    id: "art-f-lehrer",
    kind: "fill",
    sentence: "___ Lehrer ist gut.",
    accepted: ["Der"],
    explanation: "Lehrer is masculine: Der Lehrer ist gut.",
  },
  {
    id: "art-f-tasche",
    kind: "fill",
    sentence: "___ Tasche ist klein.",
    accepted: ["Die"],
    explanation: "Tasche is feminine: Die Tasche ist klein.",
  },
  {
    id: "art-f-schere",
    kind: "fill",
    sentence: "Das ist ___ Schere.",
    accepted: ["eine"],
    explanation: "Schere is feminine: Das ist eine Schere.",
  },
  // G. typed noun + article, typed plural
  {
    id: "art-t-stuhl",
    kind: "typed",
    instruction: "Write this in German, with the article.",
    prompt: "the chair",
    accepted: ["der Stuhl"],
    explanation: "Stuhl is masculine: der Stuhl.",
  },
  {
    id: "art-t-plural-tisch",
    kind: "typed",
    instruction: "Write the plural, with the article.",
    prompt: "der Tisch",
    accepted: ["die Tische"],
    explanation: "der Tisch → die Tische.",
  },
  {
    id: "art-t-ein-bett",
    kind: "typed",
    instruction: "Write this in German, with ein or eine.",
    prompt: "a bed",
    accepted: ["ein Bett"],
    explanation: "Bett is neuter: ein Bett.",
  },
];

export const articlesCourse: GrammarCourse = {
  taskId: "grammar-006",
  kicker: "Week 3 · Grammar",
  title: "Nouns, articles and plurals",
  summary:
    "Every German noun has a gender, and the gender decides the article. Learn how der, die, das and ein, eine work, and how plurals behave.",
  goal: "Score at least 13/16 to complete this lesson.",
  questions: week3ArticlesQuiz,
  passMessage:
    "You can pick the right article and recognise plurals. Keep learning each new noun together with its article and plural.",
  failMessage:
    "You need at least 13/16 before this lesson is marked complete. Review the gender and plural pages, then try again.",
  pages: [
    {
      id: "gender",
      heading: "Every noun has a gender",
      blocks: [
        {
          type: "text",
          text: "German nouns are masculine, feminine or neuter. This is grammatical gender, not biological gender: a table is not male. The gender decides which article you use.",
        },
        {
          type: "table",
          headers: ["Gender", "the", "Example"],
          rows: [
            ["masculine", "der", "der Tisch"],
            ["feminine", "die", "die Lampe"],
            ["neuter", "das", "das Buch"],
          ],
        },
        {
          type: "callout",
          title: "You cannot guess the gender",
          text: "The gender usually does not follow from the English meaning. das Mädchen (the girl) is neuter. Always learn a noun together with its article.",
        },
      ],
    },
    {
      id: "definite",
      heading: "der, die, das = the",
      blocks: [
        {
          type: "text",
          text: "der, die and das all mean “the”. You choose the one that matches the noun's gender.",
        },
        {
          type: "examples",
          items: [
            { german: "Der Tisch ist groß.", english: "The table is big." },
            { german: "Die Lampe ist neu.", english: "The lamp is new." },
            { german: "Das Fenster ist klein.", english: "The window is small." },
          ],
        },
      ],
    },
    {
      id: "indefinite",
      heading: "ein and eine = a / an",
      blocks: [
        {
          type: "text",
          text: "ein and eine mean “a” or “an”. Use ein for masculine and neuter nouns, and eine for feminine nouns.",
        },
        {
          type: "table",
          headers: ["Gender", "the", "a / an"],
          rows: [
            ["masculine", "der Tisch", "ein Tisch"],
            ["feminine", "die Lampe", "eine Lampe"],
            ["neuter", "das Buch", "ein Buch"],
          ],
        },
        {
          type: "examples",
          items: [
            { german: "Das ist ein Tisch.", english: "That is a table." },
            { german: "Das ist eine Lampe.", english: "That is a lamp." },
            { german: "Das ist ein Buch.", english: "That is a book." },
          ],
        },
      ],
    },
    {
      id: "nominative",
      heading: "The nominative: the subject",
      blocks: [
        {
          type: "text",
          text: "The nominative is the form you use for the subject of a sentence, the person or thing the sentence is about. It is also the form listed in the dictionary and in your vocabulary lists. So far, every article you have learned is a nominative article.",
        },
        {
          type: "examples",
          items: [
            { german: "Der Lehrer ist hier.", english: "The teacher is here." },
            { german: "Die Lampe ist neu.", english: "The lamp is new." },
            { german: "Das Buch ist interessant.", english: "The book is interesting." },
          ],
        },
      ],
    },
    {
      id: "plurals",
      heading: "Plurals",
      blocks: [
        {
          type: "text",
          text: "In the plural, the article is always die, whatever the gender. German plurals have no single rule. Some add an ending, some add an umlaut, and some do not change at all. Learn the plural with each new noun.",
        },
        {
          type: "table",
          headers: ["Singular", "Plural", "Pattern"],
          rows: [
            ["der Tisch", "die Tische", "-e"],
            ["die Lampe", "die Lampen", "-n"],
            ["die Tasche", "die Taschen", "-n"],
            ["der Stuhl", "die Stühle", "umlaut + -e"],
            ["das Buch", "die Bücher", "umlaut + -er"],
            ["das Fenster", "die Fenster", "no change"],
            ["das Auto", "die Autos", "-s"],
          ],
        },
        {
          type: "callout",
          title: "No plural “a”",
          text: "There is no plural of ein or eine. English “a book” becomes “books” in the plural: Bücher, with no article at all. Some mass nouns, such as die Milch, have no ordinary plural.",
        },
      ],
    },
  ],
};

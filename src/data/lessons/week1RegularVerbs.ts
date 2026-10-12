import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-002: regular present-tense verbs + verb-second word order.
 * Only genuinely regular verbs are used (lernen, wohnen, machen, kommen).
 * Question ids start with "rv-" so reviews can be traced to this lesson.
 */

export const week1RegularVerbsQuiz: CourseQuestion[] = [
  // A. choose the correct conjugation
  {
    id: "rv-c-du-lernen",
    kind: "choice",
    prompt: "Du ___ Deutsch. (lernen)",
    options: ["lernst", "lerne", "lernt", "lernen"],
    answer: "lernst",
    explanation: "du → stem lern- + -st: du lernst.",
  },
  {
    id: "rv-c-wir-wohnen",
    kind: "choice",
    prompt: "Wir ___ in Doha. (wohnen)",
    options: ["wohnen", "wohnt", "wohne", "wohnst"],
    answer: "wohnen",
    explanation: "wir → stem wohn- + -en: wir wohnen.",
  },
  {
    id: "rv-c-ihr-machen",
    kind: "choice",
    prompt: "Ihr ___ Sport. (machen)",
    options: ["macht", "machen", "mache", "machst"],
    answer: "macht",
    explanation: "ihr → stem mach- + -t: ihr macht.",
  },
  {
    id: "rv-c-v2",
    kind: "choice",
    prompt: "Which sentence has the verb in position 2?",
    options: [
      "Heute lerne ich Deutsch.",
      "Heute ich lerne Deutsch.",
      "Heute Deutsch lerne ich.",
      "Lerne heute ich Deutsch.",
    ],
    answer: "Heute lerne ich Deutsch.",
    explanation:
      "Heute is position 1 and lerne (the verb) is position 2. The subject ich follows the verb.",
  },
  // B. fill the correct verb form
  {
    id: "rv-f-ich-lernen",
    kind: "fill",
    sentence: "Ich ___ Deutsch.",
    hint: "(lernen)",
    accepted: ["lerne"],
    explanation: "ich → lern- + -e: Ich lerne Deutsch.",
  },
  {
    id: "rv-f-du-wohnen",
    kind: "fill",
    sentence: "Du ___ in Doha.",
    hint: "(wohnen)",
    accepted: ["wohnst"],
    explanation: "du → wohn- + -st: Du wohnst in Doha.",
  },
  {
    id: "rv-f-anna-machen",
    kind: "fill",
    sentence: "Anna ___ Sport.",
    hint: "(machen)",
    accepted: ["macht"],
    explanation: "Anna = sie (one person) → mach- + -t: Anna macht Sport.",
  },
  // C. build the sentence
  {
    id: "rv-r-heute",
    kind: "reorder",
    words: ["Heute", "ich", "Deutsch", "lerne"],
    accepted: ["Heute lerne ich Deutsch.", "Ich lerne heute Deutsch."],
    explanation:
      "The verb must be in position 2: Heute lerne ich Deutsch. (Ich lerne heute Deutsch is also correct.)",
  },
  {
    id: "rv-r-doha",
    kind: "reorder",
    words: ["In", "Doha", "wohne", "ich"],
    accepted: ["In Doha wohne ich.", "Ich wohne in Doha."],
    explanation:
      "Starting with In Doha puts the verb second: In Doha wohne ich. (Ich wohne in Doha is also correct.)",
  },
  // D. short typed production
  {
    id: "rv-t-wir-lernen",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "We learn German.",
    accepted: ["Wir lernen Deutsch."],
    explanation: "wir → lern- + -en: Wir lernen Deutsch.",
  },
  {
    id: "rv-t-du-wohnen",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "You (informal) live in Doha.",
    accepted: ["Du wohnst in Doha."],
    explanation: "du → wohn- + -st: Du wohnst in Doha.",
  },
  {
    id: "rv-t-sie-kommen",
    kind: "typed",
    instruction: "Write this in German.",
    prompt: "They come from India.",
    accepted: ["Sie kommen aus Indien."],
    explanation: "sie (they) → komm- + -en: Sie kommen aus Indien.",
  },
];

export const regularVerbsCourse: GrammarCourse = {
  taskId: "grammar-002",
  title: "Regular verbs + word order",
  summary:
    "Most German verbs follow one simple pattern. Learn the endings, then build sentences with the verb in the right place.",
  goal: "Score at least 10/12 to complete this lesson.",
  questions: week1RegularVerbsQuiz,
  passMessage:
    "You can conjugate regular verbs and place the verb correctly. Next you'll use this to ask questions.",
  failMessage:
    "You need at least 10/12 before this lesson is marked complete. Review the endings and the position-2 rule, then try again.",
  pages: [
    {
      id: "stem",
      heading: "Stem + ending",
      blocks: [
        {
          type: "text",
          text: "A verb's dictionary form (the infinitive) ends in -en: lernen, wohnen, machen. Remove -en to get the stem, then add an ending that matches the pronoun.",
        },
        {
          type: "table",
          headers: ["Pronoun", "Ending", "lernen (stem lern-)"],
          rows: [
            ["ich", "-e", "ich lerne"],
            ["du", "-st", "du lernst"],
            ["er / sie / es", "-t", "er lernt"],
            ["wir", "-en", "wir lernen"],
            ["ihr", "-t", "ihr lernt"],
            ["sie / Sie", "-en", "sie lernen / Sie lernen"],
          ],
        },
        {
          type: "callout",
          title: "Not every verb follows this",
          text: "sein is irregular (ich bin, du bist …), so it doesn't use these endings. The regular pattern works for most verbs you'll meet.",
        },
      ],
    },
    {
      id: "tables",
      heading: "Four regular verbs",
      blocks: [
        {
          type: "table",
          headers: ["", "lernen", "wohnen", "machen", "kommen"],
          rows: [
            ["ich", "lerne", "wohne", "mache", "komme"],
            ["du", "lernst", "wohnst", "machst", "kommst"],
            ["er / sie / es", "lernt", "wohnt", "macht", "kommt"],
            ["wir", "lernen", "wohnen", "machen", "kommen"],
            ["ihr", "lernt", "wohnt", "macht", "kommt"],
            ["sie / Sie", "lernen", "wohnen", "machen", "kommen"],
          ],
        },
        {
          type: "text",
          text: "machen = to do / to make. Notice that er/sie/es and ihr share the same form, and so do wir and sie/Sie.",
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
            {
              german: "Ich lerne Deutsch.",
              english: "I am learning German.",
              note: "ich → lern- + -e",
            },
            {
              german: "Du wohnst in Doha.",
              english: "You live in Doha.",
              note: "du → wohn- + -st",
            },
            {
              german: "Zuhayr lernt Deutsch.",
              english: "Zuhayr is learning German.",
              note: "One person (= er) → lern- + -t",
            },
            {
              german: "Wir wohnen in Doha.",
              english: "We live in Doha.",
              note: "wir → wohn- + -en",
            },
            {
              german: "Ihr macht Sport.",
              english: "You (all) do sport.",
              note: "ihr → mach- + -t",
            },
            {
              german: "Sie kommen aus Indien.",
              english: "They come from India.",
              note: "sie (they) → komm- + -en",
            },
          ],
        },
      ],
    },
    {
      id: "v2",
      heading: "The verb is in position 2",
      blocks: [
        {
          type: "text",
          text: "In a normal German statement, the conjugated verb is always the second item. The first position can be the subject, or something else such as a time or a place.",
        },
        {
          type: "table",
          headers: ["Position 1", "Position 2 (verb)", "Rest"],
          rows: [
            ["Ich", "lerne", "Deutsch."],
            ["Heute", "lerne", "ich Deutsch."],
            ["In Doha", "wohne", "ich."],
          ],
        },
        {
          type: "callout",
          title: "Same meaning, different start",
          text: "When something other than the subject comes first, the subject moves behind the verb: Heute lerne ich Deutsch, not Heute ich lerne Deutsch.",
        },
      ],
    },
  ],
};

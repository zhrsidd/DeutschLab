import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-003: yes/no questions + basic W-questions.
 * Question ids start with "qn-". heißen and kommen appear only in the
 * familiar forms needed here (du heißt, Sie heißen, du kommst, ...).
 */

export const week1QuestionsQuiz: CourseQuestion[] = [
  // A. identify the correct question
  {
    id: "qn-c-yesno",
    kind: "choice",
    prompt: "Which is the correct yes/no question?",
    options: [
      "Lernst du Deutsch?",
      "Lernst Deutsch du?",
      "Lernen du Deutsch?",
      "Du Deutsch lernst?",
    ],
    answer: "Lernst du Deutsch?",
    explanation:
      "In a yes/no question the verb comes first, and it must match the subject: lernst du.",
  },
  {
    id: "qn-c-wo",
    kind: "choice",
    prompt: "Which question means “Where do you live?”",
    options: [
      "Wo wohnst du?",
      "Wie wohnst du?",
      "Woher wohnst du?",
      "Wer wohnst du?",
    ],
    answer: "Wo wohnst du?",
    explanation: "wo = where (a place). woher asks where from.",
  },
  // B. convert a statement into a yes/no question
  {
    id: "qn-v-lernen",
    kind: "typed",
    instruction: "Turn the statement into a yes/no question.",
    prompt: "Du lernst Deutsch.",
    accepted: ["Lernst du Deutsch?"],
    explanation: "Put the verb first: Lernst du Deutsch?",
  },
  {
    id: "qn-v-wohnen-sie",
    kind: "typed",
    instruction: "Turn the statement into a yes/no question.",
    prompt: "Sie wohnen in Doha.",
    accepted: ["Wohnen Sie in Doha?"],
    explanation: "Verb first, and formal Sie keeps its capital: Wohnen Sie in Doha?",
  },
  {
    id: "qn-v-kommen-ihr",
    kind: "typed",
    instruction: "Turn the statement into a yes/no question.",
    prompt: "Ihr kommt aus Indien.",
    accepted: ["Kommt ihr aus Indien?"],
    explanation: "Verb first: Kommt ihr aus Indien?",
  },
  // C. choose the appropriate W-word
  {
    id: "qn-w-wie",
    kind: "choice",
    prompt: "___ heißt du?",
    options: ["Wie", "Wo", "Wer", "Woher"],
    answer: "Wie",
    explanation: "Wie heißt du? = What's your name? (literally “How are you called?”)",
  },
  {
    id: "qn-w-woher",
    kind: "choice",
    prompt: "___ kommst du?",
    options: ["Woher", "Wo", "Was", "Wie"],
    answer: "Woher",
    explanation: "woher = where from: Woher kommst du?",
  },
  {
    id: "qn-w-was",
    kind: "choice",
    prompt: "___ lernst du? — Ich lerne Deutsch.",
    options: ["Was", "Wer", "Wo", "Woher"],
    answer: "Was",
    explanation: "was = what: Was lernst du?",
  },
  // D. reorder
  {
    id: "qn-r-wo",
    kind: "reorder",
    words: ["wohnst", "du", "Wo"],
    accepted: ["Wo wohnst du?"],
    explanation: "W-word first, verb second: Wo wohnst du?",
  },
  {
    id: "qn-r-woher-sie",
    kind: "reorder",
    words: ["Sie", "Woher", "kommen"],
    accepted: ["Woher kommen Sie?"],
    explanation: "W-word first, then the verb: Woher kommen Sie?",
  },
  // E. typed production
  {
    id: "qn-t-wo",
    kind: "typed",
    instruction: "Write this question in German.",
    prompt: "Where do you live? (informal)",
    accepted: ["Wo wohnst du?"],
    explanation: "wo + verb + subject: Wo wohnst du?",
  },
  {
    id: "qn-t-name",
    kind: "typed",
    instruction: "Write this question in German.",
    prompt: "What's your name? (informal)",
    accepted: ["Wie heißt du?"],
    explanation: "Wie heißt du? is the standard way to ask someone's name.",
  },
];

export const questionsCourse: GrammarCourse = {
  taskId: "grammar-003",
  title: "Questions in German",
  summary:
    "Ask someone's name, where they live and where they're from, using yes/no questions and W-questions.",
  goal: "Score at least 10/12 to complete this lesson.",
  questions: week1QuestionsQuiz,
  passMessage:
    "You can ask basic questions in German. You're ready to combine everything in your self-introduction.",
  failMessage:
    "You need at least 10/12 before this lesson is marked complete. Review the question patterns and try again.",
  pages: [
    {
      id: "yesno",
      heading: "Yes/no questions",
      blocks: [
        {
          type: "text",
          text: "To ask a yes/no question, put the conjugated verb first. The subject follows it. Everything else stays the same.",
        },
        {
          type: "table",
          headers: ["Statement", "Question"],
          rows: [
            ["Du lernst Deutsch.", "Lernst du Deutsch?"],
            ["Sie wohnen in Doha.", "Wohnen Sie in Doha?"],
            ["Ihr kommt aus Indien.", "Kommt ihr aus Indien?"],
          ],
        },
        {
          type: "callout",
          title: "Answering",
          text: "Ja, ich lerne Deutsch. / Nein, ich lerne Französisch.",
        },
      ],
    },
    {
      id: "wquestions",
      heading: "W-questions",
      blocks: [
        {
          type: "text",
          text: "A W-question starts with a question word. The verb comes straight after it, in position 2, just like a normal statement.",
        },
        {
          type: "table",
          headers: ["Question word", "Meaning", "Example"],
          rows: [
            ["wer", "who", "Wer ist das?"],
            ["was", "what", "Was lernst du?"],
            ["wo", "where", "Wo wohnst du?"],
            ["woher", "where from", "Woher kommst du?"],
            ["wie", "how", "Wie heißt du?"],
          ],
        },
        {
          type: "callout",
          title: "Useful chunks",
          text: "Wie heißt du? (informal) and Wie heißen Sie? (formal) both mean “What's your name?”. Learn them as phrases for now.",
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
              german: "Wie heißt du? — Ich heiße Anna.",
              english: "What's your name? — My name is Anna.",
            },
            {
              german: "Wo wohnst du? — Ich wohne in Doha.",
              english: "Where do you live? — I live in Doha.",
            },
            {
              german: "Woher kommst du? — Ich komme aus Indien.",
              english: "Where are you from? — I come from India.",
            },
            {
              german: "Was lernst du? — Ich lerne Deutsch.",
              english: "What are you learning? — I am learning German.",
            },
            {
              german: "Wer ist das? — Das ist Herr Weber.",
              english: "Who is that? — That is Mr Weber.",
            },
            {
              german: "Wohnen Sie in Doha? — Ja, ich wohne in Doha.",
              english: "Do you live in Doha? (formal) — Yes, I live in Doha.",
            },
          ],
        },
      ],
    },
  ],
};

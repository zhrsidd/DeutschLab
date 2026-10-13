import type {
  CourseQuestion,
  GrammarCourse,
} from "./grammarCourseTypes";

/*
 * grammar-009: accusative personal pronouns (mich, dich, ihn, ...).
 * Only the direct object is taught; dative pronouns (mir, dir, ihm) stay out
 * of scope. Questions test the pronoun choice itself, mostly with regular
 * verbs (kennen, fragen, besuchen, brauchen, suchen), so a wrong answer is
 * about the pronoun and not a verb form. Ids start with "pr-" so reviews
 * trace back to this lesson and stay separate from the article concepts.
 */

export const week4PronounsQuiz: CourseQuestion[] = [
  // A. choose the pronoun
  {
    id: "pr-c-mich",
    kind: "choice",
    concept: "pronoun",
    prompt: "Der Lehrer fragt ___. (ich)",
    options: ["ich", "mich", "dich"],
    answer: "mich",
    explanation: "The teacher is the subject. I am the direct object, so ich becomes mich: Der Lehrer fragt mich.",
  },
  {
    id: "pr-c-dich",
    kind: "choice",
    concept: "pronoun",
    prompt: "Ich kenne ___. (du)",
    options: ["du", "dich", "mich"],
    answer: "dich",
    explanation: "du is the direct object here, so it becomes dich: Ich kenne dich.",
  },
  {
    id: "pr-c-ihn-lehrer",
    kind: "choice",
    concept: "pronoun",
    prompt: "Ich sehe den Lehrer. → Ich sehe ___.",
    options: ["er", "ihn", "es", "sie"],
    answer: "ihn",
    explanation: "den Lehrer is a masculine direct object. Its pronoun is ihn (just as der becomes den, er becomes ihn).",
  },
  {
    id: "pr-c-sie-lehrerin",
    kind: "choice",
    concept: "pronoun",
    prompt: "Ich frage die Lehrerin. → Ich frage ___.",
    options: ["sie", "ihn", "es"],
    answer: "sie",
    explanation: "die Lehrerin is feminine. sie does not change in the accusative: Ich frage sie.",
  },
  {
    id: "pr-c-es-buch",
    kind: "choice",
    concept: "pronoun",
    prompt: "Ich lese das Buch. → Ich lese ___.",
    options: ["es", "ihn", "sie"],
    answer: "es",
    explanation: "das Buch is neuter, so the pronoun is es. es does not change in the accusative.",
  },
  {
    id: "pr-c-uns",
    kind: "choice",
    concept: "pronoun",
    prompt: "Die Lehrerin besucht ___. (wir)",
    options: ["wir", "uns", "euch"],
    answer: "uns",
    explanation: "We are the direct object, so wir becomes uns: Die Lehrerin besucht uns.",
  },
  {
    id: "pr-c-euch",
    kind: "choice",
    concept: "pronoun",
    prompt: "Wir kennen ___. (ihr)",
    options: ["ihr", "euch", "uns"],
    answer: "euch",
    explanation: "ihr as a direct object becomes euch: Wir kennen euch.",
  },
  {
    id: "pr-c-formal",
    kind: "choice",
    concept: "pronoun",
    prompt: "Herr Weber, ich verstehe ___ nicht. (Sie, formal)",
    options: ["Sie", "dich", "ihn"],
    answer: "Sie",
    explanation: "Formal Sie stays Sie in the accusative, still with a capital S: Ich verstehe Sie nicht.",
  },
  // B. subject or direct object
  {
    id: "pr-c-obj-ihn",
    kind: "choice",
    concept: "pronoun",
    prompt: "Der Junge sucht ihn. Which word is the direct object?",
    options: ["Der Junge", "sucht", "ihn"],
    answer: "ihn",
    explanation: "Der Junge does the looking: the subject. ihn is who he is looking for: the direct object.",
  },
  {
    id: "pr-c-subj-sie",
    kind: "choice",
    concept: "pronoun",
    prompt: "Sie kennt mich. Which word is the subject?",
    options: ["Sie", "kennt", "mich"],
    answer: "Sie",
    explanation: "kennt with -t shows that Sie means she here: she knows me. mich is the direct object.",
  },
  // C. replace the noun
  {
    id: "pr-f-ihn-stift",
    kind: "fill",
    concept: "pronoun",
    sentence: "Ich brauche den Stift. → Ich brauche ___.",
    accepted: ["ihn"],
    explanation: "Stift is masculine, so den Stift becomes ihn. German uses er / ihn for masculine things too, not only for people.",
  },
  {
    id: "pr-f-sie-buecher",
    kind: "fill",
    concept: "pronoun",
    sentence: "Ich kaufe die Bücher. → Ich kaufe ___.",
    accepted: ["sie"],
    explanation: "die Bücher is plural. The plural pronoun sie does not change: Ich kaufe sie.",
  },
  {
    id: "pr-t-replace-tasche",
    kind: "typed",
    concept: "pronoun",
    instruction: "Replace the noun with a pronoun.",
    prompt: "Ich suche die Tasche.",
    accepted: ["Ich suche sie."],
    explanation: "die Tasche is feminine, so it becomes sie: Ich suche sie.",
  },
  // D. complete the question
  {
    id: "pr-f-kennst-mich",
    kind: "fill",
    concept: "pronoun",
    sentence: "Kennst du ___?",
    hint: "(ich)",
    accepted: ["mich"],
    explanation: "du is the subject; I am the direct object: Kennst du mich?",
  },
  // E. English → German
  {
    id: "pr-t-know-him",
    kind: "typed",
    concept: "pronoun",
    instruction: "Write this in German.",
    prompt: "I know him.",
    accepted: ["Ich kenne ihn."],
    explanation: "him as a direct object is ihn: Ich kenne ihn.",
  },
  {
    id: "pr-t-visits-us",
    kind: "typed",
    concept: "pronoun",
    instruction: "Write this in German.",
    prompt: "She visits us.",
    accepted: ["Sie besucht uns."],
    explanation: "She is the subject (Sie besucht); us is the direct object (uns).",
  },
];

export const pronounsCourse: GrammarCourse = {
  taskId: "grammar-009",
  kicker: "Week 4 · Grammar",
  title: "Accusative pronouns",
  summary:
    "Pronouns can replace a noun when the meaning is clear. As a direct object, ich becomes mich, du becomes dich, er becomes ihn, wir becomes uns and ihr becomes euch.",
  goal: "Score at least 13/16 to complete this lesson.",
  questions: week4PronounsQuiz,
  passMessage:
    "You can replace a direct object with mich, dich, ihn, sie, es, uns or euch. Listen for them in every conversation.",
  failMessage:
    "You need at least 13/16 before this lesson is marked complete. Go back over the table, remember that er becomes ihn just like der becomes den, and try again.",
  pages: [
    {
      id: "replace",
      heading: "Pronouns replace nouns",
      blocks: [
        {
          type: "text",
          text: "Once it is clear who or what you mean, you can replace a noun with a pronoun, just as in English: I see the teacher → I see him.",
        },
        {
          type: "examples",
          items: [
            { german: "Ich sehe den Lehrer. → Ich sehe ihn.", english: "I see the teacher. → I see him." },
            { german: "Ich kenne die Lehrerin. → Ich kenne sie.", english: "I know the teacher. → I know her." },
            { german: "Ich lese das Buch. → Ich lese es.", english: "I am reading the book. → I am reading it." },
          ],
        },
      ],
    },
    {
      id: "subject-object",
      heading: "Subject or direct object?",
      blocks: [
        {
          type: "text",
          text: "A pronoun has one form for the subject (who does the action) and one for the direct object (who or what the action affects). Ask: who is doing it?",
        },
        {
          type: "table",
          headers: ["Subject (nominative)", "Verb", "Direct object (accusative)"],
          rows: [
            ["Ich", "frage", "dich."],
            ["Du", "fragst", "mich."],
            ["Der Lehrer", "kennt", "uns."],
            ["Wir", "kennen", "ihn."],
          ],
        },
        {
          type: "callout",
          title: "The ending of the verb helps",
          text: "In Sie kennt mich, kennt ends in -t, so Sie means she (the subject). mich is the direct object.",
        },
      ],
    },
    {
      id: "table",
      heading: "The accusative pronouns",
      blocks: [
        {
          type: "table",
          headers: ["Nominative", "Accusative", "English"],
          rows: [
            ["ich", "mich", "me"],
            ["du", "dich", "you"],
            ["er", "ihn", "him / it"],
            ["sie", "sie", "her / it"],
            ["es", "es", "it"],
            ["wir", "uns", "us"],
            ["ihr", "euch", "you (plural)"],
            ["sie", "sie", "them"],
            ["Sie", "Sie", "you (formal)"],
          ],
        },
        {
          type: "callout",
          title: "er → ihn, like der → den",
          text: "Only the masculine form changes among er, sie and es, exactly as with articles. sie, es and Sie look the same as a subject and as an object.",
        },
      ],
    },
    {
      id: "things",
      heading: "Pronouns for things",
      blocks: [
        {
          type: "text",
          text: "German pronouns follow the grammatical gender of the noun, also for things. A masculine object becomes ihn, even though English says it.",
        },
        {
          type: "table",
          headers: ["Noun", "Pronoun"],
          rows: [
            ["Ich brauche den Stift.", "Ich brauche ihn."],
            ["Ich suche die Tasche.", "Ich suche sie."],
            ["Ich nehme das Heft.", "Ich nehme es."],
            ["Ich kaufe die Bücher.", "Ich kaufe sie."],
          ],
        },
        {
          type: "examples",
          items: [
            { german: "Wo ist der Schlüssel? – Ich suche ihn.", english: "Where is the key? – I am looking for it." },
            { german: "Kennst du mich?", english: "Do you know me?" },
            { german: "Wir besuchen euch.", english: "We are visiting you." },
          ],
        },
      ],
    },
  ],
};

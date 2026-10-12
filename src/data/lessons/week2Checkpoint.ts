import type { CourseQuestion } from "./grammarCourseTypes";
import type { VocabularySlot } from "./week1Checkpoint";
import type { ComprehensionQuestion, ListeningItem } from "./week1Checkpoint";

/*
 * checkpoint-002 content. Fresh questions (not replays of the lessons).
 * Grammar ids use the prefixes c2-hb-, c2-cv-, c2-v2- and c2-q- so a
 * missed question traces back to haben, common verbs, word order or
 * questions.
 */

export const week2VocabularySlots: VocabularySlot[] = [
  { category: "family", kind: "de-en", pool: ["mutter", "vater", "bruder", "schwester", "eltern", "grossmutter"] },
  { category: "places", kind: "en-de", pool: ["schule", "haus", "stadt", "restaurant", "park", "supermarkt"] },
  { category: "adjectives", kind: "typed", pool: ["gross", "klein", "neu", "alt", "schoen", "schnell"] },
  { category: "activities", kind: "de-en", pool: ["schlafen", "essen", "trinken", "arbeiten", "spielen", "lesen", "gehen"] },
  { category: "days", kind: "en-de", pool: ["montag", "mittwoch", "freitag", "samstag"] },
  { category: "family", kind: "typed", pool: ["sohn", "tochter", "kind", "freundin", "onkel"] },
  { category: "months", kind: "en-de", pool: ["maerz", "juni", "oktober", "dezember"] },
  { category: "time", kind: "de-en", pool: ["heute", "morgen", "gestern"] },
];

const typed = (
  id: string,
  instruction: string,
  prompt: string,
  accepted: string[],
  explanation: string,
): CourseQuestion => ({ id, kind: "typed", instruction, prompt, accepted, explanation });

const fill = (
  id: string,
  sentence: string,
  hint: string,
  answer: string,
  explanation: string,
): CourseQuestion => ({ id, kind: "fill", sentence, hint, accepted: [answer], explanation });

/** Ten slots, two equivalent questions each; the attempt number picks one. */
export const week2GrammarSlots: CourseQuestion[][] = [
  [
    fill("c2-hb-1a", "Wir ___ Zeit.", "(haben)", "haben", "wir → haben."),
    fill("c2-hb-1b", "Ihr ___ heute Schule.", "(haben)", "habt", "ihr → habt."),
  ],
  [
    typed("c2-hb-2a", "Write this in German.", "She has time.", ["Sie hat Zeit."], "sie (she) → hat."),
    typed("c2-hb-2b", "Write this in German.", "You (informal) have German.", ["Du hast Deutsch."], "du → hast."),
  ],
  [
    fill("c2-cv-3a", "Du ___ Deutsch.", "(sprechen)", "sprichst", "sprechen changes e → i with du: du sprichst."),
    fill("c2-cv-3b", "Er ___ heute.", "(schlafen)", "schläft", "schlafen changes a → ä with er: er schläft."),
  ],
  [
    typed("c2-cv-4a", "Write this in German.", "She reads.", ["Sie liest."], "lesen changes e → ie: sie liest."),
    typed("c2-cv-4b", "Write this in German.", "He eats.", ["Er isst."], "essen changes e → i: er isst."),
  ],
  [
    {
      id: "c2-cv-5a",
      kind: "choice",
      prompt: "Du ___ ein Buch. (lesen)",
      options: ["liest", "lest", "lese", "lesen"],
      answer: "liest",
      explanation: "du liest (e → ie).",
    },
    {
      id: "c2-cv-5b",
      kind: "choice",
      prompt: "Ihr ___ in Doha. (arbeiten)",
      options: ["arbeitet", "arbeitest", "arbeite", "arbeiten"],
      answer: "arbeitet",
      explanation: "ihr → arbeitet (with the extra e).",
    },
  ],
  [
    {
      id: "c2-cv-6a",
      kind: "choice",
      prompt: "Which pronoun goes with spricht?",
      options: ["er", "du", "ihr", "wir"],
      answer: "er",
      explanation: "er spricht. du sprichst, ihr sprecht.",
    },
    {
      id: "c2-cv-6b",
      kind: "choice",
      prompt: "Which pronoun goes with sprichst?",
      options: ["du", "er", "ihr", "wir"],
      answer: "du",
      explanation: "du sprichst.",
    },
  ],
  [
    {
      id: "c2-v2-7a",
      kind: "reorder",
      words: ["Heute", "er", "arbeitet"],
      accepted: ["Heute arbeitet er.", "Er arbeitet heute."],
      explanation: "The verb stays in position 2: Heute arbeitet er.",
    },
    {
      id: "c2-v2-7b",
      kind: "reorder",
      words: ["Morgen", "ich", "spiele", "Fußball"],
      accepted: ["Morgen spiele ich Fußball.", "Ich spiele morgen Fußball."],
      explanation: "The verb stays in position 2: Morgen spiele ich Fußball.",
    },
  ],
  [
    typed("c2-q-8a", "Write this question in German.", "Where do you work? (informal)", ["Wo arbeitest du?"], "wo + verb + subject: Wo arbeitest du?"),
    typed("c2-q-8b", "Write this question in German.", "What do you eat? (informal)", ["Was isst du?"], "was + verb + subject: Was isst du?"),
  ],
  [
    typed("c2-q-9a", "Turn the statement into a yes/no question.", "Du sprichst Deutsch.", ["Sprichst du Deutsch?"], "Verb first: Sprichst du Deutsch?"),
    typed("c2-q-9b", "Turn the statement into a yes/no question.", "Ihr arbeitet heute.", ["Arbeitet ihr heute?"], "Verb first: Arbeitet ihr heute?"),
  ],
  [
    fill("c2-cv-10a", "Anna ___ Sport.", "(spielen)", "spielt", "Anna = sie (one person) → spielt."),
    fill("c2-cv-10b", "Die Eltern ___ in Doha.", "(wohnen)", "wohnen", "Die Eltern = sie (they) → wohnen."),
  ],
];

export const checkpoint2ReadingText =
  "Hallo! Ich heiße Karim. Ich komme aus Pakistan, und ich wohne in Doha. Ich habe drei Geschwister. Der Bruder heißt Omar, und die Schwester heißt Mona. Die Mutter ist Lehrerin. Sie arbeitet in der Schule. Der Vater arbeitet in der Stadt. Heute ist Montag. Heute spiele ich Fußball. Morgen lerne ich Physik. Ich mag Physik. Mathematik ist schwierig. Die Familie ist groß, und das Haus ist neu. Der Park ist groß und schön. Das Restaurant ist gut. Der Onkel wohnt auch in Doha. Ich lerne Deutsch und Englisch.";

export const checkpoint2ReadingQuestions: ComprehensionQuestion[] = [
  {
    id: "c2-r-1",
    kind: "mc",
    prompt: "How many siblings does Karim have?",
    options: ["Three", "Two", "Four", "One"],
    answer: "Three",
    explanation: "“Ich habe drei Geschwister.”",
  },
  {
    id: "c2-r-2",
    kind: "mc",
    prompt: "True or false: Karim's mother works at a school.",
    options: ["True", "False"],
    answer: "True",
    explanation: "“Die Mutter ist Lehrerin. Sie arbeitet in der Schule.”",
  },
  {
    id: "c2-r-3",
    kind: "short",
    prompt: "What does Karim do today? (answer in English)",
    answer: "He plays football",
    keywords: [["football", "soccer", "fussball", "fußball"]],
    explanation: "“Heute spiele ich Fußball.”",
  },
  {
    id: "c2-r-4",
    kind: "short",
    prompt: "Welches Fach ist schwierig? (one word, in German)",
    answer: "Mathematik",
    language: "german",
    keywords: [["mathematik", "mathe"]],
    forbidden: ["physik"],
    explanation: "“Mathematik ist schwierig.”",
  },
];

export const checkpoint2ListeningItems: ListeningItem[] = [
  {
    id: "c2-l-uncle",
    audio: "Der Onkel wohnt in der Stadt. Er arbeitet in Doha.",
    translation: "The uncle lives in the city. He works in Doha.",
    questions: [
      {
        id: "c2-l-1",
        kind: "mc",
        prompt: "Who lives in the city?",
        options: ["The uncle", "The father", "The brother", "The friend"],
        answer: "The uncle",
        explanation: "“Der Onkel wohnt in der Stadt.”",
      },
      {
        id: "c2-l-2",
        kind: "mc",
        prompt: "Where does he work?",
        options: ["In Doha", "In Zurich", "In India", "In Austria"],
        answer: "In Doha",
        explanation: "“Er arbeitet in Doha.”",
      },
    ],
  },
  {
    id: "c2-l-lesen",
    audio: "Sie liest ein Buch.",
    translation: "She is reading a book.",
    questions: [
      {
        id: "c2-l-3",
        kind: "mc",
        prompt: "Which sentence did you hear?",
        options: ["Sie liest ein Buch.", "Du liest ein Buch.", "Ihr lest ein Buch.", "Wir lesen ein Buch."],
        answer: "Sie liest ein Buch.",
        explanation: "sie liest (e → ie). du liest is spelled the same but is a different pronoun.",
      },
    ],
  },
  {
    id: "c2-l-month",
    audio: "Heute ist Mittwoch. Ich habe Zeit. Ich spiele Fußball.",
    translation: "Today is Wednesday. I have time. I play football.",
    questions: [
      {
        id: "c2-l-4",
        kind: "mc",
        prompt: "What day is it today?",
        options: ["Wednesday", "Monday", "Friday", "Sunday"],
        answer: "Wednesday",
        explanation: "“Heute ist Mittwoch.”",
      },
    ],
  },
];

export interface PronounInfo {
  german: string;
  english: string;
  note?: string;
}

export interface ConjugationRow {
  pronoun: string;
  form: string;
  english: string;
}

export interface GuidedExample {
  german: string;
  english: string;
  note: string;
}

interface QuestionBase {
  id: string;
  explanation: string;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: "choice";
  prompt: string;
  options: string[];
  answer: string;
}

export interface FillQuestion extends QuestionBase {
  kind: "fill";
  /** Sentence with `___` marking the gap, e.g. "Ich ___ Schüler." */
  sentence: string;
  answer: string;
}

export interface TranslateQuestion extends QuestionBase {
  kind: "translate";
  english: string;
  /** Every German answer that is grammatically correct. */
  accepted: string[];
}

export type GrammarQuestion =
  | ChoiceQuestion
  | FillQuestion
  | TranslateQuestion;

export const pronouns: PronounInfo[] = [
  { german: "ich", english: "I" },
  { german: "du", english: "you", note: "informal, one person" },
  { german: "er", english: "he" },
  { german: "sie", english: "she" },
  { german: "es", english: "it" },
  { german: "wir", english: "we" },
  { german: "ihr", english: "you", note: "informal, several people" },
  { german: "sie", english: "they" },
  { german: "Sie", english: "you", note: "formal, one or more people" },
];

export const duVersusSie =
  "Use du with friends, classmates, family and children. Use Sie (always with a capital S) with adults you don't know well, such as a teacher, a professor or someone in an office. If in doubt, start with Sie.";

export const seinConjugation: ConjugationRow[] = [
  { pronoun: "ich", form: "bin", english: "I am" },
  { pronoun: "du", form: "bist", english: "you are" },
  { pronoun: "er / sie / es", form: "ist", english: "he / she / it is" },
  { pronoun: "wir", form: "sind", english: "we are" },
  { pronoun: "ihr", form: "seid", english: "you (all) are" },
  { pronoun: "sie / Sie", form: "sind", english: "they are / you are (formal)" },
];

export const guidedExamples: GuidedExample[] = [
  {
    german: "Ich bin Schüler.",
    english: "I am a student (at school).",
    note: "German leaves out 'a' with jobs and roles: Ich bin Schüler.",
  },
  {
    german: "Du bist in der Schule.",
    english: "You are at school.",
    note: "du always goes with bist.",
  },
  {
    german: "Sie ist Lehrerin.",
    english: "She is a teacher.",
    note: "er, sie and es all use ist.",
  },
  {
    german: "Wir sind Studenten.",
    english: "We are students.",
    note: "wir goes with sind.",
  },
  {
    german: "Ihr seid in der Klasse.",
    english: "You (all) are in the class.",
    note: "ihr is the only pronoun that uses seid.",
  },
  {
    german: "Sind Sie Frau Meier?",
    english: "Are you Ms Meier?",
    note: "Formal 'you' uses Sie with sind, and the capital S shows it is formal.",
  },
];

export const week1SeinQuiz: GrammarQuestion[] = [
  // Recognition
  {
    id: "c-wir",
    kind: "choice",
    prompt: "Which pronoun means 'we'?",
    options: ["wir", "ihr", "sie", "Sie"],
    answer: "wir",
    explanation: "wir = we. ihr = you (several people), sie = she or they.",
  },
  {
    id: "c-formal",
    kind: "choice",
    prompt: "Which pronoun do you use to politely address your teacher?",
    options: ["du", "ihr", "Sie", "er"],
    answer: "Sie",
    explanation:
      "Sie (capital S) is the formal 'you' for adults you don't know well.",
  },
  {
    id: "c-du",
    kind: "choice",
    prompt: "Which form of sein goes with 'du'?",
    options: ["bin", "bist", "ist", "seid"],
    answer: "bist",
    explanation: "du bist = you are.",
  },
  {
    id: "c-anna",
    kind: "choice",
    prompt: "Which pronoun replaces 'Anna' (a girl)?",
    options: ["er", "es", "wir", "sie"],
    answer: "sie",
    explanation: "Anna is female, so Anna = sie (she) and the verb is ist.",
  },
  {
    id: "c-ihr",
    kind: "choice",
    prompt: "What does 'Ihr seid' mean?",
    options: [
      "You (several friends) are",
      "I am",
      "We are",
      "He is",
    ],
    answer: "You (several friends) are",
    explanation: "ihr seid = you are, said to more than one person you call du.",
  },
  // Fill in the blank
  {
    id: "f-ich",
    kind: "fill",
    sentence: "Ich ___ Schüler.",
    answer: "bin",
    explanation: "ich goes with bin: Ich bin Schüler.",
  },
  {
    id: "f-du",
    kind: "fill",
    sentence: "Du ___ in der Schule.",
    answer: "bist",
    explanation: "du goes with bist: Du bist in der Schule.",
  },
  {
    id: "f-ihr",
    kind: "fill",
    sentence: "Ihr ___ Studenten.",
    answer: "seid",
    explanation: "ihr goes with seid: Ihr seid Studenten.",
  },
  {
    id: "f-lehrer",
    kind: "fill",
    sentence: "Der Lehrer ___ nett.",
    answer: "ist",
    explanation: "'Der Lehrer' is one person (= er), so the verb is ist.",
  },
  // Production
  {
    id: "t-ich",
    kind: "translate",
    english: "I am a student.",
    accepted: [
      "Ich bin Schüler",
      "Ich bin Schülerin",
      "Ich bin ein Schüler",
      "Ich bin eine Schülerin",
      "Ich bin Student",
      "Ich bin Studentin",
      "Ich bin ein Student",
      "Ich bin eine Studentin",
    ],
    explanation:
      "ich + bin, e.g. 'Ich bin Student.' German leaves out 'a' with roles, but 'Ich bin ein Student' is also correct.",
  },
  {
    id: "t-sie",
    kind: "translate",
    english: "She is a teacher.",
    accepted: [
      "Sie ist Lehrerin",
      "Sie ist eine Lehrerin",
    ],
    explanation:
      "sie (she) + ist. A female teacher is Lehrerin: 'Sie ist Lehrerin.'",
  },
  {
    id: "t-wir",
    kind: "translate",
    english: "We are students.",
    accepted: [
      "Wir sind Schüler",
      "Wir sind Schülerinnen",
      "Wir sind Studenten",
      "Wir sind Studentinnen",
    ],
    explanation: "wir + sind: 'Wir sind Studenten.'",
  },
];

/**
 * Normalise typed German for comparison: trim, lowercase, drop sentence
 * punctuation, collapse spaces, and treat ä/ö/ü/ß like ae/oe/ue/ss.
 */
export function normaliseGerman(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?;:"“”„'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrectTyped(
  typed: string,
  accepted: string[],
): boolean {
  const normalised = normaliseGerman(typed);

  return accepted.some((answer) => normaliseGerman(answer) === normalised);
}

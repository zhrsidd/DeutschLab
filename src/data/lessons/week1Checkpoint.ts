import type { VocabQuestionKind } from "../../lib/vocabularyExercises";
import type { VocabularyCategory } from "./week1Vocabulary";

/*
 * Static content for the Week 1 checkpoint (checkpoint-001).
 * Vocabulary and grammar reuse existing Week 1 items; reading, listening,
 * writing and speaking content lives here.
 */

/** One vocabulary question per slot; the item is chosen from `pool` by attempt. */
export interface VocabularySlot {
  category: VocabularyCategory;
  kind: VocabQuestionKind;
  pool: string[];
}

const greetingPool = [
  "hallo", "guten-morgen", "guten-tag", "danke", "bitte", "tschuss", "auf-wiedersehen",
];

export const vocabularySlots: VocabularySlot[] = [
  { category: "greetings", kind: "de-en", pool: greetingPool },
  { category: "pronouns", kind: "en-de", pool: ["ich", "du", "wir", "er", "ihr"] },
  { category: "languages", kind: "typed", pool: ["deutsch", "englisch", "franzoesisch", "spanisch", "arabisch"] },
  { category: "verbs", kind: "de-en", pool: ["heissen", "kommen", "wohnen", "lernen", "sprechen"] },
  { category: "subjects", kind: "en-de", pool: ["mathematik", "physik", "chemie", "biologie", "informatik"] },
  { category: "numbers", kind: "typed", pool: ["num-3", "num-5", "num-7", "num-12", "num-15", "num-20"] },
  { category: "countries", kind: "de-en", pool: ["deutschland", "indien", "schweiz", "oesterreich", "pakistan", "england"] },
  { category: "greetings", kind: "en-de", pool: greetingPool },
];

/**
 * Grammar: one slot per skill. Each slot offers two equivalent questions;
 * the attempt number picks one, so a retry isn't identical.
 * Covers sein, regular verbs, V2, yes/no questions and W-questions.
 */
export const grammarSlots: string[][] = [
  ["f-ich", "f-du"],
  ["t-wir", "t-ich"],
  ["rv-f-du-wohnen", "rv-f-anna-machen"],
  ["rv-t-wir-lernen", "rv-t-du-wohnen"],
  ["rv-r-heute", "rv-r-doha"],
  ["qn-v-lernen", "qn-v-wohnen-sie"],
  ["qn-t-wo", "qn-t-name"],
  ["qn-w-woher", "qn-w-wie"],
];

/** A reading / listening comprehension question. */
export interface ComprehensionQuestion {
  id: string;
  kind: "mc" | "short";
  prompt: string;
  options?: string[];
  /** Answer shown after submitting. */
  answer: string;
  /** Short answers: every group needs one of its synonyms. */
  keywords?: string[][];
  /** Short answers: words that make the answer wrong. */
  forbidden?: string[];
  explanation: string;
  /** Listening: the German the speech engine says. */
  audio?: string;
  translation?: string;
  /** Short answers: which language the learner types (default English). */
  language?: "english" | "german";
  /**
   * A reusable language concept this question exercises. When answered
   * wrongly it feeds Mistakes and Review; questions without one never do.
   */
  concept?: { sourceType: "vocabulary" | "grammar"; sourceId: string };
}

export const readingText = `Guten Morgen! Ich heiße Leila und ich bin Schülerin. Ich komme aus Pakistan. Ich wohne in Doha. Ich spreche Urdu und Englisch, und ich lerne Deutsch. Die Lehrerin heißt Frau Weber. Sie kommt aus Österreich und wohnt auch in Doha. Ich mag Physik und Mathematik. Chemie lerne ich auch. Heute lerne ich Deutsch. Wir sind in der Klasse. Wir lernen Deutsch und Englisch.`;

export const readingQuestions: ComprehensionQuestion[] = [
  {
    id: "cp-r-1",
    kind: "mc",
    prompt: "Where does Leila come from?",
    options: ["Pakistan", "Doha", "Austria", "Switzerland"],
    answer: "Pakistan",
    explanation: "“Ich komme aus Pakistan.” She lives in Doha but comes from Pakistan.",
  },
  {
    id: "cp-r-2",
    kind: "mc",
    prompt: "Where does Frau Weber come from?",
    options: ["Austria", "Germany", "Pakistan", "Switzerland"],
    answer: "Austria",
    explanation: "“Sie kommt aus Österreich.”",
  },
  {
    id: "cp-r-3",
    kind: "short",
    prompt: "Which two languages does Leila speak? (answer in English)",
    answer: "Urdu and English",
    keywords: [["urdu"], ["english", "englisch"]],
    forbidden: ["german", "arabic", "french", "spanish"],
    explanation: "“Ich spreche Urdu und Englisch.” She is learning German, not speaking it yet.",
  },
  {
    id: "cp-r-4",
    kind: "short",
    prompt: "Which two subjects does Leila like? (answer in English)",
    answer: "Physics and mathematics",
    keywords: [["physics", "physik"], ["maths", "math", "mathematics", "mathe", "mathematik"]],
    forbidden: ["chemistry", "biology", "history"],
    explanation: "“Ich mag Physik und Mathematik.”",
  },
];

export interface ListeningItem {
  id: string;
  audio: string;
  translation: string;
  questions: ComprehensionQuestion[];
}

export const listeningItems: ListeningItem[] = [
  {
    id: "cp-l-murat",
    audio: "Guten Tag! Ich heiße Murat. Ich komme aus Österreich. Ich wohne in Doha.",
    translation: "Good day! My name is Murat. I come from Austria. I live in Doha.",
    questions: [
      {
        id: "cp-l-1",
        kind: "mc",
        prompt: "Where does Murat come from?",
        options: ["Austria", "Doha", "Germany", "India"],
        answer: "Austria",
        explanation: "“komme aus Österreich” = comes from Austria.",
      },
      {
        id: "cp-l-2",
        kind: "mc",
        prompt: "Where does Murat live?",
        options: ["Doha", "Austria", "Zurich", "Berlin"],
        answer: "Doha",
        explanation: "“wohne in Doha” = lives in Doha.",
      },
    ],
  },
  {
    id: "cp-l-sara",
    audio: "Hallo! Ich bin Sara. Ich spreche Arabisch und Englisch. Ich lerne Französisch.",
    translation: "Hello! I am Sara. I speak Arabic and English. I am learning French.",
    questions: [
      {
        id: "cp-l-3",
        kind: "mc",
        prompt: "Which language is Sara learning?",
        options: ["French", "Arabic", "English", "Spanish"],
        answer: "French",
        explanation: "“Ich lerne Französisch.” She already speaks Arabic and English.",
      },
    ],
  },
  {
    id: "cp-l-school",
    audio: "Guten Morgen! Wir sind in der Schule. Ich mag Mathematik und Physik. Anna mag Biologie.",
    translation: "Good morning! We are at school. I like maths and physics. Anna likes biology.",
    questions: [
      {
        id: "cp-l-4",
        kind: "mc",
        prompt: "Which subject does Anna like?",
        options: ["Biology", "Maths", "Physics", "Chemistry"],
        answer: "Biology",
        explanation: "“Anna mag Biologie.”",
      },
    ],
  },
];

export const writingCues = [
  "your name",
  "where you live",
  "where you come from",
  "languages",
  "school / student",
  "subjects you like",
  "learning German",
];

export const writingTargetWords = { min: 40, max: 60 };

export const writingSample =
  "Ich heiße Anna. Ich bin Schülerin. Ich komme aus Indien und ich wohne in Doha. Ich spreche Urdu und Englisch. Ich lerne Deutsch. Ich mag Physik und Mathematik.";

export const writingChecklist = [
  "I wrote at least 5 complete sentences",
  "I used sein correctly",
  "I used at least one other verb correctly",
  "I used German word order carefully",
  "I answered at least 4 cue points",
];

export const SPEAKING_SECONDS = 90;

export const speakingChecklist = [
  "I spoke for at least about 45 seconds",
  "I introduced myself clearly",
  "I used at least 5 complete German sentences",
  "I used Week 1 grammar correctly most of the time",
  "I spoke mostly without reading",
];

/** Content for a free-writing task (used by lessons and checkpoints). */
export interface WritingContent {
  prompt: string;
  targetWords: { min: number; max: number };
  cues: string[];
  checklist: string[];
  /** Shown only after the learner submits. */
  sample: string;
  continueLabel?: string;
}

/** The Week 1 checkpoint's writing task. */
export const week1WritingContent: WritingContent = {
  prompt: "Write a short introduction about yourself in German.",
  targetWords: writingTargetWords,
  cues: writingCues,
  checklist: writingChecklist,
  sample: writingSample,
  continueLabel: "Continue to speaking",
};

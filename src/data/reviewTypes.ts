export type ReviewConcept =
  | "noun_article"
  | "noun_plural"
  | "accusative"
  | "negation"
  | "pronoun"
  | "verb_form"
  | "word_order";

export type ReviewSourceType =
  | "vocabulary"
  | "pronunciation"
  | "grammar"
  | "listening";

export interface AnswerRecord {
  sourceType: ReviewSourceType;
  /** Stable id of the concept within its lesson. */
  sourceId: string;
  /** Finer label than sourceType, e.g. "grammar · fill-in". */
  category: string;
  prompt: string;
  expected: string;
  userAnswer: string;
  correct: boolean;
  /** German text the review card can play. */
  audioText?: string;
  /** Add to review even when answered correctly (first time only). */
  enterOnCorrect?: boolean;
}

export interface ReviewItem {
  id: number;
  sourceType: ReviewSourceType;
  sourceId: string;
  prompt: string;
  answer: string;
  audioText: string | null;
  dueAt: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  /** Raw structured exercise JSON; null for items saved before v0.4A. */
  exerciseJson: string | null;
}

/**
 * Structured data that lets a review item be rebuilt as an active-recall
 * exercise without inferring anything from display strings.
 */
export type ReviewExercise =
  | {
      kind: "vocab";
      german: string;
      english: string;
      /** Accepted English answers (variants), before normalisation. */
      englishAnswers: string[];
      /** Accepted German answers for English → German. */
      germanAnswers: string[];
      /** What the speech engine should say, if not `german`. */
      audioText?: string;
    }
  | {
      kind: "typed";
      /** Short instruction, e.g. "Type the correct form of sein." */
      instruction: string;
      prompt: string;
      accepted: string[];
      preferred: string;
      explanation: string;
      /** Card label; defaults to "Grammar". */
      label?: string;
      /** Distinct learning target (Week 3+), kept apart in Review. */
      concept?: ReviewConcept;
    }
  | {
      kind: "choice";
      prompt: string;
      /** Shown with the prompt (pronunciation); omitted for listening. */
      word?: string;
      options: string[];
      answer: string;
      explanation: string;
      concept?: ReviewConcept;
      audioText: string;
      /** Revealed only after answering. */
      transcript?: string;
      translation?: string;
      /** True when the question cannot be answered without hearing it. */
      audioRequired: boolean;
    };

export interface ReviewStats {
  dueToday: number;
  unresolvedMistakes: number;
  nextDueAt: string | null;
}

export interface MistakeRow {
  id: number;
  lessonId: string;
  category: string;
  prompt: string;
  expected: string;
  timesMissed: number;
  resolved: boolean;
}

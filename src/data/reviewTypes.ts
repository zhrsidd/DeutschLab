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
}

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

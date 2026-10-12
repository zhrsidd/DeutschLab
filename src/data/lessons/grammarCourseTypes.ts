/*
 * Shared shapes for data-driven grammar lessons (grammar-002, grammar-003).
 * grammar-001 keeps its own earlier format.
 */

export type TeachingBlock =
  | { type: "text"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | {
      type: "examples";
      items: { german: string; english: string; note?: string }[];
    }
  | { type: "callout"; title: string; text: string };

export interface TeachingPage {
  id: string;
  heading: string;
  blocks: TeachingBlock[];
}

interface QuestionBase {
  id: string;
  explanation: string;
}

export interface CourseChoiceQuestion extends QuestionBase {
  kind: "choice";
  prompt: string;
  options: string[];
  answer: string;
}

export interface CourseFillQuestion extends QuestionBase {
  kind: "fill";
  /** Sentence with `___` marking the gap. */
  sentence: string;
  /** Shown after the sentence, e.g. "(lernen)". */
  hint?: string;
  /** Accepted answers; the first is the preferred form. */
  accepted: string[];
}

/** Translation or statement → question conversion, typed in German. */
export interface CourseTypedQuestion extends QuestionBase {
  kind: "typed";
  instruction: string;
  prompt: string;
  accepted: string[];
}

export interface CourseReorderQuestion extends QuestionBase {
  kind: "reorder";
  /** Words to arrange (any order is fine; the lesson shuffles them). */
  words: string[];
  /** Every grammatical ordering; the first is the preferred form. */
  accepted: string[];
}

export type CourseQuestion =
  | CourseChoiceQuestion
  | CourseFillQuestion
  | CourseTypedQuestion
  | CourseReorderQuestion;

export interface GrammarCourse {
  taskId: string;
  title: string;
  summary: string;
  goal: string;
  pages: TeachingPage[];
  questions: CourseQuestion[];
  passMessage: string;
  failMessage: string;
}

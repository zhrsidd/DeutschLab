/*
 * Provider-independent types for DeutschLab AI (v1.1). Nothing here is
 * Gemini-specific: a future provider returns the same shapes, and the React
 * code only ever sees these.
 */

export type ProviderId = "gemini";

/** What a request is for: drives limits, usage analytics and model choice. */
export type AIFeature = "writing" | "speaking" | "transcription" | "tutor" | "tutor_summary";

export const RUBRIC_VERSION = "dl-rubric-1";
export const RUBRIC_MAX = 5;
export const RUBRIC_CATEGORIES = ["grammar", "vocabulary", "task_completion", "coherence"] as const;
export type RubricCategory = (typeof RUBRIC_CATEGORIES)[number];
export const RUBRIC_TOTAL = RUBRIC_MAX * RUBRIC_CATEGORIES.length;

export const RUBRIC_LABELS: Record<RubricCategory, string> = {
  grammar: "Grammar accuracy",
  vocabulary: "Vocabulary",
  task_completion: "Task completion",
  coherence: "Coherence and sentence structure",
};

/**
 * grammar / spelling / word_order: objectively incorrect.
 * word_choice: understandable but unnatural or wrong word.
 * style: an optional improvement to a sentence that is already correct.
 */
export type CorrectionCategory = "grammar" | "spelling" | "word_order" | "word_choice" | "style";
export type CorrectionSeverity = "error" | "minor" | "suggestion";

export interface Correction {
  /** Exact text from the learner's response. */
  original: string;
  suggestion: string;
  explanation: string;
  /** Grammar concept in plain words, e.g. "accusative after haben". */
  concept: string;
  category: CorrectionCategory;
  severity: CorrectionSeverity;
}

export interface RubricScore {
  score: number;
  comment: string;
}

export interface AssessmentFeedback {
  rubricVersion: string;
  scores: Record<RubricCategory, RubricScore>;
  /** Computed locally from the category scores, never taken from the model. */
  total: number;
  maxTotal: number;
  strengths: string[];
  improvements: string[];
  corrections: Correction[];
  missedRequirements: string[];
  revisedText: string;
  /** Lesson ids checked against the task registry. */
  recommendedLessons: string[];
  /** The model's own uncertainty. */
  uncertaintyNotes: string[];
  /** What DeutschLab removed or adjusted while validating the output. */
  validationNotes: string[];
}

export type AssessmentKind = "writing" | "speaking";
/** Where the assessed text came from. */
export type InputSource = "typed" | "model_transcript" | "edited_transcript";

export interface AssessmentRecord {
  id: string;
  taskId: string;
  kind: AssessmentKind;
  createdAt: string;
  provider: ProviderId;
  model: string;
  rubricVersion: string;
  inputText: string;
  inputSource: InputSource;
  /** The unedited model transcript, when the learner corrected it. */
  originalTranscript: string | null;
  feedback: AssessmentFeedback;
  score: number;
  maxScore: number;
  revisionOf: string | null;
}

/*
 * Tutor
 */

export type TutorMode = "guided" | "free";
export type CorrectionMode = "immediate" | "delayed";
export type TutorLevel = "gentle" | "stretch";

export interface TutorCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface NewWord {
  german: string;
  english: string;
}

export interface TutorMessage {
  id: string;
  role: "learner" | "tutor";
  text: string;
  at: string;
  /** Learner messages: typed, or spoken and transcribed. */
  source?: "typed" | "voice";
  /** Tutor messages: a short English help line. */
  english?: string;
  corrections?: TutorCorrection[];
  newWords?: NewWord[];
}

export interface SessionSummary {
  recurringMistakes: { pattern: string; original: string; corrected: string; explanation: string }[];
  strengths: string[];
  recommendedLessons: string[];
  nextStep: string;
}

export interface TutorSession {
  id: string;
  mode: TutorMode;
  topic: string;
  level: TutorLevel;
  grammarFocus: string | null;
  correctionMode: CorrectionMode;
  contextWeek: number;
  model: string;
  startedAt: string;
  updatedAt: string;
  messages: TutorMessage[];
  summary: SessionSummary | null;
}

/** Result of one native provider call. */
export interface ProviderResult {
  text: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

/*
 * Structured-output schemas (sent to the provider) and the runtime
 * validators that every response must pass. Provider output is untrusted
 * data: it is parsed as JSON, checked field by field, and only the known
 * fields are kept. Nothing is ever rendered as HTML.
 *
 * Guards against a bad examiner:
 * - a correction must quote text that really appears in the learner's work
 *   (otherwise it is removed: the model may not invent mistakes);
 * - scores must be whole numbers from 0 to 5; the total is computed here;
 * - recommended lessons must exist in the task registry and be in scope;
 * - level claims ("this is B1", "certified") and, for speaking, any comment
 *   on pronunciation or accent are removed, because neither can be judged.
 */

import { AIError } from "./errors";
import {
  RUBRIC_CATEGORIES,
  RUBRIC_MAX,
  RUBRIC_TOTAL,
  RUBRIC_VERSION,
  type AssessmentFeedback,
  type AssessmentKind,
  type Correction,
  type CorrectionCategory,
  type CorrectionSeverity,
  type NewWord,
  type RubricCategory,
  type RubricScore,
  type SessionSummary,
  type TutorCorrection,
} from "./types";

/*
 * JSON schemas (Gemini structured-output subset)
 */

const CATEGORY_VALUES: CorrectionCategory[] = ["grammar", "spelling", "word_order", "word_choice", "style"];
const SEVERITY_VALUES: CorrectionSeverity[] = ["error", "minor", "suggestion"];

const scoreSchema = (description: string) => ({
  type: "object",
  description,
  properties: {
    score: { type: "integer", minimum: 0, maximum: RUBRIC_MAX },
    comment: { type: "string", description: "One or two short sentences in English." },
  },
  required: ["score", "comment"],
});

const stringList = (max: number, description: string) => ({
  type: "array",
  description,
  maxItems: max,
  items: { type: "string" },
});

export const ASSESSMENT_SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "object",
      properties: {
        grammar: scoreSchema("Grammar accuracy, 0–5."),
        vocabulary: scoreSchema("Range and accuracy of vocabulary for the level, 0–5."),
        task_completion: scoreSchema("How fully the task and its cues were answered, 0–5."),
        coherence: scoreSchema("Coherence and sentence structure, 0–5."),
      },
      required: [...RUBRIC_CATEGORIES],
    },
    strengths: stringList(4, "Specific things done well, in English."),
    improvements: stringList(4, "The most useful things to improve next, in English."),
    corrections: {
      type: "array",
      maxItems: 15,
      description: "Only real problems. Leave empty when the text has no errors.",
      items: {
        type: "object",
        properties: {
          original: { type: "string", description: "Copied exactly, character for character, from the learner's text." },
          suggestion: { type: "string", description: "The corrected words, keeping the learner's meaning." },
          explanation: { type: "string", description: "Why, in simple English, with the rule." },
          concept: { type: "string", description: "Grammar concept in a few words, e.g. 'accusative after haben'." },
          category: { type: "string", enum: CATEGORY_VALUES },
          severity: { type: "string", enum: SEVERITY_VALUES },
        },
        required: ["original", "suggestion", "explanation", "concept", "category", "severity"],
      },
    },
    missed_requirements: stringList(5, "Task requirements or cues that were not covered. Empty if none."),
    revised_text: { type: "string", description: "The learner's text with the corrections applied, same meaning, same level." },
    recommended_lessons: stringList(3, "Lesson ids from the provided list only."),
    uncertainty_notes: stringList(3, "Anything you are unsure about (ambiguous meaning, possible transcription errors). Empty if none."),
  },
  required: [
    "scores",
    "strengths",
    "improvements",
    "corrections",
    "missed_requirements",
    "revised_text",
    "recommended_lessons",
    "uncertainty_notes",
  ],
} as const;

export const TUTOR_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "The tutor's German reply. Short at A1." },
    english_help: { type: "string", description: "Optional one-line English help. Empty string if not needed." },
    corrections: {
      type: "array",
      maxItems: 3,
      description: "Significant mistakes in the learner's last message only. Empty when there are none or corrections are delayed.",
      items: {
        type: "object",
        properties: {
          original: { type: "string", description: "Copied exactly from the learner's last message." },
          corrected: { type: "string" },
          explanation: { type: "string", description: "Short, in English." },
        },
        required: ["original", "corrected", "explanation"],
      },
    },
    new_words: {
      type: "array",
      maxItems: 4,
      description: "German words in the reply the learner has probably not been taught yet.",
      items: {
        type: "object",
        properties: { german: { type: "string" }, english: { type: "string" } },
        required: ["german", "english"],
      },
    },
  },
  required: ["reply", "english_help", "corrections", "new_words"],
} as const;

export const SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    recurring_mistakes: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "The mistake pattern in plain English." },
          original: { type: "string", description: "One example copied exactly from the learner's messages." },
          corrected: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["pattern", "original", "corrected", "explanation"],
      },
    },
    strengths: stringList(3, "What went well, in English."),
    recommended_lessons: stringList(3, "Lesson ids from the provided list only."),
    next_step: { type: "string", description: "One concrete suggestion for next time, in English." },
  },
  required: ["recurring_mistakes", "strengths", "recommended_lessons", "next_step"],
} as const;

/*
 * Helpers
 */

const fail = (message: string) => new AIError("invalid_output", message);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseJson(text: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(text.trim());
  } catch {
    throw fail("The answer was not valid JSON.");
  }
  if (!isRecord(value)) throw fail("The answer was not an object.");
  return value;
}

/** A required string, trimmed. Absurdly long strings are rejected, long ones shortened. */
function text(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") throw fail(`${field} is missing.`);
  const trimmed = value.replace(/\u0000/g, "").trim();
  if (trimmed.length > max * 4) throw fail(`${field} is far too long.`);
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function list(value: unknown, field: string, maxItems: number, maxChars: number): string[] {
  if (!Array.isArray(value)) throw fail(`${field} is missing.`);
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => text(item, field, maxChars))
    .filter((item) => item !== "")
    .slice(0, maxItems);
}

/** Lower-case, NFC, unified quotes and whitespace, for "does this appear in the text?". */
export function normaliseForMatch(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[„“”"]/g, '"')
    .replace(/[‚‘’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function appearsIn(fragment: string, source: string): boolean {
  const needle = normaliseForMatch(fragment).replace(/[.!?,;:]+$/, "");
  return needle.length > 0 && normaliseForMatch(source).includes(needle);
}

const PROFICIENCY_CLAIM =
  /\b(?:CEFR|GER|Goethe|telc|ÖSD|certif\w*|zertifi\w*)\b|\b(?:A1|A2|B1|B2|C1|C2)(?:[\s-]+level|[\s-]+standard|[\s-]+niveau)\b|\blevel\s+(?:of\s+)?(?:A1|A2|B1|B2|C1|C2)\b|\b(?:you are|you're|this is|reached|achieved|at)\s+(?:an?\s+)?(?:A1|A2|B1|B2|C1|C2)\b/i;

export const containsProficiencyClaim = (value: string) => PROFICIENCY_CLAIM.test(value);

const PRONUNCIATION_COMMENT = /\b(?:pronunciation|pronounc\w*|accent|aussprache|intonation)\b/i;

/*
 * Assessment (writing and speaking)
 */

export interface AssessmentContext {
  kind: AssessmentKind;
  /** The text that was assessed (writing, or the transcript). */
  learnerText: string;
  allowedLessonIds: string[];
}

export function validateAssessment(rawText: string, context: AssessmentContext): AssessmentFeedback {
  const raw = parseJson(rawText);
  const notes: string[] = [];

  if (!isRecord(raw.scores)) throw fail("Scores are missing.");
  const scores = {} as Record<RubricCategory, RubricScore>;

  for (const category of RUBRIC_CATEGORIES) {
    const entry = (raw.scores as Record<string, unknown>)[category];
    if (!isRecord(entry)) throw fail(`The ${category} score is missing.`);
    const score = entry.score;
    if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > RUBRIC_MAX) {
      throw fail(`The ${category} score is out of range.`);
    }
    scores[category] = { score, comment: text(entry.comment, `${category} comment`, 400) };
  }

  // Keep only statements the system can stand behind.
  let removedClaims = 0;
  let removedPronunciation = 0;
  const allowed = (value: string) => {
    if (containsProficiencyClaim(value)) {
      removedClaims += 1;
      return false;
    }
    if (context.kind === "speaking" && PRONUNCIATION_COMMENT.test(value)) {
      removedPronunciation += 1;
      return false;
    }
    return true;
  };

  for (const category of RUBRIC_CATEGORIES) {
    if (!allowed(scores[category].comment)) scores[category] = { ...scores[category], comment: "" };
  }

  const strengths = list(raw.strengths, "strengths", 4, 300).filter(allowed);
  const improvements = list(raw.improvements, "improvements", 4, 300).filter(allowed);
  const missedRequirements = list(raw.missed_requirements, "missed_requirements", 5, 300);
  const uncertaintyNotes = list(raw.uncertainty_notes, "uncertainty_notes", 3, 300).filter(allowed);

  if (!Array.isArray(raw.corrections)) throw fail("Corrections are missing.");
  const corrections: Correction[] = [];
  let notFound = 0;
  let malformed = 0;

  for (const item of raw.corrections.slice(0, 15)) {
    if (!isRecord(item)) {
      malformed += 1;
      continue;
    }
    const category = item.category as CorrectionCategory;
    const severity = item.severity as CorrectionSeverity;
    if (!CATEGORY_VALUES.includes(category) || !SEVERITY_VALUES.includes(severity)) {
      malformed += 1;
      continue;
    }
    let correction: Correction;
    try {
      correction = {
        original: text(item.original, "original", 300),
        suggestion: text(item.suggestion, "suggestion", 300),
        explanation: text(item.explanation, "explanation", 500),
        concept: text(item.concept, "concept", 80),
        category,
        severity,
      };
    } catch {
      malformed += 1;
      continue;
    }
    if (!appearsIn(correction.original, context.learnerText)) {
      notFound += 1;
      continue;
    }
    if (normaliseForMatch(correction.original) === normaliseForMatch(correction.suggestion)) {
      malformed += 1;
      continue;
    }
    if (!allowed(correction.explanation)) continue;
    corrections.push(correction);
  }

  if (notFound) {
    notes.push(
      `${notFound} suggested ${notFound === 1 ? "correction was" : "corrections were"} removed because the quoted words do not appear in your ${context.kind === "speaking" ? "transcript" : "text"}.`,
    );
  }
  if (malformed) notes.push(`${malformed} incomplete ${malformed === 1 ? "correction was" : "corrections were"} removed.`);
  if (removedClaims) notes.push("A statement about your CEFR level was removed: DeutschLab practice marks are not a level.");
  if (removedPronunciation) {
    notes.push("A comment about pronunciation was removed: pronunciation cannot be judged from a transcript.");
  }

  const allowedIds = new Set(context.allowedLessonIds);
  const proposed = list(raw.recommended_lessons, "recommended_lessons", 6, 40);
  const recommendedLessons = [...new Set(proposed.filter((id) => allowedIds.has(id)))].slice(0, 3);
  if (proposed.length > recommendedLessons.length && proposed.some((id) => !allowedIds.has(id))) {
    notes.push("A lesson suggestion that is not part of your course so far was removed.");
  }

  let revisedText = text(raw.revised_text, "revised_text", 4000);
  if (containsProficiencyClaim(revisedText)) revisedText = "";

  const total = RUBRIC_CATEGORIES.reduce((sum, category) => sum + scores[category].score, 0);

  return {
    rubricVersion: RUBRIC_VERSION,
    scores,
    total,
    maxTotal: RUBRIC_TOTAL,
    strengths,
    improvements,
    corrections,
    missedRequirements,
    revisedText,
    recommendedLessons,
    uncertaintyNotes,
    validationNotes: notes,
  };
}

/*
 * Tutor
 */

export interface TutorReply {
  reply: string;
  english: string;
  corrections: TutorCorrection[];
  newWords: NewWord[];
}

export function validateTutorReply(
  rawText: string,
  context: { learnerMessage: string; correctionsWanted: boolean },
): TutorReply {
  const raw = parseJson(rawText);
  const reply = text(raw.reply, "reply", 1200);
  if (reply === "") throw fail("The tutor's reply is empty.");

  const corrections: TutorCorrection[] = [];
  if (context.correctionsWanted && Array.isArray(raw.corrections)) {
    for (const item of raw.corrections.slice(0, 3)) {
      if (!isRecord(item)) continue;
      try {
        const correction = {
          original: text(item.original, "original", 200),
          corrected: text(item.corrected, "corrected", 200),
          explanation: text(item.explanation, "explanation", 300),
        };
        if (
          appearsIn(correction.original, context.learnerMessage) &&
          normaliseForMatch(correction.original) !== normaliseForMatch(correction.corrected)
        ) {
          corrections.push(correction);
        }
      } catch {
        // an incomplete correction is skipped
      }
    }
  }

  const newWords: NewWord[] = [];
  if (Array.isArray(raw.new_words)) {
    for (const item of raw.new_words.slice(0, 4)) {
      if (!isRecord(item)) continue;
      try {
        newWords.push({ german: text(item.german, "german", 60), english: text(item.english, "english", 80) });
      } catch {
        // skipped
      }
    }
  }

  const english = typeof raw.english_help === "string" ? text(raw.english_help, "english_help", 300) : "";

  return {
    reply: containsProficiencyClaim(reply) ? reply.replace(PROFICIENCY_CLAIM, "…") : reply,
    english: containsProficiencyClaim(english) ? "" : english,
    corrections,
    newWords,
  };
}

export function validateSessionSummary(
  rawText: string,
  context: { learnerMessages: string[]; allowedLessonIds: string[] },
): SessionSummary {
  const raw = parseJson(rawText);
  const everything = context.learnerMessages.join("\n");

  if (!Array.isArray(raw.recurring_mistakes)) throw fail("The summary is incomplete.");
  const recurringMistakes: SessionSummary["recurringMistakes"] = [];
  for (const item of raw.recurring_mistakes.slice(0, 5)) {
    if (!isRecord(item)) continue;
    try {
      const mistake = {
        pattern: text(item.pattern, "pattern", 200),
        original: text(item.original, "original", 200),
        corrected: text(item.corrected, "corrected", 200),
        explanation: text(item.explanation, "explanation", 400),
      };
      if (appearsIn(mistake.original, everything)) recurringMistakes.push(mistake);
    } catch {
      // skipped
    }
  }

  const allowedIds = new Set(context.allowedLessonIds);
  return {
    recurringMistakes,
    strengths: list(raw.strengths, "strengths", 3, 300).filter((s) => !containsProficiencyClaim(s)),
    recommendedLessons: [...new Set(list(raw.recommended_lessons, "recommended_lessons", 6, 40))]
      .filter((id) => allowedIds.has(id))
      .slice(0, 3),
    nextStep: text(raw.next_step, "next_step", 400),
  };
}

/*
 * Builds, validates and grades active-recall review exercises.
 * Pure: no database or React imports.
 */

import type { VocabularyItem } from "../data/lessons/week1Vocabulary";
import {
  findVocabularyItem,
  vocabularySetForItem,
} from "../data/lessons/vocabularySets";
import { week2CommonVerbsQuiz } from "../data/lessons/week2CommonVerbs";
import { week2GrammarSlots } from "../data/lessons/week2Checkpoint";
import { week2HabenQuiz } from "../data/lessons/week2Haben";
import { week1SeinQuiz } from "../data/lessons/week1Sein";
import { week1PronunciationQuiz } from "../data/lessons/week1Pronunciation";
import { week1ListeningQuiz } from "../data/lessons/week1Listening";

import { week1RegularVerbsQuiz } from "../data/lessons/week1RegularVerbs";
import { week1QuestionsQuiz } from "../data/lessons/week1Questions";
import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";

import type {
  ReviewExercise,
  ReviewSourceType,
} from "../data/reviewTypes";

import { normaliseGerman } from "../data/lessons/week1Sein";

/* ---------- normalisation ---------- */

export function normaliseEnglish(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:"“”()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTerminalPunctuation(text: string): string {
  return text.trim().replace(/[.!?,;:\s]+$/g, "");
}

/* ---------- vocabulary variants ---------- */

/** The "/"-separated parts of the displayed English meaning. */
function englishParts(english: string): string[] {
  return english
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function englishVariants(item: VocabularyItem): string[] {
  const base = [
    item.english,
    ...englishParts(item.english),
    ...(item.acceptedEnglish ?? []),
  ];

  // "to learn" is also fine as "learn".
  const withoutTo = base
    .filter((variant) => /^to\s+/i.test(variant))
    .map((variant) => variant.replace(/^to\s+/i, ""));

  return [...new Set([...base, ...withoutTo])];
}

/* ---------- grammar-002 / grammar-003 ---------- */

/** Which lesson a review concept came from (used for mistakes + planning). */
export function lessonIdFor(
  sourceType: ReviewSourceType,
  sourceId: string,
): string {
  if (sourceType === "vocabulary") {
    return vocabularySetForItem(sourceId).taskId;
  }
  if (sourceType === "pronunciation") return "pronunciation-001";
  if (sourceType === "listening") return "listening-001";
  if (sourceId.startsWith("rv-")) return "grammar-002";
  if (sourceId.startsWith("qn-")) return "grammar-003";
  if (sourceId.startsWith("hb-")) return "grammar-004";
  if (sourceId.startsWith("cv-")) return "grammar-005";
  // Week 2 checkpoint questions trace back to the skill they test.
  if (sourceId.startsWith("c2-hb-")) return "grammar-004";
  if (sourceId.startsWith("c2-cv-")) return "grammar-005";
  if (sourceId.startsWith("c2-v2-")) return "grammar-002";
  if (sourceId.startsWith("c2-q-")) return "grammar-003";

  return "grammar-001";
}

const courseQuestions: CourseQuestion[] = [
  ...week1RegularVerbsQuiz,
  ...week1QuestionsQuiz,
  ...week2HabenQuiz,
  ...week2CommonVerbsQuiz,
  ...week2GrammarSlots.flat(),
];

/** Turns a data-driven grammar question into a structured review exercise. */
export function exerciseFromCourseQuestion(
  question: CourseQuestion,
): ReviewExercise {
  if (question.kind === "choice") {
    return {
      kind: "choice",
      prompt: question.prompt,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      audioText: "",
      audioRequired: false,
    };
  }

  if (question.kind === "fill") {
    return {
      kind: "typed",
      instruction: "Type the missing word.",
      prompt: question.hint
        ? `${question.sentence} ${question.hint}`
        : question.sentence,
      accepted: question.accepted,
      preferred: question.accepted[0],
      explanation: question.explanation,
    };
  }

  if (question.kind === "reorder") {
    return {
      kind: "typed",
      instruction: "Put the words in the correct order.",
      prompt: question.words.join(" / "),
      accepted: question.accepted,
      preferred: question.accepted[0],
      explanation: question.explanation,
    };
  }

  return {
    kind: "typed",
    instruction: question.instruction,
    prompt: question.prompt,
    accepted: question.accepted,
    preferred: question.accepted[0],
    explanation: question.explanation,
  };
}

/* ---------- building ---------- */

export function buildReviewExercise(
  sourceType: ReviewSourceType,
  sourceId: string,
): ReviewExercise | null {
  if (sourceType === "vocabulary") {
    const item = findVocabularyItem(sourceId);
    if (!item) return null;

    const englishAnswers = englishVariants(item);
    const myParts = new Set(englishParts(item.english).map(normaliseEnglish));

    // Words sharing a displayed meaning (e.g. "Hello") are also valid
    // German answers; so are explicitly accepted alternatives.
    const germanAnswers = vocabularySetForItem(item.id)
      .items.filter((other) =>
        englishParts(other.english).some((part) =>
          myParts.has(normaliseEnglish(part)),
        ),
      )
      .flatMap((other) => [other.german, ...(other.acceptedGerman ?? [])]);

    // "die Mutter" may also be typed without its article.
    const withoutArticle = [item.german, ...germanAnswers]
      .map((word) => word.replace(/^(der|die|das)\s+/i, ""))
      .filter((word) => word.length > 0);

    return {
      kind: "vocab",
      german: item.german,
      english: item.english,
      englishAnswers,
      germanAnswers: [
        ...new Set([
          item.german,
          ...(item.acceptedGerman ?? []),
          ...germanAnswers,
          ...withoutArticle,
        ]),
      ],
      audioText: item.audioText,
    };
  }

  if (sourceType === "grammar") {
    const course = courseQuestions.find((entry) => entry.id === sourceId);
    if (course) return exerciseFromCourseQuestion(course);

    const question = week1SeinQuiz.find((entry) => entry.id === sourceId);
    if (!question) return null;

    if (question.kind === "fill") {
      return {
        kind: "typed",
        instruction: "Type the missing word.",
        prompt: question.sentence,
        accepted: [question.answer],
        preferred: question.answer,
        explanation: question.explanation,
      };
    }

    if (question.kind === "translate") {
      return {
        kind: "typed",
        instruction: "Write this in German.",
        prompt: question.english,
        accepted: question.accepted,
        preferred: question.accepted[0],
        explanation: question.explanation,
      };
    }

    return {
      kind: "choice",
      prompt: question.prompt,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      audioText: "",
      audioRequired: false,
    };
  }

  if (sourceType === "pronunciation") {
    const question = week1PronunciationQuiz.find(
      (entry) => entry.id === sourceId,
    );
    if (!question) return null;

    return {
      kind: "choice",
      prompt: question.prompt,
      word: question.word,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      audioText: question.word ?? "",
      audioRequired: false,
    };
  }

  const question = week1ListeningQuiz.find((entry) => entry.id === sourceId);
  if (!question) return null;

  return {
    kind: "choice",
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    audioText: question.audio,
    transcript: question.audio,
    translation: question.translation,
    audioRequired: true,
  };
}

/* ---------- validation / parsing ---------- */

function isStringArray(value: unknown, minLength = 1): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= minLength &&
    value.every((entry) => typeof entry === "string" && entry.trim() !== "")
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Returns the exercise if the shape is usable, otherwise null. */
export function validateExercise(raw: unknown): ReviewExercise | null {
  if (typeof raw !== "object" || raw === null) return null;

  const value = raw as Record<string, unknown>;

  if (value.kind === "vocab") {
    if (
      isString(value.german) &&
      isString(value.english) &&
      isStringArray(value.englishAnswers) &&
      isStringArray(value.germanAnswers)
    ) {
      return value as unknown as ReviewExercise;
    }
    return null;
  }

  if (value.kind === "typed") {
    if (
      isString(value.instruction) &&
      isString(value.prompt) &&
      isStringArray(value.accepted) &&
      isString(value.preferred) &&
      isString(value.explanation)
    ) {
      return value as unknown as ReviewExercise;
    }
    return null;
  }

  if (value.kind === "choice") {
    if (
      isString(value.prompt) &&
      isStringArray(value.options, 2) &&
      isString(value.answer) &&
      (value.options as string[]).includes(value.answer) &&
      isString(value.explanation) &&
      isString(value.audioText) &&
      typeof value.audioRequired === "boolean"
    ) {
      return value as unknown as ReviewExercise;
    }
    return null;
  }

  return null;
}

/**
 * Stored JSON first (if valid), then a rebuild from the lesson data for
 * older rows. Null means "use the legacy reveal + Correct/Again card".
 */
export function resolveExercise(
  exerciseJson: string | null,
  sourceType: ReviewSourceType,
  sourceId: string,
): ReviewExercise | null {
  if (exerciseJson) {
    try {
      const stored = validateExercise(JSON.parse(exerciseJson));
      if (stored) return stored;
    } catch {
      // Malformed JSON: fall through to the rebuild.
    }
  }

  try {
    return validateExercise(buildReviewExercise(sourceType, sourceId));
  } catch {
    return null;
  }
}

/* ---------- grading adapters ---------- */

export interface Grade {
  correct: boolean;
  /** The answer to show after submission. */
  expected: string;
  /** e.g. "Preferred spelling: Schüler". */
  note?: string;
  explanation?: string;
}

export interface TypedQuestion {
  label: string;
  instruction: string;
  prompt: string;
  /** German to offer for playback once answered. */
  audioText?: string;
  grade: (input: string) => Grade;
}

export interface ChoiceQuestion {
  prompt: string;
  word?: string;
  options: string[];
  audioText: string;
  audioRequired: boolean;
  transcript?: string;
  translation?: string;
  grade: (choice: string) => Grade;
}

function gradeGerman(
  input: string,
  accepted: string[],
  preferred: string,
  explanation?: string,
): Grade {
  const typed = normaliseGerman(input);
  const correct =
    typed !== "" && accepted.some((entry) => normaliseGerman(entry) === typed);

  const note =
    correct &&
    stripTerminalPunctuation(input) !== stripTerminalPunctuation(preferred)
      ? `Preferred spelling: ${preferred}`
      : undefined;

  return { correct, expected: preferred, note, explanation };
}

/** Vocabulary alternates direction by repetition count (deterministic). */
export function toTypedQuestion(
  exercise: ReviewExercise,
  repetitions: number,
): TypedQuestion | null {
  if (exercise.kind === "vocab") {
    if (repetitions % 2 === 0) {
      return {
        label: "Vocabulary · German → English",
        instruction: "Type the English meaning.",
        prompt: exercise.german,
        audioText: exercise.audioText ?? exercise.german,
        grade: (input) => {
          const typed = normaliseEnglish(input);
          const correct =
            typed !== "" &&
            exercise.englishAnswers.some(
              (entry) => normaliseEnglish(entry) === typed,
            );

          return { correct, expected: exercise.english };
        },
      };
    }

    return {
      label: "Vocabulary · English → German",
      instruction: "Type this in German.",
      prompt: exercise.english,
      audioText: exercise.audioText ?? exercise.german,
      grade: (input) =>
        gradeGerman(input, exercise.germanAnswers, exercise.german),
    };
  }

  if (exercise.kind === "typed") {
    return {
      label: "Grammar",
      instruction: exercise.instruction,
      prompt: exercise.prompt,
      grade: (input) =>
        gradeGerman(
          input,
          exercise.accepted,
          exercise.preferred,
          exercise.explanation,
        ),
    };
  }

  return null;
}

export function toChoiceQuestion(
  exercise: ReviewExercise,
): ChoiceQuestion | null {
  if (exercise.kind !== "choice") return null;

  return {
    prompt: exercise.prompt,
    word: exercise.word,
    options: exercise.options,
    audioText: exercise.audioText,
    audioRequired: exercise.audioRequired,
    transcript: exercise.transcript,
    translation: exercise.translation,
    grade: (choice) => ({
      correct: choice === exercise.answer,
      expected: exercise.answer,
      explanation: exercise.explanation,
    }),
  };
}

/**
 * Prompt / expected answer for a reusable concept, used when a reading or
 * listening question maps to a word or grammar item that can be reviewed.
 */
export function describeReviewConcept(
  sourceType: ReviewSourceType,
  sourceId: string,
): { prompt: string; expected: string; audioText?: string } | null {
  const exercise = buildReviewExercise(sourceType, sourceId);
  if (!exercise) return null;

  if (exercise.kind === "vocab") {
    return {
      prompt: `What does "${exercise.german}" mean?`,
      expected: exercise.english,
      audioText: exercise.audioText ?? exercise.german,
    };
  }

  if (exercise.kind === "typed") {
    return {
      prompt: `${exercise.instruction} ${exercise.prompt}`,
      expected: exercise.preferred,
    };
  }

  return { prompt: exercise.prompt, expected: exercise.answer };
}

/*
 * Builds, validates and grades active-recall review exercises.
 * Pure: no database or React imports.
 */

import { week1Vocabulary, type VocabularyItem } from "../data/lessons/week1Vocabulary";
import { week1SeinQuiz } from "../data/lessons/week1Sein";
import { week1PronunciationQuiz } from "../data/lessons/week1Pronunciation";
import { week1ListeningQuiz } from "../data/lessons/week1Listening";

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

/* ---------- building ---------- */

export function buildReviewExercise(
  sourceType: ReviewSourceType,
  sourceId: string,
): ReviewExercise | null {
  if (sourceType === "vocabulary") {
    const item = week1Vocabulary.find((entry) => entry.id === sourceId);
    if (!item) return null;

    const englishAnswers = englishVariants(item);
    const myParts = new Set(englishParts(item.english).map(normaliseEnglish));

    // Words sharing a displayed meaning (e.g. "Hello") are also valid
    // German answers; so are explicitly accepted alternatives.
    const germanAnswers = week1Vocabulary
      .filter((other) =>
        englishParts(other.english).some((part) =>
          myParts.has(normaliseEnglish(part)),
        ),
      )
      .flatMap((other) => [other.german, ...(other.acceptedGerman ?? [])]);

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
        ]),
      ],
      audioText: item.audioText,
    };
  }

  if (sourceType === "grammar") {
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

/*
 * Deterministic question generation for the vocabulary lesson.
 * Pure: same batch / seed always yields the same questions.
 */

import {
  week1Vocabulary,
  type VocabularyBatch,
  type VocabularyCategory,
  type VocabularyItem,
} from "../data/lessons/week1Vocabulary";

import { seededShuffle } from "../components/lesson/shuffle";

import {
  buildReviewExercise,
  normaliseEnglish,
  toTypedQuestion,
  type Grade,
} from "./reviewExercises";

export type VocabQuestionKind = "de-en" | "en-de" | "typed";

export interface VocabQuestion {
  id: string;
  itemId: string;
  kind: VocabQuestionKind;
  /** Large text shown to the learner. */
  display: string;
  instruction: string;
  /** Multiple-choice options (empty for typed). */
  options: string[];
  /** Preferred correct answer. */
  answer: string;
  /** German to play (the prompt for de-en, the answer afterwards). */
  audioText: string;
}

export const CHECK_QUESTIONS_PER_BATCH = 4;
export const FINAL_QUIZ_SIZE = 16;

/** Questions per category in the final quiz (sums to FINAL_QUIZ_SIZE). */
const FINAL_QUOTA: [VocabularyCategory, number][] = [
  ["greetings", 3],
  ["pronouns", 2],
  ["verbs", 2],
  ["countries", 2],
  ["languages", 2],
  ["subjects", 2],
  ["numbers", 3],
];

const TYPED_EVERY = 5;
const TYPED_CATEGORIES = new Set<VocabularyCategory>([
  "greetings",
  "countries",
  "languages",
  "subjects",
  "numbers",
]);

function itemById(id: string): VocabularyItem | undefined {
  return week1Vocabulary.find((item) => item.id === id);
}

function meaningParts(item: VocabularyItem): string[] {
  return item.english.split("/").map(normaliseEnglish);
}

function sameMeaning(a: VocabularyItem, b: VocabularyItem): boolean {
  const parts = new Set(meaningParts(a));
  return meaningParts(b).some((part) => parts.has(part));
}

/** Three plausible wrong answers, preferably from the same category. */
function distractors(
  item: VocabularyItem,
  field: "english" | "german",
  seed: string,
): string[] {
  const candidates = week1Vocabulary.filter(
    (other) =>
      other.id !== item.id &&
      !sameMeaning(item, other) &&
      other.german.toLowerCase() !== item.german.toLowerCase(),
  );

  const sameCategory = candidates.filter(
    (other) => other.category === item.category,
  );
  const elsewhere = candidates.filter(
    (other) => other.category !== item.category,
  );

  const pool = [
    ...seededShuffle(sameCategory, `${seed}:same`),
    ...seededShuffle(elsewhere, `${seed}:else`),
  ];

  const picked: string[] = [];

  for (const other of pool) {
    const value = other[field];
    if (value !== item[field] && !picked.includes(value)) picked.push(value);
    if (picked.length === 3) break;
  }

  return picked;
}

export function buildQuestion(
  item: VocabularyItem,
  kind: VocabQuestionKind,
  seed: string,
): VocabQuestion {
  const audioText = item.audioText ?? item.german;

  if (kind === "de-en") {
    return {
      id: `${seed}:${item.id}:de-en`,
      itemId: item.id,
      kind,
      display: item.german,
      instruction: "What does this mean?",
      options: seededShuffle(
        [item.english, ...distractors(item, "english", `${seed}:${item.id}`)],
        `${seed}:${item.id}:opts`,
      ),
      answer: item.english,
      audioText,
    };
  }

  if (kind === "en-de") {
    return {
      id: `${seed}:${item.id}:en-de`,
      itemId: item.id,
      kind,
      display: item.english,
      instruction: "How do you say this in German?",
      options: seededShuffle(
        [item.german, ...distractors(item, "german", `${seed}:${item.id}`)],
        `${seed}:${item.id}:opts`,
      ),
      answer: item.german,
      audioText,
    };
  }

  return {
    id: `${seed}:${item.id}:typed`,
    itemId: item.id,
    kind,
    display: item.english,
    instruction: "Type this in German.",
    options: [],
    answer: item.german,
    audioText,
  };
}

/** Short formative check after a batch: alternates de→en and en→de. */
export function buildBatchCheck(batch: VocabularyBatch): VocabQuestion[] {
  const items = batch.itemIds
    .map(itemById)
    .filter((item): item is VocabularyItem => item !== undefined);

  return seededShuffle(items, `check:${batch.id}`)
    .slice(0, CHECK_QUESTIONS_PER_BATCH)
    .map((item, index) =>
      buildQuestion(item, index % 2 === 0 ? "de-en" : "en-de", `check:${batch.id}`),
    );
}

/**
 * Final mixed quiz: a fixed quota per category, chosen with a seeded
 * shuffle and interleaved. `attempt` varies the selection between retries
 * while keeping every attempt reproducible.
 */
export function buildFinalQuiz(attempt: number): VocabQuestion[] {
  const seed = `final:${attempt}`;

  const perCategory = FINAL_QUOTA.map(([category, count]) =>
    seededShuffle(
      week1Vocabulary.filter((item) => item.category === category),
      `${seed}:${category}`,
    ).slice(0, count),
  );

  const ordered: VocabularyItem[] = [];
  const rounds = Math.max(...perCategory.map((list) => list.length));

  for (let round = 0; round < rounds; round += 1) {
    for (const list of perCategory) {
      if (list[round]) ordered.push(list[round]);
    }
  }

  return ordered.map((item, index) => {
    const wantsTyped =
      index % TYPED_EVERY === TYPED_EVERY - 1 &&
      TYPED_CATEGORIES.has(item.category);

    const kind: VocabQuestionKind = wantsTyped
      ? "typed"
      : index % 2 === 0
        ? "de-en"
        : "en-de";

    return buildQuestion(item, kind, seed);
  });
}

/** Grades one answer. Typed answers use the same rules as Review. */
export function gradeVocabAnswer(
  question: VocabQuestion,
  input: string,
): Grade {
  if (question.kind !== "typed") {
    return {
      correct: input === question.answer,
      expected: question.answer,
    };
  }

  const exercise = buildReviewExercise("vocabulary", question.itemId);
  const typed = exercise ? toTypedQuestion(exercise, 1) : null;

  if (!typed) {
    return {
      correct: input.trim().toLowerCase() === question.answer.toLowerCase(),
      expected: question.answer,
    };
  }

  return typed.grade(input);
}

/** Prompt text stored with a mistake / review item. */
export function mistakePrompt(question: VocabQuestion): string {
  return question.kind === "de-en"
    ? `What does "${question.display}" mean?`
    : `How do you say "${question.display}" in German?`;
}

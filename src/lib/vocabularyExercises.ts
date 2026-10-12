/*
 * Deterministic question generation for the vocabulary lesson.
 * Pure: same batch / seed always yields the same questions.
 */

import type {
  VocabularyBatch,
  VocabularyItem,
} from "../data/lessons/week1Vocabulary";
import {
  findVocabularyItem,
  vocabularySetForItem,
  week1VocabularySet,
  type VocabularySet,
} from "../data/lessons/vocabularySets";

import { seededShuffle } from "../components/lesson/shuffle";

import {
  buildReviewExercise,
  normaliseEnglish,
  toTypedQuestion,
  type Grade,
} from "./reviewExercises";

export type VocabQuestionKind =
  | "de-en"
  | "en-de"
  | "typed"
  | "article"
  | "plural";

export interface VocabQuestion {
  id: string;
  itemId: string;
  /**
   * Review concept this question belongs to: the item id for meaning and
   * noun recall, "<id>#article" or "<id>#plural" for the Week 3 targets.
   */
  reviewId: string;
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

/** Final quiz size of the Week 1 set (kept for existing callers). */
export const FINAL_QUIZ_SIZE = week1VocabularySet.finalQuota.reduce(
  (sum, [, count]) => sum + count,
  0,
);

const TYPED_EVERY = 5;

function itemById(id: string): VocabularyItem | undefined {
  return findVocabularyItem(id);
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
  // Wrong answers come from the same lesson's vocabulary.
  const candidates = vocabularySetForItem(item.id).items.filter(
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

const ARTICLES = ["der", "die", "das"];

export const articleReviewId = (itemId: string) => `${itemId}#article`;
export const pluralReviewId = (itemId: string) => `${itemId}#plural`;

function bareNoun(item: VocabularyItem): string {
  return item.german.replace(/^(der|die|das)\s+/i, "");
}

/** True when the item can be asked as a plural question. */
export function hasPluralQuestion(item: VocabularyItem): boolean {
  return Boolean(item.plural) && !item.noPlural;
}

/** Three plausible wrong plurals, taken from other nouns of the same set. */
function pluralDistractors(item: VocabularyItem, seed: string): string[] {
  const candidates = vocabularySetForItem(item.id).items.filter(
    (other) =>
      other.id !== item.id &&
      hasPluralQuestion(other) &&
      other.plural !== item.plural,
  );

  const pool = seededShuffle(candidates, `${seed}:plural`);
  const picked: string[] = [];

  for (const other of pool) {
    const value = other.plural as string;
    if (!picked.includes(value)) picked.push(value);
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
      reviewId: item.id,
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
      reviewId: item.id,
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

  if (kind === "article") {
    return {
      id: `${seed}:${item.id}:article`,
      itemId: item.id,
      reviewId: articleReviewId(item.id),
      kind,
      display: `___ ${bareNoun(item)}`,
      instruction: "Choose the correct article.",
      options: [...ARTICLES],
      answer: item.article ?? "",
      audioText,
    };
  }

  if (kind === "plural") {
    const plural = item.plural ?? item.german;

    return {
      id: `${seed}:${item.id}:plural`,
      itemId: item.id,
      reviewId: pluralReviewId(item.id),
      kind,
      display: item.german,
      instruction: "What is the plural?",
      options: seededShuffle(
        [plural, ...pluralDistractors(item, `${seed}:${item.id}`)],
        `${seed}:${item.id}:opts`,
      ),
      answer: plural,
      audioText: plural,
    };
  }

  return {
    id: `${seed}:${item.id}:typed`,
    itemId: item.id,
    reviewId: item.id,
    kind,
    display: item.english,
    instruction: item.requireArticle
      ? "Type this in German, with its article."
      : "Type this in German.",
    options: [],
    answer: item.german,
    audioText,
  };
}

/** Article-aware batch checks: meaning, noun + article, article, plural. */
function articleAwareCheckKind(
  item: VocabularyItem,
  index: number,
): VocabQuestionKind {
  const kinds: VocabQuestionKind[] = [
    "de-en",
    "en-de",
    "article",
    hasPluralQuestion(item) ? "plural" : "typed",
  ];

  const kind = kinds[index % kinds.length];
  return kind === "plural" && !hasPluralQuestion(item) ? "article" : kind;
}

/** Final-quiz rotation for article-aware sets (each kind every 5th). */
function articleAwareFinalKind(
  item: VocabularyItem,
  index: number,
  typedAllowed: boolean,
): VocabQuestionKind {
  const slot = index % 5;

  if (slot === 0) return "de-en";
  if (slot === 1) return "en-de";
  if (slot === 2) return "article";
  if (slot === 3) return hasPluralQuestion(item) ? "plural" : "article";
  return typedAllowed ? "typed" : "en-de";
}

/** Short formative check after a batch: alternates de→en and en→de. */
export function buildBatchCheck(batch: VocabularyBatch): VocabQuestion[] {
  const items = batch.itemIds
    .map(itemById)
    .filter((item): item is VocabularyItem => item !== undefined);

  return seededShuffle(items, `check:${batch.id}`)
    .slice(0, CHECK_QUESTIONS_PER_BATCH)
    .map((item, index) =>
      buildQuestion(
        item,
        item.requireArticle
          ? articleAwareCheckKind(item, index)
          : index % 2 === 0
            ? "de-en"
            : "en-de",
        `check:${batch.id}`,
      ),
    );
}

/**
 * Final mixed quiz: a fixed quota per category, chosen with a seeded
 * shuffle and interleaved. `attempt` varies the selection between retries
 * while keeping every attempt reproducible.
 */
export function buildFinalQuiz(
  attempt: number,
  set: VocabularySet = week1VocabularySet,
): VocabQuestion[] {
  const seed = `${set.seedPrefix}:${attempt}`;
  const typedCategories = new Set(set.typedCategories);

  const perCategory = set.finalQuota.map(([category, count]) =>
    seededShuffle(
      set.items.filter((item) => item.category === category),
      `${seed}:${category}`,
    ).slice(0, count),
  );

  const ordered: VocabularyItem[] = [];
  const rounds = Math.max(0, ...perCategory.map((list) => list.length));

  for (let round = 0; round < rounds; round += 1) {
    for (const list of perCategory) {
      if (list[round]) ordered.push(list[round]);
    }
  }

  return ordered.map((item, index) => {
    if (set.articleAware) {
      return buildQuestion(
        item,
        articleAwareFinalKind(item, index, typedCategories.has(item.category)),
        seed,
      );
    }

    const wantsTyped =
      index % TYPED_EVERY === TYPED_EVERY - 1 &&
      typedCategories.has(item.category);

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
  if (question.kind === "article") {
    return `What is the article of "${question.display.replace("___ ", "")}"?`;
  }

  if (question.kind === "plural") {
    return `What is the plural of "${question.display}"?`;
  }

  return question.kind === "de-en"
    ? `What does "${question.display}" mean?`
    : `How do you say "${question.display}" in German?`;
}

/** Answer text stored with a mistake: the full noun for article questions. */
export function mistakeExpected(question: VocabQuestion): string {
  if (question.kind === "article") {
    const item = itemById(question.itemId);
    return item ? item.german : question.answer;
  }

  return question.answer;
}

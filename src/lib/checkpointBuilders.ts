/*
 * Deterministic question selection + grading helpers for the checkpoint.
 */

import {
  grammarSlots,
  vocabularySlots,
  type ComprehensionQuestion,
  type VocabularySlot,
} from "../data/lessons/week1Checkpoint";
import {
  week2GrammarSlots,
  week2VocabularySlots,
} from "../data/lessons/week2Checkpoint";
import { findVocabularyItem } from "../data/lessons/vocabularySets";
import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import { week1QuestionsQuiz } from "../data/lessons/week1Questions";
import { week1RegularVerbsQuiz } from "../data/lessons/week1RegularVerbs";
import { normaliseGerman, week1SeinQuiz } from "../data/lessons/week1Sein";

import { seededShuffle } from "../components/lesson/shuffle";

import { normaliseEnglish, type Grade } from "./reviewExercises";
import { buildQuestion, type VocabQuestion } from "./vocabularyExercises";

/** Eight vocabulary questions across categories, varied by attempt. */
export function buildCheckpointVocabulary(
  attempt: number,
  slots: VocabularySlot[] = vocabularySlots,
  seedPrefix = "cp",
): VocabQuestion[] {
  const used = new Set<string>();
  const questions: VocabQuestion[] = [];

  slots.forEach((slot, index) => {
    const candidates = seededShuffle(
      slot.pool,
      `${seedPrefix}:${attempt}:${index}`,
    );
    const id = candidates.find((candidate) => !used.has(candidate));
    const item = id ? findVocabularyItem(id) : undefined;

    if (!id || !item) return;

    used.add(id);
    questions.push(buildQuestion(item, slot.kind, `${seedPrefix}:${attempt}`));
  });

  return questions;
}

/** Eight Week 2 vocabulary questions across the new categories. */
export function buildWeek2CheckpointVocabulary(attempt: number): VocabQuestion[] {
  return buildCheckpointVocabulary(attempt, week2VocabularySlots, "cp2");
}

/** Ten Week 2 grammar questions, one per skill, varied by attempt. */
export function buildWeek2CheckpointGrammar(attempt: number): CourseQuestion[] {
  return week2GrammarSlots.map((options) => options[attempt % options.length]);
}

/** Adapts a grammar-001 question to the data-driven shape. */
function fromSeinQuestion(id: string): CourseQuestion | null {
  const question = week1SeinQuiz.find((entry) => entry.id === id);
  if (!question) return null;

  if (question.kind === "choice") {
    return {
      id,
      kind: "choice",
      prompt: question.prompt,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
    };
  }

  if (question.kind === "fill") {
    return {
      id,
      kind: "fill",
      sentence: question.sentence,
      accepted: [question.answer],
      explanation: question.explanation,
    };
  }

  return {
    id,
    kind: "typed",
    instruction: "Write this in German.",
    prompt: question.english,
    accepted: question.accepted,
    explanation: question.explanation,
  };
}

export function grammarQuestionById(id: string): CourseQuestion | null {
  return (
    week1RegularVerbsQuiz.find((entry) => entry.id === id) ??
    week1QuestionsQuiz.find((entry) => entry.id === id) ??
    fromSeinQuestion(id)
  );
}

/** Eight grammar questions, one per skill. */
export function buildCheckpointGrammar(attempt: number): CourseQuestion[] {
  return grammarSlots
    .map((options) => grammarQuestionById(options[attempt % options.length]))
    .filter((question): question is CourseQuestion => question !== null);
}

/** Deterministic keyword grading for short English answers. */
export function gradeComprehension(
  question: ComprehensionQuestion,
  answer: string,
): Grade {
  if (question.kind === "mc") {
    return {
      correct: answer === question.answer,
      expected: question.answer,
      explanation: question.explanation,
    };
  }

  const normalise =
    question.language === "german" ? normaliseGerman : normaliseEnglish;

  const tokens = normalise(answer)
    .replace(/[-/]/g, " ")
    .split(" ")
    .filter(Boolean);

  const has = (word: string) => tokens.includes(normalise(word));

  const groups = question.keywords ?? [];
  const hasAll =
    groups.length > 0 && groups.every((group) => group.some(has));
  const hasForbidden = (question.forbidden ?? []).some(has);

  return {
    correct: hasAll && !hasForbidden,
    expected: question.answer,
    explanation: question.explanation,
  };
}

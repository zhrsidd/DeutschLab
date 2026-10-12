/*
 * Deterministic question selection + grading helpers for the checkpoint.
 */

import {
  grammarSlots,
  vocabularySlots,
  type ComprehensionQuestion,
} from "../data/lessons/week1Checkpoint";
import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import { week1QuestionsQuiz } from "../data/lessons/week1Questions";
import { week1RegularVerbsQuiz } from "../data/lessons/week1RegularVerbs";
import { week1SeinQuiz } from "../data/lessons/week1Sein";
import { week1Vocabulary } from "../data/lessons/week1Vocabulary";

import { seededShuffle } from "../components/lesson/shuffle";

import { normaliseEnglish, type Grade } from "./reviewExercises";
import { buildQuestion, type VocabQuestion } from "./vocabularyExercises";

/** Eight vocabulary questions across categories, varied by attempt. */
export function buildCheckpointVocabulary(attempt: number): VocabQuestion[] {
  const used = new Set<string>();
  const questions: VocabQuestion[] = [];

  vocabularySlots.forEach((slot, index) => {
    const candidates = seededShuffle(slot.pool, `cp:${attempt}:${index}`);
    const id = candidates.find((candidate) => !used.has(candidate));
    const item = week1Vocabulary.find((entry) => entry.id === id);

    if (!id || !item) return;

    used.add(id);
    questions.push(buildQuestion(item, slot.kind, `cp:${attempt}`));
  });

  return questions;
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

  const tokens = normaliseEnglish(answer)
    .replace(/[-/]/g, " ")
    .split(" ")
    .filter(Boolean);

  const groups = question.keywords ?? [];
  const hasAll =
    groups.length > 0 &&
    groups.every((group) => group.some((word) => tokens.includes(word)));
  const hasForbidden = (question.forbidden ?? []).some((word) =>
    tokens.includes(word),
  );

  return {
    correct: hasAll && !hasForbidden,
    expected: question.answer,
    explanation: question.explanation,
  };
}

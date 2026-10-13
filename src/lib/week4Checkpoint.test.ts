import { describe, expect, it } from "vitest";

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import {
  checkpoint4ListeningItems,
  checkpoint4ReadingQuestions,
  checkpoint4ReadingText,
  checkpoint4Speaking,
  week4GrammarSlots,
  week4VocabularySlots,
} from "../data/lessons/week4Checkpoint";
import { week4IrregularVerbsQuiz } from "../data/lessons/week4IrregularVerbs";
import { week4PronounsQuiz } from "../data/lessons/week4Pronouns";
import { week4ReadingPassages } from "../data/lessons/week4Reading";
import { week4Vocabulary } from "../data/lessons/week4Vocabulary";

import {
  buildWeek4CheckpointGrammar,
  buildWeek4CheckpointVocabulary,
} from "./checkpointBuilders";
import { week4CheckpointDefinition } from "./checkpointDefinitions";
import {
  CHECKPOINT_TOTAL,
  WEEK2_CHECKPOINT_TOTAL,
  WEEK3_CHECKPOINT_TOTAL,
  WEEK4_CHECKPOINT,
  WEEK4_CHECKPOINT_ID,
  WEEK4_CHECKPOINT_TOTAL,
  checkpointConfigFor,
  evaluateCheckpoint,
  isWeek1Mastered,
  isWeek2Mastered,
  isWeek3Mastered,
  isWeek4Mastered,
  lowestSections,
  overallRequiredMarks,
  parseSections,
  requiredMarks,
  serializeSections,
  type SectionScores,
} from "./checkpointScoring";
import { buildReviewExercise, lessonIdFor } from "./reviewExercises";

const full: SectionScores = {
  vocabulary: 8, grammar: 12, reading: 4, listening: 4, writing: 6, speaking: 5,
};

const evaluate = (scores: Partial<SectionScores>) =>
  evaluateCheckpoint({ ...full, ...scores }, WEEK4_CHECKPOINT);

describe("checkpoint-004 marks and thresholds", () => {
  it("totals 39 marks across six sections", () => {
    expect(WEEK4_CHECKPOINT_TOTAL).toBe(39);
    expect(WEEK4_CHECKPOINT.rules.map((rule) => [rule.key, rule.max])).toEqual([
      ["vocabulary", 8], ["grammar", 12], ["reading", 4],
      ["listening", 4], ["writing", 6], ["speaking", 5],
    ]);
  });

  it("needs 32/39 overall (80%, rounded up to whole marks)", () => {
    expect(overallRequiredMarks(WEEK4_CHECKPOINT)).toBe(32);
    expect(Math.ceil(39 * 0.8)).toBe(32);
  });

  it("uses the agreed section minimums, with none for reading", () => {
    const required = Object.fromEntries(WEEK4_CHECKPOINT.rules.map((rule) => [rule.key, requiredMarks(rule)]));
    expect(required).toEqual({
      vocabulary: 6, grammar: 9, reading: 0, listening: 2, writing: 4, speaking: 3,
    });
  });

  it("passes at exactly 32 with every minimum met, and fails at 31", () => {
    // 6 + 9 + 4 + 4 + 6 + 3 = 32
    const pass = evaluate({ vocabulary: 6, grammar: 9, speaking: 3 });
    expect(pass.total).toBe(32);
    expect(pass.passed).toBe(true);

    // 6 + 9 + 3 + 4 + 6 + 3 = 31
    const fail = evaluate({ vocabulary: 6, grammar: 9, reading: 3, speaking: 3 });
    expect(fail.total).toBe(31);
    expect(fail.overallPassed).toBe(false);
    expect(fail.passed).toBe(false);
  });

  it.each([
    ["vocabulary", 5],
    ["grammar", 8],
    ["listening", 1],
    ["writing", 3],
    ["speaking", 2],
  ] as const)("fails a high overall score when %s is below its minimum (%i)", (key, score) => {
    const result = evaluate({ [key]: score });
    expect(result.total).toBeGreaterThanOrEqual(32);
    expect(result.overallPassed).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.weakSections).toEqual([key]);
  });

  it("does not fail on reading alone", () => {
    const result = evaluate({ reading: 0 });
    expect(result.total).toBe(35);
    expect(result.passed).toBe(true);
  });

  it("is found by id, serialises all six sections and parses them back", () => {
    expect(checkpointConfigFor(WEEK4_CHECKPOINT_ID)).toBe(WEEK4_CHECKPOINT);
    const result = evaluate({ grammar: 10 });
    expect(parseSections(serializeSections(result), WEEK4_CHECKPOINT)).toEqual({ ...full, grammar: 10 });
  });

  it("reports the lowest sections after a pass", () => {
    expect(lowestSections(evaluate({ listening: 3, writing: 5 }))).toEqual(["listening"]);
    expect(lowestSections(evaluate({}))).toEqual([]);
  });

  it("leaves the Week 1–3 checkpoints unchanged", () => {
    expect(CHECKPOINT_TOTAL).toBe(34);
    expect(WEEK2_CHECKPOINT_TOTAL).toBe(32);
    expect(WEEK3_CHECKPOINT_TOTAL).toBe(32);
    expect(checkpointConfigFor("checkpoint-003").rules).toHaveLength(5);
    expect(checkpointConfigFor("checkpoint-001").rules).toHaveLength(6);
  });
});

describe("mastery helpers", () => {
  it("marks Week 4 (October Foundations) mastered only once checkpoint-004 is complete", () => {
    expect(isWeek4Mastered([])).toBe(false);
    expect(isWeek4Mastered(["checkpoint-001", "checkpoint-002", "checkpoint-003"])).toBe(false);
    expect(isWeek4Mastered(["checkpoint-004"])).toBe(true);
  });

  it("keeps the earlier helpers unchanged", () => {
    expect(isWeek1Mastered(["checkpoint-001"])).toBe(true);
    expect(isWeek2Mastered(["checkpoint-002"])).toBe(true);
    expect(isWeek3Mastered(["checkpoint-003"])).toBe(true);
    expect(isWeek3Mastered(["checkpoint-004"])).toBe(false);
  });
});

describe("checkpoint-004 content", () => {
  const allGrammar = week4GrammarSlots.flat();
  const lessonIds = new Set([...week4PronounsQuiz, ...week4IrregularVerbsQuiz].map((q) => q.id));
  const lessonPrompts = new Set(
    [...week4PronounsQuiz, ...week4IrregularVerbsQuiz].map((q) =>
      q.kind === "choice" || q.kind === "typed" ? q.prompt : q.kind === "fill" ? q.sentence : q.accepted[0],
    ),
  );
  const promptOf = (q: CourseQuestion) =>
    q.kind === "choice" || q.kind === "typed" ? q.prompt : q.kind === "fill" ? q.sentence : q.accepted[0];

  it("has twelve grammar slots with two variants each and unique ids", () => {
    expect(week4GrammarSlots).toHaveLength(12);
    for (const slot of week4GrammarSlots) expect(slot).toHaveLength(2);
    const ids = allGrammar.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses fresh questions, not replays of the Week 4 lessons", () => {
    for (const question of allGrammar) {
      expect(lessonIds.has(question.id), question.id).toBe(false);
      expect(lessonPrompts.has(promptOf(question)), question.id).toBe(false);
    }
    expect(checkpoint4ReadingText).not.toBe(week4ReadingPassages[0].text);
  });

  it("traces every grammar question to the lesson that teaches it", () => {
    const expected: Record<string, string> = {
      "c4-art-": "grammar-006", "c4-acc-": "grammar-007", "c4-neg-": "grammar-008",
      "c4-pr-": "grammar-009", "c4-iv-": "grammar-010", "c4-v2-": "grammar-002", "c4-q-": "grammar-003",
    };
    for (const question of allGrammar) {
      const prefix = Object.keys(expected).find((p) => question.id.startsWith(p));
      expect(prefix, question.id).toBeDefined();
      expect(lessonIdFor("grammar", question.id), question.id).toBe(expected[prefix!]);
      expect(buildReviewExercise("grammar", question.id), question.id).not.toBeNull();
    }
  });

  it("covers every required skill, with most weight on Week 4", () => {
    const prefixes = allGrammar.map((q) => q.id.replace(/-\d+[ab]$/, ""));
    for (const prefix of ["c4-art", "c4-acc", "c4-neg", "c4-pr", "c4-iv", "c4-v2", "c4-q"]) {
      expect(prefixes, prefix).toContain(prefix);
    }
    const week4Slots = week4GrammarSlots.filter((slot) => /^c4-(pr|iv)-/.test(slot[0].id));
    expect(week4Slots.length).toBeGreaterThanOrEqual(5);
  });

  it("builds 12 grammar and 8 vocabulary questions for every attempt", () => {
    for (const attempt of [1, 2, 3, 4]) {
      expect(buildWeek4CheckpointGrammar(attempt)).toHaveLength(12);
      const vocab = buildWeek4CheckpointVocabulary(attempt);
      expect(vocab).toHaveLength(8);
      expect(new Set(vocab.map((q) => q.itemId)).size).toBe(8);
      for (const q of vocab) if (q.options.length) expect(q.options, q.id).toContain(q.answer);
    }
    expect(buildWeek4CheckpointGrammar(1)).not.toEqual(buildWeek4CheckpointGrammar(2));
  });

  it("draws vocabulary from Weeks 1–4, mostly Week 4", () => {
    const week4Ids = new Set(week4Vocabulary.map((item) => item.id));
    const week4Slots = week4VocabularySlots.filter((slot) => slot.pool.every((id) => week4Ids.has(id)));
    expect(week4Slots.length).toBe(6);
    expect(week4VocabularySlots.length - week4Slots.length).toBe(2);
    expect(new Set(week4VocabularySlots.map((slot) => slot.kind))).toEqual(
      new Set(["de-en", "en-de", "article", "plural", "typed"]),
    );
  });

  it("has 4 reading and 4 listening marks", () => {
    expect(checkpoint4ReadingQuestions).toHaveLength(4);
    expect(checkpoint4ListeningItems.flatMap((item) => item.questions)).toHaveLength(4);
    expect(week4CheckpointDefinition.listeningQuestions).toHaveLength(4);
  });

  it("asks for a 2–3 minute spoken introduction with a 5-point self-check", () => {
    expect(checkpoint4Speaking.seconds).toBe(180);
    expect(checkpoint4Speaking.checklist).toHaveLength(5);
    expect(week4CheckpointDefinition.speaking).toBe(checkpoint4Speaking);
    expect(week4CheckpointDefinition.writing.checklist).toHaveLength(6);
    expect(week4CheckpointDefinition.sections).toEqual([
      "vocabulary", "grammar", "reading", "listening", "writing", "speaking",
    ]);
  });

  it("does not present the result as a CEFR certificate", () => {
    expect(week4CheckpointDefinition.passNote).toMatch(/not a CEFR A1 certificate/);
    expect(week4CheckpointDefinition.title).toBe("October Foundations Checkpoint");
  });

  it("recommends the Week 4 lessons for weak sections", () => {
    const result = evaluate({ vocabulary: 4, listening: 1, speaking: 1 });
    const targets = week4CheckpointDefinition.recommend(result, []).map((r) => r.target);
    expect(targets).toEqual([
      { type: "lesson", taskId: "vocab-004" },
      { type: "lesson", taskId: "listening-004" },
      { type: "lesson", taskId: "speaking-002" },
      { type: "review" },
    ]);

    const grammar = week4CheckpointDefinition.recommend(evaluate({ grammar: 5 }), ["grammar-009"]);
    expect(grammar[0]).toEqual({ label: "Review accusative pronouns", target: { type: "lesson", taskId: "grammar-009" } });
  });
});

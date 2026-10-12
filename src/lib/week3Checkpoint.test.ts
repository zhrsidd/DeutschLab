import { describe, expect, it } from "vitest";

import {
  checkpoint3ListeningItems,
  checkpoint3ReadingQuestions,
  checkpoint3ReadingText,
  week3GrammarSlots,
  week3VocabularySlots,
} from "../data/lessons/week3Checkpoint";
import { findVocabularyItem } from "../data/lessons/vocabularySets";
import { week3ArticlesQuiz } from "../data/lessons/week3Articles";
import { week3AccusativeQuiz } from "../data/lessons/week3Accusative";
import { week3NegationQuiz } from "../data/lessons/week3Negation";
import { week3ListeningClips } from "../data/lessons/week3Listening";
import { week3ReadingPassages } from "../data/lessons/week3Reading";
import { checkpoint3Writing, roomWriting } from "../data/lessons/week3Writing";

import {
  buildWeek3CheckpointGrammar,
  buildWeek3CheckpointVocabulary,
  gradeComprehension,
} from "./checkpointBuilders";
import { week3CheckpointDefinition } from "./checkpointDefinitions";
import {
  CHECKPOINT_TOTAL,
  WEEK1_CHECKPOINT,
  WEEK2_CHECKPOINT,
  WEEK2_CHECKPOINT_TOTAL,
  WEEK3_CHECKPOINT,
  WEEK3_CHECKPOINT_ID,
  WEEK3_CHECKPOINT_TOTAL,
  checkpointConfigFor,
  evaluateCheckpoint,
  isWeek1Mastered,
  isWeek2Mastered,
  isWeek3Mastered,
  parseSections,
  serializeSections,
  type SectionScores,
} from "./checkpointScoring";
import {
  buildReviewExercise,
  lessonIdFor,
  toChoiceQuestion,
  toTypedQuestion,
} from "./reviewExercises";
import { gradeVocabAnswer } from "./vocabularyExercises";
import { countWords } from "./text";

const w3 = (
  vocabulary: number,
  grammar: number,
  reading: number,
  listening: number,
  writing: number,
) =>
  evaluateCheckpoint(
    { vocabulary, grammar, reading, listening, writing } as Partial<SectionScores>,
    WEEK3_CHECKPOINT,
  );

describe("checkpoint-003 scoring", () => {
  it("is out of 32 marks: 8 + 10 + 4 + 4 + 6", () => {
    expect(WEEK3_CHECKPOINT_TOTAL).toBe(32);
    expect(WEEK3_CHECKPOINT.rules.map((rule) => [rule.key, rule.max])).toEqual([
      ["vocabulary", 8], ["grammar", 10], ["reading", 4], ["listening", 4], ["writing", 6],
    ]);
    expect(w3(8, 10, 4, 4, 6).possible).toBe(32);
  });

  it("passes at exactly 26/32 and fails at 25/32", () => {
    expect(w3(6, 7, 4, 3, 6).total).toBe(26);
    expect(w3(6, 7, 4, 3, 6).passed).toBe(true);

    const low = w3(6, 7, 4, 3, 5);
    expect(low.total).toBe(25);
    expect(low.overallPassed).toBe(false);
    expect(low.passed).toBe(false);
  });

  it("requires vocabulary 6/8, grammar 7/10, listening 2/4 and writing 4/6", () => {
    const required = Object.fromEntries(
      w3(8, 10, 4, 4, 6).sections.map((section) => [section.key, section.required]),
    );

    expect(required).toEqual({ vocabulary: 6, grammar: 7, reading: 0, listening: 2, writing: 4 });
  });

  it.each([
    ["vocabulary", w3(5, 10, 4, 4, 6)],
    ["grammar", w3(8, 6, 4, 4, 6)],
    ["listening", w3(8, 10, 4, 1, 6)],
    ["writing", w3(8, 10, 4, 4, 3)],
  ])("fails when %s is below its minimum despite a high total", (key, result) => {
    expect(result.overallPassed).toBe(true);
    expect(result.percent).toBeGreaterThanOrEqual(80);
    expect(result.passed).toBe(false);
    expect(result.weakSections).toEqual([key]);
  });

  it("has no minimum for reading", () => {
    expect(w3(8, 10, 0, 4, 6).passed).toBe(true);
  });

  it("marks the weak sections when only the total falls short", () => {
    const result = w3(6, 7, 1, 2, 4);

    expect(result.passed).toBe(false);
    expect(result.weakSections.length).toBeGreaterThan(0);
  });

  it("round-trips scores with its own config and rejects other shapes", () => {
    const json = serializeSections(w3(7, 8, 3, 3, 5));

    expect(parseSections(json, WEEK3_CHECKPOINT)).toEqual({
      vocabulary: 7, grammar: 8, reading: 3, listening: 3, writing: 5,
    });
    expect(parseSections(json)).toBeNull(); // Week 1 expects a speaking score
    expect(parseSections(null, WEEK3_CHECKPOINT)).toBeNull();
  });

  it("selects the config by checkpoint id and leaves Weeks 1–2 alone", () => {
    expect(checkpointConfigFor("checkpoint-003")).toBe(WEEK3_CHECKPOINT);
    expect(checkpointConfigFor("checkpoint-002")).toBe(WEEK2_CHECKPOINT);
    expect(checkpointConfigFor("checkpoint-001")).toBe(WEEK1_CHECKPOINT);
    expect(CHECKPOINT_TOTAL).toBe(34);
    expect(WEEK2_CHECKPOINT_TOTAL).toBe(32);
    expect(WEEK3_CHECKPOINT.id).toBe(WEEK3_CHECKPOINT_ID);
  });
});

describe("Week 3 mastery", () => {
  it("is false until checkpoint-003 is complete", () => {
    expect(isWeek3Mastered([])).toBe(false);
    expect(
      isWeek3Mastered(["checkpoint-002", "vocab-003", "grammar-006", "grammar-007", "grammar-008", "writing-002"]),
    ).toBe(false);
  });

  it("is true once checkpoint-003 is complete", () => {
    expect(isWeek3Mastered(["checkpoint-003"])).toBe(true);
  });

  it("is independent of Weeks 1 and 2 in every direction", () => {
    expect(isWeek3Mastered(["checkpoint-001", "checkpoint-002"])).toBe(false);
    expect(isWeek1Mastered(["checkpoint-003"])).toBe(false);
    expect(isWeek2Mastered(["checkpoint-003"])).toBe(false);
    expect(isWeek1Mastered(["checkpoint-001"])).toBe(true);
    expect(isWeek2Mastered(["checkpoint-002"])).toBe(true);
  });
});

describe("checkpoint-003 content", () => {
  const vocab = buildWeek3CheckpointVocabulary(0);

  it("builds 8 vocabulary and 10 grammar questions for every attempt", () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      expect(buildWeek3CheckpointVocabulary(attempt)).toHaveLength(8);
      expect(buildWeek3CheckpointGrammar(attempt)).toHaveLength(10);
    }
  });

  it("is deterministic, and attempts vary", () => {
    expect(buildWeek3CheckpointVocabulary(2)).toEqual(buildWeek3CheckpointVocabulary(2));
    expect(buildWeek3CheckpointGrammar(1)).toEqual(buildWeek3CheckpointGrammar(1));
    expect(buildWeek3CheckpointGrammar(1)).not.toEqual(buildWeek3CheckpointGrammar(0));
  });

  it("uses distinct vocabulary items and valid pools", () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const ids = buildWeek3CheckpointVocabulary(attempt).map((entry) => entry.itemId);
      expect(new Set(ids).size).toBe(ids.length);
    }

    for (const slot of week3VocabularySlots) {
      for (const id of slot.pool) {
        const item = findVocabularyItem(id);
        expect(item, id).toBeDefined();
        expect(item!.category, id).toBe(slot.category);
        if (slot.kind === "plural") expect(item!.noPlural, id).toBeUndefined();
      }
    }
  });

  it("tests meaning, noun, article, plural and typed recall", () => {
    const kinds = new Set(vocab.map((entry) => entry.kind));

    for (const kind of ["de-en", "en-de", "article", "plural", "typed"]) {
      expect(kinds.has(kind as never), kind).toBe(true);
    }
  });

  it("grades checkpoint vocabulary like the lesson (the article is required)", () => {
    const typed = buildWeek3CheckpointVocabulary(0).find((entry) => entry.kind === "typed")!;

    expect(gradeVocabAnswer(typed, typed.answer).correct).toBe(true);
    expect(gradeVocabAnswer(typed, typed.answer.replace(/^(der|die|das) /, "")).correct).toBe(false);
  });

  it("covers gender, articles, plurals, the accusative, objects, kein and nicht vs kein", () => {
    const skills = week3GrammarSlots.map((options) => options[0].id.replace(/\d+[ab]$/, ""));

    expect(skills.filter((id) => id === "c3-art-")).toHaveLength(4);
    expect(skills.filter((id) => id === "c3-acc-")).toHaveLength(3);
    expect(skills.filter((id) => id === "c3-neg-")).toHaveLength(3);
    expect(week3GrammarSlots.every((options) => options.length === 2)).toBe(true);
  });

  it("uses fresh questions, not replays of the lesson assessments", () => {
    const lessonQuestions = [...week3ArticlesQuiz, ...week3AccusativeQuiz, ...week3NegationQuiz];
    const lessonIds = new Set(lessonQuestions.map((entry) => entry.id));
    const lessonPrompts = new Set(
      lessonQuestions.map((entry) =>
        entry.kind === "fill" ? entry.sentence : "prompt" in entry ? entry.prompt : "",
      ),
    );

    for (const entry of week3GrammarSlots.flat()) {
      expect(lessonIds.has(entry.id), entry.id).toBe(false);

      const prompt = entry.kind === "fill" ? entry.sentence : "prompt" in entry ? entry.prompt : "";
      expect(lessonPrompts.has(prompt), entry.id).toBe(false);
    }

    const lessonReading = new Set(week3ReadingPassages.map((p) => p.text));
    expect(lessonReading.has(checkpoint3ReadingText)).toBe(false);

    const lessonAudio = new Set(week3ListeningClips.map((c) => c.audio));
    for (const clip of checkpoint3ListeningItems) expect(lessonAudio.has(clip.audio)).toBe(false);

    expect(checkpoint3Writing.prompt).not.toBe(roomWriting.prompt);
  });

  it("has valid, uniquely-identified grammar questions that trace to Week 3 lessons", () => {
    const ids = week3GrammarSlots.flat().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entry of week3GrammarSlots.flat()) {
      if (entry.kind === "choice") expect(entry.options, entry.id).toContain(entry.answer);
      else expect("accepted" in entry && entry.accepted.length, entry.id).toBeGreaterThan(0);
    }

    expect(lessonIdFor("grammar", "c3-art-1a")).toBe("grammar-006");
    expect(lessonIdFor("grammar", "c3-acc-5a")).toBe("grammar-007");
    expect(lessonIdFor("grammar", "c3-neg-7b")).toBe("grammar-008");
  });

  it("grades the checkpoint grammar exercises", () => {
    const typedGrade = (id: string, input: string) => {
      const exercise = buildReviewExercise("grammar", id)!;
      return toTypedQuestion(exercise, 0)!.grade(input);
    };
    const choiceGrade = (id: string, option: string) =>
      toChoiceQuestion(buildReviewExercise("grammar", id)!)!.grade(option);

    expect(choiceGrade("c3-acc-5a", "den").correct).toBe(true);
    expect(choiceGrade("c3-acc-5a", "der").correct).toBe(false);
    expect(typedGrade("c3-acc-5b", "einen").correct).toBe(true);
    expect(typedGrade("c3-acc-5b", "ein").correct).toBe(false);
    expect(choiceGrade("c3-neg-7b", "keinen").correct).toBe(true);
    expect(choiceGrade("c3-neg-7b", "kein").correct).toBe(false);
    expect(choiceGrade("c3-neg-8a", "nicht").correct).toBe(true);
    expect(typedGrade("c3-neg-10a", "Ich habe keinen Computer.").correct).toBe(true);
    expect(typedGrade("c3-neg-10a", "Ich habe nicht Computer.").correct).toBe(false);
    expect(typedGrade("c3-art-4b", "die Gläser").correct).toBe(true);
    expect(typedGrade("c3-art-4b", "die Glaeser").correct).toBe(true);
    expect(typedGrade("c3-art-4b", "die Glas").correct).toBe(false);
    expect(typedGrade("c3-art-2a", "das").correct).toBe(true);
    expect(typedGrade("c3-art-2a", "der").correct).toBe(false);
  });

  it("has a 4-mark reading section and a 4-mark listening section", () => {
    expect(checkpoint3ReadingQuestions).toHaveLength(4);
    expect(week3CheckpointDefinition.readingQuestions).toHaveLength(4);
    expect(week3CheckpointDefinition.listeningQuestions).toHaveLength(4);
    expect(checkpoint3ListeningItems.flatMap((clip) => clip.questions)).toHaveLength(4);

    for (const question of week3CheckpointDefinition.listeningQuestions) {
      expect(question.audio, question.id).toBeTruthy();
    }

    const short = checkpoint3ReadingQuestions.find((entry) => entry.kind === "short")!;
    expect(gradeComprehension(short, "neu").correct).toBe(true);
    expect(gradeComprehension(short, "alt").correct).toBe(false);
  });

  it("asks for a fresh 50–70 word paragraph", () => {
    expect(week3CheckpointDefinition.writing.targetWords).toEqual({ min: 50, max: 70 });
    expect(countWords(checkpoint3Writing.sample)).toBeGreaterThanOrEqual(50);
    expect(week3CheckpointDefinition.writing.checklist).toHaveLength(6);
  });

  it("introduces no Week 4 material", () => {
    const text = JSON.stringify([
      week3GrammarSlots,
      checkpoint3ReadingText,
      checkpoint3ReadingQuestions,
      checkpoint3ListeningItems,
      checkpoint3Writing,
    ]);

    expect(text).not.toMatch(
      /\b(kann|kannst|müssen|muss|will|wollen|darf|dem|einem|keinem|weil|dass|ihn|mich|dich|aufstehen|fährt|sieht|nimmt|gibt)\b/i,
    );
    expect(text).not.toMatch(/dative|modal|separable|Perfekt/i);
  });

  it("recommends the right Week 3 lessons for weak sections", () => {
    const result = w3(4, 5, 1, 1, 2);
    const recommend = week3CheckpointDefinition.recommend(result, ["grammar-007", "grammar-008"]);
    const targets = recommend.map((entry) => JSON.stringify(entry.target));

    for (const taskId of ["vocab-003", "grammar-007", "grammar-008", "listening-003", "writing-002"]) {
      expect(targets, taskId).toContain(JSON.stringify({ type: "lesson", taskId }));
    }
    expect(targets).toContain(JSON.stringify({ type: "review" }));
  });

  it("recommends reading when only the total falls short", () => {
    const result = w3(6, 7, 0, 2, 4);
    const recommend = week3CheckpointDefinition.recommend(result, []);

    expect(result.passed).toBe(false);
    expect(recommend.map((entry) => entry.target)).toContainEqual({
      type: "lesson",
      taskId: "reading-002",
    });
  });

  it("falls back to grammar-006 when no specific lesson was missed", () => {
    const recommend = week3CheckpointDefinition.recommend(w3(8, 6, 4, 4, 6), []);

    expect(recommend.map((entry) => entry.target)).toContainEqual({
      type: "lesson",
      taskId: "grammar-006",
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  CHECKPOINT_ID,
  CHECKPOINT_TOTAL,
  SECTION_RULES,
  evaluateCheckpoint,
  isWeek1Mastered,
  parseSections,
  requiredMarks,
  serializeSections,
  type SectionScores,
} from "./checkpointScoring";

const scores = (
  vocabulary: number,
  grammar: number,
  reading: number,
  listening: number,
  writing: number,
  speaking: number,
): SectionScores => ({
  vocabulary,
  grammar,
  reading,
  listening,
  writing,
  speaking,
});

describe("checkpoint scoring", () => {
  it("has 34 marks in the agreed split", () => {
    expect(CHECKPOINT_TOTAL).toBe(34);
    expect(SECTION_RULES.map((rule) => rule.max)).toEqual([8, 8, 4, 4, 5, 5]);
  });

  it("converts section minimums into whole marks", () => {
    expect(SECTION_RULES.map(requiredMarks)).toEqual([6, 6, 0, 2, 3, 3]);
  });

  it("passes at 80%+ with every section minimum met", () => {
    const result = evaluateCheckpoint(scores(7, 6, 4, 3, 4, 4));

    expect(result.total).toBe(28);
    expect(result.percent).toBe(82);
    expect(result.passed).toBe(true);
    expect(result.weakSections).toEqual([]);
  });

  it("fails just under 80% overall", () => {
    const result = evaluateCheckpoint(scores(7, 6, 4, 3, 4, 3));

    expect(result.total).toBe(27);
    expect(result.overallPassed).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("fails when grammar is under its minimum despite a high total", () => {
    const result = evaluateCheckpoint(scores(8, 5, 4, 4, 5, 5));

    expect(result.percent).toBeGreaterThanOrEqual(80);
    expect(result.overallPassed).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.weakSections).toEqual(["grammar"]);
  });

  it("fails when vocabulary is under its minimum", () => {
    expect(evaluateCheckpoint(scores(5, 8, 4, 4, 5, 5)).passed).toBe(false);
  });

  it("enforces the listening minimum (2/4)", () => {
    expect(evaluateCheckpoint(scores(8, 8, 4, 1, 5, 5)).passed).toBe(false);
    expect(evaluateCheckpoint(scores(8, 8, 4, 2, 5, 5)).passed).toBe(true);
  });

  it("enforces the writing minimum (3/5)", () => {
    expect(evaluateCheckpoint(scores(8, 8, 4, 4, 2, 5)).passed).toBe(false);
    expect(evaluateCheckpoint(scores(8, 8, 4, 4, 3, 5)).passed).toBe(true);
  });

  it("enforces the speaking minimum (3/5)", () => {
    expect(evaluateCheckpoint(scores(8, 8, 4, 4, 5, 2)).passed).toBe(false);
    expect(evaluateCheckpoint(scores(8, 8, 4, 4, 5, 3)).passed).toBe(true);
  });

  it("reports sections below the bar when only the total is short", () => {
    const result = evaluateCheckpoint(scores(6, 6, 2, 2, 3, 3));

    expect(result.passed).toBe(false);
    expect(result.overallPassed).toBe(false);
    expect(result.weakSections.length).toBeGreaterThan(0);
  });

  it("clamps out-of-range scores", () => {
    const result = evaluateCheckpoint(scores(99, -3, 4, 4, 5, 5));

    expect(result.sections[0].score).toBe(8);
    expect(result.sections[1].score).toBe(0);
  });

  it("round-trips section scores through JSON", () => {
    const original = scores(7, 6, 4, 3, 4, 4);
    const json = serializeSections(evaluateCheckpoint(original));

    expect(parseSections(json)).toEqual(original);
  });

  it("rejects malformed stored scores", () => {
    expect(parseSections(null)).toBeNull();
    expect(parseSections("{not json")).toBeNull();
    expect(parseSections('{"vocabulary":1}')).toBeNull();
  });
});

describe("Week 1 mastery", () => {
  it("is false until the checkpoint is complete", () => {
    expect(isWeek1Mastered([])).toBe(false);
    expect(isWeek1Mastered(["vocab-001", "speaking-001"])).toBe(false);
  });

  it("is true once the checkpoint is complete", () => {
    expect(isWeek1Mastered(["vocab-001", CHECKPOINT_ID])).toBe(true);
  });
});

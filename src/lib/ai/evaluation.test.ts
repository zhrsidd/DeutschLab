import { describe, expect, it } from "vitest";

import { starterTasks } from "../../data/unit1";
import { countWords } from "../text";

import { EVAL_CASES, scoreCase, type EvalCategory } from "./evaluation";
import { appearsIn, validateAssessment } from "./schemas";
import type { AssessmentFeedback, Correction } from "./types";

/*
 * Deterministic checks of the examiner evaluation set and its scorer. The
 * live model run is separate and opt-in (liveEval.test.ts).
 */

describe("evaluation set", () => {
  it("has at least 20 cases, including several with nothing to correct", () => {
    expect(EVAL_CASES.length).toBeGreaterThanOrEqual(20);
    expect(EVAL_CASES.filter((c) => c.expectNoErrors).length).toBeGreaterThanOrEqual(8);
    expect(new Set(EVAL_CASES.map((c) => c.id)).size).toBe(EVAL_CASES.length);
  });

  it("covers every required category", () => {
    const required: EvalCategory[] = [
      "correct",
      "article",
      "accusative",
      "conjugation",
      "word_order",
      "nicht_kein",
      "valid_alternative",
      "unnatural",
      "incomplete",
      "mixed_language",
      "ambiguous",
    ];
    const present = new Set(EVAL_CASES.map((c) => c.category));
    for (const category of required) expect(present, category).toContain(category);
  });

  it.each(EVAL_CASES)("$id: every span is really in the text and long enough to assess", (testCase) => {
    expect(countWords(testCase.text)).toBeGreaterThanOrEqual(5);
    for (const wrong of testCase.mustFlag) expect(appearsIn(wrong.span, testCase.text), wrong.span).toBe(true);
    for (const right of testCase.mustNotFlag) expect(appearsIn(right, testCase.text), right).toBe(true);
    expect(testCase.expectNoErrors).toBe(testCase.mustFlag.length === 0);
  });
});

function feedbackWith(corrections: Correction[], grammar = 5, task = 4): AssessmentFeedback {
  return {
    rubricVersion: "test",
    scores: {
      grammar: { score: grammar, comment: "" },
      vocabulary: { score: 4, comment: "" },
      task_completion: { score: task, comment: "" },
      coherence: { score: 4, comment: "" },
    },
    total: grammar + 8 + task,
    maxTotal: 20,
    strengths: [],
    improvements: [],
    corrections,
    missedRequirements: [],
    revisedText: "",
    recommendedLessons: [],
    uncertaintyNotes: [],
    validationNotes: [],
  };
}

const fix = (original: string, suggestion: string, severity: Correction["severity"] = "error"): Correction => ({
  original,
  suggestion,
  explanation: "",
  concept: "",
  category: "grammar",
  severity,
});

describe("scoreCase", () => {
  const byId = (id: string) => EVAL_CASES.find((c) => c.id === id)!;

  it("passes an examiner that finds the real error and nothing else", () => {
    const result = scoreCase(byId("accusative-bruder"), feedbackWith([fix("ein Bruder", "einen Bruder")], 3));
    expect(result).toEqual({ id: "accusative-bruder", passed: true, problems: [] });
  });

  it("fails an examiner that misses the error", () => {
    expect(scoreCase(byId("accusative-bruder"), feedbackWith([])).passed).toBe(false);
  });

  it("fails an examiner that 'corrects' correct feminine and neuter accusatives", () => {
    const result = scoreCase(byId("correct-feminine-accusative"), feedbackWith([fix("eine Tasche", "einen Tasche")]));
    expect(result.passed).toBe(false);
    expect(result.problems.join(" ")).toMatch(/false correction/);
  });

  it("accepts an optional style suggestion on acceptable text", () => {
    const result = scoreCase(
      byId("style-only-time-position"),
      feedbackWith([fix("Klavier jeden Tag", "jeden Tag Klavier", "suggestion")]),
    );
    expect(result.passed).toBe(true);
  });

  it("requires low task completion for a far-too-short answer", () => {
    expect(scoreCase(byId("incomplete-short"), feedbackWith([], 5, 4)).passed).toBe(false);
    expect(scoreCase(byId("incomplete-short"), feedbackWith([], 5, 1)).passed).toBe(true);
  });

  it("flags low grammar marks for error-free text", () => {
    expect(scoreCase(byId("correct-intro"), feedbackWith([], 2)).passed).toBe(false);
  });
});

describe("validator on evaluation texts", () => {
  it("removes a fabricated correction on every error-free case", () => {
    for (const testCase of EVAL_CASES.filter((c) => c.expectNoErrors)) {
      const raw = JSON.stringify({
        scores: {
          grammar: { score: 5, comment: "" },
          vocabulary: { score: 4, comment: "" },
          task_completion: { score: 3, comment: "" },
          coherence: { score: 4, comment: "" },
        },
        strengths: [],
        improvements: [],
        corrections: [fix("Ich habe ein Bruder", "Ich habe einen Bruder")],
        missed_requirements: [],
        revised_text: testCase.text,
        recommended_lessons: [],
        uncertainty_notes: [],
      });
      const feedback = validateAssessment(raw, {
        kind: testCase.kind,
        learnerText: testCase.text,
        allowedLessonIds: starterTasks.map((t) => t.id),
      });
      expect(feedback.corrections, testCase.id).toEqual([]);
    }
  });
});

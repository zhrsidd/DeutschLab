import { describe, expect, it } from "vitest";

import { AIError } from "./errors";
import {
  appearsIn,
  ASSESSMENT_SCHEMA,
  containsProficiencyClaim,
  validateAssessment,
  validateSessionSummary,
  validateTutorReply,
} from "./schemas";
import { RUBRIC_TOTAL } from "./types";

const LEARNER = "Ich habe ein Bruder. Er heißt Ali. Ich habe auch eine Schwester.";
const ALLOWED = ["grammar-007", "grammar-006", "vocab-002"];

const score = (value: number, comment = "Fine.") => ({ score: value, comment });

function output(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    scores: { grammar: score(3), vocabulary: score(4), task_completion: score(2), coherence: score(4) },
    strengths: ["Clear simple sentences."],
    improvements: ["Check the accusative after haben."],
    corrections: [
      {
        original: "ein Bruder",
        suggestion: "einen Bruder",
        explanation: "Bruder is masculine. After haben, use the accusative form einen Bruder.",
        concept: "accusative after haben",
        category: "grammar",
        severity: "error",
      },
    ],
    missed_requirements: ["school"],
    revised_text: "Ich habe einen Bruder. Er heißt Ali. Ich habe auch eine Schwester.",
    recommended_lessons: ["grammar-007"],
    uncertainty_notes: [],
    ...overrides,
  });
}

const validate = (raw: string, kind: "writing" | "speaking" = "writing") =>
  validateAssessment(raw, { kind, learnerText: LEARNER, allowedLessonIds: ALLOWED });

describe("validateAssessment", () => {
  it("accepts a well-formed answer and computes the total itself", () => {
    const feedback = validate(output());
    expect(feedback.total).toBe(13);
    expect(feedback.maxTotal).toBe(RUBRIC_TOTAL);
    expect(feedback.corrections).toHaveLength(1);
    expect(feedback.corrections[0]).toMatchObject({ original: "ein Bruder", suggestion: "einen Bruder", severity: "error" });
    expect(feedback.recommendedLessons).toEqual(["grammar-007"]);
    expect(feedback.validationNotes).toEqual([]);
  });

  it("ignores a total sent by the model", () => {
    expect(validate(output({ total: 20 })).total).toBe(13);
  });

  it.each([
    ["not JSON", "here is your feedback: great job"],
    ["an array", "[]"],
    ["missing scores", output({ scores: undefined })],
    ["a missing category", output({ scores: { grammar: score(3), vocabulary: score(3), task_completion: score(3) } })],
    ["a score above 5", output({ scores: { grammar: score(6), vocabulary: score(3), task_completion: score(3), coherence: score(3) } })],
    ["a negative score", output({ scores: { grammar: score(-1), vocabulary: score(3), task_completion: score(3), coherence: score(3) } })],
    ["a fractional score", output({ scores: { grammar: score(3.5), vocabulary: score(3), task_completion: score(3), coherence: score(3) } })],
    ["a string score", output({ scores: { grammar: score("5" as unknown as number), vocabulary: score(3), task_completion: score(3), coherence: score(3) } })],
    ["missing corrections", output({ corrections: undefined })],
    ["absurdly long text", output({ revised_text: "x".repeat(50_000) })],
  ])("rejects %s without producing a score", (_label, raw) => {
    expect(() => validate(raw)).toThrow(AIError);
    try {
      validate(raw);
    } catch (error) {
      expect((error as AIError).kind).toBe("invalid_output");
    }
  });

  it("removes corrections that quote words the learner never wrote", () => {
    const feedback = validate(
      output({
        corrections: [
          { original: "ein Bruder", suggestion: "einen Bruder", explanation: "e", concept: "c", category: "grammar", severity: "error" },
          { original: "Ich habe ein Hund", suggestion: "Ich habe einen Hund", explanation: "e", concept: "c", category: "grammar", severity: "error" },
        ],
      }),
    );
    expect(feedback.corrections.map((c) => c.original)).toEqual(["ein Bruder"]);
    expect(feedback.validationNotes[0]).toMatch(/1 suggested correction was removed/);
  });

  it("removes no-op and malformed corrections", () => {
    const feedback = validate(
      output({
        corrections: [
          { original: "eine Schwester", suggestion: "eine Schwester", explanation: "e", concept: "c", category: "grammar", severity: "error" },
          { original: "Er heißt Ali", suggestion: "Er heißt Ali.", explanation: "e", concept: "c", category: "made_up", severity: "error" },
          { original: "Er heißt Ali" },
          "nonsense",
        ],
      }),
    );
    expect(feedback.corrections).toEqual([]);
    expect(feedback.validationNotes.join(" ")).toMatch(/incomplete corrections were removed/);
  });

  it("matches quoted text despite case, spacing and punctuation differences", () => {
    expect(appearsIn("ich  habe EIN bruder.", LEARNER)).toBe(true);
    expect(appearsIn("„Er heißt Ali“", "Er heißt „Er heißt Ali“")).toBe(true);
    expect(appearsIn("", LEARNER)).toBe(false);
  });

  it("only keeps recommended lessons that exist and are in scope", () => {
    const feedback = validate(output({ recommended_lessons: ["grammar-007", "grammar-099", "<script>", "grammar-007", "vocab-002"] }));
    expect(feedback.recommendedLessons).toEqual(["grammar-007", "vocab-002"]);
    expect(feedback.validationNotes.join(" ")).toMatch(/not part of your course/);
  });

  it("removes CEFR level and certificate claims", () => {
    const feedback = validate(
      output({
        strengths: ["You are at A2 level already!", "Good use of haben."],
        improvements: ["This would pass the Goethe certificate."],
      }),
    );
    expect(feedback.strengths).toEqual(["Good use of haben."]);
    expect(feedback.improvements).toEqual([]);
    expect(feedback.validationNotes.join(" ")).toMatch(/CEFR/);
  });

  it("removes pronunciation comments from speaking feedback, and never has a pronunciation score", () => {
    const feedback = validate(
      output({
        strengths: ["Your pronunciation of ü is excellent.", "Good sentences."],
        scores: {
          grammar: score(3),
          vocabulary: score(4),
          task_completion: score(2),
          coherence: score(4),
          pronunciation: score(5),
        },
        pronunciation_score: 5,
      }),
      "speaking",
    );
    expect(feedback.strengths).toEqual(["Good sentences."]);
    expect(Object.keys(feedback.scores)).toEqual(["grammar", "vocabulary", "task_completion", "coherence"]);
    expect(JSON.stringify(feedback)).not.toMatch(/pronunciation_score|"pronunciation":/);
    expect(feedback.validationNotes.join(" ")).toMatch(/pronunciation cannot be judged/);
  });

  it("keeps model text as plain strings (no HTML is interpreted)", () => {
    const feedback = validate(output({ strengths: ["<img src=x onerror=alert(1)>"] }));
    expect(feedback.strengths).toEqual(["<img src=x onerror=alert(1)>"]);
  });

  it("schema does not ask for a total or a pronunciation score", () => {
    const keys = Object.keys(ASSESSMENT_SCHEMA.properties);
    expect(keys).not.toContain("total");
    expect(JSON.stringify(ASSESSMENT_SCHEMA)).not.toMatch(/pronunciation/i);
  });
});

describe("containsProficiencyClaim", () => {
  it.each(["You are A1.", "This is B1 level writing.", "CEFR estimate: A2", "level of C1", "zertifiziert"])("flags %s", (text) =>
    expect(containsProficiencyClaim(text)).toBe(true),
  );
  it.each(["Good use of the accusative.", "Practise grammar-007.", "Week 4 grammar is used well."])("allows %s", (text) =>
    expect(containsProficiencyClaim(text)).toBe(false),
  );
});

describe("validateTutorReply", () => {
  const reply = (overrides: Record<string, unknown> = {}) =>
    JSON.stringify({ reply: "Schön! Hast du auch eine Schwester?", english_help: "Nice! Do you also have a sister?", corrections: [], new_words: [], ...overrides });

  it("keeps corrections only when they quote the learner's last message", () => {
    const result = validateTutorReply(
      reply({
        corrections: [
          { original: "ein Bruder", corrected: "einen Bruder", explanation: "Accusative." },
          { original: "ich bin fünfzehn", corrected: "Ich bin fünfzehn", explanation: "Invented." },
        ],
      }),
      { learnerMessage: "Ich habe ein Bruder.", correctionsWanted: true },
    );
    expect(result.corrections).toEqual([{ original: "ein Bruder", corrected: "einen Bruder", explanation: "Accusative." }]);
  });

  it("drops corrections in delayed mode", () => {
    const result = validateTutorReply(
      reply({ corrections: [{ original: "ein Bruder", corrected: "einen Bruder", explanation: "Accusative." }] }),
      { learnerMessage: "Ich habe ein Bruder.", correctionsWanted: false },
    );
    expect(result.corrections).toEqual([]);
  });

  it("rejects an empty reply", () => {
    expect(() => validateTutorReply(reply({ reply: "  " }), { learnerMessage: "Hallo", correctionsWanted: true })).toThrow(AIError);
  });

  it("limits new words", () => {
    const words = Array.from({ length: 8 }, (_, i) => ({ german: `Wort${i}`, english: `word${i}` }));
    expect(validateTutorReply(reply({ new_words: words }), { learnerMessage: "Hallo", correctionsWanted: true }).newWords).toHaveLength(4);
  });
});

describe("validateSessionSummary", () => {
  it("keeps only mistakes the learner actually made, and known lessons", () => {
    const summary = validateSessionSummary(
      JSON.stringify({
        recurring_mistakes: [
          { pattern: "Accusative", original: "ein Bruder", corrected: "einen Bruder", explanation: "Masculine." },
          { pattern: "Invented", original: "Ich bin gegangen", corrected: "x", explanation: "y" },
        ],
        strengths: ["Good questions."],
        recommended_lessons: ["grammar-007", "grammar-042"],
        next_step: "Practise den and einen.",
      }),
      { learnerMessages: ["Ich habe ein Bruder.", "Er heißt Ali."], allowedLessonIds: ALLOWED },
    );
    expect(summary.recurringMistakes.map((m) => m.original)).toEqual(["ein Bruder"]);
    expect(summary.recommendedLessons).toEqual(["grammar-007"]);
  });
});

import { describe, expect, it } from "vitest";

import { articlesCourse, week3ArticlesQuiz } from "../data/lessons/week3Articles";
import { week3Vocabulary } from "../data/lessons/week3Vocabulary";

import {
  buildReviewExercise,
  lessonIdFor,
  toChoiceQuestion,
  toTypedQuestion,
} from "./reviewExercises";

const vocab = (german: string) =>
  week3Vocabulary.find((item) => item.german === german);

function typedGrade(id: string, input: string) {
  const exercise = buildReviewExercise("grammar", id);
  const question = exercise && toTypedQuestion(exercise, 0);
  if (!question) throw new Error(`no typed question for ${id}`);
  return question.grade(input);
}

describe("grammar-006 content", () => {
  it("has 14–16 questions with unique art- ids", () => {
    expect(week3ArticlesQuiz.length).toBeGreaterThanOrEqual(14);
    expect(week3ArticlesQuiz.length).toBeLessThanOrEqual(16);

    const ids = week3ArticlesQuiz.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("art-"))).toBe(true);
  });

  it("is task grammar-006 with a pass mark of 80%", () => {
    expect(articlesCourse.taskId).toBe("grammar-006");
    expect(articlesCourse.questions).toBe(week3ArticlesQuiz);
    expect(Math.ceil(week3ArticlesQuiz.length * 0.8)).toBe(13);
    expect(articlesCourse.goal).toContain("13/16");
    expect(articlesCourse.failMessage).toContain("13/16");
  });

  it("covers every required question type", () => {
    const kinds = new Set(week3ArticlesQuiz.map((q) => q.kind));

    expect(kinds).toEqual(new Set(["choice", "fill", "typed"]));
    expect(week3ArticlesQuiz.some((q) => q.id.includes("gender"))).toBe(true);
    expect(week3ArticlesQuiz.some((q) => q.id.includes("ein"))).toBe(true);
    expect(week3ArticlesQuiz.some((q) => q.id.includes("plural"))).toBe(true);
    expect(week3ArticlesQuiz.some((q) => q.id.includes("subject"))).toBe(true);
  });

  it("keeps every answer valid", () => {
    for (const q of week3ArticlesQuiz) {
      if (q.kind === "choice") {
        expect(q.options, q.id).toContain(q.answer);
        expect(new Set(q.options).size, q.id).toBe(q.options.length);
      } else {
        expect(q.accepted.length, q.id).toBeGreaterThan(0);
      }
      expect(q.explanation.trim(), q.id).not.toBe("");
    }
  });

  it("teaches der/die/das, ein/eine, the nominative and plurals", () => {
    const text = JSON.stringify(articlesCourse.pages);

    for (const phrase of ["der", "die", "das", "ein", "eine", "nominative", "plural", "umlaut", "grammatical gender"]) {
      expect(text, phrase).toContain(phrase);
    }
    expect(articlesCourse.pages.map((p) => p.id)).toEqual([
      "gender", "definite", "indefinite", "nominative", "plurals",
    ]);
  });

  it("does not teach accusative or nicht/kein yet", () => {
    const text = JSON.stringify([articlesCourse.pages, week3ArticlesQuiz]);

    expect(text).not.toMatch(/accusative/i);
    expect(text).not.toMatch(/\bden\b/);
    expect(text).not.toMatch(/\beinen\b/);
    expect(text).not.toMatch(/\bkeine?n?\b/);
    expect(text).not.toMatch(/\bnicht\b/);
  });

  it("only uses articles and plurals that match the Week 3 vocabulary", () => {
    const pairs: [string, string, string][] = [
      ["art-c-gender-lampe", "die Lampe", "feminine"],
      ["art-c-gender-buch", "das Buch", "neuter"],
    ];

    for (const [id, german, gender] of pairs) {
      const q = week3ArticlesQuiz.find((entry) => entry.id === id);
      expect(vocab(german), german).toBeDefined();
      expect(q?.kind === "choice" && q.answer).toBe(gender);
    }

    expect(vocab("der Tisch")?.plural).toBe("die Tische");
    expect(vocab("das Buch")?.plural).toBe("die Bücher");
    expect(vocab("das Fenster")?.plural).toBe("die Fenster");
    expect(vocab("der Stuhl")).toBeDefined();
    expect(vocab("das Bett")).toBeDefined();
    expect(vocab("die Schere")).toBeDefined();
    expect(vocab("die Tasche")).toBeDefined();
  });
});

describe("grammar-006 grading and review", () => {
  it("traces art- questions back to grammar-006", () => {
    expect(lessonIdFor("grammar", "art-c-tisch")).toBe("grammar-006");
    expect(lessonIdFor("grammar", "hb-c-er")).toBe("grammar-004");
  });

  it("selects the nominative article", () => {
    const tisch = toChoiceQuestion(buildReviewExercise("grammar", "art-c-tisch")!)!;
    const fenster = toChoiceQuestion(buildReviewExercise("grammar", "art-c-fenster")!)!;

    expect(tisch.grade("Der").correct).toBe(true);
    expect(tisch.grade("Die").correct).toBe(false);
    expect(tisch.grade("Das").correct).toBe(false);
    expect(fenster.grade("Das").correct).toBe(true);
    expect(fenster.grade("Der").correct).toBe(false);
  });

  it("selects ein/eine and rejects the wrong one", () => {
    const lampe = toChoiceQuestion(buildReviewExercise("grammar", "art-c-ein-lampe")!)!;
    const buch = toChoiceQuestion(buildReviewExercise("grammar", "art-c-ein-buch")!)!;

    expect(lampe.grade("eine").correct).toBe(true);
    expect(lampe.grade("ein").correct).toBe(false);
    expect(buch.grade("ein").correct).toBe(true);
    expect(buch.grade("eine").correct).toBe(false);
  });

  it("recognises plurals and the plural article die", () => {
    const which = toChoiceQuestion(buildReviewExercise("grammar", "art-c-which-plural")!)!;
    const buch = toChoiceQuestion(buildReviewExercise("grammar", "art-c-plural-buch")!)!;
    const article = toChoiceQuestion(buildReviewExercise("grammar", "art-c-plural-article")!)!;

    expect(which.grade("die Tische").correct).toBe(true);
    expect(which.grade("die Lampe").correct).toBe(false);
    expect(buch.grade("die Bücher").correct).toBe(true);
    expect(buch.grade("die Bucher").correct).toBe(false);
    expect(article.grade("die").correct).toBe(true);
    expect(article.grade("der").correct).toBe(false);
  });

  it("grades sentence completion case-insensitively but rejects a wrong article", () => {
    expect(typedGrade("art-f-lehrer", "Der").correct).toBe(true);
    expect(typedGrade("art-f-lehrer", "der").correct).toBe(true);
    expect(typedGrade("art-f-lehrer", "Die").correct).toBe(false);
    expect(typedGrade("art-f-tasche", "Die").correct).toBe(true);
    expect(typedGrade("art-f-schere", "eine").correct).toBe(true);
    expect(typedGrade("art-f-schere", "ein").correct).toBe(false);
  });

  it("grades typed noun + article and plural production", () => {
    expect(typedGrade("art-t-stuhl", "der Stuhl").correct).toBe(true);
    expect(typedGrade("art-t-stuhl", "Der Stuhl").correct).toBe(true);
    expect(typedGrade("art-t-stuhl", "Stuhl").correct).toBe(false);
    expect(typedGrade("art-t-stuhl", "die Stuhl").correct).toBe(false);
    expect(typedGrade("art-t-plural-tisch", "die Tische").correct).toBe(true);
    expect(typedGrade("art-t-plural-tisch", "die Tisch").correct).toBe(false);
    expect(typedGrade("art-t-plural-tisch", "der Tische").correct).toBe(false);
    expect(typedGrade("art-t-ein-bett", "ein Bett").correct).toBe(true);
    expect(typedGrade("art-t-ein-bett", "eine Bett").correct).toBe(false);
  });
});

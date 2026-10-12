import { describe, expect, it } from "vitest";

import { accusativeCourse, week3AccusativeQuiz } from "../data/lessons/week3Accusative";
import { negationCourse, week3NegationQuiz } from "../data/lessons/week3Negation";

import {
  buildReviewExercise,
  describeReviewConcept,
  lessonIdFor,
  resolveExercise,
  toChoiceQuestion,
  toTypedQuestion,
} from "./reviewExercises";

function typedGrade(id: string, input: string) {
  const exercise = buildReviewExercise("grammar", id);
  const question = exercise && toTypedQuestion(exercise, 0);
  if (!question) throw new Error(`no typed question for ${id}`);
  return question.grade(input);
}

function choiceGrade(id: string, option: string) {
  const exercise = buildReviewExercise("grammar", id);
  const question = exercise && toChoiceQuestion(exercise);
  if (!question) throw new Error(`no choice question for ${id}`);
  return question.grade(option);
}

describe("grammar-007 content", () => {
  it("has 14–16 uniquely-identified acc- questions and is task grammar-007", () => {
    const ids = week3AccusativeQuiz.map((q) => q.id);

    expect(ids.length).toBeGreaterThanOrEqual(14);
    expect(ids.length).toBeLessThanOrEqual(16);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("acc-"))).toBe(true);
    expect(accusativeCourse.taskId).toBe("grammar-007");
    expect(Math.ceil(ids.length * 0.8)).toBe(12);
    expect(accusativeCourse.goal).toContain("12/15");
  });

  it("covers identification, article choice, completion, conversion and production", () => {
    const kinds = new Set(week3AccusativeQuiz.map((q) => q.kind));

    expect(kinds).toEqual(new Set(["choice", "fill", "typed"]));
    for (const part of ["obj", "subj", "den", "einen", "convert", "bruder"]) {
      expect(week3AccusativeQuiz.some((q) => q.id.includes(part)), part).toBe(true);
    }
  });

  it("keeps every question answerable and tagged as accusative", () => {
    for (const q of week3AccusativeQuiz) {
      expect(q.concept, q.id).toBe("accusative");
      if (q.kind === "choice") expect(q.options, q.id).toContain(q.answer);
      else expect(q.accepted.length, q.id).toBeGreaterThan(0);
    }
  });

  it("teaches the four steps with the masculine-only change", () => {
    const text = JSON.stringify(accusativeCourse.pages);

    expect(accusativeCourse.pages.map((p) => p.id)).toEqual([
      "subject-object", "definite", "indefinite", "compare",
    ]);
    for (const phrase of ["den", "einen", "Only masculine changes", "Der Junge liest das Buch.", "Ich habe einen Stift."]) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it("does not teach dative, modals, pronoun objects or negation", () => {
    const text = JSON.stringify([accusativeCourse.pages, week3AccusativeQuiz]);

    expect(text).not.toMatch(/dative|dem\b|Perfekt|müssen|können|möchte|\bmich\b|\bdich\b|\bihn\b|\bkein/i);
    expect(text).not.toMatch(/\bnicht\b/);
  });

  it("shows feminine, neuter and plural unchanged in the table", () => {
    const definite = accusativeCourse.pages.find((p) => p.id === "definite")!;
    const table = definite.blocks.find((b) => b.type === "table");
    const rows = table?.type === "table" ? table.rows : [];

    expect(rows).toEqual([
      ["masculine", "der", "den"],
      ["feminine", "die", "die"],
      ["neuter", "das", "das"],
      ["plural", "die", "die"],
    ]);

    const indefinite = accusativeCourse.pages.find((p) => p.id === "indefinite")!;
    const itable = indefinite.blocks.find((b) => b.type === "table");
    expect(itable?.type === "table" && itable.rows).toEqual([
      ["masculine", "ein", "einen"],
      ["feminine", "eine", "eine"],
      ["neuter", "ein", "ein"],
    ]);
  });
});

describe("grammar-007 grading", () => {
  it("identifies subject and direct object", () => {
    expect(choiceGrade("acc-c-obj-buch", "das Buch").correct).toBe(true);
    expect(choiceGrade("acc-c-obj-buch", "Der Junge").correct).toBe(false);
    expect(choiceGrade("acc-c-subj-apfel", "Ich").correct).toBe(true);
    expect(choiceGrade("acc-c-subj-apfel", "den Apfel").correct).toBe(false);
    expect(choiceGrade("acc-c-obj-stift", "einen Stift").correct).toBe(true);
  });

  it("der → den, ein → einen; wrong masculine articles are rejected", () => {
    expect(choiceGrade("acc-c-den-tisch", "den").correct).toBe(true);
    expect(choiceGrade("acc-c-den-tisch", "der").correct).toBe(false);
    expect(choiceGrade("acc-c-einen-rucksack", "einen").correct).toBe(true);
    expect(choiceGrade("acc-c-einen-rucksack", "ein").correct).toBe(false);
    expect(choiceGrade("acc-c-correct-sentence", "Ich habe den Stift.").correct).toBe(true);
    expect(choiceGrade("acc-c-correct-sentence", "Ich habe der Stift.").correct).toBe(false);
    expect(typedGrade("acc-f-den-apfel", "den").correct).toBe(true);
    expect(typedGrade("acc-f-den-apfel", "der").correct).toBe(false);
    expect(typedGrade("acc-f-einen-stift", "Einen").correct).toBe(true);
    expect(typedGrade("acc-f-einen-stift", "ein").correct).toBe(false);
  });

  it("leaves feminine, neuter and plural articles unchanged", () => {
    expect(choiceGrade("acc-c-die-lampe", "die").correct).toBe(true);
    expect(choiceGrade("acc-c-die-lampe", "den").correct).toBe(false);
    expect(typedGrade("acc-f-eine-tasche", "eine").correct).toBe(true);
    expect(typedGrade("acc-f-eine-tasche", "einen").correct).toBe(false);
    expect(typedGrade("acc-f-das-buch", "das").correct).toBe(true);
    expect(typedGrade("acc-f-das-buch", "den").correct).toBe(false);
  });

  it("grades typed accusative sentences", () => {
    expect(typedGrade("acc-t-convert-stift", "Ich habe den Stift.").correct).toBe(true);
    expect(typedGrade("acc-t-convert-stift", "ich habe den stift").correct).toBe(true);
    expect(typedGrade("acc-t-convert-stift", "Ich habe der Stift.").correct).toBe(false);
    expect(typedGrade("acc-t-convert-stift", "Ich habe Stift.").correct).toBe(false);
    expect(typedGrade("acc-t-bruder", "Ich habe einen Bruder.").correct).toBe(true);
    expect(typedGrade("acc-t-bruder", "Ich habe ein Bruder.").correct).toBe(false);
    expect(typedGrade("acc-t-tasche", "Ich habe die Tasche").correct).toBe(true);
    expect(typedGrade("acc-t-buch", "Ich lese das Buch.").correct).toBe(true);
    expect(typedGrade("acc-t-buch", "Ich lese den Buch.").correct).toBe(false);
  });
});

describe("grammar-008 content", () => {
  it("has 12–14 uniquely-identified neg- questions and is task grammar-008", () => {
    const ids = week3NegationQuiz.map((q) => q.id);

    expect(ids.length).toBeGreaterThanOrEqual(12);
    expect(ids.length).toBeLessThanOrEqual(14);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("neg-"))).toBe(true);
    expect(negationCourse.taskId).toBe("grammar-008");
    expect(Math.ceil(ids.length * 0.8)).toBe(12);
    expect(negationCourse.goal).toContain("12/14");
  });

  it("covers selection, kein forms, transformation, completion and production", () => {
    const kinds = new Set(week3NegationQuiz.map((q) => q.kind));

    expect(kinds).toEqual(new Set(["choice", "fill", "typed"]));
    for (const part of ["zeit", "stift", "adjective", "plural", "buch", "tasche", "e-"]) {
      expect(week3NegationQuiz.some((q) => q.id.includes(part)), part).toBe(true);
    }
    for (const q of week3NegationQuiz) {
      expect(q.concept, q.id).toBe("negation");
      if (q.kind === "choice") expect(q.options, q.id).toContain(q.answer);
    }
  });

  it("teaches nominative and accusative kein only, in the agreed table", () => {
    const kein = negationCourse.pages.find((p) => p.id === "kein")!;
    const table = kein.blocks.find((b) => b.type === "table");

    expect(table?.type === "table" && table.rows).toEqual([
      ["masculine", "kein", "keinen"],
      ["feminine", "keine", "keine"],
      ["neuter", "kein", "kein"],
      ["plural", "keine", "keine"],
    ]);
    expect(JSON.stringify(negationCourse.pages)).not.toMatch(/dative|keinem|keiner|keines/i);
  });
});

describe("grammar-008 grading", () => {
  it("chooses nicht vs kein", () => {
    expect(choiceGrade("neg-c-adjective", "nicht").correct).toBe(true);
    expect(choiceGrade("neg-c-adjective", "kein").correct).toBe(false);
    expect(choiceGrade("neg-c-verb", "nicht").correct).toBe(true);
    expect(choiceGrade("neg-c-zeit", "nicht").correct).toBe(false);
    expect(choiceGrade("neg-c-lampe", "nicht").correct).toBe(false);
  });

  it("chooses the correct kein form for each gender and case", () => {
    expect(choiceGrade("neg-c-zeit", "keine").correct).toBe(true);
    expect(choiceGrade("neg-c-zeit", "kein").correct).toBe(false);
    expect(choiceGrade("neg-c-buch", "kein").correct).toBe(true);
    expect(choiceGrade("neg-c-buch", "keine").correct).toBe(false);
    expect(choiceGrade("neg-c-stift", "keinen").correct).toBe(true);
    expect(choiceGrade("neg-c-stift", "kein").correct).toBe(false);
    expect(choiceGrade("neg-c-lampe", "keine").correct).toBe(true);
    expect(choiceGrade("neg-c-plural", "keine").correct).toBe(true);
    expect(choiceGrade("neg-c-plural", "keinen").correct).toBe(false);
  });

  it("grades negative sentence production and rejects wrong forms", () => {
    expect(typedGrade("neg-t-buch", "Das ist kein Buch.").correct).toBe(true);
    expect(typedGrade("neg-t-buch", "Das ist nicht Buch.").correct).toBe(false);
    expect(typedGrade("neg-t-buch", "Das ist keine Buch.").correct).toBe(false);
    expect(typedGrade("neg-t-stift", "Ich habe keinen Stift.").correct).toBe(true);
    expect(typedGrade("neg-t-stift", "Ich habe kein Stift.").correct).toBe(false);
    expect(typedGrade("neg-t-interessant", "Das Buch ist nicht interessant.").correct).toBe(true);
    expect(typedGrade("neg-t-interessant", "Das Buch ist kein interessant.").correct).toBe(false);
    expect(typedGrade("neg-e-zeit", "Ich habe keine Zeit").correct).toBe(true);
    expect(typedGrade("neg-e-zeit", "Ich habe nicht Zeit.").correct).toBe(false);
    expect(typedGrade("neg-e-schwierig", "Das Buch ist nicht schwierig.").correct).toBe(true);
    expect(typedGrade("neg-f-tasche", "keine").correct).toBe(true);
    expect(typedGrade("neg-f-tasche", "kein").correct).toBe(false);
    expect(typedGrade("neg-f-lampe-nicht", "nicht").correct).toBe(true);
  });
});

describe("case-aware Review", () => {
  it("traces acc- and neg- questions to their lessons, leaving older ids alone", () => {
    expect(lessonIdFor("grammar", "acc-c-den-tisch")).toBe("grammar-007");
    expect(lessonIdFor("grammar", "neg-c-zeit")).toBe("grammar-008");
    expect(lessonIdFor("grammar", "art-c-tisch")).toBe("grammar-006");
    expect(lessonIdFor("grammar", "hb-c-er")).toBe("grammar-004");
    expect(lessonIdFor("vocabulary", "tisch#article")).toBe("vocab-003");
  });

  it("keeps accusative recall separate from the article concept", () => {
    const accusative = buildReviewExercise("grammar", "acc-c-den-tisch")!;
    const article = buildReviewExercise("vocabulary", "tisch#article")!;

    expect(accusative).toMatchObject({ kind: "choice", concept: "accusative", answer: "den" });
    expect(article).toMatchObject({ kind: "typed", concept: "noun_article", preferred: "der" });
    expect(accusative.kind === "choice" && accusative.prompt).toBe("Ich habe ___ Tisch.");

    // Different source types and ids, so mistakes and schedules never merge.
    expect("grammar:acc-c-den-tisch").not.toBe("vocabulary:tisch#article");
  });

  it("labels typed accusative and negation cards and keeps concept metadata", () => {
    const acc = buildReviewExercise("grammar", "acc-f-einen-stift")!;
    const neg = buildReviewExercise("grammar", "neg-t-stift")!;

    expect(toTypedQuestion(acc, 0)?.label).toBe("Grammar · Accusative");
    expect(toTypedQuestion(neg, 0)?.label).toBe("Grammar · Negation");
    expect(acc).toMatchObject({ concept: "accusative", preferred: "einen" });
    expect(neg).toMatchObject({ concept: "negation", preferred: "Ich habe keinen Stift." });
  });

  it("round-trips stored exercise JSON and rebuilds legacy rows", () => {
    const exercise = buildReviewExercise("grammar", "neg-c-zeit")!;
    const stored = JSON.stringify(exercise);

    expect(resolveExercise(stored, "grammar", "neg-c-zeit")).toEqual(exercise);
    expect(resolveExercise(null, "grammar", "acc-c-den-tisch")).toMatchObject({ concept: "accusative" });
    expect(resolveExercise(null, "grammar", "hb-c-er")?.kind).toBe("choice");
    expect(describeReviewConcept("grammar", "neg-t-buch")?.expected).toBe("Das ist kein Buch.");
  });

  it("leaves untagged grammar exercises as before", () => {
    const old = buildReviewExercise("grammar", "hb-f-ich")!;

    expect(old).not.toHaveProperty("concept");
    expect(toTypedQuestion(old, 0)?.label).toBe("Grammar");
  });
});

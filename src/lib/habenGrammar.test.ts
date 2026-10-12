import { describe, expect, it } from "vitest";

import { habenCourse, week2HabenQuiz } from "../data/lessons/week2Haben";
import { week1QuestionsQuiz } from "../data/lessons/week1Questions";
import { week1RegularVerbsQuiz } from "../data/lessons/week1RegularVerbs";
import { week1SeinQuiz } from "../data/lessons/week1Sein";

import {
  buildReviewExercise,
  lessonIdFor,
  resolveExercise,
  toChoiceQuestion,
  toTypedQuestion,
} from "./reviewExercises";

const grade = (id: string, input: string) =>
  toTypedQuestion(buildReviewExercise("grammar", id)!, 0)!.grade(input);

describe("haben conjugation table", () => {
  const table = (() => {
    const page = habenCourse.pages.find((p) => p.id === "table")!;
    const block = page.blocks[0];
    if (block.type !== "table") throw new Error("expected a table");
    return block.rows;
  })();

  it.each([
    ["ich", "habe"],
    ["du", "hast"],
    ["er / sie / es", "hat"],
    ["wir", "haben"],
    ["ihr", "habt"],
    ["sie / Sie", "haben"],
  ])("%s → %s", (pronoun, form) => {
    const row = table.find((r) => r[0] === pronoun)!;

    expect(row[1]).toBe(form);
  });

  it("teaches ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben", () => {
    expect(table.map((r) => r[1])).toEqual([
      "habe", "hast", "hat", "haben", "habt", "haben",
    ]);
  });

  it("flags du hast and er/sie/es hat as the irregular forms", () => {
    const callout = habenCourse.pages
      .flatMap((p) => p.blocks)
      .find((b) => b.type === "callout" && /irregular/i.test(b.text));

    expect(callout).toBeDefined();
  });

  it("does not teach accusative, modals or Perfekt", () => {
    const text = JSON.stringify(habenCourse);

    expect(text).not.toMatch(/accusative|Akkusativ|Perfekt|modal/i);
  });

  it("belongs to Week 2 and is task grammar-004", () => {
    expect(habenCourse.taskId).toBe("grammar-004");
    expect(habenCourse.kicker).toBe("Week 2 · Grammar");
  });
});

describe("haben practice", () => {
  it("has 12 questions covering every requested exercise type", () => {
    expect(week2HabenQuiz).toHaveLength(12);

    const ids = week2HabenQuiz.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);

    expect(ids.filter((id) => id.startsWith("hb-c-"))).toHaveLength(4);
    expect(ids.filter((id) => id.startsWith("hb-f-"))).toHaveLength(4);
    expect(ids.filter((id) => id.startsWith("hb-t-"))).toHaveLength(2);
    expect(ids.filter((id) => id.startsWith("hb-e-"))).toHaveLength(2);
  });

  it("has ids that are unique across all grammar lessons", () => {
    const all = [
      ...week1SeinQuiz,
      ...week1RegularVerbsQuiz,
      ...week1QuestionsQuiz,
      ...week2HabenQuiz,
    ].map((q) => q.id);

    expect(new Set(all).size).toBe(all.length);
  });

  it("accepts the correct form for each pronoun", () => {
    expect(grade("hb-f-ich", "habe").correct).toBe(true);
    expect(grade("hb-f-du", "hast").correct).toBe(true);
    expect(grade("hb-f-sie", "hat").correct).toBe(true);
    expect(grade("hb-f-ihr", "habt").correct).toBe(true);
  });

  it("rejects incorrect verb forms", () => {
    expect(grade("hb-f-du", "habe").correct).toBe(false);
    expect(grade("hb-f-du", "hat").correct).toBe(false);
    expect(grade("hb-f-ich", "habe ").correct).toBe(true);
    expect(grade("hb-f-ich", "habt").correct).toBe(false);
    expect(grade("hb-f-sie", "haben").correct).toBe(false);
    expect(grade("hb-f-ihr", "hast").correct).toBe(false);
  });

  it("rejects 'du habe' in a full sentence", () => {
    expect(grade("hb-t-du-physik", "Du hast Physik.").correct).toBe(true);
    expect(grade("hb-t-du-physik", "Du habe Physik.").correct).toBe(false);
    expect(grade("hb-t-du-physik", "Du hat Physik.").correct).toBe(false);
  });

  it("accepts case, whitespace and punctuation variants", () => {
    expect(grade("hb-e-wir", "wir haben deutsch").correct).toBe(true);
    expect(grade("hb-e-wir", "  Wir   haben Deutsch!  ").correct).toBe(true);
    expect(grade("hb-e-sie", "SIE HAT SCHULE").correct).toBe(true);
    expect(grade("hb-e-sie", "Sie haben Schule.").correct).toBe(false);
    expect(grade("hb-e-sie", "Hat sie Schule.").correct).toBe(false);
  });

  it("grades the choice questions", () => {
    const choice = (id: string, option: string) =>
      toChoiceQuestion(buildReviewExercise("grammar", id)!)!.grade(option).correct;

    expect(choice("hb-c-ihr", "habt")).toBe(true);
    expect(choice("hb-c-ihr", "haben")).toBe(false);
    expect(choice("hb-c-er", "hat")).toBe(true);
    expect(choice("hb-c-er", "hast")).toBe(false);
    expect(choice("hb-c-hast", "du")).toBe(true);
    expect(choice("hb-c-wir", "haben")).toBe(true);
  });

  it("keeps each choice answer inside its options", () => {
    for (const q of week2HabenQuiz) {
      if (q.kind === "choice") expect(q.options).toContain(q.answer);
    }
  });
});

describe("haben review data", () => {
  it("builds structured exercises for every question (no legacy fallback)", () => {
    for (const q of week2HabenQuiz) {
      expect(resolveExercise(null, "grammar", q.id), q.id).not.toBeNull();
    }
  });

  it("covers pronoun → form, fill-in and typed production", () => {
    const kinds = week2HabenQuiz.map((q) => buildReviewExercise("grammar", q.id)!.kind);

    expect(kinds).toContain("choice");
    expect(kinds.filter((k) => k === "typed")).toHaveLength(8);
  });

  it("shows the blank with its verb hint in the review prompt", () => {
    const exercise = buildReviewExercise("grammar", "hb-f-du")!;

    expect(exercise.kind).toBe("typed");
    if (exercise.kind === "typed") {
      expect(exercise.prompt).toBe("Du ___ Physik. (haben)");
      expect(exercise.preferred).toBe("hast");
    }
  });

  it("traces haben reviews to grammar-004", () => {
    for (const q of week2HabenQuiz) {
      expect(lessonIdFor("grammar", q.id)).toBe("grammar-004");
    }

    expect(lessonIdFor("grammar", "qn-w-wie")).toBe("grammar-003");
  });
});

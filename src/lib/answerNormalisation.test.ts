import { describe, expect, it } from "vitest";

import { isCorrectTyped, normaliseGerman } from "../data/lessons/week1Sein";

import {
  buildReviewExercise,
  normaliseEnglish,
  toTypedQuestion,
} from "./reviewExercises";

const grade = (id: string, input: string) =>
  toTypedQuestion(buildReviewExercise("grammar", id)!, 0)!.grade(input);

describe("normaliseGerman", () => {
  it.each([
    ["Ich BIN Schüler", "ich bin schueler"],
    ["  Ich   bin   Schüler  ", "ich bin schueler"],
    ["Ich bin Schüler.", "ich bin schueler"],
    ["Wie heißt du?", "wie heisst du"],
    ["Schüler!", "schueler"],
  ])("%s → %s", (input, expected) => {
    expect(normaliseGerman(input)).toBe(expected);
  });

  it("maps ä/ae, ö/oe, ü/ue and ß/ss to the same form", () => {
    expect(normaliseGerman("ä")).toBe(normaliseGerman("ae"));
    expect(normaliseGerman("ö")).toBe(normaliseGerman("oe"));
    expect(normaliseGerman("ü")).toBe(normaliseGerman("ue"));
    expect(normaliseGerman("ß")).toBe(normaliseGerman("ss"));
    expect(normaliseGerman("Mädchen")).toBe(normaliseGerman("Maedchen"));
    expect(normaliseGerman("zwölf")).toBe(normaliseGerman("zwoelf"));
    expect(normaliseGerman("dreißig")).toBe(normaliseGerman("dreissig"));
  });
});

describe("normaliseEnglish", () => {
  it("ignores case, spacing, punctuation and brackets", () => {
    expect(normaliseEnglish("  Thank   YOU! ")).toBe("thank you");
    expect(normaliseEnglish("You're welcome")).toBe("you're welcome");
    expect(normaliseEnglish("0 (zero)")).toBe("0 zero");
  });
});

describe("typed grading", () => {
  it("accepts capitalisation, whitespace and punctuation differences", () => {
    expect(isCorrectTyped("  ich bin   schüler. ", ["Ich bin Schüler"])).toBe(true);
    expect(grade("rv-t-wir-lernen", "WIR LERNEN DEUTSCH").correct).toBe(true);
  });

  it("accepts ae/oe/ue/ss spellings and shows the preferred spelling", () => {
    const result = grade("qn-t-name", "wie heisst du");

    expect(result.correct).toBe(true);
    expect(result.note).toBe("Preferred spelling: Wie heißt du?");
  });

  it("gives no spelling note for an exact answer", () => {
    expect(grade("qn-t-name", "Wie heißt du?").note).toBeUndefined();
  });

  it("rejects incorrect verb-second word order", () => {
    expect(grade("rv-r-heute", "Heute lerne ich Deutsch.").correct).toBe(true);
    expect(grade("rv-r-heute", "Heute ich lerne Deutsch.").correct).toBe(false);
    expect(grade("rv-r-heute", "Heute Deutsch lerne ich").correct).toBe(false);
  });

  it("rejects statement order and wrong word order in questions", () => {
    expect(grade("qn-v-lernen", "Lernst du Deutsch?").correct).toBe(true);
    expect(grade("qn-v-lernen", "Du lernst Deutsch?").correct).toBe(false);
    expect(grade("qn-t-wo", "Wo du wohnst?").correct).toBe(false);
  });

  it("rejects wrong conjugations and empty answers", () => {
    expect(grade("rv-f-ich-lernen", "lerne").correct).toBe(true);
    expect(grade("rv-f-ich-lernen", "lernst").correct).toBe(false);
    expect(grade("rv-f-ich-lernen", "   ").correct).toBe(false);
  });
});

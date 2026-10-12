import { describe, expect, it } from "vitest";

import {
  commonVerbForms,
  commonVerbsCourse,
  week2CommonVerbsQuiz,
} from "../data/lessons/week2CommonVerbs";

import {
  buildReviewExercise,
  lessonIdFor,
  resolveExercise,
  toChoiceQuestion,
  toTypedQuestion,
} from "./reviewExercises";

const grade = (id: string, input: string) =>
  toTypedQuestion(buildReviewExercise("grammar", id)!, 0)!.grade(input);

// ich, du, er/sie/es, wir, ihr, sie/Sie (the spec's required forms)
const EXPECTED: Record<string, string[]> = {
  gehen: ["gehe", "gehst", "geht", "gehen", "geht", "gehen"],
  arbeiten: ["arbeite", "arbeitest", "arbeitet", "arbeiten", "arbeitet", "arbeiten"],
  sprechen: ["spreche", "sprichst", "spricht", "sprechen", "sprecht", "sprechen"],
  essen: ["esse", "isst", "isst", "essen", "esst", "essen"],
  lesen: ["lese", "liest", "liest", "lesen", "lest", "lesen"],
  schlafen: ["schlafe", "schläfst", "schläft", "schlafen", "schlaft", "schlafen"],
};

describe("grammar-005 conjugation data", () => {
  it.each(Object.entries(EXPECTED))("%s has the required forms", (verb, forms) => {
    expect(commonVerbForms[verb]).toEqual(forms);
  });

  it("covers the five regular and four stem-changing verbs", () => {
    for (const verb of ["gehen", "arbeiten", "spielen", "trinken", "hören"]) {
      expect(commonVerbForms[verb], verb).toBeDefined();
    }
    for (const verb of ["sprechen", "essen", "lesen", "schlafen"]) {
      expect(commonVerbForms[verb], verb).toBeDefined();
    }
  });

  it("changes the vowel only in du and er/sie/es", () => {
    for (const verb of ["sprechen", "lesen", "schlafen"]) {
      const forms = commonVerbForms[verb];
      const infinitive = forms[3]; // wir form = infinitive

      expect(forms[0], verb).toBe(infinitive.replace(/en$/, "e"));
      expect(forms[3], verb).toBe(forms[5]);
      expect(forms[1], verb).not.toBe(infinitive.replace(/en$/, "st"));
      expect(forms[2], verb).not.toBe(infinitive.replace(/en$/, "t"));
    }
  });

  it("gives ihr the familiar stem (sprecht, lest, schlaft, esst)", () => {
    expect(commonVerbForms.sprechen[4]).toBe("sprecht");
    expect(commonVerbForms.lesen[4]).toBe("lest");
    expect(commonVerbForms.schlafen[4]).toBe("schlaft");
    expect(commonVerbForms.essen[4]).toBe("esst");
  });

  it("shows the lesson tables with exactly these forms", () => {
    const tables = commonVerbsCourse.pages
      .flatMap((page) => page.blocks)
      .filter((block) => block.type === "table");

    const text = JSON.stringify(tables);

    for (const forms of Object.values(EXPECTED)) {
      for (const form of forms) expect(text).toContain(form);
    }
  });

  it("does not teach modals, separable verbs, Perfekt or dative", () => {
    const text = JSON.stringify(commonVerbsCourse);

    expect(text).not.toMatch(/\b(kann|muss|will|möchte|aufstehen|Perfekt|Dativ|dative)\b/i);
  });

  it("explains the extra e in arbeiten", () => {
    expect(JSON.stringify(commonVerbsCourse)).toMatch(/arbeiten[^"]*extra e/);
  });
});

describe("grammar-005 grading", () => {
  it.each([
    ["cv-f-du-sprechen", "sprichst"],
    ["cv-f-er-lesen", "liest"],
    ["cv-f-wir-trinken", "trinken"],
    ["cv-f-sie-arbeiten", "arbeitet"],
    ["cv-f-du-schlafen", "schläfst"],
    ["cv-t-ich-sprechen", "Ich spreche Deutsch."],
    ["cv-t-sie-schlafen", "Sie schläft."],
  ])("accepts the right answer for %s", (id, answer) => {
    expect(grade(id, answer).correct).toBe(true);
  });

  it("accepts du sprichst, er spricht, du isst, sie isst, du liest, er liest", () => {
    const sentence = (answer: string, id: string) => grade(id, answer).correct;

    expect(sentence("sprichst", "cv-f-du-sprechen")).toBe(true);
    expect(sentence("liest", "cv-f-er-lesen")).toBe(true);
    expect(sentence("Er isst in der Schule.", "cv-t-er-essen")).toBe(true);
    expect(sentence("Sie isst in der Schule.", "cv-t-er-essen")).toBe(false); // different pronoun
  });

  it("accepts schlaefst for schläfst and shows the preferred spelling", () => {
    const result = grade("cv-f-du-schlafen", "schlaefst");

    expect(result.correct).toBe(true);
    expect(result.note).toBe("Preferred spelling: schläfst");
  });

  it("rejects the regular form of a stem-changing verb", () => {
    expect(grade("cv-f-du-sprechen", "sprechst").correct).toBe(false); // du sprechst
    expect(grade("cv-f-er-lesen", "lest").correct).toBe(false);
    expect(grade("cv-f-er-lesen", "lesst").correct).toBe(false); // du lesst / er lesst
    expect(grade("cv-f-du-schlafen", "schlafst").correct).toBe(false);
    expect(grade("cv-t-sie-schlafen", "Sie schlaft.").correct).toBe(false); // er schlaft
  });

  it("rejects a wrong ending", () => {
    expect(grade("cv-f-er-lesen", "sprecht").correct).toBe(false);
    expect(grade("cv-f-sie-arbeiten", "arbeitt").correct).toBe(false);
    expect(grade("cv-f-sie-arbeiten", "arbeitst").correct).toBe(false);
    expect(grade("cv-t-ich-sprechen", "Ich sprichst Deutsch.").correct).toBe(false);
  });

  it("rejects incorrect word order in the reorder tasks", () => {
    expect(grade("cv-r-heute-gehen", "Heute gehe ich nach Hause.").correct).toBe(true);
    expect(grade("cv-r-heute-gehen", "Ich gehe heute nach Hause.").correct).toBe(true);
    expect(grade("cv-r-heute-gehen", "Heute ich gehe nach Hause.").correct).toBe(false);
    expect(grade("cv-r-doha-arbeiten", "In Doha arbeitet er").correct).toBe(true);
    expect(grade("cv-r-doha-arbeiten", "In Doha er arbeitet").correct).toBe(false);
  });

  it("grades the choice and pronoun-matching questions", () => {
    const choice = (id: string, option: string) =>
      toChoiceQuestion(buildReviewExercise("grammar", id)!)!.grade(option).correct;

    expect(choice("cv-c-er-essen", "isst")).toBe(true);
    expect(choice("cv-c-er-essen", "esst")).toBe(false);
    expect(choice("cv-c-ihr-lesen", "lest")).toBe(true);
    expect(choice("cv-c-ihr-lesen", "liest")).toBe(false);
    expect(choice("cv-c-match", "du")).toBe(true);
    expect(choice("cv-c-arbeiten", "arbeitest")).toBe(true);
    expect(choice("cv-c-arbeiten", "arbeitst")).toBe(false);
  });
});

describe("grammar-005 practice and review data", () => {
  it("has 14 questions of every requested kind, with unique ids", () => {
    expect(week2CommonVerbsQuiz).toHaveLength(14);
    expect(new Set(week2CommonVerbsQuiz.map((q) => q.id)).size).toBe(14);

    const kinds = new Set(week2CommonVerbsQuiz.map((q) => q.kind));
    expect(kinds).toEqual(new Set(["choice", "fill", "typed", "reorder"]));
  });

  it("builds structured active-recall exercises for every question", () => {
    for (const q of week2CommonVerbsQuiz) {
      expect(resolveExercise(null, "grammar", q.id), q.id).not.toBeNull();
    }
  });

  it("traces its mistakes to grammar-005", () => {
    for (const q of week2CommonVerbsQuiz) {
      expect(lessonIdFor("grammar", q.id)).toBe("grammar-005");
    }
  });

  it("shows the verb hint in the review prompt", () => {
    const exercise = buildReviewExercise("grammar", "cv-f-du-sprechen")!;

    expect(exercise.kind).toBe("typed");
    if (exercise.kind === "typed") {
      expect(exercise.prompt).toBe("Du ___ Deutsch. (sprechen)");
      expect(exercise.preferred).toBe("sprichst");
    }
  });
});

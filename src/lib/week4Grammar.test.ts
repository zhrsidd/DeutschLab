import { describe, expect, it } from "vitest";

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import {
  IRREGULAR_VERB_TABLE,
  irregularVerbsCourse,
  week4IrregularVerbsQuiz,
} from "../data/lessons/week4IrregularVerbs";
import { pronounsCourse, week4PronounsQuiz } from "../data/lessons/week4Pronouns";
import { week3ListeningClips } from "../data/lessons/week3Listening";

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

const preferred = (question: CourseQuestion) =>
  question.kind === "choice" ? question.answer : question.accepted[0];

/** All German a question shows or expects, for scope checks. */
const germanOf = (question: CourseQuestion) =>
  [
    question.kind === "choice" ? [question.prompt, ...question.options] : [],
    question.kind === "fill" ? [question.sentence, ...question.accepted] : [],
    question.kind === "typed" ? question.accepted : [],
    question.kind === "reorder" ? question.accepted : [],
  ].flat().join(" ");

describe("grammar-009 accusative pronouns", () => {
  const ids = week4PronounsQuiz.map((q) => q.id);

  it("has 14–16 unique pr- questions, pass 13/16, for grammar-009", () => {
    expect(ids.length).toBeGreaterThanOrEqual(14);
    expect(ids.length).toBeLessThanOrEqual(16);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("pr-"))).toBe(true);
    expect(pronounsCourse.taskId).toBe("grammar-009");
    expect(Math.ceil(ids.length * 0.8)).toBe(13);
    expect(pronounsCourse.goal).toContain("13/16");
  });

  it("mixes choice, subject/object, replacement, completion and translation", () => {
    const kinds = new Set(week4PronounsQuiz.map((q) => q.kind));
    expect([...kinds].sort()).toEqual(["choice", "fill", "typed"]);
    expect(week4PronounsQuiz.some((q) => q.kind === "choice" && /direct object\?/.test(q.prompt))).toBe(true);
    expect(week4PronounsQuiz.some((q) => q.kind === "choice" && /subject\?/.test(q.prompt))).toBe(true);
    expect(week4PronounsQuiz.filter((q) => q.kind === "typed").length).toBeGreaterThanOrEqual(3);
  });

  it("teaches the full nominative → accusative table", () => {
    const table = pronounsCourse.pages
      .flatMap((page) => page.blocks)
      .find((block) => block.type === "table" && block.headers[0] === "Nominative");
    if (!table || table.type !== "table") throw new Error("no pronoun table");

    expect(table.rows.map(([nom, acc]) => `${nom}→${acc}`)).toEqual([
      "ich→mich", "du→dich", "er→ihn", "sie→sie", "es→es",
      "wir→uns", "ihr→euch", "sie→sie", "Sie→Sie",
    ]);
  });

  it("tags every question as the pronoun concept and tests the pronoun itself", () => {
    const pronouns = /\b(mich|dich|ihn|sie|es|uns|euch|Sie)\b/;

    for (const question of week4PronounsQuiz) {
      expect(question.concept, question.id).toBe("pronoun");
      // The preferred answer (or the whole sentence) contains an object pronoun,
      // unless it is a "which word is the subject" question.
      if (!/subject\?/.test(question.kind === "choice" ? question.prompt : "")) {
        expect(preferred(question), question.id).toMatch(pronouns);
      }
    }
  });

  it("does not teach dative pronouns", () => {
    for (const question of week4PronounsQuiz) {
      expect(germanOf(question), question.id).not.toMatch(/\b(mir|dir|ihm|ihnen|Ihnen)\b/);
    }
  });

  it("builds structured Review items that grade the pronoun choice", () => {
    expect(choiceGrade("pr-c-ihn-lehrer", "ihn").correct).toBe(true);
    expect(choiceGrade("pr-c-ihn-lehrer", "er").correct).toBe(false);
    expect(typedGrade("pr-f-ihn-stift", "ihn").correct).toBe(true);
    expect(typedGrade("pr-f-ihn-stift", "er").correct).toBe(false);
    expect(typedGrade("pr-t-know-him", "ich kenne ihn").correct).toBe(true);
    expect(typedGrade("pr-t-know-him", "Ich kenne er.").correct).toBe(false);
    expect(typedGrade("pr-t-visits-us", "Sie besucht uns").correct).toBe(true);
    expect(buildReviewExercise("grammar", "pr-f-ihn-stift")).toMatchObject({
      concept: "pronoun",
      label: "Grammar · Accusative pronouns",
    });
  });

  it("traces pr- questions back to grammar-009", () => {
    for (const id of ids) expect(lessonIdFor("grammar", id), id).toBe("grammar-009");
  });
});

describe("grammar-010 irregular verbs and accusative consolidation", () => {
  const ids = week4IrregularVerbsQuiz.map((q) => q.id);

  it("has 16 unique iv- questions, pass 13/16, for grammar-010", () => {
    expect(ids).toHaveLength(16);
    expect(new Set(ids).size).toBe(16);
    expect(ids.every((id) => id.startsWith("iv-"))).toBe(true);
    expect(irregularVerbsCourse.taskId).toBe("grammar-010");
    expect(irregularVerbsCourse.goal).toContain("13/16");
  });

  it("uses the standard present-tense forms", () => {
    expect(IRREGULAR_VERB_TABLE).toEqual({
      sehen: ["sehe", "siehst", "sieht", "sehen", "seht", "sehen"],
      nehmen: ["nehme", "nimmst", "nimmt", "nehmen", "nehmt", "nehmen"],
      treffen: ["treffe", "triffst", "trifft", "treffen", "trefft", "treffen"],
      fahren: ["fahre", "fährst", "fährt", "fahren", "fahrt", "fahren"],
      tragen: ["trage", "trägst", "trägt", "tragen", "tragt", "tragen"],
    });
  });

  it("shows exactly those forms in its teaching tables", () => {
    const tables = irregularVerbsCourse.pages
      .flatMap((page) => page.blocks)
      .filter((block) => block.type === "table");

    for (const [verb, forms] of Object.entries(IRREGULAR_VERB_TABLE)) {
      const table = tables.find((block) => block.type === "table" && block.headers.includes(verb));
      if (!table || table.type !== "table") throw new Error(`no table for ${verb}`);
      const column = table.headers.indexOf(verb);
      expect(table.rows.map((row) => row[column]), verb).toEqual(forms);
    }
  });

  it("does not repeat the Week 2 verb tables", () => {
    const headers = irregularVerbsCourse.pages
      .flatMap((page) => page.blocks)
      .flatMap((block) => (block.type === "table" ? block.headers : []));
    for (const old of ["sprechen", "essen", "lesen", "schlafen"]) {
      expect(headers, old).not.toContain(old);
    }
  });

  it("covers conjugation, articles, pronouns, word order and production", () => {
    const concepts = week4IrregularVerbsQuiz.map((q) => q.concept);
    expect(new Set(concepts)).toEqual(new Set(["verb_form", "accusative", "pronoun", "word_order"]));
    expect(week4IrregularVerbsQuiz.filter((q) => q.kind === "reorder")).toHaveLength(2);
    expect(week4IrregularVerbsQuiz.filter((q) => q.kind === "typed").length).toBeGreaterThanOrEqual(3);
  });

  it("only offers correct options as answers", () => {
    for (const question of week4IrregularVerbsQuiz) {
      if (question.kind === "choice") expect(question.options, question.id).toContain(question.answer);
    }
  });

  it("grades verb forms, including the umlaut spelled out", () => {
    expect(typedGrade("iv-f-faehrst", "fährst").correct).toBe(true);
    expect(typedGrade("iv-f-faehrst", "faehrst").correct).toBe(true);
    expect(typedGrade("iv-f-faehrst", "fahrst").correct).toBe(false);
    expect(typedGrade("iv-f-trifft", "trifft").correct).toBe(true);
    expect(typedGrade("iv-f-trifft", "trefft").correct).toBe(false);
    expect(choiceGrade("iv-c-ihr-fahrt", "fahrt").correct).toBe(true);
    expect(choiceGrade("iv-c-ihr-fahrt", "fährt").correct).toBe(false);
    expect(typedGrade("iv-t-jacke", "Er trägt eine Jacke.").correct).toBe(true);
    expect(typedGrade("iv-t-jacke", "Er tragt eine Jacke.").correct).toBe(false);
  });

  it("accepts every V2 order of the reorder sentence, and only those", () => {
    expect(typedGrade("iv-r-heute-trifft", "Heute trifft Omar einen Freund.").correct).toBe(true);
    expect(typedGrade("iv-r-heute-trifft", "Omar trifft heute einen Freund").correct).toBe(true);
    expect(typedGrade("iv-r-heute-trifft", "Heute Omar trifft einen Freund.").correct).toBe(false);
    expect(typedGrade("iv-r-siehst-du", "Siehst du den Lehrer?").correct).toBe(true);
    expect(typedGrade("iv-r-siehst-du", "Du siehst den Lehrer?").correct).toBe(false);
  });

  it("labels each concept separately in Review", () => {
    expect(buildReviewExercise("grammar", "iv-f-trifft")).toMatchObject({ concept: "verb_form", label: "Grammar · Irregular verbs" });
    expect(buildReviewExercise("grammar", "iv-r-siehst-du")).toMatchObject({ concept: "word_order", label: "Grammar · Word order" });
    expect(buildReviewExercise("grammar", "iv-f-ihn-hund")).toMatchObject({ concept: "pronoun" });
    expect(buildReviewExercise("grammar", "iv-c-den-rucksack")).toMatchObject({ kind: "choice", concept: "accusative" });
  });

  it("traces iv- questions back to grammar-010", () => {
    for (const id of ids) expect(lessonIdFor("grammar", id), id).toBe("grammar-010");
  });

  it("round-trips through stored JSON (resolveExercise)", () => {
    for (const id of [...ids, ...week4PronounsQuiz.map((q) => q.id)]) {
      const built = buildReviewExercise("grammar", id);
      expect(resolveExercise(JSON.stringify(built), "grammar", id), id).toEqual(built);
    }
  });
});

describe("describeReviewConcept for grammar concepts (regression)", () => {
  // Before v1.0, any typed exercise with a concept other than noun_article was
  // described as "What is the plural of …", so a missed listening-003 question
  // (l3-4 → neg-f-tasche) was stored with a plural prompt in Mistakes.
  it("never labels an accusative, negation or pronoun item as a plural question", () => {
    for (const id of ["neg-f-tasche", "acc-f-einen-stift", "acc-t-bruder", "pr-f-ihn-stift", "iv-f-trifft"]) {
      const described = describeReviewConcept("grammar", id);
      expect(described?.prompt, id).not.toMatch(/plural/i);
    }

    expect(describeReviewConcept("grammar", "neg-f-tasche")).toEqual({
      prompt: "Type the missing word. Ich habe ___ Tasche. (kein)",
      expected: "keine",
    });
  });

  it("still describes noun article and plural concepts as before", () => {
    expect(describeReviewConcept("vocabulary", "tisch#plural")?.prompt).toBe('What is the plural of "der Tisch"?');
    expect(describeReviewConcept("vocabulary", "tisch#article")?.prompt).toBe('What is the article of "Tisch"?');
  });

  it("covers the listening-003 question that exposed the bug", () => {
    const question = week3ListeningClips.flatMap((clip) => clip.questions).find((q) => q.id === "l3-4");
    expect(question?.concept).toEqual({ sourceType: "grammar", sourceId: "neg-f-tasche" });
  });
});

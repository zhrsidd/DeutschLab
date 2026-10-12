import { describe, expect, it } from "vitest";

import {
  allVocabularyItems,
  vocabularySetForItem,
  week3VocabularySet,
} from "../data/lessons/vocabularySets";
import { week1Vocabulary } from "../data/lessons/week1Vocabulary";
import { week2Vocabulary } from "../data/lessons/week2Vocabulary";
import {
  week3Vocabulary,
  week3VocabularyBatches,
} from "../data/lessons/week3Vocabulary";

import {
  buildReviewExercise,
  describeReviewConcept,
  lessonIdFor,
  parseVocabularySourceId,
  resolveExercise,
  toTypedQuestion,
  validateExercise,
} from "./reviewExercises";
import {
  buildBatchCheck,
  buildFinalQuiz,
  gradeVocabAnswer,
  mistakeExpected,
  mistakePrompt,
} from "./vocabularyExercises";

const unique = (values: string[]) => new Set(values).size === values.length;
const bare = (german: string) => german.replace(/^(der|die|das)\s+/i, "");
const item = (id: string) => week3Vocabulary.find((i) => i.id === id)!;
const byCategory = (category: string) =>
  week3Vocabulary.filter((i) => i.category === category);

/** Grades a typed answer for a review concept at a given repetition count. */
function gradeReview(sourceId: string, input: string, repetitions = 0) {
  const exercise = buildReviewExercise("vocabulary", sourceId);
  const question = exercise && toTypedQuestion(exercise, repetitions);
  if (!question) throw new Error(`no typed question for ${sourceId}`);
  return question.grade(input);
}

describe("Week 3 vocabulary content", () => {
  it("has between 60 and 75 new items", () => {
    expect(week3Vocabulary.length).toBeGreaterThanOrEqual(60);
    expect(week3Vocabulary.length).toBeLessThanOrEqual(75);
  });

  it("has unique ids, within Week 3 and across all weeks", () => {
    expect(unique(week3Vocabulary.map((i) => i.id))).toBe(true);
    expect(unique(allVocabularyItems().map((i) => i.id))).toBe(true);
  });

  it("does not repeat any Week 1 or Week 2 word", () => {
    const earlier = [...week1Vocabulary, ...week2Vocabulary];
    const ids = new Set(earlier.map((i) => i.id));
    const words = new Set(earlier.map((i) => bare(i.german).toLowerCase()));

    for (const entry of week3Vocabulary) {
      expect(ids.has(entry.id), entry.id).toBe(false);
      expect(words.has(bare(entry.german).toLowerCase()), entry.german).toBe(false);
    }

    expect(unique(week3Vocabulary.map((i) => bare(i.german).toLowerCase()))).toBe(true);
  });

  it("gives every noun a valid article that matches its German text", () => {
    for (const entry of week3Vocabulary) {
      expect(["der", "die", "das"], entry.id).toContain(entry.article);
      expect(entry.german.startsWith(`${entry.article} `), entry.id).toBe(true);
      expect(bare(entry.german)[0], entry.id).toMatch(/[A-ZÄÖÜ]/);
      expect(entry.partOfSpeech).toBe("noun");
      expect(entry.requireArticle, entry.id).toBe(true);
      expect(entry.english.trim(), entry.id).not.toBe("");
      expect(entry.exampleGerman, entry.id).toContain(bare(entry.german));
      expect(entry.exampleEnglish?.trim(), entry.id).toBeTruthy();
    }
  });

  it("states a plural, or explicitly says there is none", () => {
    for (const entry of week3Vocabulary) {
      if (entry.noPlural) {
        expect(entry.plural, entry.id).toBeUndefined();
        expect(entry.note, entry.id).toMatch(/plural/i);
      } else {
        expect(entry.plural, entry.id).toMatch(/^die \S/);
      }
    }
  });

  it("stores the known irregular plurals exactly", () => {
    const expected: Record<string, string> = {
      tisch: "die Tische",
      lampe: "die Lampen",
      buch: "die Bücher",
      stuhl: "die Stühle",
      fenster: "die Fenster",
      apfel: "die Äpfel",
      glas: "die Gläser",
      mann: "die Männer",
      fahrrad: "die Fahrräder",
      schrank: "die Schränke",
      ei: "die Eier",
      auto: "die Autos",
      handy: "die Handys",
      maedchen: "die Mädchen",
      lehrerin: "die Lehrerinnen",
      junge: "die Jungen",
      wand: "die Wände",
      rucksack: "die Rucksäcke",
    };

    for (const [id, plural] of Object.entries(expected)) {
      expect(item(id).plural, id).toBe(plural);
    }
  });

  it("stores the known genders exactly", () => {
    const expected: Record<string, string> = {
      tisch: "der", lampe: "die", buch: "das", fenster: "das", maedchen: "das",
      milch: "die", kaese: "der", gemuese: "das", wasser: "das", kaffee: "der",
      tuer: "die", wand: "die", boden: "der", uhr: "die", handy: "das",
      schere: "die", zimmer: "das", wohnzimmer: "das", auto: "das", junge: "der",
    };

    for (const [id, article] of Object.entries(expected)) {
      expect(item(id).article, id).toBe(article);
    }
  });

  it("treats mass nouns as having no ordinary plural", () => {
    for (const id of ["milch", "kaese", "reis", "wasser", "kaffee", "gemuese"]) {
      expect(item(id).noPlural, id).toBe(true);
    }
  });

  it("covers every required category", () => {
    for (const category of ["school", "rooms", "furniture", "food", "objects", "people"]) {
      expect(byCategory(category).length, category).toBeGreaterThanOrEqual(6);
    }
  });

  it("has 7–9 batches of 8–12 items that cover every item exactly once", () => {
    expect(week3VocabularyBatches.length).toBeGreaterThanOrEqual(7);
    expect(week3VocabularyBatches.length).toBeLessThanOrEqual(9);

    for (const batch of week3VocabularyBatches) {
      expect(batch.itemIds.length, batch.id).toBeGreaterThanOrEqual(8);
      expect(batch.itemIds.length, batch.id).toBeLessThanOrEqual(12);
    }

    const all = week3VocabularyBatches.flatMap((b) => b.itemIds);
    expect(unique(all)).toBe(true);
    expect([...all].sort()).toEqual(week3Vocabulary.map((i) => i.id).sort());
  });

  it("belongs to vocab-003", () => {
    expect(week3VocabularySet.taskId).toBe("vocab-003");
    expect(vocabularySetForItem("tisch").taskId).toBe("vocab-003");
    expect(vocabularySetForItem("mutter").taskId).toBe("vocab-002");
  });
});

describe("Week 3 quizzes", () => {
  const quiz = buildFinalQuiz(1, week3VocabularySet);

  it("builds a 20-question final quiz that is deterministic", () => {
    expect(quiz).toHaveLength(20);
    expect(buildFinalQuiz(1, week3VocabularySet)).toEqual(quiz);
    expect(buildFinalQuiz(2, week3VocabularySet)).not.toEqual(quiz);
  });

  it("mixes all five question types", () => {
    const kinds = new Set(quiz.map((q) => q.kind));

    for (const kind of ["de-en", "en-de", "article", "plural", "typed"]) {
      expect(kinds.has(kind as never), kind).toBe(true);
    }
  });

  it("spreads questions across every category", () => {
    const categories = quiz.map((q) => item(q.itemId).category);

    for (const [category, count] of week3VocabularySet.finalQuota) {
      expect(categories.filter((c) => c === category), category).toHaveLength(count);
    }
  });

  it("never asks for the plural of a noun with no plural", () => {
    for (let attempt = 1; attempt <= 12; attempt += 1) {
      for (const question of buildFinalQuiz(attempt, week3VocabularySet)) {
        if (question.kind === "plural") {
          expect(item(question.itemId).noPlural, question.itemId).toBeUndefined();
        }
      }
    }
  });

  it("article questions offer der/die/das and answer with the noun's article", () => {
    const article = quiz.find((q) => q.kind === "article")!;
    const entry = item(article.itemId);

    expect(article.options).toEqual(["der", "die", "das"]);
    expect(article.answer).toBe(entry.article);
    expect(article.display).toBe(`___ ${bare(entry.german)}`);
    expect(article.reviewId).toBe(`${entry.id}#article`);
  });

  it("plural questions include the correct plural and no duplicates", () => {
    const plural = quiz.find((q) => q.kind === "plural")!;
    const entry = item(plural.itemId);

    expect(plural.answer).toBe(entry.plural);
    expect(plural.options).toContain(entry.plural);
    expect(new Set(plural.options).size).toBe(plural.options.length);
    expect(plural.options).toHaveLength(4);
    expect(plural.reviewId).toBe(`${entry.id}#plural`);
  });

  it("meaning, noun and typed questions keep the plain item id as their review id", () => {
    for (const question of quiz) {
      if (question.kind === "de-en" || question.kind === "en-de" || question.kind === "typed") {
        expect(question.reviewId).toBe(question.itemId);
      }
    }
  });

  it("English → German options and typed answers carry the article", () => {
    const enDe = quiz.find((q) => q.kind === "en-de")!;
    expect(enDe.answer).toMatch(/^(der|die|das) /);

    const typed = quiz.find((q) => q.kind === "typed")!;
    expect(typed.instruction).toMatch(/article/);
    expect(gradeVocabAnswer(typed, typed.answer).correct).toBe(true);
    expect(gradeVocabAnswer(typed, bare(typed.answer)).correct).toBe(false);
  });

  it("batch checks use article and plural questions", () => {
    const checks = buildBatchCheck(week3VocabularyBatches[0]);

    expect(checks).toHaveLength(4);
    expect(checks.map((q) => q.kind)).toEqual(["de-en", "en-de", "article", "plural"]);
  });

  it("falls back to a typed noun for a no-plural noun in the fourth check slot", () => {
    const drinks = week3VocabularyBatches.find((b) => b.id === "w3-drinks")!;
    for (const question of buildBatchCheck(drinks)) {
      if (question.kind === "plural") {
        expect(item(question.itemId).noPlural).toBeUndefined();
      }
    }
  });

  it("describes mistakes with distinct prompts and the full noun", () => {
    const article = quiz.find((q) => q.kind === "article")!;
    const plural = quiz.find((q) => q.kind === "plural")!;

    expect(mistakePrompt(article)).toMatch(/article of/);
    expect(mistakePrompt(plural)).toMatch(/plural of/);
    expect(mistakeExpected(article)).toBe(item(article.itemId).german);
    expect(mistakeExpected(plural)).toBe(plural.answer);
  });
});

describe("article-aware Review", () => {
  it("keeps meaning, article and plural as three separate concepts", () => {
    const meaning = buildReviewExercise("vocabulary", "tisch")!;
    const article = buildReviewExercise("vocabulary", "tisch#article")!;
    const plural = buildReviewExercise("vocabulary", "tisch#plural")!;

    expect(meaning.kind).toBe("vocab");
    expect(article).toMatchObject({ kind: "typed", concept: "noun_article", preferred: "der" });
    expect(plural).toMatchObject({ kind: "typed", concept: "noun_plural", preferred: "die Tische" });
    expect(article.kind === "typed" && article.prompt).toBe("___ Tisch");
    expect(plural.kind === "typed" && plural.prompt).toBe("der Tisch");
  });

  it("parses concept suffixes and traces them to vocab-003", () => {
    expect(parseVocabularySourceId("tisch#article")).toEqual({ itemId: "tisch", concept: "article" });
    expect(parseVocabularySourceId("tisch")).toEqual({ itemId: "tisch", concept: null });
    expect(lessonIdFor("vocabulary", "tisch#plural")).toBe("vocab-003");
    expect(lessonIdFor("vocabulary", "tisch")).toBe("vocab-003");
    expect(lessonIdFor("vocabulary", "mutter")).toBe("vocab-002");
    expect(lessonIdFor("vocabulary", "hallo")).toBe("vocab-001");
  });

  it("grades an article exercise: a wrong article is wrong", () => {
    expect(gradeReview("tisch#article", "der").correct).toBe(true);
    expect(gradeReview("tisch#article", "Der").correct).toBe(true);
    expect(gradeReview("tisch#article", "die").correct).toBe(false);
    expect(gradeReview("tisch#article", "das").correct).toBe(false);
    expect(gradeReview("tisch#article", "der Tisch").correct).toBe(false);
    expect(gradeReview("lampe#article", "die").correct).toBe(true);
    expect(gradeReview("buch#article", "das").correct).toBe(true);
  });

  it("grades a plural exercise: wrong plurals and wrong articles are wrong", () => {
    expect(gradeReview("buch#plural", "die Bücher").correct).toBe(true);
    expect(gradeReview("buch#plural", "Bücher").correct).toBe(true);
    expect(gradeReview("buch#plural", "die Buecher").correct).toBe(true);
    expect(gradeReview("buch#plural", "die Bucher").correct).toBe(false);
    expect(gradeReview("buch#plural", "die Buchs").correct).toBe(false);
    expect(gradeReview("buch#plural", "das Bücher").correct).toBe(false);
    expect(gradeReview("fenster#plural", "die Fenster").correct).toBe(true);
    expect(gradeReview("stuhl#plural", "die Stühle").correct).toBe(true);
  });

  it("accepts ae/oe/ue/ss spellings and shows the preferred spelling", () => {
    const grade = gradeReview("glas#plural", "die Glaeser");

    expect(grade.correct).toBe(true);
    expect(grade.note).toBe("Preferred spelling: die Gläser");
    expect(gradeReview("schluessel", "der Schluessel", 1).correct).toBe(true);
    expect(gradeReview("kaese", "der Kaese", 1).correct).toBe(true);
  });

  it("has no plural exercise for mass nouns", () => {
    expect(buildReviewExercise("vocabulary", "milch#plural")).toBeNull();
    expect(buildReviewExercise("vocabulary", "milch#article")).not.toBeNull();
  });

  it("returns null for unknown or Week 1 ids with a concept suffix on a missing item", () => {
    expect(buildReviewExercise("vocabulary", "nope#article")).toBeNull();
  });

  it("meaning recall ignores the article, noun recall demands it", () => {
    // German → English (repetitions 0): meaning only.
    expect(gradeReview("tisch", "table", 0).correct).toBe(true);
    expect(gradeReview("tisch", "Table", 0).correct).toBe(true);
    expect(gradeReview("tisch", "chair", 0).correct).toBe(false);

    // English → German (repetitions 1): article is part of the answer.
    expect(gradeReview("tisch", "der Tisch", 1).correct).toBe(true);
    expect(gradeReview("tisch", "der tisch", 1).correct).toBe(true);
    expect(gradeReview("tisch", "Tisch", 1).correct).toBe(false);
    expect(gradeReview("tisch", "die Tisch", 1).correct).toBe(false);
    expect(gradeReview("tisch", "das Tisch", 1).correct).toBe(false);
  });

  it("keeps accepting bare nouns for Week 1 and Week 2 vocabulary", () => {
    expect(gradeReview("mutter", "Mutter", 1).correct).toBe(true);
    expect(gradeReview("mutter", "die Mutter", 1).correct).toBe(true);
    expect(gradeReview("schule", "Schule", 1).correct).toBe(true);
    expect(gradeReview("hallo", "Hallo", 1).correct).toBe(true);

    const mutter = buildReviewExercise("vocabulary", "mutter")!;
    expect(mutter.kind === "vocab" && mutter.germanAnswers).toContain("Mutter");

    const tisch = buildReviewExercise("vocabulary", "tisch")!;
    expect(tisch.kind === "vocab" && tisch.germanAnswers).not.toContain("Tisch");
  });

  it("keeps Week 3 accepted English variants", () => {
    expect(gradeReview("handy", "phone", 0).correct).toBe(true);
    expect(gradeReview("lehrerin", "teacher", 0).correct).toBe(true);
    expect(gradeReview("heft", "notebook", 0).correct).toBe(true);
  });

  it("round-trips article exercise metadata through stored JSON", () => {
    const exercise = buildReviewExercise("vocabulary", "tisch#article")!;
    const stored = JSON.stringify(exercise);

    expect(validateExercise(JSON.parse(stored))).toEqual(exercise);

    const resolved = resolveExercise(stored, "vocabulary", "tisch#article");
    expect(resolved).toMatchObject({ concept: "noun_article", label: "Vocabulary · Article" });
  });

  it("falls back to a rebuild for an old row without stored JSON", () => {
    expect(resolveExercise(null, "vocabulary", "buch#plural")).toMatchObject({
      concept: "noun_plural",
    });
    expect(resolveExercise(null, "vocabulary", "danke")?.kind).toBe("vocab");
  });

  it("labels article and plural cards, and describes them for mistakes", () => {
    const article = toTypedQuestion(buildReviewExercise("vocabulary", "tisch#article")!, 0)!;
    const plural = toTypedQuestion(buildReviewExercise("vocabulary", "tisch#plural")!, 0)!;

    expect(article.label).toBe("Vocabulary · Article");
    expect(plural.label).toBe("Vocabulary · Plural");
    expect(describeReviewConcept("vocabulary", "tisch#article")).toEqual({
      prompt: 'What is the article of "Tisch"?',
      expected: "der",
    });
    expect(describeReviewConcept("vocabulary", "tisch#plural")?.prompt).toBe(
      'What is the plural of "der Tisch"?',
    );
  });

  it("leaves existing grammar exercises labelled Grammar", () => {
    const exercise = buildReviewExercise("grammar", "hb-f-ich")!;
    expect(toTypedQuestion(exercise, 0)?.label).toBe("Grammar");
  });
});

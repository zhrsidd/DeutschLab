import { describe, expect, it } from "vitest";

import {
  allVocabularyItems,
  vocabularySetForItem,
  week1VocabularySet,
  week2VocabularySet,
} from "../data/lessons/vocabularySets";
import { week1Vocabulary } from "../data/lessons/week1Vocabulary";
import {
  week2Vocabulary,
  week2VocabularyBatches,
} from "../data/lessons/week2Vocabulary";

import {
  buildReviewExercise,
  lessonIdFor,
  resolveExercise,
  toTypedQuestion,
} from "./reviewExercises";
import {
  buildBatchCheck,
  buildFinalQuiz,
  gradeVocabAnswer,
} from "./vocabularyExercises";

const unique = (values: string[]) => new Set(values).size === values.length;
const byCategory = (category: string) =>
  week2Vocabulary.filter((item) => item.category === category);
const german = (id: string) => week2Vocabulary.find((i) => i.id === id)!.german;

describe("Week 2 vocabulary content", () => {
  it("has between 60 and 75 new items", () => {
    expect(week2Vocabulary.length).toBeGreaterThanOrEqual(60);
    expect(week2Vocabulary.length).toBeLessThanOrEqual(75);
  });

  it("has unique ids, within Week 2 and across both weeks", () => {
    expect(unique(week2Vocabulary.map((item) => item.id))).toBe(true);
    expect(unique(allVocabularyItems().map((item) => item.id))).toBe(true);
  });

  it("does not re-add any Week 1 id or German word", () => {
    const week1Ids = new Set(week1Vocabulary.map((item) => item.id));
    const week1Words = new Set(week1Vocabulary.map((item) => item.german.toLowerCase()));

    for (const item of week2Vocabulary) {
      expect(week1Ids.has(item.id), item.id).toBe(false);
      expect(week1Words.has(item.german.toLowerCase()), item.german).toBe(false);
    }
  });

  it("leaves Week 1 untouched (76 items, same set)", () => {
    expect(week1Vocabulary).toHaveLength(76);
    expect(week1VocabularySet.items).toBe(week1Vocabulary);
    expect(week1VocabularySet.taskId).toBe("vocab-001");
    expect(week2VocabularySet.taskId).toBe("vocab-002");
  });

  it("has no duplicate German words within Week 2", () => {
    expect(unique(week2Vocabulary.map((item) => item.german.toLowerCase()))).toBe(true);
  });

  it("teaches all seven days in order", () => {
    expect(byCategory("days").map((item) => item.german)).toEqual([
      "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag",
    ]);
  });

  it("teaches all twelve months in order", () => {
    expect(byCategory("months").map((item) => item.german)).toEqual([
      "Januar", "Februar", "März", "April", "Mai", "Juni",
      "Juli", "August", "September", "Oktober", "November", "Dezember",
    ]);
  });

  it("teaches heute, morgen and gestern", () => {
    expect(byCategory("time").map((item) => item.german)).toEqual([
      "heute", "morgen", "gestern",
    ]);
  });

  it("fills every required category", () => {
    for (const category of [
      "family", "activities", "places", "adjectives", "days", "months", "time",
    ]) {
      expect(byCategory(category).length, category).toBeGreaterThan(0);
    }
  });

  it("includes the requested core words with correct articles", () => {
    expect(german("mutter")).toBe("die Mutter");
    expect(german("vater")).toBe("der Vater");
    expect(german("bruder")).toBe("der Bruder");
    expect(german("kind")).toBe("das Kind");
    expect(german("krankenhaus")).toBe("das Krankenhaus");
    expect(german("universitaet")).toBe("die Universität");
    expect(german("supermarkt")).toBe("der Supermarkt");
  });

  it("stores the article with every counted noun, matching its article field", () => {
    const nouns = week2Vocabulary.filter(
      (item) => item.partOfSpeech === "noun" && ["family", "places"].includes(item.category),
    );

    expect(nouns.length).toBeGreaterThan(20);

    for (const item of nouns) {
      expect(item.article, item.german).toBeDefined();
      expect(item.german.startsWith(`${item.article} `), item.german).toBe(true);
    }
  });

  it("gives days and months a der article without printing it", () => {
    for (const item of [...byCategory("days"), ...byCategory("months")]) {
      expect(item.article).toBe("der");
      expect(item.german).not.toMatch(/^(der|die|das)\s/);
    }
  });

  it("has valid, non-empty plurals that match the noun's gender pattern", () => {
    const withPlural = week2Vocabulary.filter((item) => item.plural !== undefined);

    expect(withPlural.length).toBeGreaterThan(20);

    for (const item of withPlural) {
      expect(item.plural!.trim(), item.id).not.toBe("");
      expect(item.plural!.startsWith("die "), item.id).toBe(true);
      expect(item.plural, item.id).not.toBe(item.german);
    }

    expect(week2Vocabulary.find((i) => i.id === "mutter")!.plural).toBe("die Mütter");
    expect(week2Vocabulary.find((i) => i.id === "bruder")!.plural).toBe("die Brüder");
    expect(week2Vocabulary.find((i) => i.id === "haus")!.plural).toBe("die Häuser");
  });

  it("marks plural-only family nouns without inventing a plural", () => {
    for (const id of ["eltern", "geschwister", "grosseltern"]) {
      expect(week2Vocabulary.find((i) => i.id === id)!.plural).toBeUndefined();
    }
  });

  it("does not teach separable verbs or frequency adverbs yet", () => {
    const words = week2Vocabulary.map((item) => item.german.toLowerCase());

    expect(words).not.toContain("aufstehen");
    expect(words.filter((w) => ["immer", "oft", "manchmal", "nie", "selten"].includes(w))).toEqual([]);
  });

  it("has an example sentence for every word that is not a month", () => {
    for (const item of week2Vocabulary.filter((i) => i.category !== "months")) {
      expect(item.exampleGerman, item.id).toBeTruthy();
      expect(item.exampleEnglish, item.id).toBeTruthy();
    }
  });
});

describe("Week 2 batches", () => {
  it("puts every item in exactly one batch of a sensible size", () => {
    const ids = week2VocabularyBatches.flatMap((batch) => batch.itemIds);

    expect(ids).toHaveLength(week2Vocabulary.length);
    expect(unique(ids)).toBe(true);
    expect(week2VocabularyBatches).toHaveLength(7);

    for (const batch of week2VocabularyBatches) {
      expect(batch.itemIds.length, batch.id).toBeGreaterThanOrEqual(7);
      expect(batch.itemIds.length, batch.id).toBeLessThanOrEqual(12);
    }
  });

  it("builds a 4-question check for every batch, deterministically", () => {
    for (const batch of week2VocabularyBatches) {
      const check = buildBatchCheck(batch);

      expect(check).toHaveLength(4);
      expect(buildBatchCheck(batch)).toEqual(check);
    }
  });

  it("draws check distractors only from Week 2", () => {
    const week2Ids = new Set(week2Vocabulary.map((item) => item.id));
    const week2English = new Set(week2Vocabulary.map((item) => item.english));
    const week2German = new Set(week2Vocabulary.map((item) => item.german));

    for (const batch of week2VocabularyBatches) {
      for (const question of buildBatchCheck(batch)) {
        expect(week2Ids.has(question.itemId)).toBe(true);

        for (const option of question.options) {
          expect(week2English.has(option) || week2German.has(option), option).toBe(true);
        }
      }
    }
  });
});

describe("Week 2 final quiz", () => {
  it("has 16–20 questions, deterministic per attempt", () => {
    const quiz = buildFinalQuiz(1, week2VocabularySet);

    expect(quiz.length).toBeGreaterThanOrEqual(16);
    expect(quiz.length).toBeLessThanOrEqual(20);
    expect(buildFinalQuiz(1, week2VocabularySet)).toEqual(quiz);
    expect(buildFinalQuiz(2, week2VocabularySet)).not.toEqual(quiz);
  });

  it("covers every major category and mixes choice with typed recall", () => {
    const quiz = buildFinalQuiz(1, week2VocabularySet);
    const categories = new Set(
      quiz.map((q) => allVocabularyItems().find((i) => i.id === q.itemId)!.category),
    );

    expect(categories).toEqual(
      new Set(["family", "activities", "places", "adjectives", "days", "months", "time"]),
    );

    const kinds = new Set(quiz.map((q) => q.kind));
    expect(kinds.has("typed")).toBe(true);
    expect(kinds.has("de-en")).toBe(true);
    expect(kinds.has("en-de")).toBe(true);
    expect(quiz.filter((q) => q.kind === "typed").length).toBeLessThan(quiz.length / 2);
  });

  it("keeps verbs out of typed German", () => {
    for (const q of buildFinalQuiz(1, week2VocabularySet)) {
      const item = allVocabularyItems().find((i) => i.id === q.itemId)!;
      if (item.category === "activities") expect(q.kind).not.toBe("typed");
    }
  });

  it("uses a different seed from Week 1, and leaves the Week 1 quiz unchanged", () => {
    expect(buildFinalQuiz(1, week2VocabularySet)).not.toEqual(buildFinalQuiz(1));
    expect(buildFinalQuiz(1)).toEqual(buildFinalQuiz(1, week1VocabularySet));
    expect(buildFinalQuiz(1)).toHaveLength(16);
  });

  it("has well-formed multiple choice (4 unique options incl. the answer)", () => {
    for (const q of buildFinalQuiz(1, week2VocabularySet).filter((x) => x.kind !== "typed")) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.answer);
    }
  });

  it("grades typed answers with the review rules", () => {
    for (const q of buildFinalQuiz(1, week2VocabularySet).filter((x) => x.kind === "typed")) {
      expect(gradeVocabAnswer(q, q.answer).correct).toBe(true);
      expect(gradeVocabAnswer(q, "zzzz").correct).toBe(false);
    }
  });
});

describe("Week 2 active-recall review data", () => {
  it("builds an exercise for every item in both directions", () => {
    for (const item of week2Vocabulary) {
      const exercise = buildReviewExercise("vocabulary", item.id);

      expect(exercise?.kind, item.id).toBe("vocab");
      expect(toTypedQuestion(exercise!, 0), item.id).not.toBeNull();
      expect(toTypedQuestion(exercise!, 1), item.id).not.toBeNull();
      expect(resolveExercise(null, "vocabulary", item.id), item.id).not.toBeNull();
    }
  });

  it("traces reviews to the right lesson", () => {
    expect(lessonIdFor("vocabulary", "mutter")).toBe("vocab-002");
    expect(lessonIdFor("vocabulary", "danke")).toBe("vocab-001");
    expect(vocabularySetForItem("montag").taskId).toBe("vocab-002");
  });

  it("types English → German with or without the article, and shows the preferred form", () => {
    const q = toTypedQuestion(buildReviewExercise("vocabulary", "mutter")!, 1)!;

    expect(q.grade("die Mutter").correct).toBe(true);
    expect(q.grade("die Mutter").note).toBeUndefined();

    const bare = q.grade("mutter");
    expect(bare.correct).toBe(true);
    expect(bare.note).toBe("Preferred spelling: die Mutter");

    expect(q.grade("der Mutter").correct).toBe(false);
    expect(q.grade("die Vater").correct).toBe(false);
  });

  it("accepts umlaut and ß alternatives with the preferred spelling shown", () => {
    const maerz = toTypedQuestion(buildReviewExercise("vocabulary", "maerz")!, 1)!;
    expect(maerz.grade("Maerz").correct).toBe(true);
    expect(maerz.grade("Maerz").note).toBe("Preferred spelling: März");
    expect(maerz.grade("Marz").correct).toBe(false);

    const gross = toTypedQuestion(buildReviewExercise("vocabulary", "gross")!, 1)!;
    expect(gross.grade("gross").correct).toBe(true);
    expect(gross.grade("gross").note).toBe("Preferred spelling: groß");

    const uni = toTypedQuestion(buildReviewExercise("vocabulary", "universitaet")!, 1)!;
    expect(uni.grade("Universitaet").correct).toBe(true);
    expect(uni.grade("die Uni").correct).toBe(true);

    const januar = toTypedQuestion(buildReviewExercise("vocabulary", "januar")!, 1)!;
    expect(januar.grade("Jänner").correct).toBe(true);
  });

  it("accepts sensible English variants", () => {
    const en = (id: string, input: string) =>
      toTypedQuestion(buildReviewExercise("vocabulary", id)!, 0)!.grade(input).correct;

    expect(en("mutter", "Mum")).toBe(true);
    expect(en("mutter", "mother")).toBe(true);
    expect(en("grossmutter", "grandma")).toBe(true);
    expect(en("gehen", "go")).toBe(true);
    expect(en("hoeren", "to listen")).toBe(true);
    expect(en("schoen", "nice")).toBe(true);
    expect(en("gross", "large")).toBe(true);
    expect(en("morgen", "tomorrow")).toBe(true);
    expect(en("morgen", "yesterday")).toBe(false);
    expect(en("montag", "Tuesday")).toBe(false);
  });
});

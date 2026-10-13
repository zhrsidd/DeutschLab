import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  allVocabularyItems,
  vocabularySetForItem,
  vocabularySetForTask,
  week3VocabularySet,
  week4VocabularySet,
} from "../data/lessons/vocabularySets";
import { week4Vocabulary } from "../data/lessons/week4Vocabulary";
import { IRREGULAR_VERB_TABLE } from "../data/lessons/week4IrregularVerbs";

import { buildReviewExercise, lessonIdFor, toTypedQuestion } from "./reviewExercises";
import {
  buildBatchCheck,
  buildFinalQuiz,
  gradeVocabAnswer,
  type VocabQuestion,
} from "./vocabularyExercises";

const set = week4VocabularySet;
const nouns = week4Vocabulary.filter((item) => item.partOfSpeech === "noun");
const others = week4Vocabulary.filter((item) => item.partOfSpeech !== "noun");

function typed(id: string, input: string, repetitions = 1) {
  const exercise = buildReviewExercise("vocabulary", id);
  if (!exercise) throw new Error(`no exercise for ${id}`);
  return toTypedQuestion(exercise, repetitions)!.grade(input);
}

describe("vocab-004 content", () => {
  it("adds 65–90 genuinely new items, bringing October to 280–310", () => {
    expect(week4Vocabulary.length).toBeGreaterThanOrEqual(65);
    expect(week4Vocabulary.length).toBeLessThanOrEqual(90);

    const total = allVocabularyItems().length;
    expect(total).toBeGreaterThanOrEqual(280);
    expect(total).toBeLessThanOrEqual(310);
  });

  it("uses ids and German words that no earlier week uses", () => {
    const earlier = allVocabularyItems().filter((item) => !week4Vocabulary.includes(item));
    const earlierIds = new Set(earlier.map((item) => item.id));
    const earlierGerman = new Set(earlier.map((item) => item.german.toLowerCase()));

    for (const item of week4Vocabulary) {
      expect(earlierIds.has(item.id), item.id).toBe(false);
      expect(earlierGerman.has(item.german.toLowerCase()), item.german).toBe(false);
    }

    const ids = week4Vocabulary.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all six areas, including the requested verbs", () => {
    const categories = new Set(week4Vocabulary.map((item) => item.category));
    for (const category of ["actions", "meals", "home", "clothes", "study", "descriptions", "expressions"]) {
      expect(categories.has(category as never), category).toBe(true);
    }

    for (const verb of ["sehen", "nehmen", "treffen", "tragen", "kaufen", "suchen", "brauchen"]) {
      expect(week4Vocabulary.find((item) => item.id === verb)?.partOfSpeech, verb).toBe("verb");
    }
  });

  it("gives every noun an article, a plural or no-plural status, and requires the article", () => {
    expect(nouns.length).toBeGreaterThan(30);

    for (const noun of nouns) {
      expect(noun.article, noun.id).toBeDefined();
      expect(noun.german.startsWith(`${noun.article} `), noun.id).toBe(true);
      expect(Boolean(noun.plural) !== Boolean(noun.noPlural), noun.id).toBe(true);
      if (noun.plural) expect(noun.plural.startsWith("die "), noun.id).toBe(true);
      expect(noun.requireArticle, noun.id).toBe(true);
    }
  });

  it("keeps verbs, adjectives and expressions free of noun-only fields", () => {
    for (const item of others) {
      expect(item.article, item.id).toBeUndefined();
      expect(item.plural, item.id).toBeUndefined();
      expect(item.requireArticle, item.id).toBeFalsy();
    }
  });

  it("gives every item an example sentence and translation", () => {
    for (const item of week4Vocabulary) {
      expect(item.exampleGerman, item.id).toMatch(/[.!?]$/);
      expect(item.exampleEnglish, item.id).toMatch(/[.!?]$/);
    }
  });

  it("shows the same du / er forms in the notes as grammar-010 teaches", () => {
    for (const [verb, forms] of Object.entries(IRREGULAR_VERB_TABLE)) {
      const note = week4Vocabulary.find((item) => item.id === verb)?.note ?? "";
      expect(note, verb).toContain(`du ${forms[1]}`);
      expect(note, verb).toContain(`er/sie/es ${forms[2]}`);
    }
  });

  it("puts every item in exactly one batch of 8–12 items", () => {
    const placed = set.batches.flatMap((batch) => batch.itemIds);

    expect(placed.sort()).toEqual(week4Vocabulary.map((item) => item.id).sort());
    for (const batch of set.batches) {
      expect(batch.itemIds.length, batch.id).toBeGreaterThanOrEqual(8);
      expect(batch.itemIds.length, batch.id).toBeLessThanOrEqual(12);
    }
  });

  it("is registered as vocab-004, article-aware and resumable", () => {
    expect(vocabularySetForTask("vocab-004")).toBe(set);
    expect(set.articleAware).toBe(true);
    expect(set.resumable).toBe(true);
    expect(vocabularySetForItem("tomate")).toBe(set);
    expect(lessonIdFor("vocabulary", "tomate#plural")).toBe("vocab-004");
    expect(lessonIdFor("vocabulary", "sehen")).toBe("vocab-004");
  });
});

describe("no premature grammar in Week 4 vocabulary", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/data/lessons/week4Vocabulary.ts"),
    "utf8",
  );
  const german = week4Vocabulary.flatMap((item) => [item.german, item.exampleGerman ?? ""]).join(" ");

  it("uses no modal verbs, dative pronouns, possessives or subordinate clauses", () => {
    const banned =
      /\b(kann|kannst|können|muss|musst|müssen|will|willst|wollen|möchte|möchtest|darf|soll|mir|dir|ihm|Ihnen|mein|meine|dein|deine|unser|weil|dass|dem|einem|einer)\b/;
    expect(german).not.toMatch(banned);
  });

  it("uses no Perfekt participles", () => {
    expect(german).not.toMatch(/\b(gemacht|gekauft|gesehen|genommen|gefahren|getroffen|getragen|gegessen|gelernt)\b/);
  });

  it("documents why adjectives stay after sein", () => {
    expect(source).toContain("adjective endings are");
  });
});

describe("vocab-004 quizzes", () => {
  const attempts = [1, 2, 3, 4, 5, 6, 7, 8];

  it("has a 20-question final quiz with a 16/20 pass mark", () => {
    for (const attempt of attempts) {
      const quiz = buildFinalQuiz(attempt, set);
      expect(quiz).toHaveLength(20);
      expect(Math.ceil(quiz.length * 0.8)).toBe(16);
      expect(new Set(quiz.map((q) => q.itemId)).size).toBe(20);
    }
  });

  it("never asks a verb, adjective or expression for an article or plural", () => {
    const asked: VocabQuestion[] = [
      ...attempts.flatMap((attempt) => buildFinalQuiz(attempt, set)),
      ...set.batches.flatMap((batch) => buildBatchCheck(batch)),
    ];

    for (const question of asked) {
      const item = week4Vocabulary.find((entry) => entry.id === question.itemId)!;
      if (question.kind === "article" || question.kind === "plural") {
        expect(item.partOfSpeech, question.id).toBe("noun");
      }
      if (question.kind === "plural") expect(item.noPlural, question.id).toBeFalsy();
      if (question.options.length) expect(question.options, question.id).toContain(question.answer);
      expect(question.answer, question.id).not.toBe("");
    }
  });

  it("mixes meaning, article, plural and typed questions", () => {
    const kinds = new Set(attempts.flatMap((attempt) => buildFinalQuiz(attempt, set)).map((q) => q.kind));
    expect([...kinds].sort()).toEqual(["article", "de-en", "en-de", "plural", "typed"]);
  });

  it("leaves the Week 3 final quiz unchanged by the mixed-set rule", () => {
    // Week 3 is all nouns: the rotation must still produce article/plural questions.
    const quiz = buildFinalQuiz(1, week3VocabularySet);
    expect(quiz).toHaveLength(20);
    expect(quiz.some((q) => q.kind === "article")).toBe(true);
    expect(quiz.some((q) => q.kind === "plural")).toBe(true);
  });

  it("grades typed nouns with their article and verbs without one", () => {
    const noun: VocabQuestion = {
      id: "t", itemId: "jacke", reviewId: "jacke", kind: "typed", display: "jacket",
      instruction: "", options: [], answer: "die Jacke", audioText: "die Jacke",
    };
    expect(gradeVocabAnswer(noun, "die Jacke").correct).toBe(true);
    expect(gradeVocabAnswer(noun, "Jacke").correct).toBe(false);
    expect(gradeVocabAnswer(noun, "der Jacke").correct).toBe(false);

    const verb: VocabQuestion = { ...noun, itemId: "suchen", reviewId: "suchen", display: "to look for", answer: "suchen" };
    expect(gradeVocabAnswer(verb, "suchen").correct).toBe(true);
  });
});

describe("vocab-004 accepted answers", () => {
  it("accepts every item's own German and its first English meaning", () => {
    for (const item of week4Vocabulary) {
      expect(typed(item.id, item.german, 1).correct, item.id).toBe(true);
      expect(typed(item.id, item.english.split("/")[0], 0).correct, item.id).toBe(true);
    }
  });

  it("accepts natural English variants", () => {
    expect(typed("ich-habe-hunger", "I'm hungry", 0).correct).toBe(true);
    expect(typed("was-kostet-das", "how much is that", 0).correct).toBe(true);
    expect(typed("fahren", "drive", 0).correct).toBe(true);
    expect(typed("fahren", "to ride", 0).correct).toBe(true);
    expect(typed("hose", "pants", 0).correct).toBe(true);
    expect(typed("kuehlschrank", "refrigerator", 0).correct).toBe(true);
    expect(typed("wie-bitte", "sorry", 0).correct).toBe(true);
  });

  it("accepts gerne for gern and ignores final punctuation in expressions", () => {
    expect(typed("gern", "gerne").correct).toBe(true);
    expect(typed("ich-habe-hunger", "ich habe hunger").correct).toBe(true);
    expect(typed("noch-einmal", "Noch einmal bitte").correct).toBe(true);
  });

  it("requires the article for Week 4 nouns but not for Week 2 nouns", () => {
    expect(typed("wohnung", "Wohnung").correct).toBe(false);
    expect(typed("wohnung", "die Wohnung").correct).toBe(true);
    expect(typed("mutter", "Mutter").correct).toBe(true);
  });

  it("keeps meaning, article and plural of a Week 4 noun as separate concepts", () => {
    expect(buildReviewExercise("vocabulary", "satz")?.kind).toBe("vocab");
    expect(buildReviewExercise("vocabulary", "satz#article")).toMatchObject({ concept: "noun_article", preferred: "der" });
    expect(buildReviewExercise("vocabulary", "satz#plural")).toMatchObject({ concept: "noun_plural", preferred: "die Sätze" });
    expect(buildReviewExercise("vocabulary", "geld#plural")).toBeNull();
    expect(buildReviewExercise("vocabulary", "sehen#article")).toBeNull();
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  listeningItems,
  readingQuestions,
  readingText,
} from "../data/lessons/week1Checkpoint";
import { week1ListeningQuiz } from "../data/lessons/week1Listening";
import { week1PronunciationQuiz } from "../data/lessons/week1Pronunciation";
import { questionsCourse, week1QuestionsQuiz } from "../data/lessons/week1Questions";
import { regularVerbsCourse, week1RegularVerbsQuiz } from "../data/lessons/week1RegularVerbs";
import { week1SeinQuiz } from "../data/lessons/week1Sein";
import {
  vocabularyBatches,
  week1Vocabulary,
} from "../data/lessons/week1Vocabulary";
import { starterTasks } from "../data/unit1";

import {
  CHECKPOINT_TOTAL,
  SECTION_RULES,
} from "./checkpointScoring";
import {
  buildCheckpointGrammar,
  buildCheckpointVocabulary,
} from "./checkpointBuilders";
import {
  buildReviewExercise,
  resolveExercise,
  toChoiceQuestion,
  toTypedQuestion,
} from "./reviewExercises";
import {
  buildBatchCheck,
  buildFinalQuiz,
  FINAL_QUIZ_SIZE,
} from "./vocabularyExercises";

const unique = (values: string[]) => new Set(values).size === values.length;

describe("curriculum", () => {
  it("has unique task ids", () => {
    expect(unique(starterTasks.map((task) => task.id))).toBe(true);
  });

  it("keeps the Week 1 task ids and order unchanged", () => {
    const week1 = starterTasks
      .filter((task) => (task.week ?? 1) === 1)
      .map((task) => task.id);

    expect(week1).toEqual([
      "vocab-001",
      "pronunciation-001",
      "grammar-001",
      "grammar-002",
      "grammar-003",
      "listening-001",
      "speaking-001",
      "checkpoint-001",
    ]);
  });

  it("lists Week 2 after the Week 1 checkpoint, in the agreed order", () => {
    const ids = starterTasks.map((task) => task.id);

    expect(ids.slice(ids.indexOf("checkpoint-001") + 1)).toEqual([
      "vocab-002",
      "grammar-004",
      "grammar-005",
      "writing-001",
      "reading-001",
      "listening-002",
      "checkpoint-002",
    ]);
    expect(starterTasks.filter((task) => task.week === 2)).toHaveLength(7);
  });

  it("keeps the original Week 2 ids (vocab-002, grammar-004) unchanged", () => {
    expect(starterTasks.find((t) => t.id === "vocab-002")?.title).toBe("Week 2 vocabulary");
    expect(starterTasks.find((t) => t.id === "grammar-004")?.title).toBe("haben");
  });
});

describe("vocabulary", () => {
  it("has exactly 76 items with unique ids", () => {
    expect(week1Vocabulary).toHaveLength(76);
    expect(unique(week1Vocabulary.map((item) => item.id))).toBe(true);
  });

  it("keeps the original ten ids and spellings", () => {
    const legacy: Record<string, string> = {
      hallo: "Hallo",
      "guten-morgen": "Guten Morgen",
      "guten-tag": "Guten Tag",
      "guten-abend": "Guten Abend",
      tschuss: "Tschüss",
      "auf-wiedersehen": "Auf Wiedersehen",
      danke: "Danke",
      bitte: "Bitte",
      ja: "Ja",
      nein: "Nein",
    };

    for (const [id, german] of Object.entries(legacy)) {
      expect(week1Vocabulary.find((item) => item.id === id)?.german).toBe(german);
    }
  });

  it("has no duplicate German entries except the deliberate sie/Sie pair", () => {
    const seen = new Map<string, string[]>();

    for (const item of week1Vocabulary) {
      const key = item.german.toLowerCase();
      seen.set(key, [...(seen.get(key) ?? []), item.german]);
    }

    const collisions = [...seen.entries()].filter(([, list]) => list.length > 1);

    expect(collisions).toEqual([["sie", ["sie", "Sie"]]]);
  });

  it("fills every category and assigns each item to exactly one batch", () => {
    const categories = new Set(week1Vocabulary.map((item) => item.category));
    expect(categories.size).toBe(7);

    const batched = vocabularyBatches.flatMap((batch) => batch.itemIds);
    expect(batched).toHaveLength(week1Vocabulary.length);
    expect(unique(batched)).toBe(true);
    expect(vocabularyBatches.every((batch) => batch.itemIds.length >= 6)).toBe(true);
  });

  it("spells the numbers correctly", () => {
    const expected: Record<number, string> = {
      0: "null", 1: "eins", 2: "zwei", 3: "drei", 4: "vier", 5: "fünf",
      6: "sechs", 7: "sieben", 8: "acht", 9: "neun", 10: "zehn", 11: "elf",
      12: "zwölf", 13: "dreizehn", 14: "vierzehn", 15: "fünfzehn",
      16: "sechzehn", 17: "siebzehn", 18: "achtzehn", 19: "neunzehn",
      20: "zwanzig", 30: "dreißig", 40: "vierzig", 50: "fünfzig",
      60: "sechzig", 70: "siebzig", 80: "achtzig", 90: "neunzig", 100: "hundert",
    };

    for (const [value, word] of Object.entries(expected)) {
      expect(week1Vocabulary.find((item) => item.id === `num-${value}`)?.german).toBe(word);
    }
  });

  it("builds an active-recall exercise for every item", () => {
    for (const item of week1Vocabulary) {
      const exercise = buildReviewExercise("vocabulary", item.id);

      expect(exercise?.kind).toBe("vocab");
      expect(toTypedQuestion(exercise!, 0)).not.toBeNull();
      expect(toTypedQuestion(exercise!, 1)).not.toBeNull();
    }
  });

  it("builds deterministic batch checks and final quizzes", () => {
    expect(buildFinalQuiz(1)).toHaveLength(FINAL_QUIZ_SIZE);
    expect(buildFinalQuiz(1)).toEqual(buildFinalQuiz(1));
    expect(buildFinalQuiz(1)).not.toEqual(buildFinalQuiz(2));

    for (const batch of vocabularyBatches) {
      expect(buildBatchCheck(batch)).toHaveLength(4);
    }
  });
});

describe("grammar", () => {
  const sein = {
    ich: "bin",
    du: "bist",
    "er/sie/es": "ist",
    wir: "sind",
    ihr: "seid",
    "sie/Sie": "sind",
  };

  it("keeps the sein paradigm correct in the lesson answers", () => {
    const answers = new Map(
      week1SeinQuiz.flatMap((q) => (q.kind === "fill" ? [[q.id, q.answer]] : [])),
    );

    expect(answers.get("f-ich")).toBe(sein.ich);
    expect(answers.get("f-du")).toBe(sein.du);
    expect(answers.get("f-ihr")).toBe(sein["ihr"]);
    expect(answers.get("f-lehrer")).toBe(sein["er/sie/es"]);
  });

  it("builds every regular-verb table cell from stem + ending", () => {
    const endings = ["e", "st", "t", "en", "t", "en"];
    const verbs = ["lernen", "wohnen", "machen", "kommen"];
    const page = regularVerbsCourse.pages.find((p) => p.id === "tables")!;
    const table = page.blocks[0];

    if (table.type !== "table") throw new Error("expected a table block");

    verbs.forEach((verb, column) => {
      const stem = verb.slice(0, -2);

      endings.forEach((ending, row) => {
        expect(table.rows[row][column + 1]).toBe(stem + ending);
      });
    });
  });

  it("does not teach haben, modals or other Week 2 grammar yet", () => {
    const text = JSON.stringify([regularVerbsCourse, questionsCourse]);

    expect(text).not.toMatch(/\b(haben|habe|hast|hat|habt)\b/i);
    expect(text).not.toMatch(/\b(kann|muss|will|möchte|Perfekt|Akkusativ)\b/i);
  });

  it("uses unique question ids across all three grammar lessons", () => {
    const ids = [
      ...week1SeinQuiz,
      ...week1RegularVerbsQuiz,
      ...week1QuestionsQuiz,
    ].map((q) => q.id);

    expect(unique(ids)).toBe(true);
    expect(week1RegularVerbsQuiz).toHaveLength(12);
    expect(week1QuestionsQuiz).toHaveLength(12);
  });

  it("keeps choice answers inside their options", () => {
    for (const q of [...week1RegularVerbsQuiz, ...week1QuestionsQuiz]) {
      if (q.kind === "choice") expect(q.options).toContain(q.answer);
    }
  });

  it("generates structured review exercises for every grammar question", () => {
    const ids = [
      ...week1SeinQuiz,
      ...week1RegularVerbsQuiz,
      ...week1QuestionsQuiz,
    ].map((q) => q.id);

    for (const id of ids) {
      expect(resolveExercise(null, "grammar", id), id).not.toBeNull();
    }
  });
});

describe("pronunciation and listening review data", () => {
  it("generates exercises for every pronunciation and listening question", () => {
    for (const q of week1PronunciationQuiz) {
      expect(toChoiceQuestion(buildReviewExercise("pronunciation", q.id)!)).not.toBeNull();
    }

    for (const q of week1ListeningQuiz) {
      const choice = toChoiceQuestion(buildReviewExercise("listening", q.id)!);
      expect(choice?.audioRequired).toBe(true);
    }
  });
});

describe("checkpoint", () => {
  it("totals 34 marks", () => {
    expect(CHECKPOINT_TOTAL).toBe(34);
    expect(SECTION_RULES.reduce((sum, rule) => sum + rule.max, 0)).toBe(34);
  });

  it("has no duplicate question ids", () => {
    const ids = [
      ...readingQuestions.map((q) => q.id),
      ...listeningItems.flatMap((item) => item.questions.map((q) => q.id)),
    ];

    expect(unique(ids)).toBe(true);
  });

  it("has the planned number of reading and listening questions", () => {
    expect(readingQuestions).toHaveLength(4);
    expect(listeningItems).toHaveLength(3);
    expect(listeningItems.flatMap((item) => item.questions)).toHaveLength(4);
  });

  it("keeps the reading text between 60 and 90 words", () => {
    const words = readingText.trim().split(/\s+/).length;

    expect(words).toBeGreaterThanOrEqual(60);
    expect(words).toBeLessThanOrEqual(90);
  });

  it("builds 8 vocabulary and 8 grammar questions for every attempt", () => {
    for (const attempt of [1, 2, 3]) {
      expect(buildCheckpointVocabulary(attempt)).toHaveLength(8);
      expect(buildCheckpointGrammar(attempt)).toHaveLength(8);
    }
  });
});

describe("CURRICULUM.md stays in step with the code", () => {
  const doc = readFileSync(resolve(process.cwd(), "CURRICULUM.md"), "utf8");
  const rows = [...doc.matchAll(/^\| `([a-z]+-\d{3})` \| .+? \| (Implemented|Planned) \|$/gm)];
  const appIds = new Set(starterTasks.map((task) => task.id));

  it("lists every Week 2 task as Implemented", () => {
    const week2 = Object.fromEntries(rows.map((m) => [m[1], m[2]]));

    for (const id of [
      "vocab-002", "grammar-004", "grammar-005",
      "writing-001", "reading-001", "listening-002", "checkpoint-002",
    ]) {
      expect(week2[id], id).toBe("Implemented");
    }
  });

  it("only marks a task Implemented if it exists in the app", () => {
    for (const [, id, status] of rows) {
      if (status === "Implemented") expect(appIds.has(id), id).toBe(true);
    }
  });
});

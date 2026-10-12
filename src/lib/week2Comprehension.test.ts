import { describe, expect, it } from "vitest";

import {
  checkpoint2ListeningItems,
  checkpoint2ReadingQuestions,
  checkpoint2ReadingText,
  week2GrammarSlots,
  week2VocabularySlots,
} from "../data/lessons/week2Checkpoint";
import { week2ListeningClips, week2ListeningQuestions } from "../data/lessons/week2Listening";
import { readingPassages, readingQuestionsAll } from "../data/lessons/week2Reading";
import { checkpoint2Writing, dailyLifeWriting } from "../data/lessons/week2Writing";
import { findVocabularyItem } from "../data/lessons/vocabularySets";
import type { ComprehensionQuestion } from "../data/lessons/week1Checkpoint";

import {
  buildWeek2CheckpointGrammar,
  buildWeek2CheckpointVocabulary,
  gradeComprehension,
} from "./checkpointBuilders";
import { week1CheckpointDefinition, week2CheckpointDefinition } from "./checkpointDefinitions";
import {
  buildReviewExercise,
  describeReviewConcept,
  lessonIdFor,
  resolveExercise,
} from "./reviewExercises";
import { countWords } from "./text";

const words = (text: string) => text.trim().split(/\s+/).length;
const grade = (q: ComprehensionQuestion, answer: string) =>
  gradeComprehension(q, answer).correct;
const byId = (list: ComprehensionQuestion[], id: string) =>
  list.find((q) => q.id === id)!;

describe("countWords", () => {
  it("counts accurately", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("Ich heiße Anna.")).toBe(3);
    expect(countWords("  Ich   wohne\nin\tDoha  ")).toBe(4);
  });
});

describe("reading-001 content", () => {
  it("has two passages of 70–100 words with four questions each", () => {
    expect(readingPassages).toHaveLength(2);

    for (const passage of readingPassages) {
      expect(words(passage.text), passage.id).toBeGreaterThanOrEqual(70);
      expect(words(passage.text), passage.id).toBeLessThanOrEqual(100);
      expect(passage.questions, passage.id).toHaveLength(4);
    }

    expect(readingQuestionsAll).toHaveLength(8);
  });

  it("has unique question ids and multiple-choice answers inside their options", () => {
    const ids = readingQuestionsAll.map((q) => q.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const q of readingQuestionsAll) {
      if (q.kind === "mc") expect(q.options).toContain(q.answer);
    }
  });

  it("mixes multiple choice, true/false, and short English and German answers", () => {
    const all = readingQuestionsAll;

    expect(all.some((q) => q.kind === "mc" && q.options?.length === 4)).toBe(true);
    expect(all.some((q) => q.kind === "mc" && q.options?.join() === "True,False")).toBe(true);
    expect(all.some((q) => q.kind === "short" && q.language !== "german")).toBe(true);
    expect(all.some((q) => q.kind === "short" && q.language === "german")).toBe(true);
  });

  it("quotes the text as evidence in every explanation", () => {
    for (const q of readingQuestionsAll) {
      expect(q.explanation, q.id).toMatch(/“.+”/);
    }
  });

  it("does not use later-curriculum words (nicht, aber, dann, im, am)", () => {
    for (const passage of readingPassages) {
      expect(passage.text).not.toMatch(/\b(nicht|aber|dann|im|am|weil|dass)\b/i);
    }
  });

  it("grades short English answers by keyword", () => {
    const q3 = byId(readingQuestionsAll, "rd-3");

    expect(grade(q3, "India")).toBe(true);
    expect(grade(q3, "in India.")).toBe(true);
    expect(grade(q3, "Indien")).toBe(true);
    expect(grade(q3, "Doha")).toBe(false);
    expect(grade(q3, "Pakistan")).toBe(false);
    expect(grade(q3, "")).toBe(false);

    const q7 = byId(readingQuestionsAll, "rd-7");

    expect(grade(q7, "German and French")).toBe(true);
    expect(grade(q7, "french, german")).toBe(true);
    expect(grade(q7, "German")).toBe(false);
    expect(grade(q7, "German, French and English")).toBe(false);
  });

  it("grades short German answers with umlaut and case tolerance", () => {
    const q4 = byId(readingQuestionsAll, "rd-4");

    expect(grade(q4, "Physik")).toBe(true);
    expect(grade(q4, "physik.")).toBe(true);
    expect(grade(q4, "Mathematik")).toBe(false);
    expect(grade(q4, "Chemie")).toBe(false);

    const c2 = byId(checkpoint2ReadingQuestions, "c2-r-4");
    expect(grade(c2, "Mathematik")).toBe(true);
    expect(grade(c2, "Mathe")).toBe(true);
    expect(grade(c2, "Physik")).toBe(false);
  });

  it("is deterministic", () => {
    const q = byId(readingQuestionsAll, "rd-3");

    expect(gradeComprehension(q, "India")).toEqual(gradeComprehension(q, "India"));
  });
});

describe("listening-002 content", () => {
  it("has 4 clips of 1–3 sentences and 8 questions", () => {
    expect(week2ListeningClips).toHaveLength(4);
    expect(week2ListeningQuestions).toHaveLength(8);

    for (const clip of week2ListeningClips) {
      const sentences = clip.audio.split(/(?<=[.!?])\s+/).length;

      expect(sentences, clip.id).toBeGreaterThanOrEqual(1);
      expect(sentences, clip.id).toBeLessThanOrEqual(3);
    }
  });

  it("gives every question audio, a translation and valid options", () => {
    for (const q of week2ListeningQuestions) {
      expect(q.audio, q.id).toBeTruthy();
      expect(q.translation, q.id).toBeTruthy();
      expect(q.options, q.id).toContain(q.answer);
    }

    expect(new Set(week2ListeningQuestions.map((q) => q.id)).size).toBe(8);
  });

  it("covers an identify-the-sentence question and a multi-sentence question", () => {
    expect(week2ListeningQuestions.some((q) => /Which sentence/.test(q.prompt))).toBe(true);
    expect(
      week2ListeningClips.some((clip) => clip.audio.split(/(?<=[.!?])\s+/).length === 3),
    ).toBe(true);
  });
});

describe("review concepts from reading and listening", () => {
  const withConcept = [...readingQuestionsAll, ...week2ListeningQuestions].filter(
    (q) => q.concept,
  );

  it("only some questions carry a reusable concept", () => {
    expect(withConcept.length).toBeGreaterThan(0);
    expect(withConcept.length).toBeLessThan(
      readingQuestionsAll.length + week2ListeningQuestions.length,
    );
  });

  it("maps every concept to a real, reviewable item", () => {
    for (const q of withConcept) {
      const concept = q.concept!;

      expect(describeReviewConcept(concept.sourceType, concept.sourceId), q.id).not.toBeNull();
      expect(resolveExercise(null, concept.sourceType, concept.sourceId), q.id).not.toBeNull();
    }
  });

  it("does not map generic facts (names, counts of people, places lived) to Review", () => {
    for (const id of ["rd-1", "rd-2", "rd-3", "rd-5", "rd-6", "rd-7", "l2-2", "l2-6", "l2-8"]) {
      const q = [...readingQuestionsAll, ...week2ListeningQuestions].find((x) => x.id === id)!;

      expect(q.concept, id).toBeUndefined();
    }
  });

  it("traces concepts to the right lesson", () => {
    expect(lessonIdFor("vocabulary", "freund")).toBe("vocab-002");
    expect(lessonIdFor("vocabulary", "physik")).toBe("vocab-001");
    expect(lessonIdFor("grammar", "hb-c-er")).toBe("grammar-004");
  });

  it("describes vocabulary and grammar concepts for the mistakes list", () => {
    expect(describeReviewConcept("vocabulary", "freund")).toEqual(
      expect.objectContaining({ prompt: 'What does "der Freund" mean?', expected: "friend (male)" }),
    );
    expect(describeReviewConcept("grammar", "hb-c-er")?.expected).toBe("hat");
    expect(describeReviewConcept("vocabulary", "does-not-exist")).toBeNull();
  });
});

describe("writing content", () => {
  it("has a 6-point self-check passing at 5", () => {
    expect(dailyLifeWriting.checklist).toHaveLength(6);
    expect(dailyLifeWriting.passScore).toBe(5);
    expect(checkpoint2Writing.checklist).toHaveLength(6);
  });

  it("targets 40–50 words, with a sample inside a sensible range", () => {
    expect(dailyLifeWriting.targetWords).toEqual({ min: 40, max: 50 });
    expect(countWords(dailyLifeWriting.sample)).toBeGreaterThanOrEqual(35);
    expect(countWords(dailyLifeWriting.sample)).toBeLessThanOrEqual(60);
    expect(countWords(checkpoint2Writing.sample)).toBeGreaterThanOrEqual(40);
    expect(countWords(checkpoint2Writing.sample)).toBeLessThanOrEqual(60);
  });

  it("keeps samples within current curriculum (no aber/nicht/ein-forms)", () => {
    for (const sample of [dailyLifeWriting.sample, checkpoint2Writing.sample]) {
      expect(sample).not.toMatch(/\b(aber|nicht|weil|einen|eine|einem)\b/i);
    }
  });
});

describe("checkpoint-002 content", () => {
  it("uses a fresh 80–100 word reading passage with four questions", () => {
    const count = words(checkpoint2ReadingText);

    expect(count).toBeGreaterThanOrEqual(80);
    expect(count).toBeLessThanOrEqual(100);
    expect(checkpoint2ReadingQuestions).toHaveLength(4);

    for (const passage of readingPassages) {
      expect(passage.text).not.toBe(checkpoint2ReadingText);
    }
  });

  it("has 3 fresh listening clips and 4 scored questions", () => {
    expect(checkpoint2ListeningItems).toHaveLength(3);
    expect(checkpoint2ListeningItems.flatMap((i) => i.questions)).toHaveLength(4);

    const lessonAudio = new Set(week2ListeningClips.map((c) => c.audio));

    for (const item of checkpoint2ListeningItems) {
      expect(lessonAudio.has(item.audio)).toBe(false);
    }
  });

  it("has unique ids across reading and listening", () => {
    const ids = [
      ...checkpoint2ReadingQuestions.map((q) => q.id),
      ...checkpoint2ListeningItems.flatMap((i) => i.questions.map((q) => q.id)),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds 8 deterministic vocabulary questions from vocab-002 across categories", () => {
    const first = buildWeek2CheckpointVocabulary(1);

    expect(first).toHaveLength(8);
    expect(buildWeek2CheckpointVocabulary(1)).toEqual(first);
    expect(buildWeek2CheckpointVocabulary(2)).not.toEqual(first);
    expect(new Set(first.map((q) => q.itemId)).size).toBe(8);

    const categories = new Set(first.map((q) => findVocabularyItem(q.itemId)!.category));
    for (const category of ["family", "activities", "places", "adjectives", "days", "months", "time"]) {
      expect(categories.has(category as never), category).toBe(true);
    }

    const kinds = new Set(first.map((q) => q.kind));
    expect(kinds).toEqual(new Set(["de-en", "en-de", "typed"]));

    for (const q of first) {
      expect(week2VocabularySlots.length).toBe(8);
      expect(findVocabularyItem(q.itemId)).toBeDefined();
    }
  });

  it("builds 10 grammar questions covering haben, verbs, word order and questions", () => {
    for (const attempt of [1, 2, 3]) {
      const questions = buildWeek2CheckpointGrammar(attempt);
      const lessons = new Set(questions.map((q) => lessonIdFor("grammar", q.id)));

      expect(questions).toHaveLength(10);
      expect(lessons).toEqual(
        new Set(["grammar-002", "grammar-003", "grammar-004", "grammar-005"]),
      );

      const kinds = new Set(questions.map((q) => q.kind));
      expect(kinds).toEqual(new Set(["fill", "typed", "choice", "reorder"]));
    }
  });

  it("uses grammar ids that are unique and reviewable", () => {
    const ids = week2GrammarSlots.flat().map((q) => q.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const id of ids) {
      expect(buildReviewExercise("grammar", id), id).not.toBeNull();
    }
  });

  it("defines Week 2 without a speaking section, with a 6-point writing check", () => {
    expect(week2CheckpointDefinition.sections).toEqual([
      "vocabulary", "grammar", "reading", "listening", "writing",
    ]);
    expect(week2CheckpointDefinition.writing.checklist).toHaveLength(6);
    expect(week1CheckpointDefinition.sections).toContain("speaking");
  });
});

describe("checkpoint-002 recommendations", () => {
  const failed = (weak: string[]) =>
    ({
      total: 20,
      possible: 32,
      percent: 63,
      sections: [],
      overallPassed: false,
      passed: false,
      weakSections: weak,
    }) as never;

  const labels = (weak: string[], missed: string[] = []) =>
    week2CheckpointDefinition.recommend(failed(weak), missed).map((r) => r.label);

  it("maps weak sections to deterministic Week 2 recommendations", () => {
    expect(labels(["vocabulary"])).toContain("Review Week 2 vocabulary");
    expect(labels(["listening"])).toContain("Practise listening");
    expect(labels(["reading"])).toContain("Practise reading");
    expect(labels(["writing"])).toContain("Review your writing");
    expect(labels(["grammar"], ["grammar-004"])).toContain("Review haben");
    expect(labels(["grammar"], ["grammar-005"])).toContain("Review common verbs");
  });

  it("links recommendations to real lessons, and always offers Review on failure", () => {
    const recs = week2CheckpointDefinition.recommend(failed(["vocabulary", "writing"]), []);

    expect(recs.map((r) => JSON.stringify(r.target))).toEqual([
      '{"type":"lesson","taskId":"vocab-002"}',
      '{"type":"lesson","taskId":"writing-001"}',
      '{"type":"review"}',
    ]);
  });
});

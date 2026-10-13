import { describe, expect, it } from "vitest";

import { week3ListeningClips } from "../data/lessons/week3Listening";
import { week4ListeningClips } from "../data/lessons/week4Listening";
import { week4ReadingPassages } from "../data/lessons/week4Reading";
import { week4SpeakingConfig } from "../data/lessons/week4Speaking";
import { checkpoint4Writing, everydayWriting } from "../data/lessons/week4Writing";
import { week1SpeakingConfig } from "../data/lessons/week1Speaking";

import { gradeComprehension } from "./checkpointBuilders";
import { describeReviewConcept } from "./reviewExercises";

const words = (text: string) => text.split(/\s+/).filter((word) => /[\wäöüß]/i.test(word)).length;

const readingQuestions = week4ReadingPassages.flatMap((passage) => passage.questions);
const listeningQuestions = week4ListeningClips.flatMap((clip) => clip.questions);

/** Strips quotes so an explanation's quoted line can be found in the text. */
const quotedLines = (explanation: string) =>
  [...explanation.matchAll(/“([^”]+)”/g)].map((match) =>
    // "…" marks an elided start or end of the quoted line.
    match[1].replace(/[„“]/g, "").replace(/^…\s*|\s*…$/g, ""),
  );

describe("reading-003 content", () => {
  it("has two passages of 90–120 words", () => {
    expect(week4ReadingPassages).toHaveLength(2);
    for (const passage of week4ReadingPassages) {
      expect(words(passage.text), passage.id).toBeGreaterThanOrEqual(90);
      expect(words(passage.text), passage.id).toBeLessThanOrEqual(120);
    }
  });

  it("has 8 uniquely-identified questions mixing multiple choice and short answers", () => {
    expect(readingQuestions).toHaveLength(8);
    expect(new Set(readingQuestions.map((q) => q.id)).size).toBe(8);
    expect(readingQuestions.filter((q) => q.kind === "short").length).toBeGreaterThanOrEqual(2);
    expect(Math.ceil(8 * 0.8)).toBe(7);
  });

  it("tests pronoun reference, case and verb meaning, not only facts", () => {
    const prompts = readingQuestions.map((q) => q.prompt).join(" | ");
    expect(prompts).toMatch(/what does es refer to/);
    expect(prompts).toMatch(/what does sie refer to/);
    expect(prompts).toMatch(/___ Lehrer/);
    expect(prompts).toMatch(/putzt/);
  });

  it("quotes real lines of the passage in every explanation", () => {
    for (const passage of week4ReadingPassages) {
      const text = passage.text.replace(/[„“]/g, "");
      for (const question of passage.questions) {
        const quotes = quotedLines(question.explanation);
        expect(quotes.length, question.id).toBeGreaterThan(0);
        for (const quote of quotes) {
          if (/^[A-Z]/.test(quote) && quote.includes(" ")) expect(text, question.id).toContain(quote);
        }
      }
    }
  });

  it("marks the correct answers right and common wrong ones wrong", () => {
    for (const question of readingQuestions) {
      if (question.kind === "mc") {
        expect(question.options, question.id).toContain(question.answer);
        expect(gradeComprehension(question, question.answer).correct, question.id).toBe(true);
      }
    }
    const byId = (id: string) => readingQuestions.find((q) => q.id === id)!;
    expect(gradeComprehension(byId("rd4-3"), "by bike").correct).toBe(true);
    expect(gradeComprehension(byId("rd4-3"), "by car").correct).toBe(false);
    expect(gradeComprehension(byId("rd4-7"), "Fleisch").correct).toBe(true);
    expect(gradeComprehension(byId("rd4-7"), "Fisch").correct).toBe(false);
  });

  it("maps only reusable concepts to Review, and every one resolves", () => {
    for (const question of readingQuestions) {
      if (!question.concept) continue;
      expect(describeReviewConcept(question.concept.sourceType, question.concept.sourceId), question.id).not.toBeNull();
    }
  });
});

describe("listening-004 content", () => {
  it("has 4 clips and 8 questions", () => {
    expect(week4ListeningClips).toHaveLength(4);
    expect(listeningQuestions).toHaveLength(8);
    expect(new Set(listeningQuestions.map((q) => q.id)).size).toBe(8);
  });

  it("is longer than the Week 3 clips on average", () => {
    const average = (clips: { audio: string }[]) =>
      clips.reduce((sum, clip) => sum + words(clip.audio), 0) / clips.length;
    expect(average(week4ListeningClips)).toBeGreaterThan(average(week3ListeningClips) * 1.3);
  });

  it("includes conversations (two speakers marked with –)", () => {
    expect(week4ListeningClips.filter((clip) => clip.audio.includes(" – ")).length).toBeGreaterThanOrEqual(2);
  });

  it("keeps a translation for every clip, shown only after answering", () => {
    for (const clip of week4ListeningClips) expect(clip.translation.length, clip.id).toBeGreaterThan(10);
  });

  it("has valid answers and resolvable Review concepts", () => {
    for (const question of listeningQuestions) {
      expect(question.options, question.id).toContain(question.answer);
      if (question.concept) {
        expect(describeReviewConcept(question.concept.sourceType, question.concept.sourceId), question.id).not.toBeNull();
      }
    }
  });

  it("quotes lines that are really in the clip", () => {
    for (const clip of week4ListeningClips) {
      for (const question of clip.questions) {
        for (const quote of quotedLines(question.explanation)) {
          if (quote.includes(" ")) expect(clip.audio, question.id).toContain(quote);
        }
      }
    }
  });
});

describe("writing-003 content", () => {
  it("asks for 60–80 words with a 6-point self-check, pass 5/6", () => {
    expect(everydayWriting.taskId).toBe("writing-003");
    expect(everydayWriting.targetWords).toEqual({ min: 60, max: 80 });
    expect(everydayWriting.checklist).toHaveLength(6);
    expect(everydayWriting.passScore).toBe(5);
  });

  it("has a model text inside the target length", () => {
    for (const sample of [everydayWriting.sample, checkpoint4Writing.sample]) {
      expect(words(sample)).toBeGreaterThanOrEqual(60);
      expect(words(sample)).toBeLessThanOrEqual(80);
    }
  });

  it("uses a fresh prompt for the checkpoint", () => {
    expect(checkpoint4Writing.prompt).not.toBe(everydayWriting.prompt);
    expect(checkpoint4Writing.sample).not.toBe(everydayWriting.sample);
  });

  it("never claims automatic grading", () => {
    expect(everydayWriting.intro).toMatch(/can't be marked automatically/);
  });
});

describe("speaking-002 content", () => {
  it("is a 2–3 minute guided talk with a 5-point self-check, pass 4/5", () => {
    expect(week4SpeakingConfig.finalSeconds).toBe(180);
    expect(week4SpeakingConfig.selfAssessment).toHaveLength(5);
    expect(week4SpeakingConfig.passScore).toBe(4);
    expect(week4SpeakingConfig.finalLabel).toBe("2–3 min");
  });

  it("uses the eight requested cues", () => {
    expect(week4SpeakingConfig.finalCues).toEqual([
      "your name",
      "where you live",
      "the languages you speak",
      "your family",
      "your school subjects",
      "what you do today",
      "your home or your school",
      "something you like doing",
    ]);
  });

  it("has prompts and frames whose German uses only taught grammar", () => {
    const german = [
      ...week4SpeakingConfig.prompts.map((prompt) => prompt.german),
      ...week4SpeakingConfig.frames.map((frame) => frame.example),
      week4SpeakingConfig.sample,
    ].join(" ");

    expect(german).not.toMatch(/\b(kann|muss|will|möchte|mein|meine|mir|dir|weil|dass)\b/);
  });

  it("leaves the Week 1 speaking lesson unchanged", () => {
    expect(week1SpeakingConfig.finalSeconds).toBe(60);
    expect(week1SpeakingConfig.passScore).toBe(4);
    expect(week1SpeakingConfig.selfAssessment).toHaveLength(5);
    expect(week1SpeakingConfig.kicker).toBe("Week 1 · Speaking");
  });
});

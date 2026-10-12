import { describe, expect, it } from "vitest";

import { week3ListeningClips } from "../data/lessons/week3Listening";
import { week3ReadingPassages } from "../data/lessons/week3Reading";
import {
  checkpoint3Writing,
  roomWriting,
  roomWritingChecklist,
} from "../data/lessons/week3Writing";

import { gradeComprehension } from "./checkpointBuilders";
import { describeReviewConcept } from "./reviewExercises";
import { countWords } from "./text";

const readingQuestions = week3ReadingPassages.flatMap((p) => p.questions);
const listeningQuestions = week3ListeningClips.flatMap((c) => c.questions);
const allQuestions = [...readingQuestions, ...listeningQuestions];
const q = (id: string) => allQuestions.find((entry) => entry.id === id)!;

/** Words that belong to later weeks and must not appear in Week 3 texts. */
const LATER_GRAMMAR =
  /\b(kann|kannst|können|muss|musst|müssen|will|willst|wollen|darf|dürfen|soll|sollen|möchte|möchten|weil|dass|hat gelernt|habe gelernt|aufstehen|steht auf|dem|einem|einer|meinem)\b/i;

describe("reading-002 content", () => {
  it("has two passages of about 80–100 words and 8 questions", () => {
    expect(week3ReadingPassages).toHaveLength(2);
    expect(readingQuestions).toHaveLength(8);

    for (const passage of week3ReadingPassages) {
      expect(countWords(passage.text), passage.id).toBeGreaterThanOrEqual(78);
      expect(countWords(passage.text), passage.id).toBeLessThanOrEqual(100);
    }
  });

  it("covers a room and school belongings", () => {
    const text = week3ReadingPassages.map((p) => p.text).join(" ");

    for (const word of ["Zimmer", "Fenster", "Rucksack", "Hefte", "Bücher"]) {
      expect(text, word).toContain(word);
    }
  });

  it("uses nominative, accusative, plural, nicht and kein", () => {
    const text = week3ReadingPassages.map((p) => p.text).join(" ");

    expect(text).toMatch(/\bder\b.*\bdie\b.*\bdas\b/is);
    expect(text).toMatch(/\bein(e|en)?\b/);
    expect(text).toMatch(/\bkeinen\b/);
    expect(text).toMatch(/\bkeine\b/);
    expect(text).toMatch(/\bkein\b/);
    expect(text).toMatch(/\bnicht\b/);
    expect(text).toMatch(/Bücher sind/);
  });

  it("stays inside Weeks 1–3", () => {
    for (const passage of week3ReadingPassages) {
      expect(passage.text, passage.id).not.toMatch(LATER_GRAMMAR);
    }
  });

  it("mixes multiple choice and short answers with a quoted line as evidence", () => {
    expect(readingQuestions.some((e) => e.kind === "short")).toBe(true);
    expect(readingQuestions.filter((e) => e.kind === "mc").length).toBeGreaterThanOrEqual(5);

    const text = week3ReadingPassages.map((p) => p.text).join(" ");

    for (const question of readingQuestions) {
      const quoted = question.explanation.match(/“([^”]+)”/);
      expect(quoted, question.id).not.toBeNull();
      expect(text, question.id).toContain(quoted![1].replace(/\.$/, ""));
    }
  });

  it("covers article identification and subject/object questions", () => {
    expect(q("rd3-2").prompt).toMatch(/article/);
    expect(q("rd3-2").answer).toBe("das");
    expect(q("rd3-3").prompt).toMatch(/direct object/);
    expect(q("rd3-3").answer).toBe("einen Stuhl");
    expect(q("rd3-8").answer).toBe("einen");
  });
});

describe("listening-003 content", () => {
  it("has four clips and 8 questions", () => {
    expect(week3ListeningClips).toHaveLength(4);
    expect(listeningQuestions).toHaveLength(8);
  });

  it("covers description, possession, rooms, negation and singular vs plural", () => {
    const audio = week3ListeningClips.map((c) => c.audio).join(" ");

    expect(audio).toMatch(/ist (groß|neu|klein)/);
    expect(audio).toMatch(/Ich habe einen/);
    expect(audio).toMatch(/keine Tasche/);
    expect(audio).toMatch(/Wohnzimmer/);
    expect(audio).toMatch(/Bücher sind/);
    expect(audio).toMatch(/Das Buch ist/);
  });

  it("stays inside Weeks 1–3", () => {
    for (const clip of week3ListeningClips) {
      expect(clip.audio, clip.id).not.toMatch(LATER_GRAMMAR);
      expect(clip.translation.trim(), clip.id).not.toBe("");
    }
  });
});

describe("Week 3 comprehension questions", () => {
  it("have unique ids and valid answers", () => {
    const ids = allQuestions.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const question of allQuestions) {
      if (question.kind === "mc") {
        expect(question.options, question.id).toContain(question.answer);
      } else {
        expect(question.keywords?.length, question.id).toBeGreaterThan(0);
      }
      expect(question.explanation.trim(), question.id).not.toBe("");
    }
  });

  it("grade multiple choice exactly and short answers by keyword", () => {
    expect(gradeComprehension(q("rd3-2"), "das").correct).toBe(true);
    expect(gradeComprehension(q("rd3-2"), "der").correct).toBe(false);

    const read = q("rd3-4");
    expect(gradeComprehension(read, "Buch").correct).toBe(true);
    expect(gradeComprehension(read, "ein Buch").correct).toBe(true);
    expect(gradeComprehension(read, "Bücher").correct).toBe(false);
    expect(gradeComprehension(read, "Heft").correct).toBe(false);

    const pencil = q("rd3-7");
    expect(gradeComprehension(pencil, "No").correct).toBe(true);
    expect(gradeComprehension(pencil, "no, he does not").correct).toBe(true);
    expect(gradeComprehension(pencil, "Yes").correct).toBe(false);
  });

  it("only attach concepts that resolve to a reusable language item", () => {
    const withConcept = allQuestions.filter((e) => e.concept);

    expect(withConcept.length).toBeGreaterThan(8);

    for (const question of withConcept) {
      const concept = describeReviewConcept(
        question.concept!.sourceType,
        question.concept!.sourceId,
      );
      expect(concept, question.id).not.toBeNull();
    }
  });

  it("never turn passage facts into Review concepts", () => {
    // Plain comprehension (counts, rooms, who has what) carries no concept.
    for (const id of ["rd3-5", "l3-5"]) expect(q(id).concept, id).toBeUndefined();

    // Concepts only ever point at vocabulary or the Week 3 grammar lessons.
    for (const question of allQuestions.filter((e) => e.concept)) {
      const { sourceType, sourceId } = question.concept!;
      if (sourceType === "grammar") expect(sourceId, question.id).toMatch(/^(art|acc|neg)-/);
      else expect(sourceId, question.id).toMatch(/^[a-z]+(#(article|plural))?$/);
    }
  });

  it("keep gender, plural, accusative and negation concepts distinct", () => {
    const concepts = allQuestions.filter((e) => e.concept).map((e) => e.concept!.sourceId);

    expect(concepts.some((id) => id.endsWith("#article"))).toBe(true);
    expect(concepts.some((id) => id.endsWith("#plural"))).toBe(true);
    expect(concepts.some((id) => id.startsWith("acc-"))).toBe(true);
    expect(concepts.some((id) => id.startsWith("neg-"))).toBe(true);
  });
});

describe("writing-002 content", () => {
  it("is a 50–70 word self-assessed task with a 6-point checklist passing at 5", () => {
    expect(roomWriting.taskId).toBe("writing-002");
    expect(roomWriting.targetWords).toEqual({ min: 50, max: 70 });
    expect(roomWriting.checklist).toHaveLength(6);
    expect(roomWriting.checklist).toBe(roomWritingChecklist);
    expect(roomWriting.passScore).toBe(5);
    expect(roomWriting.lengthLabel).toBe("50–70 words");
  });

  it("has model paragraphs that meet the word target", () => {
    for (const sample of [roomWriting.sample, checkpoint3Writing.sample]) {
      expect(countWords(sample)).toBeGreaterThanOrEqual(50);
      expect(countWords(sample)).toBeLessThanOrEqual(70);
      expect(sample).not.toMatch(LATER_GRAMMAR);
    }
  });

  it("checklist covers the six required criteria", () => {
    const text = roomWriting.checklist.join(" | ");

    expect(text).toMatch(/50 words/);
    expect(text).toMatch(/5 complete/);
    expect(text).toMatch(/der, die, das/);
    expect(text).toMatch(/accusative/);
    expect(text).toMatch(/nicht or kein/);
    expect(text).toMatch(/verb/);
  });

  it("offers the key sentence structures and a fresh checkpoint prompt", () => {
    for (const frame of [
      "Das ist mein Zimmer.",
      "Der Tisch ist groß.",
      "Ich habe einen Computer.",
      "Ich habe keine Lampe.",
      "Das Buch ist interessant.",
    ]) {
      expect(roomWriting.frames).toContain(frame);
    }

    expect(checkpoint3Writing.prompt).not.toBe(roomWriting.prompt);
    expect(checkpoint3Writing.targetWords).toEqual({ min: 50, max: 70 });
    expect(checkpoint3Writing.sample).not.toBe(roomWriting.sample);
  });
});

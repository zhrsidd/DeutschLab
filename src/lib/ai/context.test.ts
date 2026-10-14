import { describe, expect, it } from "vitest";

import { starterTasks } from "../../data/unit1";

import { buildLearnerContext, contextForPrompt } from "./context";
import { historyTurns, startTutorSession, topicsFor } from "./tutor";
import type { TutorMessage } from "./types";

const ids = (week: number) => starterTasks.filter((t) => (t.week ?? 1) === week).map((t) => t.id);
const throughWeek3 = [...ids(1), ...ids(2), ...ids(3)];

describe("curriculum context", () => {
  it("a new learner is in Week 1 with nothing completed or mastered", () => {
    const context = buildLearnerContext({ completed: [] });
    expect(context.currentWeek).toBe(1);
    expect(context.completedLessons).toEqual([]);
    expect(context.masteredWeeks).toEqual([]);
    expect(context.lessonCatalog.every((l) => l.week === 1)).toBe(true);
    expect(context.lessonCatalog.some((l) => l.id.startsWith("checkpoint"))).toBe(false);
  });

  it("a Week 4 learner gets Weeks 1–4 grammar, and mastery stays separate from completion", () => {
    const context = buildLearnerContext({ completed: [...throughWeek3, "grammar-009"] });
    expect(context.currentWeek).toBe(4);
    expect(context.masteredWeeks).toEqual([1, 2, 3]);
    expect(context.completedLessons.map((l) => l.id)).toContain("grammar-009");
    expect(context.completedLessons.map((l) => l.id)).not.toContain("grammar-010");
    expect(context.grammarInScope.map((g) => g.week)).toEqual([1, 2, 3, 4]);
    expect(context.vocabulary.length).toBeGreaterThan(200);
    expect(context.vocabulary.length).toBeLessThanOrEqual(320);

    const text = contextForPrompt(context);
    expect(text).toMatch(/working on Week 4/);
    expect(text).toMatch(/Weeks mastered \(checkpoint passed\): 1, 2, 3/);
    expect(text).toMatch(/not proof the learner has mastered/);
    expect(text).toMatch(/modal verbs/);
    expect(text).not.toMatch(/Vocabulary introduced/); // only when asked
  });

  it("does not let Week 5+ content in, even though it is planned", () => {
    const context = buildLearnerContext({ completed: [...throughWeek3, ...ids(4)] });
    expect(context.weeksInScope).toEqual([1, 2, 3, 4]);
    expect(context.lessonCatalog.every((l) => l.week <= 4)).toBe(true);
  });

  it("includes weak lessons by title and count only", () => {
    const context = buildLearnerContext({ completed: [], openMistakesByLesson: new Map([["grammar-007", 4], ["nonsense", 9]]) });
    expect(context.weakLessons).toEqual([{ id: "grammar-007", title: expect.any(String), openMistakes: 4 }]);
  });
});

describe("tutor sessions", () => {
  const week4 = buildLearnerContext({ completed: throughWeek3 });

  it("only offers topics the curriculum has reached", () => {
    const topics = topicsFor(1);
    expect(topics.find((t) => t.id === "introductions")?.available).toBe(true);
    expect(topics.find((t) => t.id === "food")?.available).toBe(false);
    expect(topicsFor(4).find((t) => t.id === "routines")?.available).toBe(false);
  });

  it("opens with a local question (no request) and refuses a locked topic", () => {
    const session = startTutorSession({ mode: "guided", topicId: "family", level: "gentle", grammarFocusId: "haben", correctionMode: "immediate", context: week4, model: "gemini-3.5-flash-lite" });
    expect(session.messages).toHaveLength(1);
    expect(session.messages[0]).toMatchObject({ role: "tutor", text: "Hallo! Hast du Geschwister?" });
    expect(session.grammarFocus).toBe("haben");
    expect(() =>
      startTutorSession({ mode: "guided", topicId: "routines", level: "gentle", grammarFocusId: null, correctionMode: "immediate", context: week4, model: "m" }),
    ).toThrow();
  });

  it("sends a bounded history that starts with the learner", () => {
    const messages: TutorMessage[] = [{ id: "o", role: "tutor", text: "Hallo!", at: "" }];
    for (let i = 0; i < 20; i += 1) {
      messages.push({ id: `l${i}`, role: "learner", text: `L${i}`, at: "" }, { id: `t${i}`, role: "tutor", text: `T${i}`, at: "" });
    }
    const turns = historyTurns(messages);
    expect(turns.length).toBeLessThanOrEqual(12);
    expect(turns[0].role).toBe("user");
    expect(historyTurns([messages[0]])).toEqual([]);
  });
});

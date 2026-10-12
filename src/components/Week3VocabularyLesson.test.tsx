import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import {
  week3VocabularySet,
  type VocabularySet,
} from "../data/lessons/vocabularySets";
import { trackAnswer } from "../lib/db";
import { buildBatchCheck, buildFinalQuiz } from "../lib/vocabularyExercises";
import type { VocabQuestion } from "../lib/vocabularyExercises";

import VocabularyLesson from "./VocabularyLesson";

type User = ReturnType<typeof userEvent.setup>;

/*
 * Waits for the button to be enabled first: answering saves asynchronously
 * and the continue button stays disabled until that settles, so a click
 * made too early is silently ignored.
 */
const click = async (user: User, name: string | RegExp) => {
  const button = screen.getByRole("button", { name });

  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
};

function setup(set: VocabularySet = week3VocabularySet) {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  const view = render(
    <VocabularyLesson
      set={set}
      onBack={vi.fn()}
      onFinish={onFinish}
      onSaveAttempt={onSaveAttempt}
    />,
  );

  return { user, onSaveAttempt, onFinish, view };
}

async function respond(user: User, question: VocabQuestion, correct: boolean) {
  if (question.kind === "typed") {
    await user.type(
      screen.getByLabelText("Your answer"),
      `${correct ? question.answer : "zzz"}{Enter}`,
    );
    return;
  }

  await click(
    user,
    correct ? question.answer : question.options.find((o) => o !== question.answer)!,
  );
}

async function learnBatch(user: User, index: number) {
  const words = week3VocabularySet.batches[index].itemIds.length;

  await click(user, "Start batch");
  for (let i = 0; i < words - 1; i += 1) await click(user, "Next word");
  await click(user, "Quick check");
}

async function checkBatch(user: User, index: number, last: boolean) {
  const checks = buildBatchCheck(week3VocabularySet.batches[index]);

  for (const [i, question] of checks.entries()) {
    await respond(user, question, true);
    await click(
      user,
      i === checks.length - 1 ? (last ? "Start final quiz" : "Next batch") : "Next question",
    );
  }
}

/** Walks every batch (learn + check) to arrive at the final quiz. */
async function reachQuiz(user: User) {
  await click(user, "Begin lesson");
  const count = week3VocabularySet.batches.length;

  for (let index = 0; index < count; index += 1) {
    await learnBatch(user, index);
    await checkBatch(user, index, index === count - 1);
  }
}

async function playQuiz(user: User, correctFor: (index: number) => boolean) {
  const quiz = buildFinalQuiz(1, week3VocabularySet);

  for (const [index, question] of quiz.entries()) {
    await respond(user, question, correctFor(index));
    await click(user, index === quiz.length - 1 ? "See results" : "Next question");
  }

  return quiz;
}

beforeEach(() => {
  vi.mocked(trackAnswer).mockClear();
  window.localStorage.clear();
});

describe("vocab-003 lesson", () => {
  it("opens with the Week 3 title, counts and the article reminder", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: "School, home and everyday objects" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Week 3 · Vocabulary")).toBeInTheDocument();
    expect(screen.getByText(String(week3VocabularySet.items.length))).toBeInTheDocument();
    expect(screen.getByText("20 Qs")).toBeInTheDocument();
    expect(screen.getByText(/Score at least 16\/20/)).toBeInTheDocument();
    expect(
      screen.getByText(/Learn German nouns together with their articles/),
    ).toBeInTheDocument();
  });

  it("shows each noun with article, meaning, plural, example and audio", async () => {
    const { user } = setup();

    await click(user, "Begin lesson");
    expect(screen.getByText(`Batch 1 of ${week3VocabularySet.batches.length}`)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "School objects" })).toBeInTheDocument();

    await click(user, "Start batch");

    expect(screen.getByRole("heading", { name: "der Stift" })).toBeInTheDocument();
    expect(screen.getByText("pen")).toBeInTheDocument();
    expect(screen.getByText("Plural: die Stifte")).toBeInTheDocument();
    expect(screen.getByText("Der Stift ist neu.")).toBeInTheDocument();
    expect(screen.getByText("The pen is new.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play der Stift" })).toBeEnabled();
    expect(
      screen.getByText(/The article is part of the word you need to remember/),
    ).toBeInTheDocument();
  });

  it("shows irregular plurals and a no-plural note for mass nouns", async () => {
    const { user } = setup();
    const foodIndex = week3VocabularySet.batches.findIndex((b) => b.id === "w3-drinks");
    expect(foodIndex).toBeGreaterThan(0);

    await click(user, "Begin lesson");
    for (let index = 0; index < foodIndex; index += 1) {
      await learnBatch(user, index);
      await checkBatch(user, index, false);
    }

    await click(user, "Start batch");

    expect(screen.getByRole("heading", { name: "die Milch" })).toBeInTheDocument();
    expect(screen.getByText(/Plural: none/)).toBeInTheDocument();
    expect(screen.getByText(/No ordinary plural/)).toBeInTheDocument();
    expect(screen.queryByText(/Plural: die /)).not.toBeInTheDocument();
  });

  it("runs a batch check with article and plural questions and advances", async () => {
    const { user } = setup();

    await click(user, "Begin lesson");
    await learnBatch(user, 0);
    expect(screen.getByText(/School objects · check/)).toBeInTheDocument();

    const checks = buildBatchCheck(week3VocabularySet.batches[0]);
    expect(checks.map((q) => q.kind)).toContain("article");
    expect(checks.map((q) => q.kind)).toContain("plural");

    await checkBatch(user, 0, false);

    expect(screen.getByText(`Batch 2 of ${week3VocabularySet.batches.length}`)).toBeInTheDocument();
    expect(trackAnswer).not.toHaveBeenCalled(); // correct checks never enter review
  });

  it("records a missed article check under the separate article concept", async () => {
    const { user } = setup();

    await click(user, "Begin lesson");
    await learnBatch(user, 0);

    const checks = buildBatchCheck(week3VocabularySet.batches[0]);

    for (const [i, question] of checks.entries()) {
      await respond(user, question, question.kind !== "article");
      await click(user, i === checks.length - 1 ? "Next batch" : "Next question");
    }

    const article = checks.find((q) => q.kind === "article")!;

    expect(trackAnswer).toHaveBeenCalledTimes(1);
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "vocabulary",
        sourceId: `${article.itemId}#article`,
        correct: false,
        expected: expect.stringMatching(/^(der|die|das) /),
      }),
    );
  });

  it("passes the final quiz with every answer correct and saves the attempt", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await reachQuiz(user);

    expect(screen.getByText(/Final quiz · 1 of 20/)).toBeInTheDocument();
    vi.mocked(trackAnswer).mockClear();

    const quiz = await playQuiz(user, () => true);

    expect(onSaveAttempt).toHaveBeenCalledWith(20, 20);
    expect(screen.getByText("20/20")).toBeInTheDocument();
    expect(screen.getByText("Nice work.")).toBeInTheDocument();

    // Every final answer enters review under its own concept.
    expect(trackAnswer).toHaveBeenCalledTimes(20);
    const sourceIds = vi.mocked(trackAnswer).mock.calls.map(([call]) => call.sourceId);
    expect(sourceIds).toEqual(quiz.map((q) => q.reviewId));
    expect(sourceIds.some((id) => id.endsWith("#article"))).toBe(true);
    expect(sourceIds.some((id) => id.endsWith("#plural"))).toBe(true);

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("passes at exactly 16/20 and fails at 15/20, with no completion on failure", async () => {
    const pass = setup();
    await reachQuiz(pass.user);
    await playQuiz(pass.user, (index) => index < 16);
    expect(pass.onSaveAttempt).toHaveBeenCalledWith(16, 20);
    expect(screen.getByText("Nice work.")).toBeInTheDocument();
    pass.view.unmount();

    const fail = setup();
    await reachQuiz(fail.user);
    await playQuiz(fail.user, (index) => index < 15);
    expect(fail.onSaveAttempt).toHaveBeenCalledWith(15, 20);
    expect(screen.getByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).not.toBeInTheDocument();
    expect(fail.onFinish).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retry quiz" })).toBeInTheDocument();
  });

  it("requires the article in the typed question", async () => {
    const { user } = setup();
    await reachQuiz(user);

    const quiz = buildFinalQuiz(1, week3VocabularySet);
    const typedIndex = quiz.findIndex((q) => q.kind === "typed");

    for (let index = 0; index < typedIndex; index += 1) {
      await respond(user, quiz[index], true);
      await click(user, "Next question");
    }

    const typed = quiz[typedIndex];
    const input = screen.getByLabelText("Your answer");
    await user.type(input, `${typed.answer.replace(/^(der|die|das) /, "")}{Enter}`);

    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
  });
});

describe("vocab-003 resumable progress", () => {
  it("remembers the batch and offers to resume after leaving", async () => {
    const first = setup();

    await click(first.user, "Begin lesson");
    await learnBatch(first.user, 0);
    await checkBatch(first.user, 0, false);
    expect(window.localStorage.getItem("deutschlab:vocab-resume:vocab-003")).toBe("1");
    first.view.unmount();

    const second = setup();
    expect(screen.getByRole("button", { name: "Resume at batch 2" })).toBeInTheDocument();

    await click(second.user, "Resume at batch 2");
    expect(
      screen.getByText(`Batch 2 of ${week3VocabularySet.batches.length}`),
    ).toBeInTheDocument();
  });

  it("offers no resume button for a fresh start", () => {
    setup();

    expect(screen.queryByRole("button", { name: /Resume at batch/ })).not.toBeInTheDocument();
  });

  it("ignores a corrupt saved position", () => {
    window.localStorage.setItem("deutschlab:vocab-resume:vocab-003", "999");
    setup();

    expect(screen.queryByRole("button", { name: /Resume at batch/ })).not.toBeInTheDocument();
  });

  it("clears the saved position once the lesson is finished", async () => {
    const { user } = setup();
    await reachQuiz(user);

    expect(window.localStorage.getItem("deutschlab:vocab-resume:vocab-003")).toBe(
      String(week3VocabularySet.batches.length - 1),
    );

    await playQuiz(user, () => true);
    await click(user, "Finish lesson");

    expect(window.localStorage.getItem("deutschlab:vocab-resume:vocab-003")).toBeNull();
  });

  it("does not affect Week 2 vocabulary, which is not resumable", async () => {
    window.localStorage.setItem("deutschlab:vocab-resume:vocab-002", "3");
    const { week2VocabularySet } = await import("../data/lessons/vocabularySets");
    setup(week2VocabularySet);

    expect(screen.queryByRole("button", { name: /Resume at batch/ })).not.toBeInTheDocument();
  });
});

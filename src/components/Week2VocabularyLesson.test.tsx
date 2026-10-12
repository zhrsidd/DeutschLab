import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import {
  week2VocabularySet,
  type VocabularySet,
} from "../data/lessons/vocabularySets";
import { trackAnswer } from "../lib/db";
import { buildBatchCheck, buildFinalQuiz } from "../lib/vocabularyExercises";

import VocabularyLesson from "./VocabularyLesson";

type User = ReturnType<typeof userEvent.setup>;
type Question = { answer: string; options: string[] };

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

function setup(set: VocabularySet = week2VocabularySet) {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <VocabularyLesson
      set={set}
      onBack={vi.fn()}
      onFinish={onFinish}
      onSaveAttempt={onSaveAttempt}
    />,
  );

  return { user, onSaveAttempt, onFinish };
}

async function answer(user: User, question: Question, correct: boolean) {
  await click(
    user,
    correct ? question.answer : question.options.find((o) => o !== question.answer)!,
  );
}

/** A short vocab-002 variant: first batch only, five family questions, one typed. */
const miniSet: VocabularySet = {
  ...week2VocabularySet,
  batches: [week2VocabularySet.batches[0]],
  finalQuota: [["family", 5]],
  typedCategories: ["family"],
};

async function learnFirstBatch(user: User, set: VocabularySet) {
  await click(user, "Begin lesson");
  await click(user, "Start batch");

  const words = set.batches[0].itemIds.length;

  for (let i = 0; i < words - 1; i += 1) await click(user, "Next word");
  await click(user, "Quick check");
}

async function reachQuiz(user: User) {
  await learnFirstBatch(user, miniSet);

  const checks = buildBatchCheck(miniSet.batches[0]);

  for (const [index, question] of checks.entries()) {
    await answer(user, question, true);
    await click(user, index === checks.length - 1 ? "Start final quiz" : "Next question");
  }
}

describe("vocab-002 lesson", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("opens as Week 2 vocabulary with its word and batch counts", () => {
    setup();

    expect(screen.getByRole("heading", { name: "Week 2 vocabulary" })).toBeInTheDocument();
    expect(screen.getByText("Week 2 · Vocabulary")).toBeInTheDocument();
    expect(screen.getByText(String(week2VocabularySet.items.length))).toBeInTheDocument();
    expect(screen.getByText(String(week2VocabularySet.batches.length))).toBeInTheDocument();
    expect(screen.getByText(/family, daily activities, places/)).toBeInTheDocument();
  });

  it("shows the first batch with article, plural and a Play button", async () => {
    const { user } = setup();

    await click(user, "Begin lesson");

    expect(screen.getByText(`Batch 1 of ${week2VocabularySet.batches.length}`)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Close family" })).toBeInTheDocument();

    await click(user, "Start batch");

    expect(screen.getByRole("heading", { name: "die Familie" })).toBeInTheDocument();
    expect(screen.getByText("family")).toBeInTheDocument();
    expect(screen.getByText("Plural: die Familien")).toBeInTheDocument();
    expect(screen.getByText("Die Familie ist groß.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play die Familie" })).toBeEnabled();
  });

  it("walks a whole batch, checks it, and moves on to the next batch", async () => {
    const { user } = setup();

    await learnFirstBatch(user, week2VocabularySet);

    expect(screen.getByText(/Close family · check/)).toBeInTheDocument();

    const checks = buildBatchCheck(week2VocabularySet.batches[0]);

    for (const [index, question] of checks.entries()) {
      await answer(user, question, true);
      await click(user, index === checks.length - 1 ? "Next batch" : "Next question");
    }

    expect(screen.getByText(`Batch 2 of ${week2VocabularySet.batches.length}`)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Extended family and friends" })).toBeInTheDocument();
  });

  it("passes the final quiz with every answer correct", async () => {
    const { user, onSaveAttempt, onFinish } = setup(miniSet);
    await reachQuiz(user);

    const quiz = buildFinalQuiz(1, miniSet);
    expect(quiz).toHaveLength(5);

    for (const [index, question] of quiz.entries()) {
      if (question.kind === "typed") {
        await user.type(screen.getByLabelText("Your answer"), `${question.answer}{Enter}`);
      } else {
        await answer(user, question, true);
      }

      await click(user, index === quiz.length - 1 ? "See results" : "Next question");
    }

    expect(onSaveAttempt).toHaveBeenCalledWith(5, 5);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails below 80% and offers a retry instead of Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup(miniSet);
    await reachQuiz(user);

    // Miss 2 of 5 (60%) by answering the first two choice questions wrongly.
    let missed = 0;

    for (const [index, question] of buildFinalQuiz(1, miniSet).entries()) {
      if (question.kind === "typed") {
        await user.type(screen.getByLabelText("Your answer"), `${question.answer}{Enter}`);
      } else {
        await answer(user, question, missed >= 2);
        if (missed < 2) missed += 1;
      }

      await click(user, index === 4 ? "See results" : "Next question");
    }

    expect(onSaveAttempt).toHaveBeenCalledWith(3, 5);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(screen.getByRole("button", { name: /Retry quiz/ })).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("accepts a typed noun without its article and shows the preferred form", async () => {
    const { user } = setup(miniSet);
    await reachQuiz(user);

    const quiz = buildFinalQuiz(1, miniSet);

    for (const question of quiz.slice(0, 4)) {
      await answer(user, question, true);
      await click(user, "Next question");
    }

    const typed = quiz[4];
    expect(typed.kind).toBe("typed");

    const bare = typed.answer.replace(/^(der|die|das)\s+/, "").toLowerCase();
    await user.type(screen.getByLabelText("Your answer"), `${bare}{Enter}`);

    expect(await screen.findByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(`Preferred spelling: ${typed.answer}`)).toBeInTheDocument();
  });

  it("rejects a typed answer with the wrong article", async () => {
    const { user } = setup(miniSet);
    await reachQuiz(user);

    const quiz = buildFinalQuiz(1, miniSet);

    for (const question of quiz.slice(0, 4)) {
      await answer(user, question, true);
      await click(user, "Next question");
    }

    const typed = quiz[4];
    const wrongArticle = typed.answer.replace(/^(der|die|das)/, (a) => (a === "der" ? "die" : "der"));
    await user.type(screen.getByLabelText("Your answer"), `${wrongArticle}{Enter}`);

    expect(await screen.findByText("Not quite.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ correct: false, sourceType: "vocabulary" }),
    );
  });

  it("records a missed batch-check word for review but not a correct one", async () => {
    const { user } = setup();
    await learnFirstBatch(user, week2VocabularySet);

    const checks = buildBatchCheck(week2VocabularySet.batches[0]);

    await answer(user, checks[0], true);
    expect(trackAnswer).not.toHaveBeenCalled();

    await click(user, "Next question");
    await answer(user, checks[1], false);

    expect(trackAnswer).toHaveBeenCalledTimes(1);
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: checks[1].itemId, correct: false }),
    );
  });
});

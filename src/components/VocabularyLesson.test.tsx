import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A tiny curriculum: one batch of three greetings.
vi.mock("../data/lessons/week1Vocabulary", () => {
  const item = (id: string, german: string, english: string) => ({
    id,
    german,
    english,
    category: "greetings",
    exampleGerman: `${german}!`,
    exampleEnglish: `${english}!`,
  });

  return {
    categoryLabels: { greetings: "Greetings" },
    week1Vocabulary: [
      item("hallo", "Hallo", "Hello"),
      item("danke", "Danke", "Thank you"),
      item("ja", "Ja", "Yes"),
    ],
    vocabularyBatches: [
      {
        id: "greetings",
        title: "Greetings",
        intro: "Say hello.",
        itemIds: ["hallo", "danke", "ja"],
      },
    ],
  };
});

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import { trackAnswer } from "../lib/db";
import { buildBatchCheck, buildFinalQuiz } from "../lib/vocabularyExercises";
import { vocabularyBatches } from "../data/lessons/week1Vocabulary";

import VocabularyLesson from "./VocabularyLesson";

function setup() {
  const onBack = vi.fn();
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <VocabularyLesson
      onBack={onBack}
      onFinish={onFinish}
      onSaveAttempt={onSaveAttempt}
    />,
  );

  return { user, onBack, onFinish, onSaveAttempt };
}

type Question = { answer: string; options: string[] };

const click = (user: ReturnType<typeof userEvent.setup>, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

async function answer(
  user: ReturnType<typeof userEvent.setup>,
  question: Question,
  correct: boolean,
) {
  const choice = correct
    ? question.answer
    : question.options.find((option) => option !== question.answer)!;

  await click(user, choice);
}

/** Intro → batch → learn cards → batch check, ending on the first quiz question. */
async function reachQuiz(user: ReturnType<typeof userEvent.setup>) {
  await click(user, "Begin lesson");

  expect(screen.getByText("Batch 1 of 1")).toBeInTheDocument();
  await click(user, "Start batch");

  // Learn cards: three words, then the quick check.
  expect(screen.getByText("Hallo")).toBeInTheDocument();
  await click(user, "Next word");
  await click(user, "Next word");
  await click(user, "Quick check");

  const checks = buildBatchCheck(vocabularyBatches[0]);

  for (const [index, question] of checks.entries()) {
    await answer(user, question, true);
    await click(user, index === checks.length - 1 ? "Start final quiz" : "Next question");
  }
}

describe("VocabularyLesson", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("shows the intro with the pass goal", () => {
    setup();

    expect(screen.getByText("Week 1 vocabulary")).toBeInTheDocument();
    expect(screen.getByText(/Score at least 3\/3/)).toBeInTheDocument();
  });

  it("walks through a batch and passes with all answers correct", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    await reachQuiz(user);

    const quiz = buildFinalQuiz(1);
    expect(quiz).toHaveLength(3);

    for (const [index, question] of quiz.entries()) {
      expect(screen.getByText(`Final quiz · ${index + 1} of 3`)).toBeInTheDocument();
      await answer(user, question, true);
      await click(user, index === quiz.length - 1 ? "See results" : "Next question");
    }

    expect(onSaveAttempt).toHaveBeenCalledWith(3, 3);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails below the 80% threshold and offers a retry instead of Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    await reachQuiz(user);

    const quiz = buildFinalQuiz(1);

    // 2 of 3 is 67%: below the pass mark.
    for (const [index, question] of quiz.entries()) {
      await answer(user, question, index !== 0);
      await click(user, index === quiz.length - 1 ? "See results" : "Next question");
    }

    expect(onSaveAttempt).toHaveBeenCalledWith(2, 3);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(screen.getByRole("button", { name: /Retry quiz/ })).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("retry starts a fresh quiz from question 1", async () => {
    const { user } = setup();

    await reachQuiz(user);

    for (const [index, question] of buildFinalQuiz(1).entries()) {
      await answer(user, question, false);
      await click(user, index === 2 ? "See results" : "Next question");
    }

    await user.click(await screen.findByRole("button", { name: /Retry quiz/ }));

    expect(screen.getByText("Final quiz · 1 of 3")).toBeInTheDocument();
  });

  it("records missed answers for review, but not correct batch checks", async () => {
    const { user } = setup();

    await click(user, "Begin lesson");
    await click(user, "Start batch");
    await click(user, "Next word");
    await click(user, "Next word");
    await click(user, "Quick check");

    const checks = buildBatchCheck(vocabularyBatches[0]);

    await answer(user, checks[0], true);
    expect(trackAnswer).not.toHaveBeenCalled();

    await click(user, "Next question");
    await answer(user, checks[1], false);

    expect(trackAnswer).toHaveBeenCalledTimes(1);
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ correct: false, sourceType: "vocabulary" }),
    );
  });

  it("lets the learner go back", async () => {
    const { user, onBack } = setup();

    await click(user, /Back to today/);

    expect(onBack).toHaveBeenCalled();
  });
});

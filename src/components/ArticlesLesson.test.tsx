import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import { week3ArticlesQuiz } from "../data/lessons/week3Articles";
import { trackAnswer } from "../lib/db";

import ArticlesLesson from "./ArticlesLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <ArticlesLesson onBack={vi.fn()} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />,
  );

  return { user, onSaveAttempt, onFinish };
}

async function startPractice(user: User) {
  await click(user, "Begin lesson");
  for (let i = 0; i < 4; i += 1) await click(user, "Continue");
  await click(user, "Start practice");
}

async function respond(user: User, question: CourseQuestion, correct: boolean) {
  if (question.kind === "choice") {
    await click(
      user,
      correct ? question.answer : question.options.find((o) => o !== question.answer)!,
    );
  } else if (question.kind === "reorder") {
    throw new Error("grammar-006 has no reorder questions");
  } else {
    await user.type(
      screen.getByLabelText("Your answer"),
      `${correct ? question.accepted[0] : "zzz"}{Enter}`,
    );
  }
}

async function playThrough(user: User, correctFor: (index: number) => boolean) {
  for (const [index, question] of week3ArticlesQuiz.entries()) {
    await respond(user, question, correctFor(index));
    await click(user, index === week3ArticlesQuiz.length - 1 ? "See results" : "Next question");
  }
}

describe("articles lesson (grammar-006)", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("opens as Week 3 grammar and walks the five teaching steps", async () => {
    const { user } = setup();

    expect(
      screen.getByRole("heading", { name: "Nouns, articles and plurals" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Week 3 · Grammar")).toBeInTheDocument();
    expect(screen.getByText("16 Qs")).toBeInTheDocument();
    expect(screen.getByText("13/16")).toBeInTheDocument();

    await click(user, "Begin lesson");
    expect(screen.getByRole("heading", { name: "Every noun has a gender" })).toBeInTheDocument();
    expect(screen.getByText("der Tisch")).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByRole("heading", { name: "der, die, das = the" })).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByRole("heading", { name: "ein and eine = a / an" })).toBeInTheDocument();
    expect(screen.getByText("Das ist eine Lampe.")).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByRole("heading", { name: "The nominative: the subject" })).toBeInTheDocument();
    expect(screen.getByText("Der Lehrer ist hier.")).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByRole("heading", { name: "Plurals" })).toBeInTheDocument();
    expect(screen.getByText("die Bücher")).toBeInTheDocument();
  });

  it("accepts a correct choice and records it", async () => {
    const { user } = setup();
    await startPractice(user);

    // First question: grammatical gender of die Lampe.
    await click(user, "feminine");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "grammar", sourceId: "art-c-gender-lampe", correct: true }),
    );
  });

  it("rejects a wrong article and records a mistake", async () => {
    const { user } = setup();
    await startPractice(user);

    await click(user, "masculine");

    expect(screen.queryByText("Correct.")).not.toBeInTheDocument();
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: "art-c-gender-lampe", correct: false }),
    );
  });

  it("grades typed answers on Enter, requiring the correct article", async () => {
    const { user } = setup();
    await startPractice(user);

    const stuhlIndex = week3ArticlesQuiz.findIndex((q) => q.id === "art-t-stuhl");

    for (let index = 0; index < stuhlIndex; index += 1) {
      await respond(user, week3ArticlesQuiz[index], true);
      await click(user, "Next question");
    }

    await user.type(screen.getByLabelText("Your answer"), "die Stuhl{Enter}");
    expect(screen.queryByText("Correct.")).not.toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceId: "art-t-stuhl", correct: false }),
    );
  });

  it("passes at 16/16, saves the attempt and completes only after Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await startPractice(user);
    await playThrough(user, () => true);

    expect(onSaveAttempt).toHaveBeenCalledWith(16, 16);
    expect(onFinish).not.toHaveBeenCalled();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("passes at exactly 13/16", async () => {
    const { user, onSaveAttempt } = setup();
    await startPractice(user);
    await playThrough(user, (index) => index < 13);

    expect(onSaveAttempt).toHaveBeenCalledWith(13, 16);
    expect(screen.getByRole("button", { name: "Finish lesson" })).toBeInTheDocument();
  });

  it("fails at 12/16 with a retry and no completion", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await startPractice(user);
    await playThrough(user, (index) => index < 12);

    expect(onSaveAttempt).toHaveBeenCalledWith(12, 16);
    expect(screen.queryByRole("button", { name: "Finish lesson" })).not.toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Try again|Retry/ })).toBeInTheDocument();
  });
});

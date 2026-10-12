import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import { week2HabenQuiz } from "../data/lessons/week2Haben";
import { trackAnswer } from "../lib/db";

import HabenLesson from "./HabenLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <HabenLesson onBack={vi.fn()} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />,
  );

  return { user, onSaveAttempt, onFinish };
}

async function startPractice(user: User) {
  await click(user, "Begin lesson");
  await click(user, "Continue");
  await click(user, "Continue");
  await click(user, "Start practice");
}

async function respond(user: User, question: CourseQuestion, correct: boolean) {
  if (question.kind === "choice") {
    await click(
      user,
      correct ? question.answer : question.options.find((o) => o !== question.answer)!,
    );
  } else if (question.kind === "reorder") {
    throw new Error("haben has no reorder questions");
  } else {
    await user.type(
      screen.getByLabelText("Your answer"),
      `${correct ? question.accepted[0] : "zzz"}{Enter}`,
    );
  }
}

async function playThrough(user: User, correctFor: (index: number) => boolean) {
  for (const [index, question] of week2HabenQuiz.entries()) {
    await respond(user, question, correctFor(index));
    await click(user, index === week2HabenQuiz.length - 1 ? "See results" : "Next question");
  }
}

describe("haben lesson (grammar-004)", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("opens as Week 2 grammar with its three teaching steps", async () => {
    const { user } = setup();

    expect(screen.getByRole("heading", { name: "haben" })).toBeInTheDocument();
    expect(screen.getByText("Week 2 · Grammar")).toBeInTheDocument();

    await click(user, "Begin lesson");
    expect(screen.getByRole("heading", { name: "haben = to have" })).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByRole("heading", { name: "haben in the present tense" })).toBeInTheDocument();
    expect(screen.getByText("hast")).toBeInTheDocument();
    expect(screen.getByText(/du hast and er\/sie\/es hat are irregular/)).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByText("Ich habe einen Bruder.")).toBeInTheDocument();
  });

  it("accepts the correct choice and records it", async () => {
    const { user } = setup();
    await startPractice(user);

    // First question: Er ___ Physik.
    await click(user, "hat");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceId: "hb-c-er", correct: true, sourceType: "grammar" }),
    );
  });

  it("rejects the wrong choice, then shows the answer", async () => {
    const { user } = setup();
    await startPractice(user);

    await click(user, "hast");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/)).toHaveTextContent("hat");
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceId: "hb-c-er", correct: false }),
    );
  });

  it("submits a typed answer with Enter (correct) and rejects 'habe' for du (wrong)", async () => {
    const { user } = setup();
    await startPractice(user);

    // Skip the four choice questions.
    for (const q of week2HabenQuiz.slice(0, 4)) {
      if (q.kind !== "choice") throw new Error("expected choice");
      await click(user, q.answer);
      await click(user, "Next question");
    }

    // Ich ___ Zeit. (haben)
    expect(screen.getByLabelText("Your answer")).toHaveFocus();
    await user.type(screen.getByLabelText("Your answer"), "habe{Enter}");
    expect(screen.getByText("Correct.")).toBeInTheDocument();

    await click(user, "Next question");

    // Du ___ Physik. (haben)
    await user.type(screen.getByLabelText("Your answer"), "habe{Enter}");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/)).toHaveTextContent("hast");
  });

  it("passes with 12/12 and enables Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await startPractice(user);

    await playThrough(user, () => true);

    expect(onSaveAttempt).toHaveBeenCalledWith(12, 12);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("passes at exactly 10/12 (the 80% threshold)", async () => {
    const { user, onSaveAttempt } = setup();
    await startPractice(user);

    await playThrough(user, (index) => index >= 2);

    expect(onSaveAttempt).toHaveBeenCalledWith(10, 12);
    expect(await screen.findByRole("button", { name: "Finish lesson" })).toBeInTheDocument();
  });

  it("fails at 9/12 and offers a retry instead of Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await startPractice(user);

    await playThrough(user, (index) => index >= 3);

    expect(onSaveAttempt).toHaveBeenCalledWith(9, 12);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(screen.getByRole("button", { name: /Retry practice/ })).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });
});

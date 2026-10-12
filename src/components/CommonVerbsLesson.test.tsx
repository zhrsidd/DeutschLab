import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import { week2CommonVerbsQuiz } from "../data/lessons/week2CommonVerbs";
import { trackAnswer } from "../lib/db";

import CommonVerbsLesson from "./CommonVerbsLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <CommonVerbsLesson onBack={vi.fn()} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />,
  );

  return { user, onSaveAttempt, onFinish };
}

async function startPractice(user: User) {
  await click(user, "Begin lesson");
  await click(user, "Continue"); // regular pattern → stem-changing
  await click(user, "Continue"); // → conjugation examples
  await click(user, "Continue"); // → guided comparison
  await click(user, "Start practice");
}

async function tap(user: User, word: string) {
  const tile = screen
    .getAllByRole("button", { name: word })
    .find((button) => !(button as HTMLButtonElement).disabled)!;

  await user.click(tile);
}

async function respond(user: User, q: CourseQuestion, correct: boolean) {
  if (q.kind === "choice") {
    await click(user, correct ? q.answer : q.options.find((o) => o !== q.answer)!);
  } else if (q.kind === "reorder") {
    const order = correct ? q.accepted[0].replace(/[.?!]/g, "").split(" ") : [...q.words].reverse();

    for (const word of order) await tap(user, word);
    await click(user, "Check answer");
  } else {
    await user.type(
      screen.getByLabelText("Your answer"),
      `${correct ? q.accepted[0] : "zzz"}{Enter}`,
    );
  }
}

async function playThrough(user: User, correctFor: (index: number) => boolean) {
  for (const [index, q] of week2CommonVerbsQuiz.entries()) {
    await respond(user, q, correctFor(index));
    await click(user, index === week2CommonVerbsQuiz.length - 1 ? "See results" : "Next question");
  }
}

describe("grammar-005 lesson", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("opens with its four teaching steps", async () => {
    const { user } = setup();

    expect(screen.getByRole("heading", { name: "Common present-tense verbs" })).toBeInTheDocument();
    expect(screen.getByText("Week 2 · Grammar")).toBeInTheDocument();

    await click(user, "Begin lesson");
    expect(screen.getByRole("heading", { name: "The regular pattern, again" })).toBeInTheDocument();
    expect(screen.getByText("arbeitest")).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByRole("heading", { name: "Verbs that change their vowel" })).toBeInTheDocument();
    expect(screen.getByText("sprichst")).toBeInTheDocument();
    expect(screen.getByText("schläfst")).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByText("Ich spreche Deutsch.")).toBeInTheDocument();

    await click(user, "Continue");
    expect(screen.getByRole("heading", { name: "Guided comparison" })).toBeInTheDocument();
  });

  it("accepts a typed stem-changing form with Enter", async () => {
    const { user } = setup();
    await startPractice(user);

    // Four multiple-choice questions come first.
    for (const q of week2CommonVerbsQuiz.slice(0, 4)) {
      if (q.kind !== "choice") throw new Error("expected choice");
      await click(user, q.answer);
      await click(user, "Next question");
    }

    expect(screen.getByText("Du ___ Deutsch. (sprechen)")).toBeInTheDocument();
    expect(screen.getByLabelText("Your answer")).toHaveFocus();

    await user.type(screen.getByLabelText("Your answer"), "sprichst{Enter}");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceId: "cv-f-du-sprechen", correct: true }),
    );
  });

  it("rejects the regular form 'du sprechst' and shows the answer", async () => {
    const { user } = setup();
    await startPractice(user);

    for (const q of week2CommonVerbsQuiz.slice(0, 4)) {
      if (q.kind !== "choice") throw new Error("expected choice");
      await click(user, q.answer);
      await click(user, "Next question");
    }

    await user.type(screen.getByLabelText("Your answer"), "sprechst{Enter}");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/)).toHaveTextContent("sprichst");
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ correct: false, userAnswer: "sprechst", sourceType: "grammar" }),
    );
  });

  it("accepts ae for ä and shows the preferred spelling", async () => {
    const { user } = setup();
    await startPractice(user);

    for (const q of week2CommonVerbsQuiz.slice(0, 8)) {
      await respond(user, q, true);
      await click(user, "Next question");
    }

    expect(screen.getByText("Du ___ heute. (schlafen)")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your answer"), "schlaefst{Enter}");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText("Preferred spelling: schläfst")).toBeInTheDocument();
  });

  it("builds a sentence with the verb in position 2", async () => {
    const { user } = setup();
    await startPractice(user);

    for (const q of week2CommonVerbsQuiz.slice(0, 12)) {
      await respond(user, q, true);
      await click(user, "Next question");
    }

    for (const word of ["Heute", "gehe", "ich", "nach", "Hause"]) await tap(user, word);
    await click(user, "Check answer");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });

  it("passes at 12/14 and finishes", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await startPractice(user);

    await playThrough(user, (index) => index >= 2);

    expect(onSaveAttempt).toHaveBeenCalledWith(12, 14);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails at 11/14 and offers a retry instead of Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();
    await startPractice(user);

    await playThrough(user, (index) => index >= 3);

    expect(onSaveAttempt).toHaveBeenCalledWith(11, 14);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(onFinish).not.toHaveBeenCalled();
  });
});

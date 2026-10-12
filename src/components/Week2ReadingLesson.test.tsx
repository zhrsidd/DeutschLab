import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { ComprehensionQuestion } from "../data/lessons/week1Checkpoint";
import { readingPassages, readingQuestionsAll } from "../data/lessons/week2Reading";
import { trackAnswer } from "../lib/db";

import Week2ReadingLesson from "./Week2ReadingLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <Week2ReadingLesson onBack={vi.fn()} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />,
  );

  return { user, onSaveAttempt, onFinish };
}

async function answer(user: User, q: ComprehensionQuestion, correct: boolean) {
  if (q.kind === "mc") {
    await click(user, correct ? q.answer : q.options!.find((o) => o !== q.answer)!);
  } else {
    await user.type(screen.getByLabelText("Your answer"), `${correct ? q.answer : "zzz"}{Enter}`);
  }
}

async function playThrough(user: User, correctFor: (index: number) => boolean) {
  await click(user, "Begin lesson");

  let index = 0;

  for (const passage of readingPassages) {
    for (const [i, q] of passage.questions.entries()) {
      await answer(user, q, correctFor(index));
      await click(user, i === passage.questions.length - 1 ? "Finish section" : "Next question");
      index += 1;
    }
  }
}

describe("reading-001 lesson", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("opens with 8 questions across two texts and a 7/8 target", () => {
    setup();

    expect(screen.getByRole("heading", { name: "Week 2 reading" })).toBeInTheDocument();
    expect(screen.getByText("Week 2 · Reading")).toBeInTheDocument();
    expect(screen.getByText("7/8")).toBeInTheDocument();
  });

  it("shows the passage with its questions, one at a time", async () => {
    const { user } = setup();

    await click(user, "Begin lesson");

    expect(screen.getByText(/Hallo! Ich heiße Mona/)).toBeInTheDocument();
    expect(screen.getByText("What is Mona's mother's job?")).toBeInTheDocument();
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
  });

  it("gives correct-answer feedback with evidence from the text", async () => {
    const { user } = setup();
    await click(user, "Begin lesson");

    await click(user, "Teacher");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    // The line appears in the passage and again as evidence in the feedback.
    expect(screen.getAllByText(/Die Mutter ist Lehrerin/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/“Die Mutter ist Lehrerin\.”/)).toBeInTheDocument();
  });

  it("gives wrong-answer feedback with the correct answer and evidence", async () => {
    const { user } = setup();
    await click(user, "Begin lesson");

    await click(user, "Doctor");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Answer:/)).toHaveTextContent("Teacher");
    expect(screen.getByText(/“Die Mutter ist Lehrerin\.”/)).toBeInTheDocument();
  });

  it("grades a short English answer by keyword", async () => {
    const { user } = setup();
    await click(user, "Begin lesson");

    await click(user, "Teacher");
    await click(user, "Next question");
    await click(user, "True");
    await click(user, "Next question");

    expect(screen.getByText(/Where do Mona's grandparents live/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your answer"), "in India{Enter}");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });

  it("rejects a wrong short English answer", async () => {
    const { user } = setup();
    await click(user, "Begin lesson");

    await click(user, "Teacher");
    await click(user, "Next question");
    await click(user, "True");
    await click(user, "Next question");
    await user.type(screen.getByLabelText("Your answer"), "Doha{Enter}");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
  });

  it("grades a short German keyword answer", async () => {
    const { user } = setup();
    await click(user, "Begin lesson");

    for (const choice of ["Teacher", "True"]) {
      await click(user, choice);
      await click(user, "Next question");
    }

    await user.type(screen.getByLabelText("Your answer"), "India{Enter}");
    await click(user, "Next question");

    expect(screen.getByText(/Welches Fach ist interessant/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your answer"), "physik{Enter}");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });

  it("does not add generic comprehension facts to Review", async () => {
    const { user } = setup();
    await click(user, "Begin lesson");

    await click(user, "Doctor"); // rd-1: a plain fact about Mona's mother

    expect(trackAnswer).not.toHaveBeenCalled();
  });

  it("does add a missed reusable word to Review", async () => {
    const { user } = setup();
    await click(user, "Begin lesson");

    for (const choice of ["Teacher", "True"]) {
      await click(user, choice);
      await click(user, "Next question");
    }

    await user.type(screen.getByLabelText("Your answer"), "India{Enter}");
    await click(user, "Next question");
    await user.type(screen.getByLabelText("Your answer"), "Mathematik{Enter}");

    expect(trackAnswer).toHaveBeenCalledTimes(1);
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "vocabulary",
        sourceId: "physik",
        correct: false,
        prompt: 'What does "Physik" mean?',
      }),
    );
  });

  it("passes at 7/8 and finishes", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    await playThrough(user, (index) => index !== 0);

    expect(onSaveAttempt).toHaveBeenCalledWith(7, 8);
    expect(await screen.findByText("Nice work.")).toBeInTheDocument();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails at 6/8 and offers another try instead of Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    await playThrough(user, (index) => index > 1);

    expect(onSaveAttempt).toHaveBeenCalledWith(6, 8);
    expect(await screen.findByText("One more pass.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
    expect(screen.getByRole("button", { name: /Try again/ })).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("covers all eight reading questions", () => {
    expect(readingQuestionsAll).toHaveLength(8);
  });
});

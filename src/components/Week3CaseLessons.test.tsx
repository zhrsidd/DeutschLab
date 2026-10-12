import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import { accusativeCourse, week3AccusativeQuiz } from "../data/lessons/week3Accusative";
import { negationCourse, week3NegationQuiz } from "../data/lessons/week3Negation";
import { trackAnswer } from "../lib/db";

import AccusativeLesson from "./AccusativeLesson";
import NegationLesson from "./NegationLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

const cases = [
  {
    label: "grammar-007 (accusative)",
    Lesson: AccusativeLesson,
    course: accusativeCourse,
    quiz: week3AccusativeQuiz,
    title: "The accusative case",
    steps: 4,
    pass: 12,
    firstId: "acc-c-obj-buch",
    firstRight: "das Buch",
  },
  {
    label: "grammar-008 (nicht and kein)",
    Lesson: NegationLesson,
    course: negationCourse,
    quiz: week3NegationQuiz,
    title: "Negation — nicht and kein",
    steps: 4,
    pass: 12,
    firstId: "neg-c-zeit",
    firstRight: "keine",
  },
];

function setup(Lesson: (typeof cases)[number]["Lesson"]) {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(<Lesson onBack={vi.fn()} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />);

  return { user, onSaveAttempt, onFinish };
}

async function startPractice(user: User, steps: number) {
  await click(user, "Begin lesson");
  for (let i = 0; i < steps; i += 1) {
    await click(user, i === steps - 1 ? "Start practice" : "Continue");
  }
}

async function respond(user: User, question: CourseQuestion, correct: boolean) {
  if (question.kind === "choice") {
    await click(
      user,
      correct ? question.answer : question.options.find((o) => o !== question.answer)!,
    );
  } else if (question.kind === "reorder") {
    throw new Error("no reorder questions");
  } else {
    await user.type(
      screen.getByLabelText("Your answer"),
      `${correct ? question.accepted[0] : "zzz"}{Enter}`,
    );
  }
}

async function playThrough(
  user: User,
  quiz: CourseQuestion[],
  correctFor: (index: number) => boolean,
) {
  for (const [index, question] of quiz.entries()) {
    await respond(user, question, correctFor(index));
    await click(user, index === quiz.length - 1 ? "See results" : "Next question");
  }
}

beforeEach(() => {
  vi.mocked(trackAnswer).mockClear();
});

describe.each(cases)("$label", ({ Lesson, course, quiz, title, steps, pass, firstId, firstRight }) => {
  it("opens with its title, step count, question count and pass mark", () => {
    setup(Lesson);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText("Week 3 · Grammar")).toBeInTheDocument();
    expect(screen.getByText(`${quiz.length} Qs`)).toBeInTheDocument();
    expect(screen.getByText(`${pass}/${quiz.length}`)).toBeInTheDocument();
    expect(screen.getByText(`${course.pages.length} steps`)).toBeInTheDocument();
  });

  it("walks the teaching pages in order", async () => {
    const { user } = setup(Lesson);

    await click(user, "Begin lesson");
    for (const [index, page] of course.pages.entries()) {
      expect(screen.getByRole("heading", { name: page.heading })).toBeInTheDocument();
      if (index < course.pages.length - 1) await click(user, "Continue");
    }
    expect(course.pages).toHaveLength(steps);
  });

  it("accepts a correct answer and records it for Review", async () => {
    const { user } = setup(Lesson);
    await startPractice(user, steps);

    await click(user, firstRight);

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "grammar", sourceId: firstId, correct: true }),
    );
  });

  it("rejects a wrong answer, shows the explanation and records a mistake", async () => {
    const { user } = setup(Lesson);
    await startPractice(user, steps);

    const first = quiz[0];
    if (first.kind !== "choice") throw new Error("expected a choice question first");
    await click(user, first.options.find((o) => o !== first.answer)!);

    expect(screen.queryByText("Correct.")).not.toBeInTheDocument();
    expect(screen.getByText(first.explanation)).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: firstId, correct: false, expected: first.answer }),
    );
  });

  it("submits typed answers with Enter", async () => {
    const { user } = setup(Lesson);
    await startPractice(user, steps);

    const typedIndex = quiz.findIndex((q) => q.kind === "fill");
    for (let index = 0; index < typedIndex; index += 1) {
      await respond(user, quiz[index], true);
      await click(user, "Next question");
    }

    const fill = quiz[typedIndex];
    if (fill.kind !== "fill") throw new Error("expected fill");
    await user.type(screen.getByLabelText("Your answer"), `${fill.accepted[0]}{Enter}`);

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceId: fill.id, correct: true }),
    );
  });

  it("passes with a perfect score and completes only after Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup(Lesson);
    await startPractice(user, steps);
    await playThrough(user, quiz, () => true);

    expect(onSaveAttempt).toHaveBeenCalledWith(quiz.length, quiz.length);
    expect(onFinish).not.toHaveBeenCalled();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("passes at exactly the pass mark", async () => {
    const { user, onSaveAttempt } = setup(Lesson);
    await startPractice(user, steps);
    await playThrough(user, quiz, (index) => index < pass);

    expect(onSaveAttempt).toHaveBeenCalledWith(pass, quiz.length);
    expect(screen.getByRole("button", { name: "Finish lesson" })).toBeInTheDocument();
  });

  it("fails one point short, offers a retry and never completes", async () => {
    const { user, onSaveAttempt, onFinish } = setup(Lesson);
    await startPractice(user, steps);
    await playThrough(user, quiz, (index) => index < pass - 1);

    expect(onSaveAttempt).toHaveBeenCalledWith(pass - 1, quiz.length);
    expect(screen.queryByRole("button", { name: "Finish lesson" })).not.toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();

    const retry = screen.getByRole("button", { name: /Try again|Retry/ });
    await user.click(retry);

    // Retrying restarts practice at the first question with the score reset.
    expect(screen.getByText(new RegExp(`1 of ${quiz.length}|1 / ${quiz.length}`))).toBeInTheDocument();
  });
});

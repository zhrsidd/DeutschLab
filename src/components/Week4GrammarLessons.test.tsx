import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { CourseQuestion } from "../data/lessons/grammarCourseTypes";
import {
  irregularVerbsCourse,
  week4IrregularVerbsQuiz,
} from "../data/lessons/week4IrregularVerbs";
import { pronounsCourse, week4PronounsQuiz } from "../data/lessons/week4Pronouns";
import { trackAnswer } from "../lib/db";

import IrregularVerbsLesson from "./IrregularVerbsLesson";
import PronounsLesson from "./PronounsLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

const cases = [
  {
    label: "grammar-009 (accusative pronouns)",
    Lesson: PronounsLesson,
    course: pronounsCourse,
    quiz: week4PronounsQuiz,
    title: "Accusative pronouns",
    pass: 13,
  },
  {
    label: "grammar-010 (irregular verbs and the accusative)",
    Lesson: IrregularVerbsLesson,
    course: irregularVerbsCourse,
    quiz: week4IrregularVerbsQuiz,
    title: "Irregular verbs and the accusative",
    pass: 13,
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

const tilesOf = (sentence: string) => sentence.replace(/[.?!]$/, "").split(" ");

async function respond(user: User, question: CourseQuestion, correct: boolean) {
  if (question.kind === "choice") {
    await click(
      user,
      correct ? question.answer : question.options.find((o) => o !== question.answer)!,
    );
  } else if (question.kind === "reorder") {
    const words = tilesOf(question.accepted[0]);
    // A wrong answer: swap the verb and the word before it.
    const order = correct ? words : [words[1], words[0], ...words.slice(2)];
    for (const word of order) await click(user, word);
    await click(user, "Check answer");
  } else {
    await user.type(
      screen.getByLabelText("Your answer"),
      `${correct ? question.accepted[0] : "zzz"}{Enter}`,
    );
  }
}

async function playThrough(user: User, quiz: CourseQuestion[], correctFor: (index: number) => boolean) {
  for (const [index, question] of quiz.entries()) {
    await respond(user, question, correctFor(index));
    await click(user, index === quiz.length - 1 ? "See results" : "Next question");
  }
}

beforeEach(() => {
  vi.mocked(trackAnswer).mockClear();
});

describe.each(cases)("$label", ({ Lesson, course, quiz, title, pass }) => {
  const steps = course.pages.length;

  it("opens with its title, Week 4 label, question count and pass mark", () => {
    setup(Lesson);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText("Week 4 · Grammar")).toBeInTheDocument();
    expect(screen.getByText(`${quiz.length} Qs`)).toBeInTheDocument();
    expect(screen.getByText(`${pass}/${quiz.length}`)).toBeInTheDocument();
  });

  it("walks the teaching pages in order", async () => {
    const { user } = setup(Lesson);

    await click(user, "Begin lesson");
    for (const [index, page] of course.pages.entries()) {
      expect(screen.getByRole("heading", { name: page.heading })).toBeInTheDocument();
      if (index < steps - 1) await click(user, "Continue");
    }
  });

  it("records a wrong first answer with its concept for Review", async () => {
    const { user } = setup(Lesson);
    await startPractice(user, steps);

    await respond(user, quiz[0], false);

    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "grammar", sourceId: quiz[0].id, correct: false }),
    );
    expect(screen.getByText(quiz[0].explanation)).toBeInTheDocument();
  });

  it("passes at exactly the pass mark and completes only after Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup(Lesson);
    await startPractice(user, steps);
    await playThrough(user, quiz, (index) => index < pass);

    expect(onSaveAttempt).toHaveBeenCalledWith(pass, quiz.length);
    expect(onFinish).not.toHaveBeenCalled();

    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails one point short and never completes", async () => {
    const { user, onSaveAttempt, onFinish } = setup(Lesson);
    await startPractice(user, steps);
    await playThrough(user, quiz, (index) => index < pass - 1);

    expect(onSaveAttempt).toHaveBeenCalledWith(pass - 1, quiz.length);
    expect(screen.queryByRole("button", { name: "Finish lesson" })).not.toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });
});

describe("grammar-010 word order", () => {
  it("builds the V2 sentence from tiles and accepts it", async () => {
    const { user } = setup(IrregularVerbsLesson);
    await startPractice(user, irregularVerbsCourse.pages.length);

    const index = week4IrregularVerbsQuiz.findIndex((q) => q.id === "iv-r-heute-trifft");
    for (let i = 0; i < index; i += 1) {
      await respond(user, week4IrregularVerbsQuiz[i], true);
      await click(user, "Next question");
    }

    await respond(user, week4IrregularVerbsQuiz[index], true);
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceId: "iv-r-heute-trifft", correct: true }),
    );
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/db", () => ({ trackAnswer: vi.fn() }));

import type { CourseQuestion } from "../../data/lessons/grammarCourseTypes";
import { week1QuestionsQuiz } from "../../data/lessons/week1Questions";
import { week1RegularVerbsQuiz } from "../../data/lessons/week1RegularVerbs";
import { week2HabenQuiz } from "../../data/lessons/week2Haben";
import { trackAnswer } from "../../lib/db";

import CoursePractice from "./CoursePractice";

const find = (id: string): CourseQuestion =>
  [...week1RegularVerbsQuiz, ...week1QuestionsQuiz, ...week2HabenQuiz].find((q) => q.id === id)!;

function setup(id: string, props: { trackCorrect?: boolean } = {}) {
  const onAnswered = vi.fn();
  const user = userEvent.setup({ delay: null });

  render(
    <CoursePractice
      question={find(id)}
      isLast={false}
      onAnswered={onAnswered}
      onNext={vi.fn()}
      {...props}
    />,
  );

  return { user, onAnswered };
}

/** Clicks the enabled tile with this word (placed copies share the name). */
async function tap(user: ReturnType<typeof userEvent.setup>, word: string) {
  const tile = screen
    .getAllByRole("button", { name: word })
    .find((button) => !(button as HTMLButtonElement).disabled)!;

  await user.click(tile);
}

describe("CoursePractice", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("accepts the correct word order when building a sentence", async () => {
    const { user, onAnswered } = setup("rv-r-heute");

    for (const word of ["Heute", "lerne", "ich", "Deutsch"]) await tap(user, word);
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(onAnswered).toHaveBeenCalledWith(true);
  });

  it("rejects incorrect verb-second order", async () => {
    const { user, onAnswered } = setup("rv-r-heute");

    for (const word of ["Heute", "ich", "lerne", "Deutsch"]) await tap(user, word);
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(onAnswered).toHaveBeenCalledWith(false);
  });

  it("keeps Check disabled until every word is placed", async () => {
    const { user } = setup("rv-r-heute");

    await tap(user, "Heute");

    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
  });

  it("accepts a typed question and submits with Enter", async () => {
    const { user } = setup("qn-t-wo");

    await user.type(screen.getByLabelText("Your answer"), "wo wohnst du{Enter}");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });

  it("rejects a typed question with wrong order", async () => {
    const { user } = setup("qn-t-wo");

    await user.type(screen.getByLabelText("Your answer"), "Wo du wohnst?{Enter}");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText("Answer:", { exact: false })).toHaveTextContent(
      "Wo wohnst du?",
    );
  });

  it("shows the preferred spelling when ss is typed for ß", async () => {
    const { user } = setup("qn-t-name");

    await user.type(screen.getByLabelText("Your answer"), "wie heisst du{Enter}");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(/Preferred spelling: Wie heißt du\?/)).toBeInTheDocument();
  });

  it("tracks a wrong answer for review", async () => {
    const { user } = setup("qn-c-wo");

    await user.click(screen.getByRole("button", { name: "Wie wohnst du?" }));

    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: "qn-c-wo", correct: false }),
    );
  });

  it("does not add a correct answer to review when trackCorrect is false", async () => {
    const { user } = setup("qn-c-wo", { trackCorrect: false });

    await user.click(screen.getByRole("button", { name: "Wo wohnst du?" }));

    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, enterOnCorrect: false }),
    );
  });

  describe("haben questions", () => {
    it("accepts the right form with Enter", async () => {
      const { user, onAnswered } = setup("hb-f-du");

      await user.type(screen.getByLabelText("Your answer"), "hast{Enter}");

      expect(screen.getByText("Correct.")).toBeInTheDocument();
      expect(onAnswered).toHaveBeenCalledWith(true);
    });

    it("rejects du habe", async () => {
      const { user, onAnswered } = setup("hb-t-du-physik");

      await user.type(screen.getByLabelText("Your answer"), "Du habe Physik.{Enter}");

      expect(screen.getByText("Not quite.")).toBeInTheDocument();
      expect(onAnswered).toHaveBeenCalledWith(false);
    });

    it("accepts a translation regardless of case and punctuation", async () => {
      const { user } = setup("hb-e-wir");

      await user.type(screen.getByLabelText("Your answer"), "wir haben deutsch{Enter}");

      expect(screen.getByText("Correct.")).toBeInTheDocument();
    });
  });
});

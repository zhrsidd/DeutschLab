import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { findVocabularyItem } from "../../data/lessons/vocabularySets";
import { buildQuestion } from "../../lib/vocabularyExercises";

import RecallQuestion from "./RecallQuestion";

const speech = {
  available: false,
  checked: true,
  speak: vi.fn(),
  stop: vi.fn(),
};

/*
 * Regression for an intermittent failure in the lesson tests: the continue
 * button is disabled while the answer is being saved, so a click made before
 * the save settles is ignored. Tests must wait for it to be enabled.
 */
describe("RecallQuestion continue button", () => {
  const question = buildQuestion(findVocabularyItem("tisch")!, "de-en", "t");

  it("stays disabled until the answer has been saved, then continues", async () => {
    let finishSave!: () => void;
    const saving = new Promise<void>((resolve) => {
      finishSave = resolve;
    });
    const onNext = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <RecallQuestion
        question={question}
        speech={speech}
        continueLabel="Next question"
        onAnswered={() => saving}
        onNext={onNext}
      />,
    );

    const next = screen.getByRole("button", { name: "Next question" });
    expect(next).toBeDisabled();

    await user.click(screen.getByRole("button", { name: question.answer }));
    expect(next).toBeDisabled();

    // Clicking while the save is pending is ignored, not queued.
    await user.click(next);
    expect(onNext).not.toHaveBeenCalled();

    finishSave();
    await waitFor(() => expect(next).toBeEnabled());

    await user.click(next);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("enables continue after a synchronous save once the update settles", async () => {
    const onNext = vi.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <RecallQuestion
        question={question}
        speech={speech}
        continueLabel="Next question"
        onAnswered={() => undefined}
        onNext={onNext}
      />,
    );

    await user.click(screen.getByRole("button", { name: question.answer }));

    const next = screen.getByRole("button", { name: "Next question" });
    await waitFor(() => expect(next).toBeEnabled());
    await user.click(next);

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import { week1SeinQuiz } from "../data/lessons/week1Sein";
import { trackAnswer } from "../lib/db";

import GrammarLesson from "./GrammarLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

/** Teaching pages, then the five multiple-choice questions, ending on the first fill-in. */
async function reachFillIn(user: User) {
  await click(user, "Begin lesson");
  await click(user, "Continue");
  await click(user, "Continue");
  await click(user, "Start practice");

  for (const question of week1SeinQuiz.slice(0, 5)) {
    if (question.kind !== "choice") throw new Error("expected a choice question");

    await click(user, question.answer);
    await click(user, "Next question");
  }
}

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <GrammarLesson
      onBack={vi.fn()}
      onFinish={vi.fn().mockResolvedValue(undefined)}
      onSaveAttempt={onSaveAttempt}
    />,
  );

  return { user, onSaveAttempt };
}

describe("GrammarLesson (sein)", () => {
  beforeEach(() => {
    vi.mocked(trackAnswer).mockClear();
  });

  it("accepts a correct typed answer submitted with Enter", async () => {
    const { user } = setup();
    await reachFillIn(user);

    expect(screen.getByText("Ich ___ Schüler.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Your answer"), "bin{Enter}");

    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceId: "f-ich", correct: true }),
    );
  });

  it("rejects a wrong typed answer and then shows the expected form", async () => {
    const { user } = setup();
    await reachFillIn(user);

    expect(screen.queryByText(/Expected:/)).toBeNull();

    await user.type(screen.getByLabelText("Your answer"), "bist{Enter}");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/Expected:/)).toHaveTextContent("Expected: bin");
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ correct: false, userAnswer: "bist" }),
    );
  });

  it("does not submit an empty answer", async () => {
    const { user } = setup();
    await reachFillIn(user);

    await user.type(screen.getByLabelText("Your answer"), "{Enter}");

    expect(screen.queryByText("Correct.")).toBeNull();
    expect(screen.queryByText("Not quite.")).toBeNull();
  });

  it("autofocuses the text field when a typed exercise appears", async () => {
    const { user } = setup();
    await reachFillIn(user);

    expect(screen.getByLabelText("Your answer")).toHaveFocus();
  });
});

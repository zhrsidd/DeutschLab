import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Scores the stubbed sections will report.
const board = vi.hoisted(() => ({
  vocabulary: 8,
  grammar: 10,
  reading: 4,
  listening: 4,
  writing: 6,
  missedGrammar: [] as string[],
}));

vi.mock("./checkpoint/VocabularySection", () => ({
  default: ({ onComplete }: { onComplete: (score: number) => void }) =>
    createElement("button", { onClick: () => onComplete(board.vocabulary) }, "finish vocabulary"),
}));

vi.mock("./checkpoint/GrammarSection", () => ({
  default: ({ onComplete }: { onComplete: (score: number, missed: string[]) => void }) =>
    createElement(
      "button",
      { onClick: () => onComplete(board.grammar, board.missedGrammar) },
      "finish grammar",
    ),
}));

vi.mock("./checkpoint/ComprehensionSection", () => ({
  default: ({ passage, onComplete }: { passage?: string; onComplete: (score: number) => void }) =>
    createElement(
      "button",
      { onClick: () => onComplete(passage ? board.reading : board.listening) },
      passage ? "finish reading" : "finish listening",
    ),
}));

vi.mock("./checkpoint/WritingSection", () => ({
  default: ({ onComplete }: { onComplete: (score: number) => void }) =>
    createElement("button", { onClick: () => onComplete(board.writing) }, "finish writing"),
}));

import { week2CheckpointDefinition } from "../lib/checkpointDefinitions";
import { removeGermanVoices } from "../test/fakeSpeech";

import WeekCheckpoint from "./WeekCheckpoint";

type User = ReturnType<typeof userEvent.setup>;

/*
 * Waits for the button to be enabled first: answering saves asynchronously
 * and the continue button stays disabled until that settles, so a click
 * made too early is silently ignored.
 */
const click = async (user: User, name: string | RegExp) => {
  const button = screen.getByRole("button", { name });

  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
};

function setup(unfinishedLessons = 0) {
  const user = userEvent.setup({ delay: null });
  const onBack = vi.fn();
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onOpenTarget = vi.fn();

  render(
    <WeekCheckpoint
      definition={week2CheckpointDefinition}
      unfinishedLessons={unfinishedLessons}
      onBack={onBack}
      onFinish={onFinish}
      onSaveAttempt={onSaveAttempt}
      onOpenTarget={onOpenTarget}
    />,
  );

  return { user, onBack, onFinish, onSaveAttempt, onOpenTarget };
}

async function runThrough(user: User) {
  await click(user, "Begin checkpoint");
  await click(user, "finish vocabulary");
  await click(user, "finish grammar");
  await click(user, "finish reading");
  await click(user, "finish listening");
  await click(user, "finish writing");

  await screen.findByText(/Week 2 mastered|Review recommended/);
}

function setScores(partial: Partial<typeof board>) {
  Object.assign(board, {
    vocabulary: 8,
    grammar: 10,
    reading: 4,
    listening: 4,
    writing: 6,
    missedGrammar: [],
    ...partial,
  });
}

describe("checkpoint-002 (Week 2 Checkpoint)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setScores({});
  });

  it("introduces Week 2 with 5 sections, 32 marks and no speaking", () => {
    setup();

    expect(screen.getByRole("heading", { name: "Week 2 Checkpoint" })).toBeInTheDocument();
    expect(screen.getByText("Week 2 · Checkpoint")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText(/Speaking/)).toBeNull();
    expect(screen.getByText("Writing self-check")).toBeInTheDocument();
  });

  it("warns, without blocking, when Week 2 lessons are unfinished", async () => {
    const { user } = setup(3);

    expect(screen.getByText(/You still have unfinished Week 2 lessons/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Begin checkpoint" })).toBeEnabled();

    await click(user, "Begin checkpoint");
    expect(screen.getByText(/Section 1 of 5/)).toBeInTheDocument();
  });

  it("shows no warning when every Week 2 lesson is complete", () => {
    setup(0);

    expect(screen.queryByText(/unfinished Week 2 lessons/)).toBeNull();
  });

  it("passes at 26/32 and enables Finish checkpoint", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    setScores({ vocabulary: 6, grammar: 7, reading: 4, listening: 3, writing: 6 });
    await runThrough(user);

    expect(screen.getByText("Week 2 mastered")).toBeInTheDocument();
    expect(screen.getByText(/26 \/ 32 — 81%/)).toBeInTheDocument();
    expect(onSaveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ total: 26, possible: 32, passed: true }),
    );

    await click(user, "Finish checkpoint");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails when grammar is below 7/10 despite a high total, and shows no Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    setScores({ grammar: 6, missedGrammar: ["grammar-005"] });
    await runThrough(user);

    expect(screen.getByText("Review recommended")).toBeInTheDocument();
    expect(screen.getAllByText(/28 \/ 32/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Finish checkpoint" })).toBeNull();
    expect(onSaveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false, weakSections: ["grammar"] }),
    );
    expect(onFinish).not.toHaveBeenCalled();

    await click(user, "Review common verbs");
  });

  it.each([
    ["vocabulary", { vocabulary: 5 }],
    ["listening", { listening: 1 }],
    ["writing", { writing: 3 }],
  ])("fails when %s is below its minimum", async (_name, scores) => {
    const { user } = setup();

    setScores(scores);
    await runThrough(user);

    expect(screen.getByText("Review recommended")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish checkpoint" })).toBeNull();
  });

  it("links weak areas to Week 2 lessons and Review", async () => {
    const { user, onOpenTarget } = setup();

    setScores({ vocabulary: 4, writing: 2 });
    await runThrough(user);

    await click(user, "Review Week 2 vocabulary");
    expect(onOpenTarget).toHaveBeenLastCalledWith({ type: "lesson", taskId: "vocab-002" });

    await click(user, "Review your writing");
    expect(onOpenTarget).toHaveBeenLastCalledWith({ type: "lesson", taskId: "writing-001" });

    await click(user, "Open Review");
    expect(onOpenTarget).toHaveBeenLastCalledWith({ type: "review" });
  });

  it("retry saves another attempt instead of replacing the first", async () => {
    const { user, onSaveAttempt } = setup();

    setScores({ grammar: 5 });
    await runThrough(user);
    expect(onSaveAttempt).toHaveBeenCalledTimes(1);

    await click(user, /Retry checkpoint/);
    expect(screen.getByText(/Section 1 of 5/)).toBeInTheDocument();

    setScores({});
    await click(user, "finish vocabulary");
    await click(user, "finish grammar");
    await click(user, "finish reading");
    await click(user, "finish listening");
    await click(user, "finish writing");
    await screen.findByText("Week 2 mastered");

    expect(onSaveAttempt).toHaveBeenCalledTimes(2);
    expect(onSaveAttempt.mock.calls.map((call) => call[0].passed)).toEqual([false, true]);
  });

  it("does not silently award or fail listening when no German voice exists", async () => {
    removeGermanVoices();
    const { user, onSaveAttempt, onBack } = setup();

    await click(user, "Begin checkpoint");
    await click(user, "finish vocabulary");
    await click(user, "finish grammar");
    await click(user, "finish reading");

    expect(
      await screen.findByText(/Listening needs a German voice/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(onSaveAttempt).not.toHaveBeenCalled();

    await click(user, "Exit checkpoint");
    expect(onBack).toHaveBeenCalled();
  });

  it("finishes after the writing section (there is no speaking section)", async () => {
    const { user, onSaveAttempt } = setup();

    await click(user, "Begin checkpoint");
    await click(user, "finish vocabulary");
    await click(user, "finish grammar");
    await click(user, "finish reading");
    await click(user, "finish listening");

    expect(onSaveAttempt).not.toHaveBeenCalled();
    await click(user, "finish writing");

    await screen.findByText("Week 2 mastered");
    expect(onSaveAttempt).toHaveBeenCalledTimes(1);
  });
});

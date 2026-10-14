import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Scores the stubbed sections will report.
const board = vi.hoisted(() => ({
  vocabulary: 8,
  grammar: 12,
  reading: 4,
  listening: 4,
  writing: 6,
  speaking: 5,
  missedGrammar: [] as string[],
  speakingHeading: "",
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

vi.mock("./checkpoint/SpeakingSection", () => ({
  default: ({
    content,
    onComplete,
  }: {
    content?: { heading: string };
    onComplete: (score: number) => void;
  }) => {
    board.speakingHeading = content?.heading ?? "(default)";
    return createElement("button", { onClick: () => onComplete(board.speaking) }, "finish speaking");
  },
}));

import { week4CheckpointDefinition } from "../lib/checkpointDefinitions";

import WeekCheckpoint from "./WeekCheckpoint";

type User = ReturnType<typeof userEvent.setup>;

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
      definition={week4CheckpointDefinition}
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
  await click(user, "finish speaking");

  await screen.findByText(/Week 4 completed|Review recommended/);
}

function setScores(partial: Partial<typeof board>) {
  Object.assign(board, {
    vocabulary: 8,
    grammar: 12,
    reading: 4,
    listening: 4,
    writing: 6,
    speaking: 5,
    missedGrammar: [],
    ...partial,
  });
}

describe("checkpoint-004 (October Foundations Checkpoint)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setScores({});
  });

  it("introduces six sections, 39 marks and the 32/39 pass mark", () => {
    setup();

    expect(screen.getByRole("heading", { name: "October Foundations Checkpoint" })).toBeInTheDocument();
    expect(screen.getByText("Week 4 · Checkpoint")).toBeInTheDocument();
    expect(screen.getByText("39")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText(/80% overall \(32\/39\)/)).toBeInTheDocument();
    expect(screen.getByText("Speaking self-check")).toBeInTheDocument();
  });

  it("warns, without blocking, when Week 4 lessons are unfinished", async () => {
    const { user } = setup(2);

    expect(screen.getByText(/You still have unfinished Week 4 lessons/)).toBeInTheDocument();
    await click(user, "Begin checkpoint");
    expect(screen.getByText(/Section 1 of 6/)).toBeInTheDocument();
  });

  it("uses the Week 4 speaking task, not the Week 1 one", async () => {
    const { user } = setup();
    await runThrough(user);

    expect(board.speakingHeading).toBe("Introduce yourself and your daily life.");
  });

  it("passes at 32/39, shows October completion and finishes only on Finish", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    setScores({ vocabulary: 6, grammar: 9, reading: 4, listening: 4, writing: 6, speaking: 3 });
    await runThrough(user);

    expect(screen.getByText("Week 4 completed")).toBeInTheDocument();
    expect(screen.getByText(/October Foundations complete/)).toBeInTheDocument();
    expect(screen.getByText(/not a CEFR A1 certificate/)).toBeInTheDocument();
    expect(onSaveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ total: 32, possible: 39, passed: true }),
    );
    expect(onFinish).not.toHaveBeenCalled();

    await click(user, "Finish checkpoint");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("names the weakest section after a pass and links to its lesson", async () => {
    const { user, onOpenTarget } = setup();

    setScores({ speaking: 3 });
    await runThrough(user);

    expect(screen.getByText(/Your weakest section was Speaking self-check \(3\/5\)/)).toBeInTheDocument();
    await click(user, "Practise your spoken introduction");
    expect(onOpenTarget).toHaveBeenLastCalledWith({ type: "lesson", taskId: "speaking-002" });
  });

  it("fails at 31/39 even with every minimum met", async () => {
    const { user, onFinish } = setup();

    setScores({ vocabulary: 6, grammar: 9, reading: 3, listening: 4, writing: 6, speaking: 3 });
    await runThrough(user);

    expect(screen.getByText("Review recommended")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish checkpoint" })).toBeNull();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it.each([
    ["vocabulary", { vocabulary: 5 }, "Review Week 4 vocabulary", "vocab-004"],
    ["listening", { listening: 1 }, "Practise listening", "listening-004"],
    ["writing", { writing: 3 }, "Review your writing", "writing-003"],
    ["speaking", { speaking: 2 }, "Practise your spoken introduction", "speaking-002"],
  ])("fails when %s is below its minimum despite a high total", async (_name, scores, label, taskId) => {
    const { user, onOpenTarget } = setup();

    setScores(scores);
    await runThrough(user);

    expect(screen.getByText("Review recommended")).toBeInTheDocument();
    expect(screen.getByText(/a section is below its minimum/)).toBeInTheDocument();
    await click(user, label);
    expect(onOpenTarget).toHaveBeenLastCalledWith({ type: "lesson", taskId });
  });

  it("links missed grammar to the Week 4 grammar lessons", async () => {
    const { user, onOpenTarget } = setup();

    setScores({ grammar: 8, missedGrammar: ["grammar-009", "grammar-010"] });
    await runThrough(user);

    await click(user, "Review accusative pronouns");
    expect(onOpenTarget).toHaveBeenLastCalledWith({ type: "lesson", taskId: "grammar-009" });
    await click(user, "Review irregular verbs and the accusative");
    expect(onOpenTarget).toHaveBeenLastCalledWith({ type: "lesson", taskId: "grammar-010" });
  });

  it("retry saves another attempt instead of replacing the first", async () => {
    const { user, onSaveAttempt } = setup();

    setScores({ grammar: 5 });
    await runThrough(user);

    await click(user, /Retry checkpoint/);
    setScores({});
    await click(user, "finish vocabulary");
    await click(user, "finish grammar");
    await click(user, "finish reading");
    await click(user, "finish listening");
    await click(user, "finish writing");
    await click(user, "finish speaking");
    await screen.findByText("Week 4 completed");

    expect(onSaveAttempt.mock.calls.map((call) => call[0].passed)).toEqual([false, true]);
  });
});

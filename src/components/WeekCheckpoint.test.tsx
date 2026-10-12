import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Section scores the stubs will report; tests overwrite them per case.
const scoreBoard = vi.hoisted(() => ({
  vocabulary: 8,
  grammar: 8,
  reading: 4,
  listening: 4,
  writing: 5,
  speaking: 5,
  missedGrammar: [] as string[],
}));

vi.mock("./checkpoint/VocabularySection", () => ({
  default: ({ onComplete }: { onComplete: (score: number) => void }) =>
    createElement(
      "button",
      { onClick: () => onComplete(scoreBoard.vocabulary) },
      "finish vocabulary",
    ),
}));

vi.mock("./checkpoint/GrammarSection", () => ({
  default: ({
    onComplete,
  }: {
    onComplete: (score: number, missed: string[]) => void;
  }) =>
    createElement(
      "button",
      { onClick: () => onComplete(scoreBoard.grammar, scoreBoard.missedGrammar) },
      "finish grammar",
    ),
}));

// Reading (has a passage) and listening share this stub.
vi.mock("./checkpoint/ComprehensionSection", () => ({
  default: ({
    passage,
    onComplete,
  }: {
    passage?: string;
    onComplete: (score: number) => void;
  }) =>
    createElement(
      "button",
      {
        onClick: () =>
          onComplete(passage ? scoreBoard.reading : scoreBoard.listening),
      },
      passage ? "finish reading" : "finish listening",
    ),
}));

vi.mock("./checkpoint/WritingSection", () => ({
  default: ({ onComplete }: { onComplete: (score: number) => void }) =>
    createElement(
      "button",
      { onClick: () => onComplete(scoreBoard.writing) },
      "finish writing",
    ),
}));

vi.mock("./checkpoint/SpeakingSection", () => ({
  default: ({ onComplete }: { onComplete: (score: number) => void }) =>
    createElement(
      "button",
      { onClick: () => onComplete(scoreBoard.speaking) },
      "finish speaking",
    ),
}));

import { removeGermanVoices } from "../test/fakeSpeech";

import WeekCheckpoint from "./WeekCheckpoint";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup(unfinishedLessons = 0) {
  const user = userEvent.setup({ delay: null });
  const onBack = vi.fn();
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onOpenTarget = vi.fn();

  render(
    <WeekCheckpoint
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

  // Saving is async; wait for the results screen.
  await screen.findByText(/Week 1 mastered|Review recommended/);
}

function setScores(partial: Partial<typeof scoreBoard>) {
  Object.assign(scoreBoard, {
    vocabulary: 8,
    grammar: 8,
    reading: 4,
    listening: 4,
    writing: 5,
    speaking: 5,
    missedGrammar: [],
    ...partial,
  });
}

describe("WeekCheckpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setScores({});
  });

  it("warns, without blocking, when lessons are unfinished", async () => {
    const { user } = setup(3);

    expect(screen.getByText(/You still have unfinished Week 1 lessons/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Begin checkpoint" })).toBeEnabled();

    await click(user, "Begin checkpoint");
    expect(screen.getByText(/Section 1 of 6/)).toBeInTheDocument();
  });

  it("shows no warning when every lesson is complete", () => {
    setup(0);

    expect(screen.queryByText(/unfinished Week 1 lessons/)).toBeNull();
  });

  it("passes with strong scores and enables Finish checkpoint", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    setScores({ vocabulary: 7, grammar: 6, reading: 4, listening: 3, writing: 4, speaking: 4 });
    await runThrough(user);

    expect(screen.getByText("Week 1 mastered")).toBeInTheDocument();
    expect(screen.getByText(/28 \/ 34 — 82%/)).toBeInTheDocument();
    expect(onSaveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ total: 28, passed: true }),
    );

    await click(user, "Finish checkpoint");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("fails on a section minimum even with a high overall score", async () => {
    const { user, onSaveAttempt, onFinish } = setup();

    // 31/34 = 91%, but grammar 5/8 is below the 6/8 minimum.
    setScores({ grammar: 5, missedGrammar: ["grammar-003"] });
    await runThrough(user);

    expect(screen.getByText("Review recommended")).toBeInTheDocument();
    expect(screen.getByText(/91%/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish checkpoint" })).toBeNull();
    expect(screen.getByRole("button", { name: /Retry checkpoint/ })).toBeInTheDocument();
    expect(onSaveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ passed: false, weakSections: ["grammar"] }),
    );
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("fails when the overall score is under 80%", async () => {
    const { user } = setup();

    setScores({ vocabulary: 6, grammar: 6, reading: 2, listening: 2, writing: 3, speaking: 3 });
    await runThrough(user);

    expect(screen.getByText("Review recommended")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish checkpoint" })).toBeNull();
  });

  it("links a weak grammar area to the relevant lesson", async () => {
    const { user, onOpenTarget } = setup();

    setScores({ grammar: 4, missedGrammar: ["grammar-003"] });
    await runThrough(user);

    await click(user, "Review German questions");

    expect(onOpenTarget).toHaveBeenCalledWith({
      type: "lesson",
      taskId: "grammar-003",
    });
  });

  it("offers Review when the checkpoint is failed", async () => {
    const { user, onOpenTarget } = setup();

    setScores({ vocabulary: 4 });
    await runThrough(user);

    await click(user, "Open Review");

    expect(onOpenTarget).toHaveBeenCalledWith({ type: "review" });
  });

  it("retry starts a new attempt from the first section and saves each attempt", async () => {
    const { user, onSaveAttempt } = setup();

    setScores({ writing: 1 });
    await runThrough(user);
    expect(onSaveAttempt).toHaveBeenCalledTimes(1);

    await click(user, /Retry checkpoint/);
    expect(screen.getByText(/Section 1 of 6/)).toBeInTheDocument();

    setScores({});
    await click(user, "finish vocabulary");
    await click(user, "finish grammar");
    await click(user, "finish reading");
    await click(user, "finish listening");
    await click(user, "finish writing");
    await click(user, "finish speaking");
    await screen.findByText("Week 1 mastered");

    expect(onSaveAttempt).toHaveBeenCalledTimes(2);
    expect(onSaveAttempt.mock.calls[0][0].passed).toBe(false);
    expect(onSaveAttempt.mock.calls[1][0].passed).toBe(true);
  });

  it("does not silently award listening marks when no German voice exists", async () => {
    removeGermanVoices();
    const { user, onSaveAttempt, onBack } = setup();

    await click(user, "Begin checkpoint");
    await click(user, "finish vocabulary");
    await click(user, "finish grammar");
    await click(user, "finish reading");

    expect(
      await screen.findByText(/Listening needs a German voice/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "finish listening" })).toBeNull();
    expect(onSaveAttempt).not.toHaveBeenCalled();

    await click(user, "Exit checkpoint");
    expect(onBack).toHaveBeenCalled();
  });

  it("keeps the result visible if saving fails, with an error", async () => {
    const { user, onSaveAttempt } = setup();
    onSaveAttempt.mockRejectedValueOnce(new Error("disk full"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await click(user, "Begin checkpoint");
    await click(user, "finish vocabulary");
    await click(user, "finish grammar");
    await click(user, "finish reading");
    await click(user, "finish listening");
    await click(user, "finish writing");
    await click(user, "finish speaking");

    expect(await screen.findByText(/could not be saved/)).toBeInTheDocument();
  });
});

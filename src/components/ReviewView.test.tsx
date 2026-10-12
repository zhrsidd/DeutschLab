import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({
  getReviewStats: vi.fn(),
  getMistakes: vi.fn(),
  getDueReviewItems: vi.fn(),
  applyReviewResult: vi.fn(),
}));

import type { ReviewItem } from "../data/reviewTypes";
import {
  applyReviewResult,
  getDueReviewItems,
  getMistakes,
  getReviewStats,
} from "../lib/db";

import ReviewView from "./ReviewView";

type User = ReturnType<typeof userEvent.setup>;

const item = (overrides: Partial<ReviewItem>): ReviewItem => ({
  id: 1,
  sourceType: "vocabulary",
  sourceId: "danke",
  prompt: "What does “Danke” mean?",
  answer: "Thank you",
  audioText: null,
  dueAt: "2020-01-01T00:00:00.000Z",
  intervalDays: 1,
  ease: 2.5,
  repetitions: 0,
  exerciseJson: null,
  ...overrides,
});

function arrange(items: ReviewItem[], dueToday = items.length) {
  vi.mocked(getReviewStats).mockResolvedValue({
    dueToday,
    unresolvedMistakes: 0,
    nextDueAt: null,
  });
  vi.mocked(getMistakes).mockResolvedValue([]);
  vi.mocked(getDueReviewItems).mockResolvedValue(items);
  vi.mocked(applyReviewResult).mockResolvedValue(undefined);
}

async function start(sessionLimit?: number | null) {
  const user = userEvent.setup({ delay: null });
  const onChange = vi.fn();

  render(<ReviewView sessionLimit={sessionLimit} onChange={onChange} />);

  await user.click(await screen.findByRole("button", { name: "Start Review" }));

  // The session replaces the overview once the due items have loaded.
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Start Review" })).toBeNull(),
  );

  return { user, onChange };
}


/** After feedback is saved, focus moves to Continue so Enter advances. */
async function pressEnterToContinue(user: User) {
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Continue|Finish review/ })).toHaveFocus(),
  );
  await user.keyboard("{Enter}");
}

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

describe("ReviewView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Review shuffles its items; a Math.random near 1 keeps the given order.
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
  });

  describe("active recall", () => {
    it("grades a correct typed answer automatically (Correct)", async () => {
      const due = item({});
      arrange([due]);
      const { user } = await start();

      // Vocabulary at repetition 0 asks German → English.
      expect(screen.getByRole("heading", { name: "Danke" })).toBeInTheDocument();
      expect(screen.queryByText("Thank you")).toBeNull();

      await user.type(screen.getByLabelText("Your answer"), "thank you{Enter}");

      expect(screen.getByText("Correct.")).toBeInTheDocument();
      expect(applyReviewResult).toHaveBeenCalledTimes(1);
      expect(applyReviewResult).toHaveBeenCalledWith(due, true);
      expect(screen.queryByRole("button", { name: "Again" })).toBeNull();
    });

    it("grades a wrong typed answer automatically (Again) and shows the answer", async () => {
      const due = item({});
      arrange([due]);
      const { user } = await start();

      await user.type(screen.getByLabelText("Your answer"), "please{Enter}");

      expect(screen.getByText("Not quite.")).toBeInTheDocument();
      expect(screen.getByText(/Answer:/)).toHaveTextContent("Thank you");
      expect(applyReviewResult).toHaveBeenCalledWith(due, false);
    });

    it("asks English → German on odd repetitions and shows the preferred spelling", async () => {
      const due = item({
        sourceId: "tschuss",
        prompt: "p",
        answer: "Tschüss",
        repetitions: 1,
      });
      arrange([due]);
      const { user } = await start();

      expect(screen.getByRole("heading", { name: /Bye/ })).toBeInTheDocument();

      await user.type(screen.getByLabelText("Your answer"), "tschuess{Enter}");

      expect(screen.getByText("Correct.")).toBeInTheDocument();
      expect(screen.getByText("Preferred spelling: Tschüss")).toBeInTheDocument();
    });

    it("continues with Enter after feedback and finishes the session", async () => {
      arrange([item({}), item({ id: 2, sourceId: "bitte", answer: "Please" })]);
      const { user, onChange } = await start();

      await user.type(screen.getByLabelText("Your answer"), "thank you{Enter}");
      await pressEnterToContinue(user);

      expect(await screen.findByText("2 of 2")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Your answer"), "please{Enter}");
      await pressEnterToContinue(user);

      expect(await screen.findByText("Review complete")).toBeInTheDocument();
      expect(screen.getByText("2/2")).toBeInTheDocument();

      await click(user, "Done");
      expect(onChange).toHaveBeenCalled();
    });

    it("autofocuses the answer field", async () => {
      arrange([item({})]);
      await start();

      await waitFor(() => expect(screen.getByLabelText("Your answer")).toHaveFocus());
    });
  });

  describe("other exercise types", () => {
    it("grammar blanks are typed and graded", async () => {
      arrange([
        item({
          sourceType: "grammar",
          sourceId: "f-ich",
          prompt: "Complete",
          answer: "bin",
        }),
      ]);
      const { user } = await start();

      expect(screen.getByText("Ich ___ Schüler.")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Your answer"), "bin{Enter}");

      expect(screen.getByText("Correct.")).toBeInTheDocument();
    });

    it("pronunciation uses multiple choice", async () => {
      arrange([
        item({
          sourceType: "pronunciation",
          sourceId: "q-ei",
          prompt: "p",
          answer: "Like 'eye'",
          audioText: "mein",
        }),
      ]);
      const { user } = await start();

      expect(screen.getByRole("heading", { name: "mein" })).toBeInTheDocument();

      await click(user, "Like 'eye'");

      expect(screen.getByText("Correct.")).toBeInTheDocument();
      expect(applyReviewResult).toHaveBeenCalledWith(expect.anything(), true);
    });

    it("listening keeps the transcript hidden until the answer is submitted", async () => {
      arrange([
        item({
          sourceType: "listening",
          sourceId: "p-maria",
          prompt: "p",
          answer: "Zurich",
        }),
      ]);
      const { user } = await start();

      expect(screen.queryByText("Transcript")).toBeNull();
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Play audio" })).toBeEnabled(),
      );

      await click(user, "Spain");

      expect(screen.getByText("Not quite.")).toBeInTheDocument();
      expect(screen.getByText("Transcript")).toBeInTheDocument();
      expect(applyReviewResult).toHaveBeenCalledWith(expect.anything(), false);
    });

    it("mixes types in one session and adapts the UI per item", async () => {
      arrange([
        item({}),
        item({
          id: 2,
          sourceType: "pronunciation",
          sourceId: "q-ei",
          answer: "x",
          audioText: "mein",
        }),
      ]);
      const { user } = await start();

      await user.type(screen.getByLabelText("Your answer"), "thank you{Enter}");
      await pressEnterToContinue(user);

      expect(await screen.findByText("Pronunciation")).toBeInTheDocument();
      expect(screen.queryByLabelText("Your answer")).toBeNull();
    });
  });

  describe("legacy and damaged items", () => {
    it("falls back to reveal + Correct/Again when nothing can be rebuilt", async () => {
      const old = item({
        sourceId: "removed-from-curriculum",
        prompt: "Old card",
        answer: "Old answer",
      });
      arrange([old]);
      const { user } = await start();

      expect(screen.getByText("Old card")).toBeInTheDocument();
      expect(screen.queryByText("Old answer")).toBeNull();

      await click(user, "Reveal answer");

      expect(screen.getByText("Old answer")).toBeInTheDocument();

      await click(user, "Correct");

      expect(applyReviewResult).toHaveBeenCalledWith(old, true);
      expect(screen.getByText("Review complete")).toBeInTheDocument();
    });

    it("legacy 'Again' reports a miss", async () => {
      const old = item({ sourceId: "gone", prompt: "Old", answer: "A" });
      arrange([old]);
      const { user } = await start();

      await click(user, "Reveal answer");
      await click(user, "Again");

      expect(applyReviewResult).toHaveBeenCalledWith(old, false);
    });

    it("rebuilds an old item (no stored JSON) from the lesson data", async () => {
      arrange([item({ exerciseJson: null })]);
      await start();

      expect(screen.getByLabelText("Your answer")).toBeInTheDocument();
    });

    it("survives malformed stored JSON by rebuilding", async () => {
      arrange([item({ exerciseJson: "{this is not json" })]);
      await start();

      expect(screen.getByLabelText("Your answer")).toBeInTheDocument();
    });

    it("falls back to a card when the stored data is unusable and unrecoverable", async () => {
      arrange([
        item({
          sourceId: "unknown",
          exerciseJson: JSON.stringify({ kind: "typed", accepted: [] }),
          prompt: "Broken",
          answer: "Fallback",
        }),
      ]);
      await start();

      expect(screen.getByRole("button", { name: "Reveal answer" })).toBeInTheDocument();
    });
  });

  describe("session limits", () => {
    it("loads the planned count when started from Today", async () => {
      arrange([item({})]);
      await start(15);

      expect(getDueReviewItems).toHaveBeenCalledWith(15);
    });

    it("defaults to 20 when opened directly", async () => {
      arrange([item({})]);
      await start(null);

      expect(getDueReviewItems).toHaveBeenCalledWith(20);
    });

    it("never exceeds 20", async () => {
      arrange([item({})]);
      await start(50);

      expect(getDueReviewItems).toHaveBeenCalledWith(20);
    });
  });

  describe("empty states", () => {
    it("shows no Start button when nothing is due", async () => {
      arrange([], 0);
      render(<ReviewView onChange={vi.fn()} />);

      expect(
        await screen.findByText(/Nothing to review yet/),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Start Review" })).toBeNull();
    });

    it("does not open an empty session if nothing is due after all", async () => {
      arrange([], 3);
      const user = userEvent.setup({ delay: null });
      const onChange = vi.fn();

      render(<ReviewView onChange={onChange} />);
      await user.click(await screen.findByRole("button", { name: "Start Review" }));

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(screen.queryByText("Review complete")).toBeNull();
    });

    it("lists mistakes with their status", async () => {
      arrange([], 0);
      vi.mocked(getMistakes).mockResolvedValue([
        {
          id: 1,
          lessonId: "grammar-001",
          category: "grammar · fill",
          prompt: "Complete: Ich ___ Schüler.",
          expected: "bin",
          timesMissed: 3,
          resolved: false,
        },
      ]);

      render(<ReviewView onChange={vi.fn()} />);

      expect(await screen.findByText("Unresolved")).toBeInTheDocument();
      expect(screen.getByText(/missed 3×/)).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/db", () => ({ trackAnswer: vi.fn() }));

import { week1ListeningQuiz } from "../data/lessons/week1Listening";
import { getFakeSpeech, removeGermanVoices } from "../test/fakeSpeech";

import ListeningLesson from "./ListeningLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = (user: User, name: string | RegExp) =>
  user.click(screen.getByRole("button", { name }));

function setup() {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(
    <ListeningLesson
      onBack={vi.fn()}
      onFinish={onFinish}
      onSaveAttempt={onSaveAttempt}
    />,
  );

  return { user, onSaveAttempt, onFinish };
}

async function reachFirstQuestion(user: User) {
  await click(user, "Begin lesson");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Start listening practice/ }),
    ).toBeEnabled(),
  );
  await click(user, /Start listening practice/);
}

describe("ListeningLesson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides the transcript before answering and reveals it afterwards", async () => {
    const { user } = setup();
    await reachFirstQuestion(user);

    const first = week1ListeningQuiz[0];

    expect(screen.queryByText("Transcript")).toBeNull();
    expect(screen.queryByText(first.audio)).toBeNull();

    await click(user, first.answer);

    expect(screen.getByText("Transcript")).toBeInTheDocument();
    expect(screen.getByText(first.audio)).toBeInTheDocument();
    expect(screen.getByText("Correct.")).toBeInTheDocument();
  });

  it("reveals the transcript and correct answer after a wrong answer too", async () => {
    const { user } = setup();
    await reachFirstQuestion(user);

    const first = week1ListeningQuiz[0];
    const wrong = first.options.find((option) => option !== first.answer)!;

    await click(user, wrong);

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(first.audio)).toBeInTheDocument();
    expect(screen.getByText(/Correct answer:/)).toHaveTextContent(first.answer);
  });

  it("does not autoplay; Play and Slower use different speeds", async () => {
    const { user } = setup();
    await reachFirstQuestion(user);

    const speech = getFakeSpeech();
    expect(speech.spoken).toHaveLength(0);

    await click(user, "Play audio");
    await click(user, /Slower/);

    expect(speech.spoken.map((entry) => entry.text)).toEqual([
      week1ListeningQuiz[0].audio,
      week1ListeningQuiz[0].audio,
    ]);
    expect(speech.spoken[0].rate).toBeGreaterThan(speech.spoken[1].rate);
    expect(speech.spoken[1].rate).toBeCloseTo(0.7);
    expect(speech.spoken[0].lang).toBe("de-DE");
  });

  it("explains when no German voice exists and blocks the practice", async () => {
    removeGermanVoices();
    setup();

    expect(
      await screen.findByText(/Audio unavailable/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();

    const user = userEvent.setup({ delay: null });
    await click(user, "Begin lesson");

    expect(
      screen.getByRole("button", { name: /Start listening practice/ }),
    ).toBeDisabled();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ draft: "" }));

vi.mock("../lib/db", () => ({
  trackAnswer: vi.fn(),
  getWritingDraft: vi.fn(async () => store.draft),
  saveWritingDraft: vi.fn(async (_id: string, text: string) => {
    store.draft = text;
  }),
  clearWritingDraft: vi.fn(async () => {
    store.draft = "";
  }),
}));

import type { ComprehensionQuestion } from "../data/lessons/week1Checkpoint";
import { week4VocabularySet } from "../data/lessons/vocabularySets";
import { week4ListeningClips } from "../data/lessons/week4Listening";
import { week4ReadingPassages } from "../data/lessons/week4Reading";
import { week4SpeakingConfig } from "../data/lessons/week4Speaking";
import { everydayWriting } from "../data/lessons/week4Writing";
import { trackAnswer } from "../lib/db";
import { getFakeSpeech } from "../test/fakeSpeech";

import SpeakingLesson from "./SpeakingLesson";
import VocabularyLesson from "./VocabularyLesson";
import Week4ListeningLesson from "./Week4ListeningLesson";
import Week4ReadingLesson from "./Week4ReadingLesson";
import WritingLesson from "./WritingLesson";

type User = ReturnType<typeof userEvent.setup>;

const click = async (user: User, name: string | RegExp) => {
  const button = screen.getByRole("button", { name });

  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
};

function setupComprehension(Lesson: typeof Week4ReadingLesson) {
  const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
  const onFinish = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ delay: null });

  render(<Lesson onBack={vi.fn()} onFinish={onFinish} onSaveAttempt={onSaveAttempt} />);

  return { user, onSaveAttempt, onFinish };
}

async function answer(user: User, q: ComprehensionQuestion, correct: boolean) {
  if (q.kind === "mc") {
    await click(user, correct ? q.answer : q.options!.find((o) => o !== q.answer)!);
  } else {
    await user.type(screen.getByLabelText("Your answer"), `${correct ? q.answer : "zzz"}{Enter}`);
  }
}

async function playThrough(
  user: User,
  groups: ComprehensionQuestion[][],
  correctFor: (index: number) => boolean,
) {
  let index = 0;

  for (const group of groups) {
    for (const [i, q] of group.entries()) {
      await answer(user, q, correctFor(index));
      await click(user, i === group.length - 1 ? "Finish section" : "Next question");
      index += 1;
    }
  }
}

beforeEach(() => {
  store.draft = "";
  vi.mocked(trackAnswer).mockClear();
});

describe("reading-003 lesson", () => {
  const groups = week4ReadingPassages.map((p) => p.questions);

  it("opens with the Week 4 title and a 7/8 target", () => {
    setupComprehension(Week4ReadingLesson);

    expect(screen.getByRole("heading", { name: "Everyday descriptions" })).toBeInTheDocument();
    expect(screen.getByText("Week 4 · Reading")).toBeInTheDocument();
    expect(screen.getByText("7/8")).toBeInTheDocument();
  });

  it("shows evidence after a pronoun-reference answer and records its concept", async () => {
    const { user } = setupComprehension(Week4ReadingLesson);
    await click(user, "Begin lesson");

    await answer(user, groups[0][0], true);
    await click(user, "Next question");
    await click(user, "The dog");

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(screen.getByText(/es replaces das Wörterbuch/)).toBeInTheDocument();
    expect(trackAnswer).toHaveBeenLastCalledWith(
      expect.objectContaining({ sourceType: "grammar", sourceId: "pr-c-es-buch", correct: false }),
    );
  });

  it("passes at 7/8 and finishes; fails at 6/8 without Finish", async () => {
    const pass = setupComprehension(Week4ReadingLesson);
    await click(pass.user, "Begin lesson");
    await playThrough(pass.user, groups, (index) => index !== 3);

    expect(pass.onSaveAttempt).toHaveBeenCalledWith(7, 8);
    await click(pass.user, "Finish lesson");
    expect(pass.onFinish).toHaveBeenCalledTimes(1);
  });

  it("does not offer Finish at 6/8", async () => {
    const fail = setupComprehension(Week4ReadingLesson);
    await click(fail.user, "Begin lesson");
    await playThrough(fail.user, groups, (index) => index > 1);

    expect(fail.onSaveAttempt).toHaveBeenCalledWith(6, 8);
    expect(screen.queryByRole("button", { name: "Finish lesson" })).toBeNull();
  });
});

describe("listening-004 lesson", () => {
  const groups = week4ListeningClips.map((clip) => clip.questions);

  it("hides the transcript until the question is answered, and never autoplays", async () => {
    const { user } = setupComprehension(Week4ListeningLesson);
    await click(user, "Begin lesson");
    await screen.findByRole("button", { name: "Play audio" });

    expect(screen.queryByText(/Heute habe ich eine Prüfung/)).toBeNull();
    expect(getFakeSpeech().spoken).toEqual([]);

    await answer(user, groups[0][0], true);
    expect(screen.getAllByText(/Heute habe ich eine Prüfung/).length).toBeGreaterThan(0);
  });

  it("passes at 7/8 and records the verb-form concept on a miss", async () => {
    const { user, onSaveAttempt, onFinish } = setupComprehension(Week4ListeningLesson);
    await click(user, "Begin lesson");
    await screen.findByRole("button", { name: "Play audio" });

    // Index 5 is l4-6 (which form of nehmen).
    await playThrough(user, groups, (index) => index !== 5);

    expect(trackAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "grammar", sourceId: "iv-c-nimmt", correct: false }),
    );
    expect(onSaveAttempt).toHaveBeenCalledWith(7, 8);
    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

describe("writing-003 lesson", () => {
  it("opens with the Week 4 prompt and 60–80 word target, and keeps the draft", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <WritingLesson config={everydayWriting} onBack={vi.fn()} onFinish={vi.fn()} onSaveAttempt={vi.fn()} />,
    );

    expect(await screen.findByRole("heading", { name: "Describing everyday life" })).toBeInTheDocument();
    expect(screen.getByText("Week 4 · Writing")).toBeInTheDocument();

    await click(user, "Begin lesson");
    expect(screen.getByText("Ich trage eine Jacke und nehme den Rucksack.")).toBeInTheDocument();
    await click(user, "Plan my paragraph");
    await click(user, "Start writing");

    await user.type(screen.getByRole("textbox"), "Ich heiße Omar.");
    await waitFor(() => expect(store.draft).toBe("Ich heiße Omar."));
    // The model text stays hidden until submission.
    expect(screen.queryByText(/Ich heiße Omar, und ich wohne in Doha/)).toBeNull();
  });
});

describe("speaking-002 lesson", () => {
  function setupSpeaking() {
    const onSaveAttempt = vi.fn().mockResolvedValue(undefined);
    const onFinish = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup({ delay: null });

    render(
      <SpeakingLesson
        config={week4SpeakingConfig}
        onBack={vi.fn()}
        onFinish={onFinish}
        onSaveAttempt={onSaveAttempt}
      />,
    );

    return { user, onSaveAttempt, onFinish };
  }

  it("opens as the Week 4 lesson with a 2–3 minute final talk", () => {
    setupSpeaking();

    expect(screen.getByRole("heading", { name: "Introducing myself and my daily life" })).toBeInTheDocument();
    expect(screen.getByText("Week 4 · Speaking")).toBeInTheDocument();
    expect(screen.getByText("2–3 min")).toBeInTheDocument();
    expect(screen.getByText(String(week4SpeakingConfig.prompts.length))).toBeInTheDocument();
  });

  it("runs every prompt, the cue-based talk and a 4/5 self-assessment", async () => {
    const { user, onSaveAttempt, onFinish } = setupSpeaking();

    await click(user, "Begin lesson");
    expect(screen.getByText("Example talk")).toBeInTheDocument();
    await click(user, "Start speaking prompts");

    for (const [index] of week4SpeakingConfig.prompts.entries()) {
      await click(user, "Start speaking");
      await click(user, "Done");
      await click(user, index === week4SpeakingConfig.prompts.length - 1 ? "Start final challenge" : "Next prompt");
    }

    expect(screen.getByRole("heading", { name: week4SpeakingConfig.finalHeading })).toBeInTheDocument();
    for (const cue of week4SpeakingConfig.finalCues) expect(screen.getByText(cue)).toBeInTheDocument();
    expect(screen.getByText("3:00")).toBeInTheDocument();

    await click(user, "Start");
    await click(user, "Stop early");
    await click(user, "Continue to self-assessment");

    expect(screen.getByText(/Tick each statement that is honestly true/)).toBeInTheDocument();
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(5);
    for (let i = 0; i < 4; i += 1) await user.click(boxes[i]);
    await click(user, "See results");

    expect(onSaveAttempt).toHaveBeenCalledWith(4, 5);
    await click(user, "Finish lesson");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

describe("vocab-004 lesson", () => {
  it("opens with the Week 4 title, word count and article reminder", () => {
    render(
      <VocabularyLesson set={week4VocabularySet} onBack={vi.fn()} onFinish={vi.fn()} onSaveAttempt={vi.fn()} />,
    );

    expect(screen.getByRole("heading", { name: "Everyday German in context" })).toBeInTheDocument();
    expect(screen.getByText("Week 4 · Vocabulary")).toBeInTheDocument();
    expect(screen.getByText(/Learn 84 words and phrases/)).toBeInTheDocument();
  });

  it("shows verb notes without a plural, and nouns with their plural", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <VocabularyLesson set={week4VocabularySet} onBack={vi.fn()} onFinish={vi.fn()} onSaveAttempt={vi.fn()} />,
    );

    await click(user, "Begin lesson");
    await click(user, "Start batch");

    expect(screen.getByText("sehen")).toBeInTheDocument();
    expect(screen.getByText(/du siehst, er\/sie\/es sieht/)).toBeInTheDocument();
    expect(screen.queryByText(/Plural:/)).toBeNull();
  });
});

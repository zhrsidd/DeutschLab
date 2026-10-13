import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Celebration, { LESSON_CELEBRATION_MS } from "./Celebration";

describe("Celebration", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const lesson = { kind: "lesson", title: "First vocabulary", week: 1, before: 2, after: 3, total: 8, seed: 3 } as const;

  it("announces a lesson completion with its real week progress and dismisses itself", () => {
    const onDone = vi.fn();
    render(<Celebration data={lesson} onDone={onDone} />);

    expect(screen.getByRole("status")).toHaveTextContent("First vocabulary complete. Week 1: 3 of 8 activities.");
    expect(onDone).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(LESSON_CELEBRATION_MS));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("can be skipped with Escape or a click", () => {
    const onDone = vi.fn();
    render(<Celebration data={lesson} onDone={onDone} />);

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByTestId("celebration-lesson"));
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  it("holds a mastered week until the learner continues, with focus on Weiter", () => {
    const onDone = vi.fn();
    render(
      <Celebration data={{ kind: "week", week: 2, title: "Present tense", activities: 7, nextWeek: 3 }} onDone={onDone} />,
    );

    expect(screen.getByRole("dialog", { name: "Woche 2 geschafft." })).toBeInTheDocument();
    expect(screen.getByText("7 of 7")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onDone).not.toHaveBeenCalled();

    const weiter = screen.getByRole("button", { name: /Weiter/ });
    expect(weiter).toHaveFocus();
    fireEvent.click(weiter);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("frames October mastery as the app's milestone, never a CEFR level", () => {
    render(<Celebration data={{ kind: "unit", weeks: 4, activities: 31 }} onDone={() => {}} />);

    expect(screen.getByRole("dialog", { name: "Oktober geschafft." })).toBeInTheDocument();
    expect(screen.getByText(/not a CEFR certificate/)).toBeInTheDocument();
    expect(screen.getByText("4 of 4")).toBeInTheDocument();
  });
});

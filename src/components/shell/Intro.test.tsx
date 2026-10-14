import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Intro, { FULL_MS } from "./Intro";

describe("Intro (StartupLoader)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it("covers the app while the database opens and is hidden from assistive tech", () => {
    render(<Intro ready={false} failed={false} />);
    const intro = screen.getByTestId("intro");

    expect(intro).toHaveAttribute("data-phase", "in");
    expect(intro).toHaveAttribute("data-ready", "false");
    expect(intro).toHaveAttribute("aria-hidden", "true");
  });

  it("releases the app the moment it is ready, but lets the opening play for its full length", () => {
    const { rerender } = render(<Intro ready={false} failed={false} />);
    rerender(<Intro ready failed={false} />);

    // Interactive at once (the overlay stops taking pointer events)...
    expect(screen.getByTestId("intro")).toHaveAttribute("data-ready", "true");
    // ...while the sequence stays visible until FULL_MS, not cut short.
    act(() => vi.advanceTimersByTime(FULL_MS - 100));
    expect(screen.getByTestId("intro")).toHaveAttribute("data-phase", "in");
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByTestId("intro")).toHaveAttribute("data-phase", "out");
    act(() => vi.advanceTimersByTime(700));
    expect(screen.queryByTestId("intro")).toBeNull();
    expect(window.sessionStorage.getItem("dl-intro-seen")).toBe("1");
  });

  it("gets out of the way at once when the database fails, so the error is visible", () => {
    render(<Intro ready={false} failed />);

    expect(screen.getByTestId("intro")).toHaveAttribute("data-phase", "out");
    act(() => vi.advanceTimersByTime(700));
    expect(screen.queryByTestId("intro")).toBeNull();
  });

  it("falls into the dot loop when startup outlasts the sequence, and says so honestly", () => {
    render(<Intro ready={false} failed={false} />);
    const intro = screen.getByTestId("intro");
    const note = screen.getByText("Opening your study data…");

    expect(intro).toHaveAttribute("data-loading", "false");
    expect(note).toHaveAttribute("data-visible", "false");
    act(() => vi.advanceTimersByTime(FULL_MS));
    expect(intro).toHaveAttribute("data-loading", "true");
    act(() => vi.advanceTimersByTime(400));
    expect(note).toHaveAttribute("data-visible", "true");
    expect(intro.textContent).not.toMatch(/%/);
  });

  it("exits immediately when ready after a slow start", () => {
    const { rerender } = render(<Intro ready={false} failed={false} />);
    act(() => vi.advanceTimersByTime(FULL_MS + 500));
    rerender(<Intro ready failed={false} />);

    expect(screen.getByTestId("intro")).toHaveAttribute("data-phase", "out");
    expect(screen.getByTestId("intro")).toHaveAttribute("data-loading", "false");
  });

  it("uses the short reveal on a reload in the same session", () => {
    window.sessionStorage.setItem("dl-intro-seen", "1");
    const { rerender } = render(<Intro ready={false} failed={false} />);

    expect(screen.getByTestId("intro")).toHaveAttribute("data-brief", "true");
    rerender(<Intro ready failed={false} />);
    expect(screen.getByTestId("intro")).toHaveAttribute("data-phase", "out");
  });
});

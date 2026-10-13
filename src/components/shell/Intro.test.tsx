import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Intro from "./Intro";

describe("Intro", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it("covers the app while the database opens and is hidden from assistive tech", () => {
    render(<Intro ready={false} failed={false} />);
    const intro = screen.getByTestId("intro");

    expect(intro).toHaveAttribute("data-phase", "in");
    expect(intro).toHaveAttribute("aria-hidden", "true");
  });

  it("starts revealing the moment the app is ready, then unmounts", () => {
    const { rerender } = render(<Intro ready={false} failed={false} />);
    rerender(<Intro ready failed={false} />);

    expect(screen.getByTestId("intro")).toHaveAttribute("data-phase", "out");
    act(() => vi.advanceTimersByTime(800));
    expect(screen.queryByTestId("intro")).toBeNull();
    expect(window.sessionStorage.getItem("dl-intro-seen")).toBe("1");
  });

  it("gets out of the way when the database fails, so the error is visible", () => {
    render(<Intro ready={false} failed />);

    expect(screen.getByTestId("intro")).toHaveAttribute("data-phase", "out");
    act(() => vi.advanceTimersByTime(800));
    expect(screen.queryByTestId("intro")).toBeNull();
  });

  it("says honestly when opening is slow, without percentages", () => {
    render(<Intro ready={false} failed={false} />);
    const note = screen.getByText("Opening your study data…");

    expect(note).toHaveAttribute("data-visible", "false");
    act(() => vi.advanceTimersByTime(1700));
    expect(note).toHaveAttribute("data-visible", "true");
    expect(screen.getByTestId("intro").textContent).not.toMatch(/%/);
  });

  it("uses the short reveal on a reload in the same session", () => {
    window.sessionStorage.setItem("dl-intro-seen", "1");
    render(<Intro ready={false} failed={false} />);

    expect(screen.getByTestId("intro")).toHaveAttribute("data-brief", "true");
  });
});

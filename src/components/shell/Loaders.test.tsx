import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Logomark, Wordmark } from "./Brand";
import { BrandLoader, ButtonLoader, InlineLoader, LOADER_DELAY_MS, SectionLoader } from "./Loaders";

describe("brand mark", () => {
  it("is real SVG geometry, decorative by default, with crimson and gold dots", () => {
    const { container } = render(<Logomark />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelector("path.dl-logo__u")).not.toBeNull();
    expect(svg.querySelectorAll("circle")).toHaveLength(2);
    expect(svg.querySelector(".dl-logo__dot--a")).not.toBeNull();
    expect(svg.querySelector(".dl-logo__dot--b")).not.toBeNull();
    expect(svg).toHaveAttribute("data-loading", "false");
  });

  it("exposes its states as data attributes and can be labelled", () => {
    const { container, rerender } = render(<Logomark state="loading" title="DeutschLab" />);
    expect(screen.getByRole("img", { name: "DeutschLab" })).toHaveAttribute("data-loading", "true");

    rerender(<Logomark state="success" />);
    expect(container.querySelector("svg")).toHaveAttribute("data-settle", "true");
  });

  it("reads as one word in the wordmark", () => {
    const { container } = render(<Wordmark />);
    expect(container.textContent).toBe("DeutschLab");
  });
});

describe("loaders", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("do not flash for quick work: dots appear only after the delay, words are always there", () => {
    render(<SectionLoader label="Loading your records…" />);
    const status = screen.getByRole("status");

    expect(status).toHaveTextContent("Loading your records…");
    expect(status.querySelector(".dl-dots")).toBeNull();
    act(() => vi.advanceTimersByTime(LOADER_DELAY_MS));
    expect(status.querySelector(".dl-dots")).not.toBeNull();
  });

  it("BrandLoader uses the animated mark; InlineLoader the small dots", () => {
    render(
      <>
        <BrandLoader label="Opening DeutschLab…" />
        <InlineLoader label="Saving…" />
      </>,
    );
    act(() => vi.advanceTimersByTime(LOADER_DELAY_MS));

    const [brand, inline] = screen.getAllByRole("status");
    expect(brand.querySelector("svg.dl-logo")).toHaveAttribute("data-loading", "true");
    expect(inline.querySelector(".dl-dots")).not.toBeNull();
    expect(inline).toHaveTextContent("Saving…");
  });

  it("ButtonLoader is decorative and single-colour", () => {
    const { container } = render(<ButtonLoader />);
    act(() => vi.advanceTimersByTime(LOADER_DELAY_MS));

    const dots = container.querySelector(".dl-dots")!;
    expect(dots).toHaveAttribute("aria-hidden", "true");
    expect(dots).toHaveClass("dl-dots--mono");
  });
});

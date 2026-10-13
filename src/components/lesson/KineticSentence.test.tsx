import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { irregularVerbsCourse as week4IrregularVerbs } from "../../data/lessons/week4IrregularVerbs";
import { MotionProvider } from "../motion";
import KineticSentence from "./KineticSentence";

const block = week4IrregularVerbs.pages
  .flatMap((page) => page.blocks)
  .find((entry) => entry.type === "kinetic");

describe("KineticSentence (V2 word order)", () => {
  it("steps through the sentences with a written caption for each, then replays", () => {
    if (!block || block.type !== "kinetic") throw new Error("missing kinetic block");
    render(
      <MotionProvider>
        <KineticSentence title={block.title} steps={block.steps} />
      </MotionProvider>,
    );

    expect(screen.getByText("Ich lerne heute Deutsch.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show the change" }));
    expect(screen.getByText("Heute lerne ich Deutsch.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show the next step" }));
    expect(screen.getByText("Heute Abend lerne ich Deutsch.")).toBeInTheDocument();
    expect(screen.getByText(/not one word/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByText("Ich lerne heute Deutsch.")).toBeInTheDocument();
  });

  it("keeps the verb in position 2 in every step", () => {
    if (!block || block.type !== "kinetic") throw new Error("missing kinetic block");
    for (const step of block.steps) expect(step.parts[1].id).toBe("verb");
  });
});

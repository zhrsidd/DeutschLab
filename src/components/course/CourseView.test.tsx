import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { starterTasks } from "../../data/unit1";
import { weekSummaries } from "../../lib/progress";
import CourseView from "./CourseView";

describe("modular curriculum roadmap", () => {
  it("shows suggested dates and planned recipes while retaining working lesson actions", () => {
    render(<CourseView summaries={weekSummaries(starterTasks, [])} completedTasks={[]} startLesson={() => {}} />);
    expect(screen.getByText("15 Nov 2026 – 6 Mar 2027", { exact: true })).toBeInTheDocument();
    const week = within(screen.getByRole("region", { name: "Week 1 progress" }));
    expect(week.getByText("15 Nov 2026 – 21 Nov 2026")).toBeInTheDocument();
    expect(week.getByText("Introduce myself and ask someone for basic personal details.")).toBeInTheDocument();
    expect(week.getByText("Modules · planned")).toBeInTheDocument();
    expect(week.getByText("Give a short personal introduction using familiar sein sentences.")).toBeInTheDocument();
    expect(week.getByRole("button", { name: /First vocabulary/ })).toBeInTheDocument();
    const later = within(screen.getByRole("region", { name: "Everyday communication" }));
    expect(later.queryByRole("button")).not.toBeInTheDocument();
    expect(later.getByText("13 Dec 2026 – 19 Dec 2026")).toBeInTheDocument();
  });
});

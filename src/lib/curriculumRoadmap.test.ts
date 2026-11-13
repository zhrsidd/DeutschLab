import { describe, expect, it } from "vitest";
import { courseUnits } from "../data/course";
import { starterTasks, taskWeek, unit1Curriculum } from "../data/unit1";

const weeks = unit1Curriculum.flatMap((block) => block.weeks);
const day = (iso: string) => Date.parse(iso + "T12:00:00Z");

describe("Sunday modular curriculum", () => {
  it("keeps sixteen Sunday–Saturday study weeks from 15 November without gaps", () => {
    expect(weeks).toHaveLength(16);
    expect(weeks[0].startsOn).toBe("2026-11-15");
    expect(weeks[15].endsOn).toBe("2027-03-06");
    weeks.forEach((week, i) => {
      expect(week.week).toBe(i + 1);
      expect(new Date(day(week.startsOn)).getUTCDay()).toBe(0);
      expect(new Date(day(week.endsOn)).getUTCDay()).toBe(6);
      expect(day(week.endsOn) - day(week.startsOn)).toBe(6 * 86400000);
      if (i) expect(day(week.startsOn) - day(weeks[i - 1].endsOn)).toBe(86400000);
    });
  });

  it("maps every built lesson to planned modules without inventing runnable lessons", () => {
    const modules = weeks.flatMap((week) => week.modules);
    const ids = modules.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(modules.length).toBeGreaterThanOrEqual(32);
    const preceding = new Set<string>();
    for (const week of weeks) {
      expect(week.outcome.length).toBeGreaterThan(15);
      for (const module of week.modules) {
        expect(module.status).toBe("planned");
        expect(module.outcome.length).toBeGreaterThan(15);
        expect(module.transferTask.length).toBeGreaterThan(15);
        for (const prerequisite of module.prerequisites) expect(preceding.has(prerequisite)).toBe(true);
        for (const id of module.legacyTaskIds) {
          const task = starterTasks.find((candidate) => candidate.id === id);
          expect(task, id).toBeDefined();
          expect(taskWeek(task!)).toBeLessThanOrEqual(week.week);
        }
        preceding.add(module.id);
      }
    }
    const mapped = new Set(modules.flatMap((module) => module.legacyTaskIds));
    for (const task of starterTasks) expect(mapped.has(task.id), task.id).toBe(true);
    expect(Math.max(...starterTasks.map(taskWeek))).toBe(4);
  });

  it("keeps later phase dates sequential rather than overlapping the shifted A1 course", () => {
    expect(courseUnits[0].startsOn).toBe("2026-11-15");
    expect(courseUnits[0].endsOn).toBe("2027-03-06");
    for (let i = 1; i < courseUnits.length; i++) {
      expect(day(courseUnits[i].startsOn) - day(courseUnits[i - 1].endsOn)).toBe(86400000);
    }
    expect(courseUnits[courseUnits.length - 1].endsOn).toBe("2028-03-04");
  });
});

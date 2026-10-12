/*
 * Daily study planner. Pure and deterministic: no database access.
 *
 * Order: A) due reviews → B) one weak-area item → C) next unfinished
 * lesson → D) one more lesson only if time clearly remains.
 */

import type { LessonTask } from "../data/unit1";

export const STUDY_TIME_OPTIONS = [15, 30, 45, 60] as const;
export const DEFAULT_STUDY_MINUTES = 30;

export const MAX_REVIEWS_PER_DAY = 20;
/** Roughly 36 seconds per review item. */
const MINUTES_PER_REVIEW = 0.6;
/** Share of the time budget reviews may take. */
const REVIEW_BUDGET_SHARE = 0.6;
const WEAK_AREA_MINUTES = 4;
const MAX_LESSONS_PER_DAY = 2;

export type PlanTarget =
  | { type: "review" }
  | { type: "lesson"; taskId: string };

export interface PlanItem {
  id: string;
  kind: "lesson" | "review" | "mistake";
  sourceId: string;
  title: string;
  description: string;
  minutes: number;
  priority: number;
  reason: string;
  target: PlanTarget;
  /** Set for weak-area items so the UI can dismiss them once practised. */
  mistakeId?: number;
}

export interface PlannerMistake {
  id: number;
  lessonId: string;
  /** "<sourceType>:<sourceId>", matches a review item key. */
  itemKey: string;
  prompt: string;
  timesMissed: number;
}

export interface PlannerInput {
  tasks: LessonTask[];
  completedTaskIds: string[];
  dueReviewCount: number;
  /** Keys ("<sourceType>:<sourceId>") of every currently due review item. */
  dueReviewKeys: string[];
  unresolvedMistakes: PlannerMistake[];
  /** Mistakes already practised today, so they stop being suggested. */
  dismissedMistakeIds?: number[];
  budgetMinutes: number;
}

export interface DailyPlan {
  items: PlanItem[];
  totalMinutes: number;
  budgetMinutes: number;
  dueReviewCount: number;
  /** True when there is nothing left worth doing today. */
  done: boolean;
}

const WEAK_AREA_TITLE: Record<string, string> = {
  vocabulary: "Revisit Week 1 vocabulary",
  pronunciation: "Revisit German sounds",
  grammar: "Review sein conjugation",
  listening: "Revisit listening: introductions",
};

function sourceTypeOf(itemKey: string): string {
  return itemKey.split(":")[0];
}

export function reviewMinutes(count: number): number {
  return count === 0 ? 0 : Math.max(1, Math.round(count * MINUTES_PER_REVIEW));
}

export function generateDailyPlan(input: PlannerInput): DailyPlan {
  const {
    tasks,
    completedTaskIds,
    dueReviewCount,
    dueReviewKeys,
    unresolvedMistakes,
    dismissedMistakeIds = [],
    budgetMinutes,
  } = input;

  const items: PlanItem[] = [];
  let remaining = budgetMinutes;

  const push = (item: Omit<PlanItem, "priority">) => {
    items.push({ ...item, priority: items.length + 1 });
    remaining -= item.minutes;
  };

  const unfinished = tasks.filter(
    (task) => !completedTaskIds.includes(task.id),
  );

  // A. Due reviews, batched into one block.
  if (dueReviewCount > 0) {
    const affordable = Math.floor(
      (budgetMinutes * REVIEW_BUDGET_SHARE) / MINUTES_PER_REVIEW,
    );
    const count = Math.max(
      1,
      Math.min(dueReviewCount, MAX_REVIEWS_PER_DAY, affordable),
    );

    push({
      id: "review-block",
      kind: "review",
      sourceId: "review",
      title: `${dueReviewCount} ${dueReviewCount === 1 ? "review" : "reviews"} due`,
      description:
        count < dueReviewCount
          ? `Today's session covers ${count} of them.`
          : "Quick recall of items you've learned or missed.",
      minutes: reviewMinutes(count),
      reason:
        dueReviewCount === 1
          ? "1 review is due"
          : `${dueReviewCount} reviews are due`,
      target: { type: "review" },
    });
  }

  // B. At most one weak-area item: an unresolved mistake with no due review
  // whose lesson is already finished (an unfinished lesson covers it anyway).
  const dueKeys = new Set(dueReviewKeys);
  const dismissed = new Set(dismissedMistakeIds);
  const unfinishedIds = new Set(unfinished.map((task) => task.id));

  const weak = unresolvedMistakes
    .filter(
      (mistake) =>
        !dueKeys.has(mistake.itemKey) &&
        !dismissed.has(mistake.id) &&
        !unfinishedIds.has(mistake.lessonId) &&
        tasks.some((task) => task.id === mistake.lessonId),
    )
    .sort((a, b) => b.timesMissed - a.timesMissed || b.id - a.id)[0];

  if (weak && remaining >= WEAK_AREA_MINUTES) {
    push({
      id: `mistake-${weak.id}`,
      kind: "mistake",
      sourceId: weak.lessonId,
      title:
        WEAK_AREA_TITLE[sourceTypeOf(weak.itemKey)] ?? "Revisit a weak area",
      description: `You missed: ${weak.prompt}`,
      minutes: WEAK_AREA_MINUTES,
      reason: "You missed this recently",
      target: { type: "lesson", taskId: weak.lessonId },
      mistakeId: weak.id,
    });
  }

  // C + D. Lessons in curriculum order. The first always appears if nothing
  // else is planned; further lessons only if they fit.
  let lessons = 0;

  for (const task of unfinished) {
    if (lessons >= MAX_LESSONS_PER_DAY) break;

    const fits = task.minutes <= remaining;
    const allowed = lessons === 0 ? fits || items.length === 0 : fits;

    if (!allowed) break; // keep curriculum order: don't skip ahead

    push({
      id: `lesson-${task.id}`,
      kind: "lesson",
      sourceId: task.id,
      title: task.title,
      description: task.description,
      minutes: task.minutes,
      reason: lessons === 0 ? "Next lesson" : "Fits your remaining time",
      target: { type: "lesson", taskId: task.id },
    });

    lessons += 1;
  }

  return {
    items,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    budgetMinutes,
    dueReviewCount,
    done: items.length === 0,
  };
}

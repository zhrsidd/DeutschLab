/*
 * Pure aggregation for Home and Progress charts. Every number is derived
 * from persisted rows (see getProgressData); nothing is estimated.
 * Study activity counts recorded events; it is not study time.
 */

import { starterTasks, taskWeek, type LessonType } from "../data/unit1";

import type { ProgressData } from "./db";

export interface DayActivity {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Short weekday label, e.g. "Mo". */
  label: string;
  lessons: number;
  checkpoints: number;
  reviews: number;
  total: number;
  isToday: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const localDate = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Midnight (local) `days - 1` days before `now`: the start of the window. */
export function windowStart(days: number, now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

/** One entry per local day, oldest first, ending today. */
export function dailyActivity(
  events: ProgressData["activity"],
  days: number,
  now = new Date(),
): DayActivity[] {
  const start = windowStart(days, now);
  const out: DayActivity[] = [];
  const index = new Map<string, DayActivity>();

  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const entry: DayActivity = {
      date: localDate(day),
      label: WEEKDAYS[day.getDay()],
      lessons: 0,
      checkpoints: 0,
      reviews: 0,
      total: 0,
      isToday: i === days - 1,
    };
    out.push(entry);
    index.set(entry.date, entry);
  }

  for (const event of events) {
    const entry = index.get(localDate(new Date(event.at)));
    if (!entry) continue;
    if (event.kind === "lesson") entry.lessons += 1;
    else if (event.kind === "checkpoint") entry.checkpoints += 1;
    else entry.reviews += 1;
    entry.total += 1;
  }

  return out;
}

/** Days with at least one recorded event. */
export const activeDays = (days: DayActivity[]) => days.filter((day) => day.total > 0).length;

/** A round axis maximum (1, 2, 5, 10, 20, 50 …) at or above the largest value. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= value) return step * magnitude;
  }
  return 10 * magnitude;
}

export interface Accuracy {
  correct: number;
  total: number;
  /** 0–1, or null without answers. */
  rate: number | null;
}

export function reviewAccuracy(answers: ProgressData["reviewAnswers"]): Accuracy {
  const correct = answers.filter((answer) => answer.correct).length;
  return { correct, total: answers.length, rate: answers.length ? correct / answers.length : null };
}

/** Review answers grouped into 7-day blocks, oldest first, ending today. */
export function weeklyAccuracy(
  answers: ProgressData["reviewAnswers"],
  weeks: number,
  now = new Date(),
): { label: string; accuracy: Accuracy }[] {
  const start = windowStart(weeks * 7, now);
  const buckets: ProgressData["reviewAnswers"][] = Array.from({ length: weeks }, () => []);

  for (const answer of answers) {
    const offset = Math.floor((new Date(answer.at).getTime() - start.getTime()) / 86_400_000);
    if (offset < 0 || offset >= weeks * 7) continue;
    buckets[Math.floor(offset / 7)].push(answer);
  }

  return buckets.map((bucket, index) => ({
    label: index === weeks - 1 ? "This week" : `${weeks - 1 - index} wk ago`,
    accuracy: reviewAccuracy(bucket),
  }));
}

export interface LessonScoreRow {
  taskId: string;
  title: string;
  week: number;
  type: LessonType;
  latest: number;
  latestScore: number;
  latestTotal: number;
  best: number;
  attempts: number;
}

/** Latest and best score per lesson, in curriculum order (checkpoints excluded). */
export function lessonScoreRows(scores: ProgressData["lessonScores"]): LessonScoreRow[] {
  const byId = new Map(scores.map((score) => [score.taskId, score]));

  return starterTasks
    .filter((task) => byId.has(task.id) && !task.id.startsWith("checkpoint-"))
    .map((task) => {
      const score = byId.get(task.id)!;
      return {
        taskId: task.id,
        title: task.title,
        week: taskWeek(task),
        type: task.type,
        latest: score.latestTotal ? score.latestScore / score.latestTotal : 0,
        latestScore: score.latestScore,
        latestTotal: score.latestTotal,
        best: score.bestFraction,
        attempts: score.attempts,
      };
    });
}

export const REVIEW_STAGE_LABELS = [
  "New or missed",
  "Recalled once",
  "Recalled twice",
  "Three in a row",
  "Four or more",
];

/** Review items by consecutive correct recalls (0 … 4+), always five entries. */
export function reviewStages(stages: ProgressData["reviewStages"]) {
  return REVIEW_STAGE_LABELS.map((label, repetitions) => ({
    label,
    count: stages.find((stage) => stage.repetitions === repetitions)?.count ?? 0,
  }));
}

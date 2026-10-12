/*
 * Small deterministic review scheduler (v0.3A). Not FSRS.
 *
 * wrong            → due tomorrow (1 day), progress resets
 * correct (1st)    → 3 days
 * correct (2nd)    → 7 days
 * correct (3rd)    → 14 days
 * correct (4th)    → 30 days
 * correct (later)  → doubles, capped at 60 days
 */

export const MAX_INTERVAL_DAYS = 60;
export const START_EASE = 2.5;

const CORRECT_LADDER_DAYS = [3, 7, 14, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SchedulerState {
  intervalDays: number;
  ease: number;
  repetitions: number;
}

export interface ScheduleResult extends SchedulerState {
  dueAt: string;
}

function dueIn(days: number, now: Date): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

/** State for a concept that has just entered review. */
export function initialSchedule(now = new Date()): ScheduleResult {
  return {
    intervalDays: 1,
    ease: START_EASE,
    repetitions: 0,
    dueAt: dueIn(1, now),
  };
}

export function scheduleNext(
  state: SchedulerState,
  correct: boolean,
  now = new Date(),
): ScheduleResult {
  if (!correct) {
    return {
      intervalDays: 1,
      ease: Math.max(1.3, state.ease - 0.2),
      repetitions: 0,
      dueAt: dueIn(1, now),
    };
  }

  const repetitions = state.repetitions + 1;

  const intervalDays =
    repetitions <= CORRECT_LADDER_DAYS.length
      ? CORRECT_LADDER_DAYS[repetitions - 1]
      : Math.min(MAX_INTERVAL_DAYS, state.intervalDays * 2);

  return {
    intervalDays,
    ease: Math.min(3, state.ease + 0.05),
    repetitions,
    dueAt: dueIn(intervalDays, now),
  };
}

/** Items due at any point before the end of the local day count as due today. */
export function endOfToday(now = new Date()): string {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return end.toISOString();
}

/** A mistake counts as resolved after this many correct reviews in a row. */
export const REPETITIONS_TO_RESOLVE = 2;

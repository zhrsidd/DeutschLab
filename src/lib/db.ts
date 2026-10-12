import Database from "@tauri-apps/plugin-sql";

import { buildReviewExercise } from "./reviewExercises";

import type { PlannerMistake } from "./dailyPlanner";

import {
  REPETITIONS_TO_RESOLVE,
  START_EASE,
  endOfToday,
  initialSchedule,
  scheduleNext,
} from "./reviewScheduler";

import type {
  AnswerRecord,
  MistakeRow,
  ReviewItem,
  ReviewSourceType,
  ReviewStats,
} from "../data/reviewTypes";

const DATABASE_URL = "sqlite:deutschlab.db";

let databasePromise: Promise<Database> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load(DATABASE_URL);
  }

  return databasePromise;
}

export async function initialiseDatabase() {
  const db = await getDatabase();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS task_progress (
      task_id TEXT PRIMARY KEY NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )
  `);

  await db.execute(`
  CREATE TABLE IF NOT EXISTS lesson_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    completed_at TEXT NOT NULL
  )
`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL,
      item_key TEXT NOT NULL,
      category TEXT NOT NULL,
      prompt TEXT NOT NULL,
      expected_answer TEXT NOT NULL,
      user_answer TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      times_missed INTEGER NOT NULL DEFAULT 1
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      audio_text TEXT,
      due_at TEXT NOT NULL,
      interval_days INTEGER NOT NULL DEFAULT 1,
      ease REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      last_result TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE (source_type, source_id)
    )
  `);

  // v0.4A: structured exercise data. Older databases get the column added;
  // existing rows keep NULL and are rebuilt (or shown as legacy cards).
  const columns = await db.select<{ name: string }[]>(
    `PRAGMA table_info(review_items)`,
  );

  if (!columns.some((column) => column.name === "exercise_json")) {
    await db.execute(`ALTER TABLE review_items ADD COLUMN exercise_json TEXT`);
  }
}

interface TaskProgressRow {
  task_id: string;
}

export async function getCompletedTaskIds(): Promise<string[]> {
  const db = await getDatabase();

  const rows = await db.select<TaskProgressRow[]>(
    `
      SELECT task_id
      FROM task_progress
      WHERE completed = 1
    `,
  );

  return rows.map((row) => row.task_id);
}

export async function markTaskComplete(taskId: string) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO task_progress (
        task_id,
        completed,
        completed_at
      )
      VALUES (?, 1, ?)

      ON CONFLICT(task_id)
      DO UPDATE SET
        completed = 1,
        completed_at = excluded.completed_at
    `,
    [taskId, new Date().toISOString()],
  );
}

export async function markTaskIncomplete(taskId: string) {
  const db = await getDatabase();

  await db.execute(
    `
      DELETE FROM task_progress
      WHERE task_id = ?
    `,
    [taskId],
  );
}

export async function saveLessonAttempt(
  taskId: string,
  score: number,
  total: number,
) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO lesson_attempts (
        task_id,
        score,
        total,
        completed_at
      )
      VALUES (?, ?, ?, ?)
    `,
    [taskId, score, total, new Date().toISOString()],
  );
}
/*
 * Mistakes + review scheduling
 */

const LESSON_FOR_SOURCE: Record<ReviewSourceType, string> = {
  vocabulary: "vocab-001",
  pronunciation: "pronunciation-001",
  grammar: "grammar-001",
  listening: "listening-001",
};

function itemKey(sourceType: ReviewSourceType, sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

async function upsertMistake(
  sourceType: ReviewSourceType,
  sourceId: string,
  category: string,
  prompt: string,
  expected: string,
  userAnswer: string,
) {
  const db = await getDatabase();
  const key = itemKey(sourceType, sourceId);

  const existing = await db.select<{ id: number }[]>(
    `
      SELECT id FROM mistakes
      WHERE item_key = ? AND resolved_at IS NULL
      LIMIT 1
    `,
    [key],
  );

  if (existing.length > 0) {
    await db.execute(
      `
        UPDATE mistakes
        SET times_missed = times_missed + 1,
            user_answer = ?,
            prompt = ?,
            expected_answer = ?
        WHERE id = ?
      `,
      [userAnswer, prompt, expected, existing[0].id],
    );

    return;
  }

  await db.execute(
    `
      INSERT INTO mistakes (
        lesson_id, item_key, category, prompt,
        expected_answer, user_answer, created_at, times_missed
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
    [
      LESSON_FOR_SOURCE[sourceType],
      key,
      category,
      prompt,
      expected,
      userAnswer,
      new Date().toISOString(),
    ],
  );
}

/**
 * Called after an assessed answer. A wrong answer records a mistake and
 * (re)schedules the item for tomorrow. A correct answer only adds the item
 * to review the first time, and only when `enterOnCorrect` is set.
 */
export async function recordAnswer(input: AnswerRecord) {
  const db = await getDatabase();
  const now = new Date();
  const schedule = initialSchedule(now);

  let exerciseJson: string | null = null;
  try {
    const exercise = buildReviewExercise(input.sourceType, input.sourceId);
    exerciseJson = exercise ? JSON.stringify(exercise) : null;
  } catch (error) {
    console.error("Failed to build review exercise:", error);
  }

  if (input.correct) {
    if (!input.enterOnCorrect) return;

    await db.execute(
      `
        INSERT INTO review_items (
          source_type, source_id, prompt, answer, audio_text,
          due_at, interval_days, ease, repetitions, last_result, updated_at,
          exercise_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'correct', ?, ?)
        ON CONFLICT(source_type, source_id) DO NOTHING
      `,
      [
        input.sourceType,
        input.sourceId,
        input.prompt,
        input.expected,
        input.audioText ?? null,
        schedule.dueAt,
        schedule.intervalDays,
        START_EASE,
        now.toISOString(),
        exerciseJson,
      ],
    );

    return;
  }

  await upsertMistake(
    input.sourceType,
    input.sourceId,
    input.category,
    input.prompt,
    input.expected,
    input.userAnswer,
  );

  await db.execute(
    `
      INSERT INTO review_items (
        source_type, source_id, prompt, answer, audio_text,
        due_at, interval_days, ease, repetitions, last_result, updated_at,
        exercise_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'wrong', ?, ?)
      ON CONFLICT(source_type, source_id) DO UPDATE SET
        prompt = excluded.prompt,
        answer = excluded.answer,
        audio_text = excluded.audio_text,
        due_at = excluded.due_at,
        interval_days = 1,
        ease = MAX(1.3, review_items.ease - 0.2),
        repetitions = 0,
        last_result = 'wrong',
        updated_at = excluded.updated_at,
        exercise_json = COALESCE(excluded.exercise_json, review_items.exercise_json)
    `,
    [
      input.sourceType,
      input.sourceId,
      input.prompt,
      input.expected,
      input.audioText ?? null,
      schedule.dueAt,
      schedule.intervalDays,
      START_EASE,
      now.toISOString(),
      exerciseJson,
    ],
  );
}

/** Fire-and-forget wrapper so tracking never blocks or breaks a lesson. */
export function trackAnswer(input: AnswerRecord): void {
  recordAnswer(input).catch((error) => {
    console.error("Failed to record answer for review:", error);
  });
}

interface ReviewItemDbRow {
  id: number;
  source_type: ReviewSourceType;
  source_id: string;
  prompt: string;
  answer: string;
  audio_text: string | null;
  due_at: string;
  interval_days: number;
  ease: number;
  repetitions: number;
  exercise_json: string | null;
}

function toReviewItem(row: ReviewItemDbRow): ReviewItem {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    prompt: row.prompt,
    answer: row.answer,
    audioText: row.audio_text,
    dueAt: row.due_at,
    intervalDays: row.interval_days,
    ease: row.ease,
    repetitions: row.repetitions,
    exerciseJson: row.exercise_json,
  };
}

export async function getDueReviewItems(limit = 20): Promise<ReviewItem[]> {
  const db = await getDatabase();

  const rows = await db.select<ReviewItemDbRow[]>(
    `
      SELECT id, source_type, source_id, prompt, answer, audio_text,
             due_at, interval_days, ease, repetitions, exercise_json
      FROM review_items
      WHERE due_at <= ?
      ORDER BY due_at ASC
      LIMIT ?
    `,
    [endOfToday(), limit],
  );

  return rows.map(toReviewItem);
}

export async function getReviewStats(): Promise<ReviewStats> {
  const db = await getDatabase();

  const due = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) AS count FROM review_items WHERE due_at <= ?`,
    [endOfToday()],
  );

  const unresolved = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) AS count FROM mistakes WHERE resolved_at IS NULL`,
  );

  const next = await db.select<{ due_at: string | null }[]>(
    `SELECT MIN(due_at) AS due_at FROM review_items WHERE due_at > ?`,
    [endOfToday()],
  );

  return {
    dueToday: due[0]?.count ?? 0,
    unresolvedMistakes: unresolved[0]?.count ?? 0,
    nextDueAt: next[0]?.due_at ?? null,
  };
}

/** Apply a Correct / Again result and reschedule the item. */
export async function applyReviewResult(
  item: ReviewItem,
  correct: boolean,
) {
  const db = await getDatabase();
  const now = new Date();

  // Use the stored schedule, not the session snapshot, in case the item was
  // rescheduled or deleted while the session was open.
  const current = await db.select<
    { interval_days: number; ease: number; repetitions: number }[]
  >(
    `SELECT interval_days, ease, repetitions FROM review_items WHERE id = ?`,
    [item.id],
  );

  if (current.length === 0) return;

  const next = scheduleNext(
    {
      intervalDays: current[0].interval_days,
      ease: current[0].ease,
      repetitions: current[0].repetitions,
    },
    correct,
    now,
  );

  await db.execute(
    `
      UPDATE review_items
      SET due_at = ?, interval_days = ?, ease = ?, repetitions = ?,
          last_result = ?, updated_at = ?
      WHERE id = ?
    `,
    [
      next.dueAt,
      next.intervalDays,
      next.ease,
      next.repetitions,
      correct ? "correct" : "wrong",
      now.toISOString(),
      item.id,
    ],
  );

  if (!correct) {
    await upsertMistake(
      item.sourceType,
      item.sourceId,
      item.sourceType,
      item.prompt,
      item.answer,
      "(marked Again in review)",
    );

    return;
  }

  if (next.repetitions >= REPETITIONS_TO_RESOLVE) {
    await db.execute(
      `
        UPDATE mistakes
        SET resolved_at = ?
        WHERE item_key = ? AND resolved_at IS NULL
      `,
      [now.toISOString(), itemKey(item.sourceType, item.sourceId)],
    );
  }
}

interface MistakeDbRow {
  id: number;
  lesson_id: string;
  category: string;
  prompt: string;
  expected_answer: string;
  times_missed: number;
  resolved_at: string | null;
}

export async function getMistakes(): Promise<MistakeRow[]> {
  const db = await getDatabase();

  const rows = await db.select<MistakeDbRow[]>(
    `
      SELECT id, lesson_id, category, prompt, expected_answer,
             times_missed, resolved_at
      FROM mistakes
      ORDER BY (resolved_at IS NOT NULL) ASC, times_missed DESC, id DESC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    lessonId: row.lesson_id,
    category: row.category,
    prompt: row.prompt,
    expected: row.expected_answer,
    timesMissed: row.times_missed,
    resolved: row.resolved_at !== null,
  }));
}

/*
 * Planner data + preferences
 */

export interface PlannerData {
  dueReviewCount: number;
  dueReviewKeys: string[];
  unresolvedMistakes: PlannerMistake[];
  nextDueAt: string | null;
}

export async function getPlannerData(): Promise<PlannerData> {
  const db = await getDatabase();

  const stats = await getReviewStats();

  const dueRows = await db.select<
    { source_type: string; source_id: string }[]
  >(
    `SELECT source_type, source_id FROM review_items WHERE due_at <= ?`,
    [endOfToday()],
  );

  const mistakeRows = await db.select<
    {
      id: number;
      lesson_id: string;
      item_key: string;
      prompt: string;
      times_missed: number;
    }[]
  >(
    `
      SELECT id, lesson_id, item_key, prompt, times_missed
      FROM mistakes
      WHERE resolved_at IS NULL
    `,
  );

  return {
    dueReviewCount: stats.dueToday,
    dueReviewKeys: dueRows.map(
      (row) => `${row.source_type}:${row.source_id}`,
    ),
    unresolvedMistakes: mistakeRows.map((row) => ({
      id: row.id,
      lessonId: row.lesson_id,
      itemKey: row.item_key,
      prompt: row.prompt,
      timesMissed: row.times_missed,
    })),
    nextDueAt: stats.nextDueAt,
  };
}

const STUDY_MINUTES_KEY = "study_minutes";

export async function getStudyMinutes(): Promise<number | null> {
  const db = await getDatabase();

  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_state WHERE key = ?`,
    [STUDY_MINUTES_KEY],
  );

  const parsed = rows.length > 0 ? Number(rows[0].value) : NaN;

  return Number.isFinite(parsed) ? parsed : null;
}

export async function setStudyMinutes(minutes: number) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO app_state (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [STUDY_MINUTES_KEY, String(minutes)],
  );
}

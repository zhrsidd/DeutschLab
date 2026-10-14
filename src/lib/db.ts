import Database from "@tauri-apps/plugin-sql";

import {
  checkpointConfigFor,
  parseSections,
  serializeSections,
  type CheckpointResult,
  type SectionScores,
} from "./checkpointScoring";

import { buildReviewExercise, lessonIdFor } from "./reviewExercises";

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
/** Used only by the opt-in native self-test, so it never touches learner data. */
export const SELFTEST_DATABASE_URL = "sqlite:deutschlab-selftest.db";

let databaseUrl = DATABASE_URL;

let databasePromise: Promise<Database> | null = null;

/** Shared connection; also used by the AI store (src/lib/ai/store.ts). */
export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load(databaseUrl);
  }

  return databasePromise;
}

/**
 * Points this session at the self-test database. Only allowed before the
 * database has been opened, so learner data can never be mixed in.
 */
export function useSelfTestDatabase() {
  if (databasePromise && databaseUrl !== SELFTEST_DATABASE_URL) {
    throw new Error("The learner database is already open.");
  }

  databaseUrl = SELFTEST_DATABASE_URL;
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS checkpoint_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkpoint_id TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      total_possible INTEGER NOT NULL,
      section_scores_json TEXT NOT NULL,
      passed INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    )
  `);

  // v0.8: indexes for the Review and mistakes queries. Additive and
  // idempotent; they only change query plans, never data.
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_review_items_due ON review_items (due_at)`,
  );

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_mistakes_open_key
    ON mistakes (item_key) WHERE resolved_at IS NULL
  `);

  // v0.4A: structured exercise data. Older databases get the column added;
  // existing rows keep NULL and are rebuilt (or shown as legacy cards).
  const columns = await db.select<{ name: string }[]>(
    `PRAGMA table_info(review_items)`,
  );

  if (!columns.some((column) => column.name === "exercise_json")) {
    await db.execute(`ALTER TABLE review_items ADD COLUMN exercise_json TEXT`);
  }

  // v1.1: an append-only log of review answers for Progress. Lesson and
  // checkpoint attempts already keep their own timestamped rows. Additive:
  // nothing existing is read, changed or backfilled.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS study_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      item_key TEXT,
      correct INTEGER,
      occurred_at TEXT NOT NULL
    )
  `);

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_study_events_time ON study_events (occurred_at)`,
  );

  // AI v1.1: optional AI feedback history, tutor sessions and a local usage
  // log. Additive and idempotent; nothing existing is read or changed, and
  // no credential is ever stored here (the API key lives in the Keychain).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_assessments (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      rubric_version TEXT NOT NULL,
      input_text TEXT NOT NULL,
      input_source TEXT NOT NULL,
      original_transcript TEXT,
      feedback_json TEXT NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      revision_of TEXT
    )
  `);

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_ai_assessments_task ON ai_assessments (task_id, created_at)`,
  );

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_tutor_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      mode TEXT NOT NULL,
      topic TEXT NOT NULL,
      level TEXT NOT NULL,
      grammar_focus TEXT,
      correction_mode TEXT NOT NULL,
      context_week INTEGER NOT NULL,
      model TEXT NOT NULL,
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      messages_json TEXT NOT NULL,
      summary_json TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      occurred_at TEXT NOT NULL,
      feature TEXT NOT NULL,
      model TEXT NOT NULL,
      outcome TEXT NOT NULL,
      error_kind TEXT,
      input_tokens INTEGER,
      output_tokens INTEGER
    )
  `);

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_ai_usage_time ON ai_usage (occurred_at)`,
  );
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
      lessonIdFor(sourceType, sourceId),
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

  // Progress history only; scheduling above is unchanged.
  await db.execute(
    `INSERT INTO study_events (kind, item_key, correct, occurred_at) VALUES ('review', ?, ?, ?)`,
    [itemKey(item.sourceType, item.sourceId), correct ? 1 : 0, now.toISOString()],
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

/** How many mistakes the Review screen lists (the counts are exact). */
export const MISTAKE_LIST_LIMIT = 100;

/** Unresolved first, then the most-missed; capped so Review stays fast. */
export async function getMistakes(
  limit = MISTAKE_LIST_LIMIT,
): Promise<MistakeRow[]> {
  const db = await getDatabase();

  const rows = await db.select<MistakeDbRow[]>(
    `
      SELECT id, lesson_id, category, prompt, expected_answer,
             times_missed, resolved_at
      FROM mistakes
      ORDER BY (resolved_at IS NOT NULL) ASC, times_missed DESC, id DESC
      LIMIT ?
    `,
    [limit],
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
  /** Checkpoints the learner has attempted at least once. */
  attemptedCheckpointIds: string[];
  dueReviewCount: number;
  dueReviewKeys: string[];
  unresolvedMistakes: PlannerMistake[];
  nextDueAt: string | null;
}

/**
 * How many weak-area candidates Today considers. The planner shows at most
 * one; the rest only matter if the top ones are dismissed this session or
 * belong to an unfinished lesson.
 */
export const PLANNER_MISTAKE_LIMIT = 200;

export async function getPlannerData(): Promise<PlannerData> {
  const db = await getDatabase();

  const stats = await getReviewStats();

  // Weak-area candidates only: unresolved mistakes whose concept has no
  // review due today (a due review already covers it), strongest first and
  // capped. Earlier versions returned every due key and every mistake, which
  // grew linearly with the database (v0.8 audit, risk 4); the plan is the same.
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
      SELECT m.id, m.lesson_id, m.item_key, m.prompt, m.times_missed
      FROM mistakes m
      WHERE m.resolved_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM review_items r
          WHERE r.source_type = substr(m.item_key, 1, instr(m.item_key, ':') - 1)
            AND r.source_id = substr(m.item_key, instr(m.item_key, ':') + 1)
            AND r.due_at <= ?
        )
      ORDER BY m.times_missed DESC, m.id DESC
      LIMIT ?
    `,
    [endOfToday(), PLANNER_MISTAKE_LIMIT],
  );

  const attempted = await db.select<{ checkpoint_id: string }[]>(
    `SELECT DISTINCT checkpoint_id FROM checkpoint_attempts`,
  );

  return {
    attemptedCheckpointIds: attempted.map((row) => row.checkpoint_id),
    dueReviewCount: stats.dueToday,
    // Mistakes with a due review are already excluded above.
    dueReviewKeys: [],
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

/*
 * Checkpoint attempts (every attempt is kept; nothing is overwritten)
 */

export interface CheckpointAttemptRow {
  id: number;
  checkpointId: string;
  total: number;
  possible: number;
  sections: Partial<SectionScores> | null;
  passed: boolean;
  completedAt: string;
}

export async function saveCheckpointAttempt(
  checkpointId: string,
  result: CheckpointResult,
) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO checkpoint_attempts (
        checkpoint_id, total_score, total_possible,
        section_scores_json, passed, completed_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      checkpointId,
      result.total,
      result.possible,
      serializeSections(result),
      result.passed ? 1 : 0,
      new Date().toISOString(),
    ],
  );
}

export async function getCheckpointAttempts(
  checkpointId: string,
): Promise<CheckpointAttemptRow[]> {
  const db = await getDatabase();

  const rows = await db.select<
    {
      id: number;
      checkpoint_id: string;
      total_score: number;
      total_possible: number;
      section_scores_json: string;
      passed: number;
      completed_at: string;
    }[]
  >(
    `
      SELECT id, checkpoint_id, total_score, total_possible,
             section_scores_json, passed, completed_at
      FROM checkpoint_attempts
      WHERE checkpoint_id = ?
      ORDER BY id ASC
    `,
    [checkpointId],
  );

  return rows.map((row) => ({
    id: row.id,
    checkpointId: row.checkpoint_id,
    total: row.total_score,
    possible: row.total_possible,
    sections: parseSections(
      row.section_scores_json,
      checkpointConfigFor(row.checkpoint_id),
    ),
    passed: row.passed === 1,
    completedAt: row.completed_at,
  }));
}

/*
 * Writing drafts (kept in app_state, so no schema change is needed)
 */

const draftKey = (taskId: string) => `writing_draft:${taskId}`;

/** The saved draft for a writing task, or "" if there is none. */
export async function getWritingDraft(taskId: string): Promise<string> {
  const db = await getDatabase();

  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_state WHERE key = ?`,
    [draftKey(taskId)],
  );

  return rows.length > 0 ? rows[0].value : "";
}

export async function saveWritingDraft(taskId: string, text: string) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO app_state (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [draftKey(taskId), text],
  );
}

/** Deliberately discards the draft (the learner chose to start again). */
export async function clearWritingDraft(taskId: string) {
  const db = await getDatabase();

  await db.execute(`DELETE FROM app_state WHERE key = ?`, [draftKey(taskId)]);
}

/*
 * Vocabulary batch position for resumable lessons (v1.0). Stored in
 * app_state so it lives in the database file with the rest of the learner's
 * progress; see src/lib/vocabResume.ts for the localStorage migration.
 */

const vocabResumeKey = (taskId: string) => `vocab_resume:${taskId}`;

/** The saved batch index, or null when nothing (or nothing valid) is stored. */
export async function getVocabResume(taskId: string): Promise<number | null> {
  const db = await getDatabase();

  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_state WHERE key = ?`,
    [vocabResumeKey(taskId)],
  );

  const parsed = rows.length > 0 ? Number(rows[0].value) : NaN;

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function saveVocabResume(taskId: string, batchIndex: number) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO app_state (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [vocabResumeKey(taskId), String(batchIndex)],
  );
}

/** Forgets the position once the lesson has been finished. */
export async function clearVocabResume(taskId: string) {
  const db = await getDatabase();

  await db.execute(`DELETE FROM app_state WHERE key = ?`, [vocabResumeKey(taskId)]);
}

/*
 * Backup (v1.0). Read-only: exporting never changes the database.
 */

/** Every learner table, in a stable order, for the JSON export. */
export const LEARNER_TABLES = [
  "task_progress",
  "lesson_attempts",
  "checkpoint_attempts",
  "review_items",
  "mistakes",
  "app_state",
  "study_events",
  "ai_assessments",
  "ai_tutor_sessions",
  "ai_usage",
] as const;

export type LearnerTable = (typeof LEARNER_TABLES)[number];

/** All rows of every learner table, oldest first. */
export async function exportLearnerTables(): Promise<
  Record<LearnerTable, Record<string, unknown>[]>
> {
  const db = await getDatabase();
  const out = {} as Record<LearnerTable, Record<string, unknown>[]>;

  // Table names come from the constant list above, never from input.
  for (const table of LEARNER_TABLES) {
    out[table] = await db.select<Record<string, unknown>[]>(
      `SELECT * FROM ${table} ORDER BY rowid`,
    );
  }

  return out;
}

/**
 * Writes a consistent copy of the whole database (including anything still
 * in the WAL file) to `path`. SQLite refuses if the file already exists.
 */
export async function snapshotDatabase(path: string) {
  const db = await getDatabase();

  await db.execute(`VACUUM INTO ?`, [path]);
}

/*
 * Progress (v1.1). Read-only; every figure comes from persisted rows.
 */

export interface ProgressData {
  /** Timestamps of lesson attempts, checkpoint attempts and review answers in the window. */
  activity: { kind: "lesson" | "checkpoint" | "review"; at: string }[];
  /** Latest and best attempt per lesson. */
  lessonScores: {
    taskId: string;
    latestScore: number;
    latestTotal: number;
    bestFraction: number;
    attempts: number;
  }[];
  checkpointAttempts: CheckpointAttemptRow[];
  /** Review answers in the window (recorded from v1.1 on). */
  reviewAnswers: { correct: boolean; at: string }[];
  /** Review items by how many times in a row they were recalled. */
  reviewStages: { repetitions: number; count: number }[];
  /** Unresolved mistakes per lesson, most first. */
  openMistakesByLesson: { lessonId: string; count: number }[];
  /** First recorded study_events row, to say since when reviews are counted. */
  reviewHistoryStartedAt: string | null;
}

/** Everything Progress shows; `since` bounds the time-based series. */
export async function getProgressData(since: Date): Promise<ProgressData> {
  const db = await getDatabase();
  const from = since.toISOString();

  const activity = await db.select<{ kind: "lesson" | "checkpoint" | "review"; at: string }[]>(
    `
      SELECT 'lesson' AS kind, completed_at AS at FROM lesson_attempts WHERE completed_at >= ?
      UNION ALL
      SELECT 'checkpoint', completed_at FROM checkpoint_attempts WHERE completed_at >= ?
      UNION ALL
      SELECT 'review', occurred_at FROM study_events WHERE kind = 'review' AND occurred_at >= ?
    `,
    [from, from, from],
  );

  const scores = await db.select<
    { task_id: string; score: number; total: number; best: number; attempts: number }[]
  >(
    `
      SELECT a.task_id, a.score, a.total, s.best, s.attempts
      FROM lesson_attempts a
      JOIN (
        SELECT task_id, MAX(id) AS last_id, COUNT(*) AS attempts,
               MAX(CAST(score AS REAL) / NULLIF(total, 0)) AS best
        FROM lesson_attempts GROUP BY task_id
      ) s ON s.last_id = a.id
      ORDER BY a.task_id
    `,
  );

  const answers = await db.select<{ correct: number; at: string }[]>(
    `SELECT correct, occurred_at AS at FROM study_events WHERE kind = 'review' AND occurred_at >= ? ORDER BY id`,
    [from],
  );

  const stages = await db.select<{ repetitions: number; count: number }[]>(
    `SELECT MIN(repetitions, 4) AS repetitions, COUNT(*) AS count FROM review_items GROUP BY MIN(repetitions, 4) ORDER BY 1`,
  );

  const open = await db.select<{ lesson_id: string; count: number }[]>(
    `
      SELECT lesson_id, COUNT(*) AS count FROM mistakes
      WHERE resolved_at IS NULL GROUP BY lesson_id ORDER BY count DESC, lesson_id LIMIT 8
    `,
  );

  const firstEvent = await db.select<{ at: string | null }[]>(
    `SELECT MIN(occurred_at) AS at FROM study_events`,
  );

  const checkpoints = (
    await Promise.all(
      ["checkpoint-001", "checkpoint-002", "checkpoint-003", "checkpoint-004"].map((id) =>
        getCheckpointAttempts(id),
      ),
    )
  ).flat();

  return {
    activity,
    lessonScores: scores.map((row) => ({
      taskId: row.task_id,
      latestScore: row.score,
      latestTotal: row.total,
      bestFraction: row.best ?? 0,
      attempts: row.attempts,
    })),
    checkpointAttempts: checkpoints,
    reviewAnswers: answers.map((row) => ({ correct: row.correct === 1, at: row.at })),
    reviewStages: stages,
    openMistakesByLesson: open.map((row) => ({ lessonId: row.lesson_id, count: row.count })),
    reviewHistoryStartedAt: firstEvent[0]?.at ?? null,
  };
}

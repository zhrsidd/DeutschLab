import Database from "@tauri-apps/plugin-sql";

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
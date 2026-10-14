/*
 * Local AI history: assessments, tutor sessions and the usage log
 * (tables created additively in initialiseDatabase). Every query is bounded.
 * Raw API responses, audio and credentials are never stored.
 */

import { getDatabase } from "../db";

import type {
  AIFeature,
  AssessmentFeedback,
  AssessmentRecord,
  SessionSummary,
  TutorMessage,
  TutorSession,
} from "./types";

export const HISTORY_LIMIT = 20;
export const SESSION_LIST_LIMIT = 20;
export const USAGE_WINDOW_DAYS = 30;

export function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

/*
 * Assessments
 */

interface AssessmentRow {
  id: string;
  task_id: string;
  kind: string;
  created_at: string;
  provider: string;
  model: string;
  rubric_version: string;
  input_text: string;
  input_source: string;
  original_transcript: string | null;
  feedback_json: string;
  score: number;
  max_score: number;
  revision_of: string | null;
}

export async function saveAssessment(record: AssessmentRecord) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO ai_assessments
        (id, task_id, kind, created_at, provider, model, rubric_version, input_text,
         input_source, original_transcript, feedback_json, score, max_score, revision_of)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      record.id,
      record.taskId,
      record.kind,
      record.createdAt,
      record.provider,
      record.model,
      record.rubricVersion,
      record.inputText,
      record.inputSource,
      record.originalTranscript,
      JSON.stringify(record.feedback),
      record.score,
      record.maxScore,
      record.revisionOf,
    ],
  );
}

function rowToAssessment(row: AssessmentRow): AssessmentRecord | null {
  try {
    return {
      id: row.id,
      taskId: row.task_id,
      kind: row.kind === "speaking" ? "speaking" : "writing",
      createdAt: row.created_at,
      provider: "gemini",
      model: row.model,
      rubricVersion: row.rubric_version,
      inputText: row.input_text,
      inputSource:
        row.input_source === "model_transcript" || row.input_source === "edited_transcript"
          ? row.input_source
          : "typed",
      originalTranscript: row.original_transcript,
      feedback: JSON.parse(row.feedback_json) as AssessmentFeedback,
      score: row.score,
      maxScore: row.max_score,
      revisionOf: row.revision_of,
    };
  } catch {
    return null; // a damaged row is skipped, never shown as a score
  }
}

/** Most recent first. */
export async function listAssessments(taskId: string, limit = HISTORY_LIMIT): Promise<AssessmentRecord[]> {
  const db = await getDatabase();
  const rows = await db.select<AssessmentRow[]>(
    `SELECT * FROM ai_assessments WHERE task_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?`,
    [taskId, limit],
  );
  return rows.map(rowToAssessment).filter((row): row is AssessmentRecord => row !== null);
}

/*
 * Tutor sessions
 */

interface SessionRow {
  id: string;
  mode: string;
  topic: string;
  level: string;
  grammar_focus: string | null;
  correction_mode: string;
  context_week: number;
  model: string;
  started_at: string;
  updated_at: string;
  messages_json: string;
  summary_json: string | null;
}

export async function saveTutorSession(session: TutorSession) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO ai_tutor_sessions
        (id, mode, topic, level, grammar_focus, correction_mode, context_week, model,
         started_at, updated_at, messages_json, summary_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        correction_mode = excluded.correction_mode,
        updated_at = excluded.updated_at,
        messages_json = excluded.messages_json,
        summary_json = excluded.summary_json
    `,
    [
      session.id,
      session.mode,
      session.topic,
      session.level,
      session.grammarFocus,
      session.correctionMode,
      session.contextWeek,
      session.model,
      session.startedAt,
      session.updatedAt,
      JSON.stringify(session.messages),
      session.summary ? JSON.stringify(session.summary) : null,
    ],
  );
}

function rowToSession(row: SessionRow): TutorSession | null {
  try {
    return {
      id: row.id,
      mode: row.mode === "free" ? "free" : "guided",
      topic: row.topic,
      level: row.level === "stretch" ? "stretch" : "gentle",
      grammarFocus: row.grammar_focus,
      correctionMode: row.correction_mode === "delayed" ? "delayed" : "immediate",
      contextWeek: row.context_week,
      model: row.model,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      messages: JSON.parse(row.messages_json) as TutorMessage[],
      summary: row.summary_json ? (JSON.parse(row.summary_json) as SessionSummary) : null,
    };
  } catch {
    return null;
  }
}

export async function listTutorSessions(limit = SESSION_LIST_LIMIT): Promise<TutorSession[]> {
  const db = await getDatabase();
  const rows = await db.select<SessionRow[]>(
    `SELECT * FROM ai_tutor_sessions ORDER BY updated_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(rowToSession).filter((row): row is TutorSession => row !== null);
}

export async function deleteTutorSession(id: string) {
  const db = await getDatabase();
  await db.execute(`DELETE FROM ai_tutor_sessions WHERE id = ?`, [id]);
}

/*
 * Usage log
 */

export type UsageOutcome = "ok" | "error" | "rate_limited" | "invalid_output";

export async function recordUsage(entry: {
  feature: AIFeature | "connection";
  model: string;
  outcome: UsageOutcome;
  errorKind?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  at?: Date;
}) {
  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO ai_usage (occurred_at, feature, model, outcome, error_kind, input_tokens, output_tokens)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      (entry.at ?? new Date()).toISOString(),
      entry.feature,
      entry.model,
      entry.outcome,
      entry.errorKind ?? null,
      entry.inputTokens ?? null,
      entry.outputTokens ?? null,
    ],
  );
}

export function startOfLocalDay(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Requests sent to the provider today (local day). Connection tests don't count. */
export async function countRequestsToday(now = new Date()): Promise<number> {
  const db = await getDatabase();
  const rows = await db.select<{ n: number }[]>(
    `SELECT COUNT(*) AS n FROM ai_usage WHERE occurred_at >= ? AND feature != 'connection'`,
    [startOfLocalDay(now).toISOString()],
  );
  return Number(rows[0]?.n ?? 0);
}

export interface UsageSummary {
  today: number;
  windowDays: number;
  requests: number;
  successes: number;
  failures: number;
  rateLimited: number;
  inputTokens: number;
  outputTokens: number;
  byModel: { model: string; requests: number }[];
  byFeature: { feature: string; requests: number }[];
  assessments: number;
  tutorSessions: number;
}

export async function getUsageSummary(now = new Date()): Promise<UsageSummary> {
  const db = await getDatabase();
  const since = new Date(startOfLocalDay(now).getTime() - (USAGE_WINDOW_DAYS - 1) * 86_400_000).toISOString();

  const totals = await db.select<
    { requests: number; ok: number | null; limited: number | null; input: number | null; output: number | null }[]
  >(
    `
      SELECT COUNT(*) AS requests,
             SUM(outcome = 'ok') AS ok,
             SUM(outcome = 'rate_limited') AS limited,
             SUM(input_tokens) AS input,
             SUM(output_tokens) AS output
      FROM ai_usage
      WHERE occurred_at >= ? AND feature != 'connection'
    `,
    [since],
  );
  const byModel = await db.select<{ model: string; requests: number }[]>(
    `SELECT model, COUNT(*) AS requests FROM ai_usage
     WHERE occurred_at >= ? AND feature != 'connection' GROUP BY model ORDER BY requests DESC LIMIT 10`,
    [since],
  );
  const byFeature = await db.select<{ feature: string; requests: number }[]>(
    `SELECT feature, COUNT(*) AS requests FROM ai_usage
     WHERE occurred_at >= ? AND feature != 'connection' GROUP BY feature ORDER BY requests DESC LIMIT 10`,
    [since],
  );
  const counts = await db.select<{ assessments: number; sessions: number }[]>(
    `SELECT (SELECT COUNT(*) FROM ai_assessments) AS assessments,
            (SELECT COUNT(*) FROM ai_tutor_sessions) AS sessions`,
  );

  const total = totals[0];
  const requests = Number(total?.requests ?? 0);
  const successes = Number(total?.ok ?? 0);

  return {
    today: await countRequestsToday(now),
    windowDays: USAGE_WINDOW_DAYS,
    requests,
    successes,
    failures: requests - successes,
    rateLimited: Number(total?.limited ?? 0),
    inputTokens: Number(total?.input ?? 0),
    outputTokens: Number(total?.output ?? 0),
    byModel: byModel.map((row) => ({ model: row.model, requests: Number(row.requests) })),
    byFeature: byFeature.map((row) => ({ feature: row.feature, requests: Number(row.requests) })),
    assessments: Number(counts[0]?.assessments ?? 0),
    tutorSessions: Number(counts[0]?.sessions ?? 0),
  };
}

/** Deletes every local AI record. Lessons, scores, Review and drafts are untouched. */
export async function deleteAllAIHistory() {
  const db = await getDatabase();
  await db.execute(`DELETE FROM ai_assessments`);
  await db.execute(`DELETE FROM ai_tutor_sessions`);
  await db.execute(`DELETE FROM ai_usage`);
}

/*
 * Deutsch mit KI: a curriculum-aware, turn-based German tutor.
 *
 * The opening question is written locally (no request). Each learner turn
 * sends a bounded window of recent messages plus a compact curriculum
 * context; a turn is only added to the session once the reply has passed
 * validation, so a failed request never loses or half-saves anything.
 */

import { loadLearnerContext, type LearnerContext } from "./context";
import { AIError } from "./errors";
import { generate } from "./native";
import {
  FREE_OPENER,
  FREE_OPENER_ENGLISH,
  GRAMMAR_FOCUS,
  SUMMARY_INSTRUCTION,
  TUTOR_TOPICS,
  tutorInstruction,
} from "./prompts";
import { contextForPrompt } from "./context";
import { runAIRequest } from "./request";
import { SUMMARY_SCHEMA, TUTOR_SCHEMA, validateSessionSummary, validateTutorReply } from "./schemas";
import { loadAISettings, type AISettings } from "./settings";
import { newId, saveTutorSession } from "./store";
import type { CorrectionMode, TutorLevel, TutorMessage, TutorMode, TutorSession } from "./types";

/** Messages sent as conversation history (the rest stays local). */
export const TUTOR_HISTORY_WINDOW = 12;
export const MAX_LEARNER_MESSAGE = 600;

export const topicsFor = (week: number) =>
  TUTOR_TOPICS.map((topic) => ({ ...topic, available: topic.fromWeek <= week }));

export const grammarFocusFor = (week: number) => GRAMMAR_FOCUS.filter((focus) => focus.fromWeek <= week);

export const learnerTurns = (session: TutorSession) =>
  session.messages.filter((message) => message.role === "learner").length;

export function startTutorSession(input: {
  mode: TutorMode;
  topicId: string;
  level: TutorLevel;
  grammarFocusId: string | null;
  correctionMode: CorrectionMode;
  context: LearnerContext;
  model: string;
  now?: Date;
}): TutorSession {
  const now = (input.now ?? new Date()).toISOString();
  const topic = TUTOR_TOPICS.find((t) => t.id === input.topicId && t.fromWeek <= input.context.currentWeek);
  if (input.mode === "guided" && !topic) throw new AIError("invalid_request", "That topic is not available yet.");

  const focus = grammarFocusFor(input.context.currentWeek).find((f) => f.id === input.grammarFocusId) ?? null;
  const opener: TutorMessage = {
    id: newId("msg"),
    role: "tutor",
    text: input.mode === "guided" ? topic!.opener : FREE_OPENER,
    english: input.mode === "guided" ? topic!.openerEnglish : FREE_OPENER_ENGLISH,
    at: now,
  };

  return {
    id: newId("tutor"),
    mode: input.mode,
    topic: input.mode === "guided" ? topic!.label : "Free conversation",
    level: input.level,
    grammarFocus: focus?.label ?? null,
    correctionMode: input.correctionMode,
    contextWeek: input.context.currentWeek,
    model: input.model,
    startedAt: now,
    updatedAt: now,
    messages: [opener],
    summary: null,
  };
}

/** Recent history, starting with a learner turn (the opener is in the instruction). */
export function historyTurns(messages: TutorMessage[]): { role: "user" | "model"; text: string }[] {
  const recent = messages.slice(-TUTOR_HISTORY_WINDOW);
  const firstLearner = recent.findIndex((message) => message.role === "learner");
  return (firstLearner === -1 ? [] : recent.slice(firstLearner)).map((message) => ({
    role: message.role === "learner" ? "user" : "model",
    text: message.text,
  }));
}

export async function sendTutorTurn(
  session: TutorSession,
  learnerText: string,
  source: "typed" | "voice",
  options: { settings?: AISettings; context?: LearnerContext } = {},
): Promise<TutorSession> {
  const text = learnerText.trim();
  if (!text) throw new AIError("too_short", "Write something first.");
  if (text.length > MAX_LEARNER_MESSAGE) {
    throw new AIError("too_long", `Keep each message under ${MAX_LEARNER_MESSAGE} characters.`);
  }

  const settings = options.settings ?? (await loadAISettings());
  if (learnerTurns(session) >= settings.tutorTurnLimit) {
    throw new AIError("session_limit", `This conversation has reached ${settings.tutorTurnLimit} turns.`);
  }

  const context = options.context ?? (await loadLearnerContext());
  const learner: TutorMessage = { id: newId("msg"), role: "learner", text, at: new Date().toISOString(), source };
  const opener = session.messages[0];
  const instruction = [
    tutorInstruction({
      context,
      mode: session.mode,
      topic: session.topic,
      level: session.level,
      grammarFocus: session.grammarFocus,
      correctionMode: session.correctionMode,
    }),
    opener ? `You opened the conversation with: «${opener.text}»` : "",
  ].join("\n\n");

  const { value: reply } = await runAIRequest({
    feature: "tutor",
    model: session.model,
    settings,
    send: () =>
      generate({
        model: session.model,
        systemInstruction: instruction,
        turns: [...historyTurns(session.messages), { role: "user", text }],
        responseSchema: TUTOR_SCHEMA,
        maxOutputTokens: 4096,
        temperature: 0.6,
      }),
    validate: (raw) =>
      validateTutorReply(raw.text, {
        learnerMessage: text,
        correctionsWanted: session.correctionMode === "immediate",
      }),
  });

  const tutor: TutorMessage = {
    id: newId("msg"),
    role: "tutor",
    text: reply.reply,
    english: reply.english || undefined,
    newWords: reply.newWords.length ? reply.newWords : undefined,
    at: new Date().toISOString(),
  };

  // Corrections belong to the learner's message they refer to.
  learner.corrections = reply.corrections.length ? reply.corrections : undefined;

  const next: TutorSession = {
    ...session,
    messages: [...session.messages, learner, tutor],
    updatedAt: tutor.at,
  };
  await saveTutorSession(next);
  return next;
}

export async function setCorrectionMode(session: TutorSession, mode: CorrectionMode): Promise<TutorSession> {
  const next = { ...session, correctionMode: mode, updatedAt: new Date().toISOString() };
  // A session with only the opener has nothing worth saving yet.
  if (learnerTurns(next) > 0) await saveTutorSession(next);
  return next;
}

/** End-of-session summary. With no learner messages, nothing is sent. */
export async function summariseSession(
  session: TutorSession,
  options: { settings?: AISettings; context?: LearnerContext } = {},
): Promise<TutorSession> {
  const learnerMessages = session.messages.filter((m) => m.role === "learner").map((m) => m.text);
  if (learnerMessages.length === 0) {
    return { ...session, summary: { recurringMistakes: [], strengths: [], recommendedLessons: [], nextStep: "" } };
  }

  const context = options.context ?? (await loadLearnerContext());
  const conversation = session.messages
    .map((m) => `${m.role === "learner" ? "Learner" : "Tutor"}: ${m.text}`)
    .join("\n");

  const { value: summary } = await runAIRequest({
    feature: "tutor_summary",
    model: session.model,
    settings: options.settings,
    send: () =>
      generate({
        model: session.model,
        systemInstruction: SUMMARY_INSTRUCTION,
        turns: [
          {
            role: "user",
            text: `<context>\n${contextForPrompt(context)}\n</context>\n\n<conversation>\n${conversation}\n</conversation>`,
          },
        ],
        responseSchema: SUMMARY_SCHEMA,
        maxOutputTokens: 4096,
        temperature: 0.2,
      }),
    validate: (raw) =>
      validateSessionSummary(raw.text, {
        learnerMessages,
        allowedLessonIds: context.lessonCatalog.map((lesson) => lesson.id),
      }),
  });

  const next = { ...session, summary, updatedAt: new Date().toISOString() };
  await saveTutorSession(next);
  return next;
}

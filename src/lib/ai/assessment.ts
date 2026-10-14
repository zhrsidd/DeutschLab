/*
 * AI Writing and Speaking Examiner (v1.1). Formative and advisory only:
 * results are saved to ai_assessments and nowhere else. They never change
 * lesson attempts, checkpoint results, completion, mistakes or Review.
 */

import { countWords } from "../text";

import { loadLearnerContext } from "./context";
import { AIError } from "./errors";
import { generate, transcribe } from "./native";
import { assessmentRequest, SPEAKING_EXAMINER_INSTRUCTION, WRITING_EXAMINER_INSTRUCTION, type TaskBrief } from "./prompts";
import { runAIRequest } from "./request";
import { ASSESSMENT_SCHEMA, validateAssessment } from "./schemas";
import { loadAISettings, MAX_WRITING_WORDS } from "./settings";
import { newId, saveAssessment } from "./store";
import type { AssessmentKind, AssessmentRecord, InputSource } from "./types";

export const MIN_ASSESSABLE_WORDS = 5;

function checkLength(text: string, kind: AssessmentKind) {
  const words = countWords(text);
  const what = kind === "speaking" ? "transcript" : "text";
  if (words < MIN_ASSESSABLE_WORDS) {
    throw new AIError("too_short", `Write at least ${MIN_ASSESSABLE_WORDS} words of German before asking for feedback.`);
  }
  if (words > MAX_WRITING_WORDS) {
    throw new AIError("too_long", `The ${what} has ${words} words; AI feedback accepts up to ${MAX_WRITING_WORDS}.`);
  }
  return words;
}

interface AssessInput {
  taskId: string;
  task: TaskBrief;
  text: string;
  revisionOf?: string | null;
}

async function assess(
  kind: AssessmentKind,
  input: AssessInput & { inputSource: InputSource; originalTranscript?: string | null; durationSeconds?: number },
): Promise<AssessmentRecord> {
  const learnerText = input.text.trim();
  const wordCount = checkLength(learnerText, kind);
  const settings = await loadAISettings();
  const model = settings.models[kind];
  const context = await loadLearnerContext();
  const allowedLessonIds = context.lessonCatalog.map((lesson) => lesson.id);

  const { value: feedback, result } = await runAIRequest({
    feature: kind,
    model,
    settings,
    send: () =>
      generate({
        model,
        systemInstruction: kind === "speaking" ? SPEAKING_EXAMINER_INSTRUCTION : WRITING_EXAMINER_INSTRUCTION,
        turns: [
          {
            role: "user",
            text: assessmentRequest({
              context,
              task: input.task,
              learnerText,
              wordCount,
              kind,
              durationSeconds: input.durationSeconds,
            }),
          },
        ],
        responseSchema: ASSESSMENT_SCHEMA,
        maxOutputTokens: 8192,
        temperature: 0.2,
      }),
    validate: (raw) => validateAssessment(raw.text, { kind, learnerText, allowedLessonIds }),
  });

  const record: AssessmentRecord = {
    id: newId("assessment"),
    taskId: input.taskId,
    kind,
    createdAt: new Date().toISOString(),
    provider: "gemini",
    model: result.model || model,
    rubricVersion: feedback.rubricVersion,
    inputText: learnerText,
    inputSource: input.inputSource,
    originalTranscript: input.originalTranscript ?? null,
    feedback,
    score: feedback.total,
    maxScore: feedback.maxTotal,
    revisionOf: input.revisionOf ?? null,
  };

  await saveAssessment(record);
  return record;
}

export const assessWriting = (input: AssessInput) => assess("writing", { ...input, inputSource: "typed" });

export const assessSpeaking = (
  input: AssessInput & { inputSource: InputSource; originalTranscript: string | null; durationSeconds?: number },
) => assess("speaking", input);

/*
 * Transcription
 */

export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

/** Sends one recording for transcription. The audio is not kept anywhere. */
export async function transcribeRecording(recording: Blob, mimeType: string): Promise<{ text: string; model: string }> {
  if (recording.size === 0) throw new AIError("empty_transcript", "The recording is empty. Record again.");

  const settings = await loadAISettings();
  const model = settings.models.transcription;
  const audioBase64 = await blobToBase64(recording);

  const { value, result } = await runAIRequest({
    feature: "transcription",
    model,
    settings,
    send: () => transcribe({ model, audioBase64, mimeType }),
    validate: (raw) => {
      const text = raw.text.replace(/\u0000/g, "").trim();
      if (!text) {
        throw new AIError("empty_transcript", "No speech was recognised. Try again a little closer to the microphone.");
      }
      if (text.length > 20_000) throw new AIError("invalid_output", "The transcript is unexpectedly long.");
      return text;
    },
  });

  return { text: value, model: result.model || model };
}

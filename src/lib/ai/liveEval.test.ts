// @vitest-environment node
import { describe, expect, it } from "vitest";

import { starterTasks } from "../../data/unit1";

import { buildLearnerContext } from "./context";
import { EVAL_CASES, EVAL_TASK, scoreCase, SPEAKING_EVAL_TASK } from "./evaluation";
import { assessmentRequest, SPEAKING_EXAMINER_INSTRUCTION, WRITING_EXAMINER_INSTRUCTION } from "./prompts";
import { ASSESSMENT_SCHEMA, validateAssessment } from "./schemas";
import { countWords } from "../text";

/*
 * OPT-IN live examiner evaluation. Skipped unless DEUTSCHLAB_LIVE_EVAL=1.
 * Uses ~27 requests on your own key (read from the environment, never from
 * the app or the repository):
 *
 *   DEUTSCHLAB_LIVE_EVAL=1 GEMINI_API_KEY=... [DEUTSCHLAB_EVAL_MODEL=gemini-3.8-flash] \
 *     npx vitest run src/lib/ai/liveEval.test.ts
 *
 * The request mirrors src-tauri/src/ai.rs (Interactions API, store=false).
 */

const enabled = process.env.DEUTSCHLAB_LIVE_EVAL === "1" && !!process.env.GEMINI_API_KEY;
const model = process.env.DEUTSCHLAB_EVAL_MODEL ?? "gemini-3.8-flash";

async function interact(system: string, text: string): Promise<string> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      model,
      store: false,
      system_instruction: system,
      input: [{ type: "user_input", content: text }],
      generation_config: { max_output_tokens: 8192, temperature: 0.2 },
      response_format: { type: "text", mime_type: "application/json", schema: ASSESSMENT_SCHEMA },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { steps?: { type: string; content?: { type: string; text?: string }[] }[] };
  return (body.steps ?? [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .map((part) => part.text ?? "")
    .join("");
}

describe.skipIf(!enabled)("live examiner evaluation", () => {
  // A Week 4 learner: Weeks 1–3 complete.
  const context = buildLearnerContext({ completed: starterTasks.filter((t) => (t.week ?? 1) <= 3).map((t) => t.id) });
  const allowed = context.lessonCatalog.map((l) => l.id);

  it(
    `runs ${EVAL_CASES.length} cases against ${model}`,
    async () => {
      const results = [];
      for (const testCase of EVAL_CASES) {
        const speaking = testCase.kind === "speaking";
        const raw = await interact(
          speaking ? SPEAKING_EXAMINER_INSTRUCTION : WRITING_EXAMINER_INSTRUCTION,
          assessmentRequest({
            context,
            task: speaking ? SPEAKING_EVAL_TASK : EVAL_TASK,
            learnerText: testCase.text,
            wordCount: countWords(testCase.text),
            kind: testCase.kind,
          }),
        );
        const feedback = validateAssessment(raw, { kind: testCase.kind, learnerText: testCase.text, allowedLessonIds: allowed });
        results.push(scoreCase(testCase, feedback));
      }

      const failed = results.filter((r) => !r.passed);
      console.info(
        [`${results.length - failed.length}/${results.length} cases passed (${model})`, ...failed.map((r) => `✗ ${r.id}: ${r.problems.join("; ")}`)].join("\n"),
      );
      // Reported, not enforced: model quality varies; see docs/AI_ASSESSMENT.md.
      expect(results).toHaveLength(EVAL_CASES.length);
    },
    15 * 60_000,
  );
});

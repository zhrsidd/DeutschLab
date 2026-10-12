/*
 * Checkpoint scoring (Week 1 and Week 2). Pure: every threshold lives here.
 */

export const CHECKPOINT_ID = "checkpoint-001";
export const OVERALL_PASS_FRACTION = 0.8;

export type SectionKey =
  | "vocabulary"
  | "grammar"
  | "reading"
  | "listening"
  | "writing"
  | "speaking";

export interface SectionRule {
  key: SectionKey;
  label: string;
  /** Marks available. */
  max: number;
  /** Minimum fraction of `max` needed to pass the checkpoint. */
  minFraction: number;
}

export const SECTION_RULES: SectionRule[] = [
  { key: "vocabulary", label: "Vocabulary", max: 8, minFraction: 0.7 },
  { key: "grammar", label: "Grammar", max: 8, minFraction: 0.7 },
  { key: "reading", label: "Reading", max: 4, minFraction: 0 },
  { key: "listening", label: "Listening", max: 4, minFraction: 0.5 },
  { key: "writing", label: "Writing self-check", max: 5, minFraction: 0.6 },
  { key: "speaking", label: "Speaking self-check", max: 5, minFraction: 0.6 },
];

const totalOf = (rules: SectionRule[]) =>
  rules.reduce((sum, rule) => sum + rule.max, 0);

export const CHECKPOINT_TOTAL = totalOf(SECTION_RULES);

export type SectionScores = Record<SectionKey, number>;

/** One checkpoint's marks and thresholds. */
export interface CheckpointConfig {
  id: string;
  rules: SectionRule[];
  overallPassFraction: number;
}

export const WEEK1_CHECKPOINT: CheckpointConfig = {
  id: CHECKPOINT_ID,
  rules: SECTION_RULES,
  overallPassFraction: OVERALL_PASS_FRACTION,
};

export const WEEK2_CHECKPOINT_ID = "checkpoint-002";

/** Week 2 has no speaking section; writing is out of 6. */
export const WEEK2_SECTION_RULES: SectionRule[] = [
  { key: "vocabulary", label: "Vocabulary", max: 8, minFraction: 0.75 },
  { key: "grammar", label: "Grammar", max: 10, minFraction: 0.7 },
  { key: "reading", label: "Reading", max: 4, minFraction: 0 },
  { key: "listening", label: "Listening", max: 4, minFraction: 0.5 },
  { key: "writing", label: "Writing self-check", max: 6, minFraction: 4 / 6 },
];

export const WEEK2_CHECKPOINT_TOTAL = totalOf(WEEK2_SECTION_RULES);

export const WEEK2_CHECKPOINT: CheckpointConfig = {
  id: WEEK2_CHECKPOINT_ID,
  rules: WEEK2_SECTION_RULES,
  overallPassFraction: OVERALL_PASS_FRACTION,
};

export function checkpointConfigFor(id: string): CheckpointConfig {
  return id === WEEK2_CHECKPOINT_ID ? WEEK2_CHECKPOINT : WEEK1_CHECKPOINT;
}

export interface SectionResult {
  key: SectionKey;
  label: string;
  score: number;
  max: number;
  /** Whole marks needed to meet the section minimum. */
  required: number;
  passed: boolean;
}

export interface CheckpointResult {
  total: number;
  possible: number;
  percent: number;
  sections: SectionResult[];
  overallPassed: boolean;
  passed: boolean;
  /** Sections below their minimum, or (if only the total fell short) below the overall bar. */
  weakSections: SectionKey[];
}

export function requiredMarks(rule: SectionRule): number {
  // Math.max avoids a stray -0 when there is no minimum.
  return Math.max(0, Math.ceil(rule.minFraction * rule.max - 1e-9));
}

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.round(value)));
}

export function evaluateCheckpoint(
  scores: Partial<SectionScores>,
  config: CheckpointConfig = WEEK1_CHECKPOINT,
): CheckpointResult {
  const rules = config.rules;
  const possible = totalOf(rules);
  const passFraction = config.overallPassFraction;

  const sections: SectionResult[] = rules.map((rule) => {
    const score = clamp(scores[rule.key] ?? 0, rule.max);
    const required = requiredMarks(rule);

    return {
      key: rule.key,
      label: rule.label,
      score,
      max: rule.max,
      required,
      passed: score >= required,
    };
  });

  const total = sections.reduce((sum, section) => sum + section.score, 0);
  const percent = Math.round((total / possible) * 100);
  const overallPassed = total / possible >= passFraction - 1e-9;
  const failedMinimums = sections.filter((section) => !section.passed);

  const passed = overallPassed && failedMinimums.length === 0;

  let weak = failedMinimums;

  if (!passed && weak.length === 0) {
    weak = sections.filter(
      (section) => section.score / section.max < passFraction,
    );
  }

  return {
    total,
    possible,
    percent,
    sections,
    overallPassed,
    passed,
    weakSections: weak.map((section) => section.key),
  };
}

/* ---------- persistence helpers ---------- */

export function serializeSections(result: CheckpointResult): string {
  const scores: Partial<SectionScores> = {};

  for (const section of result.sections) scores[section.key] = section.score;

  return JSON.stringify(scores);
}

export function parseSections(
  json: string | null,
  config: CheckpointConfig = WEEK1_CHECKPOINT,
): Partial<SectionScores> | null {
  if (!json) return null;

  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const scores: Partial<SectionScores> = {};

    for (const rule of config.rules) {
      const value = raw[rule.key];
      if (typeof value !== "number") return null;
      scores[rule.key] = clamp(value, rule.max);
    }

    return scores;
  } catch {
    return null;
  }
}

/** Week 1 is mastered once the checkpoint task has been completed (passed). */
export function isWeek1Mastered(completedTaskIds: string[]): boolean {
  return completedTaskIds.includes(CHECKPOINT_ID);
}

/** Week 2 is mastered once checkpoint-002 has been completed (passed). */
export function isWeek2Mastered(completedTaskIds: string[]): boolean {
  return completedTaskIds.includes(WEEK2_CHECKPOINT_ID);
}

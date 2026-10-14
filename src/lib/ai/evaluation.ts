/*
 * Examiner quality evaluation set (AI v1.1).
 *
 * Hand-checked A1 German examples for the writing/speaking examiner. Each
 * case lists the spans that are wrong (and must be corrected) and spans that
 * are correct German (and must NOT be marked as an error). Several cases
 * contain no error at all: an examiner that invents mistakes fails them.
 *
 * Deterministic tests (evaluation.test.ts) check the set itself and the
 * scorer. The live run against Gemini is opt-in (liveEval.test.ts) and never
 * part of the normal test gate.
 */

import type { TaskBrief } from "./prompts";
import { normaliseForMatch } from "./schemas";
import type { AssessmentFeedback } from "./types";

export type EvalCategory =
  | "correct"
  | "article"
  | "accusative"
  | "conjugation"
  | "word_order"
  | "nicht_kein"
  | "valid_alternative"
  | "unnatural"
  | "incomplete"
  | "mixed_language"
  | "ambiguous"
  | "spelling";

export interface EvalCase {
  id: string;
  kind: "writing" | "speaking";
  category: EvalCategory;
  text: string;
  /** Wrong spans: some correction's "original" must overlap each one. */
  mustFlag: { span: string; expected: string }[];
  /** Correct spans: no correction of severity error/minor may overlap them. */
  mustNotFlag: string[];
  /** True when the text contains no error at all (only optional style suggestions are acceptable). */
  expectNoErrors: boolean;
  /** Upper bound for task_completion (e.g. a very short answer). */
  taskCompletionAtMost?: number;
  note: string;
}

export const EVAL_TASK: TaskBrief = {
  prompt: "Write 60–80 words about yourself, your family, your school, your activities and your home.",
  targetWords: { min: 60, max: 80 },
  cues: ["your name and where you live", "family", "school", "activities", "home and things you have"],
  checklist: ["I used sein and haben correctly", "I used the accusative after haben and sehen", "I checked verb position 2"],
};

export const SPEAKING_EVAL_TASK: TaskBrief = {
  prompt: "Talk about yourself and your daily life.",
  cues: ["your name", "where you live", "family", "activities"],
  checklist: ["I used at least 4 complete German sentences"],
};

export const EVAL_CASES: EvalCase[] = [
  {
    id: "correct-intro",
    kind: "writing",
    category: "correct",
    text: "Ich heiße Lena. Ich wohne in Hamburg, und ich komme aus Deutschland. Ich bin Schülerin. Ich lerne Englisch und Französisch. Ich mag Mathematik.",
    mustFlag: [],
    mustNotFlag: ["Ich heiße Lena", "Ich bin Schülerin", "Ich mag Mathematik"],
    expectNoErrors: true,
    note: "Fully correct Week 1 introduction.",
  },
  {
    id: "correct-family",
    kind: "writing",
    category: "correct",
    text: "Ich habe einen Bruder und eine Schwester. Mein Bruder heißt Tom. Er ist zwölf Jahre alt. Meine Schwester spielt Tennis.",
    mustFlag: [],
    mustNotFlag: ["einen Bruder", "eine Schwester", "Er ist zwölf Jahre alt"],
    expectNoErrors: true,
    note: "Correct accusative with haben; feminine eine must not be changed.",
  },
  {
    id: "valid-time-first",
    kind: "writing",
    category: "valid_alternative",
    text: "Heute spiele ich Fußball. Morgen lese ich ein Buch. Am Abend höre ich Musik.",
    mustFlag: [],
    mustNotFlag: ["Heute spiele ich", "Morgen lese ich", "Am Abend höre ich"],
    expectNoErrors: true,
    note: "Time word first with the verb second is correct V2, not an error.",
  },
  {
    id: "correct-kein",
    kind: "writing",
    category: "correct",
    text: "Ich habe keinen Hund, aber ich habe eine Katze. Die Katze ist klein. Ich trinke keinen Kaffee.",
    mustFlag: [],
    mustNotFlag: ["keinen Hund", "eine Katze", "keinen Kaffee"],
    expectNoErrors: true,
    note: "Correct kein in the accusative.",
  },
  {
    id: "correct-pronouns",
    kind: "writing",
    category: "correct",
    text: "Ich sehe den Lehrer. Ich sehe ihn jeden Tag. Die Lehrerin ist nett. Ich mag sie.",
    mustFlag: [],
    mustNotFlag: ["den Lehrer", "Ich sehe ihn", "Ich mag sie"],
    expectNoErrors: true,
    note: "Correct accusative pronouns (Week 4).",
  },
  {
    id: "correct-feminine-accusative",
    kind: "writing",
    category: "accusative",
    text: "Ich habe eine Tasche und ein Heft. Ich brauche die Schere.",
    mustFlag: [],
    mustNotFlag: ["eine Tasche", "ein Heft", "die Schere"],
    expectNoErrors: true,
    note: "Trap: only masculine changes in the accusative. eine/ein/die are correct.",
  },
  {
    id: "correct-neuter-accusative",
    kind: "writing",
    category: "accusative",
    text: "Ich kaufe das Brot. Ich esse ein Ei. Wir trinken das Wasser.",
    mustFlag: [],
    mustNotFlag: ["das Brot", "ein Ei", "das Wasser"],
    expectNoErrors: true,
    note: "Trap: neuter das/ein do not change in the accusative.",
  },
  {
    id: "article-lampe",
    kind: "writing",
    category: "article",
    text: "Der Tisch ist groß. Das Lampe ist neu. Ich habe ein Buch.",
    mustFlag: [{ span: "Das Lampe", expected: "Die Lampe" }],
    mustNotFlag: ["Der Tisch ist groß", "Ich habe ein Buch"],
    expectNoErrors: false,
    note: "die Lampe is feminine.",
  },
  {
    id: "article-zimmer-bett",
    kind: "writing",
    category: "article",
    text: "Ich wohne in Berlin. Die Zimmer ist klein, aber der Bett ist neu.",
    mustFlag: [
      { span: "Die Zimmer ist", expected: "Das Zimmer ist" },
      { span: "der Bett", expected: "das Bett" },
    ],
    mustNotFlag: ["Ich wohne in Berlin"],
    expectNoErrors: false,
    note: "das Zimmer and das Bett are neuter.",
  },
  {
    id: "accusative-bruder",
    kind: "writing",
    category: "accusative",
    text: "Ich habe ein Bruder. Er heißt Ali. Ich habe auch eine Schwester.",
    mustFlag: [{ span: "ein Bruder", expected: "einen Bruder" }],
    mustNotFlag: ["eine Schwester", "Er heißt Ali"],
    expectNoErrors: false,
    note: "Masculine object after haben: einen.",
  },
  {
    id: "accusative-hund",
    kind: "writing",
    category: "accusative",
    text: "Ich sehe der Hund im Garten. Der Hund ist braun.",
    mustFlag: [{ span: "sehe der Hund", expected: "sehe den Hund" }],
    mustNotFlag: ["Der Hund ist braun"],
    expectNoErrors: false,
    note: "Masculine object after sehen: den. The second der Hund is a correct subject.",
  },
  {
    id: "conjugation-wohnen",
    kind: "writing",
    category: "conjugation",
    text: "Ich wohnen in Wien. Du spielst Gitarre. Er lernt Deutsch.",
    mustFlag: [{ span: "Ich wohnen", expected: "Ich wohne" }],
    mustNotFlag: ["Du spielst Gitarre", "Er lernt Deutsch"],
    expectNoErrors: false,
    note: "ich takes -e.",
  },
  {
    id: "conjugation-stem-change",
    kind: "writing",
    category: "conjugation",
    text: "Mein Vater sprecht Arabisch. Meine Mutter liest gern. Er esst Reis.",
    mustFlag: [
      { span: "sprecht", expected: "spricht" },
      { span: "Er esst", expected: "Er isst" },
    ],
    mustNotFlag: ["Meine Mutter liest gern"],
    expectNoErrors: false,
    note: "Stem changes: er spricht, er isst.",
  },
  {
    id: "conjugation-sein",
    kind: "writing",
    category: "conjugation",
    text: "Wir ist Schüler. Ihr seid nett. Sie sind meine Freunde.",
    mustFlag: [{ span: "Wir ist", expected: "Wir sind" }],
    mustNotFlag: ["Ihr seid nett", "Sie sind meine Freunde"],
    expectNoErrors: false,
    note: "wir sind.",
  },
  {
    id: "word-order-v2",
    kind: "writing",
    category: "word_order",
    text: "Heute ich spiele Fußball. Ich gehe dann nach Hause.",
    mustFlag: [{ span: "Heute ich spiele", expected: "Heute spiele ich" }],
    mustNotFlag: ["Ich gehe dann nach Hause"],
    expectNoErrors: false,
    note: "After a time word the verb comes second.",
  },
  {
    id: "word-order-question",
    kind: "writing",
    category: "word_order",
    text: "Wo du wohnst? Ich wohne in Zürich.",
    mustFlag: [{ span: "Wo du wohnst", expected: "Wo wohnst du" }],
    mustNotFlag: ["Ich wohne in Zürich"],
    expectNoErrors: false,
    note: "W-question: question word, verb, subject.",
  },
  {
    id: "nicht-kein-errors",
    kind: "writing",
    category: "nicht_kein",
    text: "Ich habe nicht ein Auto. Das ist kein schwer.",
    mustFlag: [
      { span: "nicht ein Auto", expected: "kein Auto" },
      { span: "kein schwer", expected: "nicht schwer" },
    ],
    mustNotFlag: [],
    expectNoErrors: false,
    note: "kein negates nouns with ein/no article; nicht negates adjectives.",
  },
  {
    id: "nicht-kein-correct",
    kind: "writing",
    category: "nicht_kein",
    text: "Das Buch ist nicht neu. Ich habe kein Fahrrad. Ich spiele heute nicht.",
    mustFlag: [],
    mustNotFlag: ["nicht neu", "kein Fahrrad", "Ich spiele heute nicht"],
    expectNoErrors: true,
    note: "All three negations are correct.",
  },
  {
    id: "valid-untaught-dative",
    kind: "writing",
    category: "valid_alternative",
    text: "Ich komme aus Indien, aber ich wohne in Doha. Ich lerne seit einem Monat Deutsch.",
    mustFlag: [],
    mustNotFlag: ["seit einem Monat", "ich wohne in Doha"],
    expectNoErrors: true,
    note: "Correct use of untaught grammar (seit + dative) must not be penalised.",
  },
  {
    id: "unnatural-age",
    kind: "writing",
    category: "unnatural",
    text: "Ich heiße Noah. Ich bin 15 Jahre. Ich wohne in Köln.",
    mustFlag: [{ span: "15 Jahre", expected: "15 Jahre alt" }],
    mustNotFlag: ["Ich heiße Noah", "Ich wohne in Köln"],
    expectNoErrors: false,
    note: "Understandable but incomplete: Ich bin 15 Jahre alt (or Ich bin 15).",
  },
  {
    id: "style-only-time-position",
    kind: "writing",
    category: "unnatural",
    text: "Ich spiele Klavier jeden Tag. Meine Schwester spielt auch Klavier.",
    mustFlag: [],
    mustNotFlag: ["Ich spiele Klavier jeden Tag", "Meine Schwester spielt auch Klavier"],
    expectNoErrors: true,
    note: "'jeden Tag Klavier' is more usual, but this is acceptable: at most an optional style suggestion.",
  },
  {
    id: "incomplete-short",
    kind: "writing",
    category: "incomplete",
    text: "Ich heiße Max. Ich wohne in Bern.",
    mustFlag: [],
    mustNotFlag: ["Ich heiße Max", "Ich wohne in Bern"],
    expectNoErrors: true,
    taskCompletionAtMost: 2,
    note: "Correct but far below the 60–80 word task: task completion must be low, grammar must not be marked down.",
  },
  {
    id: "mixed-english-sentence",
    kind: "writing",
    category: "mixed_language",
    text: "Ich heiße Sara. I like reading books. Ich lese Bücher.",
    mustFlag: [{ span: "I like reading books", expected: "Ich lese gern Bücher" }],
    mustNotFlag: ["Ich heiße Sara", "Ich lese Bücher"],
    expectNoErrors: false,
    note: "An English sentence should be pointed out, not treated as German spelling.",
  },
  {
    id: "mixed-english-word",
    kind: "writing",
    category: "mixed_language",
    text: "Ich habe einen Dog und eine Katze.",
    mustFlag: [{ span: "Dog", expected: "Hund" }],
    mustNotFlag: ["eine Katze"],
    expectNoErrors: false,
    note: "English word inside a correct German frame (einen is right for der Hund).",
  },
  {
    id: "ambiguous-sie",
    kind: "writing",
    category: "ambiguous",
    text: "Meine Freunde und meine Schwester kommen heute. Ich sehe sie morgen.",
    mustFlag: [],
    mustNotFlag: ["Ich sehe sie morgen", "kommen heute"],
    expectNoErrors: true,
    note: "sie could mean them or her: correct either way; at most an uncertainty note.",
  },
  {
    id: "spelling-capital-umlaut",
    kind: "writing",
    category: "spelling",
    text: "Ich wohne in Wien. Ich habe einen hund. Mein Vater fahrt Auto.",
    mustFlag: [
      { span: "einen hund", expected: "einen Hund" },
      { span: "fahrt", expected: "fährt" },
    ],
    mustNotFlag: ["Ich wohne in Wien"],
    expectNoErrors: false,
    note: "Nouns are capitalised; er fährt has an umlaut.",
  },
  {
    id: "speaking-fillers-correct",
    kind: "speaking",
    category: "correct",
    text: "Äh ich heiße Jonas ich wohne in äh Graz ich habe zwei Brüder und ich spiele Fußball",
    mustFlag: [],
    mustNotFlag: ["ich heiße Jonas", "ich habe zwei Brüder", "ich spiele Fußball"],
    expectNoErrors: true,
    note: "Fillers and missing punctuation in a transcript are not errors.",
  },
  {
    id: "speaking-accusative",
    kind: "speaking",
    category: "accusative",
    text: "Ich bin Schüler. Ich habe ein Hund. Der Hund heißt Bello.",
    mustFlag: [{ span: "ein Hund", expected: "einen Hund" }],
    mustNotFlag: ["Der Hund heißt Bello", "Ich bin Schüler"],
    expectNoErrors: false,
    note: "Accusative error in speech.",
  },
];

/*
 * Scoring a feedback object against a case (used by the live evaluation).
 */

const overlaps = (a: string, b: string) => {
  const x = normaliseForMatch(a);
  const y = normaliseForMatch(b);
  return x.includes(y) || y.includes(x);
};

export interface CaseResult {
  id: string;
  passed: boolean;
  problems: string[];
}

export function scoreCase(testCase: EvalCase, feedback: AssessmentFeedback): CaseResult {
  const problems: string[] = [];
  const marked = feedback.corrections.filter((c) => c.severity !== "suggestion");

  for (const wrong of testCase.mustFlag) {
    if (!feedback.corrections.some((c) => overlaps(c.original, wrong.span))) {
      problems.push(`missed: "${wrong.span}" (expected "${wrong.expected}")`);
    }
  }

  for (const right of testCase.mustNotFlag) {
    const bad = marked.find((c) => overlaps(c.original, right) && !testCase.mustFlag.some((w) => overlaps(c.original, w.span)));
    if (bad) problems.push(`false correction on correct text: "${bad.original}" → "${bad.suggestion}"`);
  }

  if (testCase.expectNoErrors && marked.length > 0) {
    problems.push(`expected no errors, got ${marked.length}: ${marked.map((c) => `"${c.original}"`).join(", ")}`);
  }

  if (testCase.taskCompletionAtMost !== undefined && feedback.scores.task_completion.score > testCase.taskCompletionAtMost) {
    problems.push(`task_completion ${feedback.scores.task_completion.score} > ${testCase.taskCompletionAtMost}`);
  }

  if (testCase.expectNoErrors && testCase.taskCompletionAtMost === undefined && feedback.scores.grammar.score < 4) {
    problems.push(`grammar ${feedback.scores.grammar.score}/5 for error-free text`);
  }

  return { id: testCase.id, passed: problems.length === 0, problems };
}

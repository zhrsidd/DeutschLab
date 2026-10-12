export interface SentenceFrame {
  /** Pattern with a gap for the learner, e.g. "Ich heiße ___." */
  frame: string;
  english: string;
  /** Complete example the speech engine says. */
  example: string;
}

export interface SpeakingPrompt {
  id: string;
  english: string;
  /** Hidden until the learner presses "Reveal answer". */
  german: string;
}

export const sentenceFrames: SentenceFrame[] = [
  { frame: "Hallo! / Guten Morgen!", english: "Hello! / Good morning!", example: "Hallo! Guten Morgen!" },
  { frame: "Ich heiße ___.", english: "My name is ___.", example: "Ich heiße Anna." },
  { frame: "Ich bin Schüler.", english: "I am a student.", example: "Ich bin Schüler." },
  { frame: "Ich wohne in ___.", english: "I live in ___.", example: "Ich wohne in Zürich." },
  { frame: "Ich komme aus ___.", english: "I come from ___.", example: "Ich komme aus Indien." },
  { frame: "Ich lerne Deutsch.", english: "I am learning German.", example: "Ich lerne Deutsch." },
  { frame: "Ich mag Mathematik und Physik.", english: "I like maths and physics.", example: "Ich mag Mathematik und Physik." },
];

export const sampleIntroduction =
  "Guten Morgen! Ich heiße Anna. Ich bin Schülerin. Ich wohne in Zürich. Ich komme aus Indien. Ich lerne Deutsch. Ich mag Physik.";

export const sampleIntroductionEnglish =
  "Good morning! My name is Anna. I am a student. I live in Zurich. I come from India. I am learning German. I like physics.";

export const speakingPrompts: SpeakingPrompt[] = [
  { id: "name", english: "Say: My name is Zuhayr.", german: "Ich heiße Zuhayr." },
  { id: "student", english: "Say: I am a student.", german: "Ich bin Schüler." },
  { id: "live", english: "Say: I live in Zurich.", german: "Ich wohne in Zürich." },
  { id: "from", english: "Say: I come from India.", german: "Ich komme aus Indien." },
  {
    id: "learn",
    english: "Say: I am learning German. I like physics.",
    german: "Ich lerne Deutsch. Ich mag Physik.",
  },
];

export const finalCues = [
  "your name",
  "where you live",
  "where you come from",
  "student / school",
  "subjects you like",
  "learning German",
];

export const selfAssessment = [
  "I introduced myself without reading a full script",
  "I used at least 4 complete German sentences",
  "I used sein correctly at least once",
  "I spoke mostly without switching to English",
  "I could understand what I was saying",
];

export const DRILL_SECONDS = 20;
export const FINAL_SECONDS = 60;
export const SPEAKING_PASS_SCORE = 4;

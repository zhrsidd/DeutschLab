export interface WarmupPhrase {
  german: string;
  english: string;
}

export interface ListeningQuestion {
  id: string;
  kind: "meaning" | "sentence" | "passage";
  /** What the speech engine says. Hidden until the learner answers. */
  audio: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  /** English translation of the audio, shown after answering. */
  translation?: string;
}

export const warmupPhrases: WarmupPhrase[] = [
  { german: "Hallo!", english: "Hello!" },
  { german: "Guten Morgen.", english: "Good morning." },
  { german: "Guten Tag.", english: "Good day / hello (daytime)." },
  { german: "Ich heiße Anna.", english: "My name is Anna." },
  { german: "Ich bin Schüler.", english: "I am a student (at school)." },
  { german: "Ich wohne in Zürich.", english: "I live in Zurich." },
  { german: "Ich komme aus Indien.", english: "I come from India." },
  { german: "Ich lerne Deutsch.", english: "I am learning German." },
];

export const listeningTips = [
  "Listen for names, places and jobs first. Don't try to catch every word.",
  "German is often said faster than you expect. Use the slower replay.",
  "wohne in = live in, komme aus = come from. Listen for in and aus.",
];

export const week1ListeningQuiz: ListeningQuestion[] = [
  // A: hear a phrase → choose the English meaning
  {
    id: "m-morgen",
    kind: "meaning",
    audio: "Guten Morgen.",
    prompt: "What does this mean?",
    options: ["Good morning.", "Good evening.", "Goodbye.", "Good night."],
    answer: "Good morning.",
    explanation: "Morgen = morning. You say it until about midday.",
    translation: "Good morning.",
  },
  {
    id: "m-tag",
    kind: "meaning",
    audio: "Guten Tag.",
    prompt: "What does this mean?",
    options: ["Good day / hello.", "Thank you.", "See you later.", "Good night."],
    answer: "Good day / hello.",
    explanation:
      "Guten Tag is the standard daytime greeting, a bit more formal than Hallo.",
    translation: "Good day / hello.",
  },
  {
    id: "m-heisse",
    kind: "meaning",
    audio: "Ich heiße Anna.",
    prompt: "What does this mean?",
    options: [
      "My name is Anna.",
      "I am from Anna.",
      "I live with Anna.",
      "I am Anna's teacher.",
    ],
    answer: "My name is Anna.",
    explanation: "Ich heiße ... = My name is ...",
    translation: "My name is Anna.",
  },
  {
    id: "m-lerne",
    kind: "meaning",
    audio: "Ich lerne Deutsch.",
    prompt: "What does this mean?",
    options: [
      "I am learning German.",
      "I speak German.",
      "I teach German.",
      "I am from Germany.",
    ],
    answer: "I am learning German.",
    explanation: "lernen = to learn, so Ich lerne Deutsch = I am learning German.",
    translation: "I am learning German.",
  },
  // B: hear a sentence → choose the German sentence heard
  {
    id: "s-wohne",
    kind: "sentence",
    audio: "Ich wohne in Zürich.",
    prompt: "Which sentence did you hear?",
    options: [
      "Ich wohne in Zürich.",
      "Ich komme aus Zürich.",
      "Wir wohnen in Zürich.",
      "Ich wohne in Zug.",
    ],
    answer: "Ich wohne in Zürich.",
    explanation: "wohne in = live in. komme aus would mean 'come from'.",
    translation: "I live in Zurich.",
  },
  {
    id: "s-komme",
    kind: "sentence",
    audio: "Ich komme aus Indien.",
    prompt: "Which sentence did you hear?",
    options: [
      "Ich komme aus Indien.",
      "Ich wohne in Indien.",
      "Ich komme aus Irland.",
      "Wir kommen aus Indien.",
    ],
    answer: "Ich komme aus Indien.",
    explanation: "komme aus = come from. Listen for aus and the place name.",
    translation: "I come from India.",
  },
  {
    id: "s-schueler",
    kind: "sentence",
    audio: "Ich bin Schüler.",
    prompt: "Which sentence did you hear?",
    options: [
      "Ich bin Schüler.",
      "Du bist Schüler.",
      "Wir sind Schüler.",
      "Ich bin Lehrer.",
    ],
    answer: "Ich bin Schüler.",
    explanation: "ich + bin, and Schüler = student (at school).",
    translation: "I am a student.",
  },
  // C: short introduction → comprehension question
  {
    id: "p-maria",
    kind: "passage",
    audio:
      "Guten Tag! Ich heiße Maria. Ich komme aus Spanien. Ich wohne in Zürich.",
    prompt: "Where does Maria live now?",
    options: ["Zurich", "Spain", "Berlin", "Vienna"],
    answer: "Zurich",
    explanation:
      "She says 'komme aus Spanien' (comes from Spain) but 'wohne in Zürich' (lives in Zurich).",
    translation: "Hello! My name is Maria. I come from Spain. I live in Zurich.",
  },
  {
    id: "p-jonas",
    kind: "passage",
    audio: "Hallo! Ich bin Jonas. Ich bin Schüler. Ich lerne Deutsch und Physik.",
    prompt: "What is Jonas learning?",
    options: [
      "German and physics",
      "German and maths",
      "French and physics",
      "Only physics",
    ],
    answer: "German and physics",
    explanation: "'Deutsch und Physik' = German and physics. und = and.",
    translation:
      "Hello! I am Jonas. I am a student. I am learning German and physics.",
  },
  {
    id: "p-weber",
    kind: "passage",
    audio: "Guten Morgen! Ich heiße Weber. Ich bin Lehrer. Ich komme aus Bern.",
    prompt: "What does Mr Weber do?",
    options: [
      "He is a teacher.",
      "He is a student.",
      "He is a doctor.",
      "He is an engineer.",
    ],
    answer: "He is a teacher.",
    explanation: "'Ich bin Lehrer' = I am a teacher.",
    translation:
      "Good morning! My name is Weber. I am a teacher. I come from Bern.",
  },
];

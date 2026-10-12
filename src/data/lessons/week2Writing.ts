/*
 * writing-001 content. There is no automatic marking: the learner compares
 * with an example and answers an honest self-check.
 */

export const writingFrames = [
  "Ich heiße ...",
  "Ich wohne in ...",
  "Ich komme aus ...",
  "Ich habe ...",
  "Ich spreche ...",
  "Ich lerne ...",
  "Ich mag ...",
  "Ich spiele ...",
  "Ich lese ...",
  "Ich arbeite ...",
];

export const writingCues = [
  "name",
  "where you live",
  "where you come from",
  "family",
  "languages",
  "school",
  "subjects",
  "activities",
  "something you like",
];

export const dailyLifeWriting = {
  taskId: "writing-001",
  prompt: "Write a short paragraph about yourself and your daily life.",
  targetWords: { min: 40, max: 50 },
  cues: writingCues,
  checklist: [
    "I wrote at least 40 words",
    "I wrote at least 5 complete German sentences",
    "I used sein or haben correctly",
    "I used at least two other verbs correctly",
    "I checked the position of the conjugated verb",
    "I covered at least four suggested topics",
  ],
  passScore: 5,
  sample:
    "Ich heiße Anna. Ich wohne in Doha, und ich komme aus Indien. Ich habe drei Geschwister. Ich spreche Englisch und Urdu, und ich lerne Deutsch. Ich bin Schülerin. Ich mag Physik. Mathematik ist schwierig. Heute spiele ich Fußball.",
};

export const checkpoint2Writing = {
  prompt: "Write 40–60 words about yourself, your family, school and daily life.",
  targetWords: { min: 40, max: 60 },
  cues: [
    "your name and where you live",
    "your family",
    "school and subjects",
    "languages",
    "what you do in your daily life",
    "something you like",
  ],
  checklist: dailyLifeWriting.checklist,
  sample:
    "Ich heiße Karim, und ich wohne in Doha. Die Familie ist groß: Ich habe drei Geschwister. Der Vater arbeitet in der Stadt, und die Mutter ist Lehrerin. Ich bin Schüler. Ich spreche Urdu und Englisch, und ich lerne Deutsch. Ich mag Physik. Heute spiele ich Fußball, und morgen lese ich.",
};

import type { SpeakingLessonConfig } from "./week1Speaking";

/*
 * speaking-002: a guided 2–3 minute introduction about yourself and your
 * daily life. Nothing is recorded or analysed: the learner speaks out loud
 * and rates themselves honestly (5 points, pass 4/5).
 */

export const week4SpeakingCues = [
  "your name",
  "where you live",
  "the languages you speak",
  "your family",
  "your school subjects",
  "what you do today",
  "your home or your school",
  "something you like doing",
];

export const week4SpeakingChecklist = [
  "I spoke for at least 2 minutes without reading a full script",
  "I covered at least 6 of the 8 cues",
  "I used sein and haben correctly most of the time",
  "I used at least two direct objects (for example einen Bruder, den Rucksack or ihn)",
  "I kept the verb in position 2 and spoke mostly without switching to English",
];

export const week4SpeakingConfig: SpeakingLessonConfig = {
  kicker: "Week 4 · Speaking",
  title: "Introducing myself and my daily life",
  intro:
    "Bring October together out loud. You'll prepare with sentence frames and a model, practise short prompts, then talk for 2–3 minutes about yourself and your daily life, guided only by cues.",
  finalLabel: "2–3 min",
  frames: [
    { frame: "Ich heiße ___, und ich wohne in ___.", english: "My name is ___, and I live in ___.", example: "Ich heiße Anna, und ich wohne in Zürich." },
    { frame: "Ich spreche ___. Ich lerne jetzt Deutsch.", english: "I speak ___. I am learning German now.", example: "Ich spreche Englisch und Urdu. Ich lerne jetzt Deutsch." },
    { frame: "Ich habe einen Bruder / eine Schwester.", english: "I have a brother / a sister.", example: "Ich habe einen Bruder und eine Schwester." },
    { frame: "Ich lerne ___. ___ ist interessant.", english: "I study ___. ___ is interesting.", example: "Ich lerne Physik und Mathematik. Physik ist interessant." },
    { frame: "Heute treffe ich ___ / fahre ich ___.", english: "Today I am meeting ___ / riding ___.", example: "Heute treffe ich einen Freund, und ich fahre Fahrrad." },
    { frame: "Die Wohnung / Die Schule ist ___.", english: "The flat / The school is ___.", example: "Die Wohnung ist klein, und die Schule ist groß." },
    { frame: "Ich ___ gern.", english: "I like ___ing.", example: "Ich lese gern, und ich koche gern." },
  ],
  sampleLabel: "Example talk",
  sample:
    "Hallo! Ich heiße Anna. Ich bin Schülerin, und ich wohne in Zürich. Ich spreche Englisch und Urdu, und ich lerne jetzt Deutsch. Die Familie ist groß. Ich habe einen Bruder, und ich sehe ihn heute. Ich lerne Physik und Mathematik. Physik ist sehr interessant, und Mathematik ist nicht langweilig. Die Wohnung ist klein, und die Schule ist groß. Heute fahre ich Fahrrad, und ich treffe eine Freundin. Ich lese gern, und ich koche gern.",
  sampleEnglish:
    "Hello! My name is Anna. I am a pupil, and I live in Zurich. I speak English and Urdu, and I am learning German now. The family is big. I have a brother, and I am seeing him today. I study physics and maths. Physics is very interesting, and maths is not boring. The flat is small, and the school is big. Today I am riding my bike, and I am meeting a friend. I like reading, and I like cooking.",
  prompts: [
    { id: "languages", english: "Say: I speak English, and I am learning German.", german: "Ich spreche Englisch, und ich lerne Deutsch." },
    { id: "brother", english: "Say: I have a brother. I see him today.", german: "Ich habe einen Bruder. Ich sehe ihn heute." },
    { id: "physics", english: "Say: Physics is very interesting.", german: "Physik ist sehr interessant." },
    { id: "bike", english: "Say: Today I ride a bike.", german: "Heute fahre ich Fahrrad." },
    { id: "home", english: "Say: The flat is small, and I have no dog.", german: "Die Wohnung ist klein, und ich habe keinen Hund." },
    { id: "like", english: "Say: I like reading.", german: "Ich lese gern." },
  ],
  finalHeading: "Talk about yourself and your daily life for 2–3 minutes.",
  finalHint:
    "Use the cues in any order. Keep going for at least 2 minutes; stop early only when you have covered most of them.",
  finalCues: week4SpeakingCues,
  finishedText: "Time's up. Three minutes of German: well done.",
  selfAssessment: week4SpeakingChecklist,
  drillSeconds: 25,
  finalSeconds: 180,
  passScore: 4,
  passMessage:
    "You can talk about yourself and your daily life for several minutes. This is the spoken goal of October. Say it out loud again on another day.",
  failMessage:
    "Practise the prompts again, then try the talk once more with the cues.",
};

import type { ListeningItem } from "./week1Checkpoint";

/*
 * listening-002: four short clips. Questions with a `concept` map to a
 * reusable word or grammar item; the others never create Review items.
 */

export const week2ListeningClips: ListeningItem[] = [
  {
    id: "l2-family",
    audio: "Die Familie ist groß. Ich habe drei Geschwister. Der Bruder heißt Omar.",
    translation: "The family is big. I have three siblings. The brother is called Omar.",
    questions: [
      {
        id: "l2-1",
        kind: "mc",
        prompt: "How many siblings does the speaker have?",
        options: ["Three", "Two", "Four", "One"],
        answer: "Three",
        explanation: "“Ich habe drei Geschwister.” drei = three; Geschwister = siblings.",
        concept: { sourceType: "vocabulary", sourceId: "geschwister" },
      },
      {
        id: "l2-2",
        kind: "mc",
        prompt: "What is the brother called?",
        options: ["Omar", "Karim", "Paul", "Jonas"],
        answer: "Omar",
        explanation: "“Der Bruder heißt Omar.”",
      },
    ],
  },
  {
    id: "l2-day",
    audio: "Heute ist Freitag. Ich arbeite in Doha. Morgen schlafe ich.",
    translation: "Today is Friday. I work in Doha. Tomorrow I sleep.",
    questions: [
      {
        id: "l2-3",
        kind: "mc",
        prompt: "What day is it today?",
        options: ["Friday", "Thursday", "Saturday", "Sunday"],
        answer: "Friday",
        explanation: "“Heute ist Freitag.”",
        concept: { sourceType: "vocabulary", sourceId: "freitag" },
      },
      {
        id: "l2-4",
        kind: "mc",
        prompt: "What does the speaker do tomorrow?",
        options: ["Sleeps", "Works", "Reads", "Plays football"],
        answer: "Sleeps",
        explanation: "“Morgen schlafe ich.” morgen = tomorrow; schlafe = sleep.",
        concept: { sourceType: "vocabulary", sourceId: "schlafen" },
      },
    ],
  },
  {
    id: "l2-haben",
    audio: "Er hat Zeit.",
    translation: "He has time.",
    questions: [
      {
        id: "l2-5",
        kind: "mc",
        prompt: "Which sentence did you hear?",
        options: ["Er hat Zeit.", "Ihr habt Zeit.", "Du hast Zeit.", "Wir haben Zeit."],
        answer: "Er hat Zeit.",
        explanation: "er → hat. ihr habt, du hast and wir haben sound different.",
        concept: { sourceType: "grammar", sourceId: "hb-c-er" },
      },
      {
        id: "l2-6",
        kind: "mc",
        prompt: "What does it mean?",
        options: ["He has time.", "He is a student.", "They have time.", "She has time."],
        answer: "He has time.",
        explanation: "er hat = he has; Zeit = time.",
      },
    ],
  },
  {
    id: "l2-school",
    audio: "Ich lerne Deutsch in der Schule. Mathematik ist schwierig. Physik ist interessant.",
    translation: "I learn German at school. Maths is difficult. Physics is interesting.",
    questions: [
      {
        id: "l2-7",
        kind: "mc",
        prompt: "Which subject is difficult?",
        options: ["Maths", "Physics", "German", "Biology"],
        answer: "Maths",
        explanation: "“Mathematik ist schwierig.” schwierig = difficult.",
        concept: { sourceType: "vocabulary", sourceId: "schwierig" },
      },
      {
        id: "l2-8",
        kind: "mc",
        prompt: "What does the speaker think of physics?",
        options: ["It is interesting", "It is difficult", "It is bad", "It is easy"],
        answer: "It is interesting",
        explanation: "“Physik ist interessant.”",
      },
    ],
  },
];

export const week2ListeningQuestions = week2ListeningClips.flatMap((clip) =>
  clip.questions.map((question) => ({
    ...question,
    audio: clip.audio,
    translation: clip.translation,
  })),
);

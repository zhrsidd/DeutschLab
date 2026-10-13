import type { ListeningItem } from "./week1Checkpoint";

/*
 * listening-004: four clips about everyday life. They are longer than the
 * Week 3 clips (three or four sentences, two of them short conversations)
 * and add the Week 4 verbs and accusative pronouns. Questions with a
 * `concept` map to a reusable word or grammar item; the others never create
 * Review items.
 */

export const week4ListeningClips: ListeningItem[] = [
  {
    id: "l4-exam",
    audio: "Hallo, ich bin Tim. Heute habe ich eine Prüfung. Die Prüfung ist wichtig. Ich brauche einen Bleistift und ein Lineal.",
    translation: "Hello, I'm Tim. Today I have an exam. The exam is important. I need a pencil and a ruler.",
    questions: [
      {
        id: "l4-1",
        kind: "mc",
        prompt: "What does Tim have today?",
        options: ["An exam", "A break", "A long lesson", "Homework"],
        answer: "An exam",
        explanation: "“Heute habe ich eine Prüfung.” die Prüfung = exam.",
        concept: { sourceType: "vocabulary", sourceId: "pruefung" },
      },
      {
        id: "l4-2",
        kind: "mc",
        prompt: "What does Tim need?",
        options: [
          "A pencil and a ruler",
          "A pen and a ruler",
          "A pencil and a book",
          "A dictionary",
        ],
        answer: "A pencil and a ruler",
        explanation: "“Ich brauche einen Bleistift und ein Lineal.” brauchen = to need.",
        concept: { sourceType: "vocabulary", sourceId: "brauchen" },
      },
    ],
  },
  {
    id: "l4-teacher",
    audio: "Siehst du die Frau dort? – Ja, ich sehe sie. – Das ist Frau Klein. Sie ist Lehrerin, und ich kenne sie gut.",
    translation: "Do you see the woman there? – Yes, I see her. – That is Ms Klein. She is a teacher, and I know her well.",
    questions: [
      {
        id: "l4-3",
        kind: "mc",
        prompt: "Who is Frau Klein?",
        options: ["A teacher", "A pupil", "A friend's mother", "A shop assistant"],
        answer: "A teacher",
        explanation: "“Sie ist Lehrerin, und ich kenne sie gut.” Lehrerin = (female) teacher.",
      },
      {
        id: "l4-4",
        kind: "mc",
        prompt: "In “Ja, ich sehe sie”, who is sie?",
        options: ["The woman", "The speaker", "The pupils", "A girl"],
        answer: "The woman",
        explanation: "The question was “Siehst du die Frau dort?” die Frau is feminine, so the object pronoun is sie.",
        concept: { sourceType: "grammar", sourceId: "pr-c-sie-lehrerin" },
      },
    ],
  },
  {
    id: "l4-friend",
    audio: "Morgen besucht Lena einen Freund. Sie trifft ihn in der Stadt. Sie trägt eine Jacke, und sie nimmt ein Brötchen und Wasser.",
    translation: "Tomorrow Lena is visiting a friend. She is meeting him in town. She is wearing a jacket, and she is taking a bread roll and water.",
    questions: [
      {
        id: "l4-5",
        kind: "mc",
        prompt: "Who does Lena meet in town?",
        options: ["A friend", "A teacher", "Her brother", "A girl"],
        answer: "A friend",
        explanation: "“Morgen besucht Lena einen Freund. Sie trifft ihn in der Stadt.” ihn = the friend.",
        concept: { sourceType: "vocabulary", sourceId: "treffen" },
      },
      {
        id: "l4-6",
        kind: "mc",
        prompt: "Which form of nehmen did you hear?",
        options: ["nimmt", "nehmt", "nimmst", "nehmen"],
        answer: "nimmt",
        explanation: "“… und sie nimmt ein Brötchen und Wasser.” With sie (she), nehmen becomes nimmt.",
        concept: { sourceType: "grammar", sourceId: "iv-c-nimmt" },
      },
    ],
  },
  {
    id: "l4-shop",
    audio: "Was kostet das T-Shirt? – Zehn Euro. – Das ist billig! Ich nehme es. Und die Schuhe? – Die Schuhe sind teuer.",
    translation: "How much does the T-shirt cost? – Ten euros. – That's cheap! I'll take it. And the shoes? – The shoes are expensive.",
    questions: [
      {
        id: "l4-7",
        kind: "mc",
        prompt: "How much is the T-shirt?",
        options: ["10 euros", "12 euros", "20 euros", "2 euros"],
        answer: "10 euros",
        explanation: "“Zehn Euro.” zehn = ten.",
        concept: { sourceType: "vocabulary", sourceId: "num-10" },
      },
      {
        id: "l4-8",
        kind: "mc",
        prompt: "What does the speaker buy?",
        options: ["The T-shirt", "The shoes", "The T-shirt and the shoes", "Nothing"],
        answer: "The T-shirt",
        explanation: "“Das ist billig! Ich nehme es.” es replaces das T-Shirt. The shoes are expensive.",
        concept: { sourceType: "grammar", sourceId: "pr-c-es-buch" },
      },
    ],
  },
];

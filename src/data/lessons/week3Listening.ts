import type { ListeningItem } from "./week1Checkpoint";

/*
 * listening-003: four short clips about objects and possession. Questions
 * with a `concept` map to a reusable word or grammar item; the others
 * never create Review items.
 */

export const week3ListeningClips: ListeningItem[] = [
  {
    id: "l3-describe",
    audio: "Der Tisch ist groß. Die Lampe ist neu. Das Fenster ist klein.",
    translation: "The table is big. The lamp is new. The window is small.",
    questions: [
      {
        id: "l3-1",
        kind: "mc",
        prompt: "Which object is big?",
        options: ["The table", "The lamp", "The window", "The door"],
        answer: "The table",
        explanation: "“Der Tisch ist groß.” groß = big.",
        concept: { sourceType: "vocabulary", sourceId: "tisch" },
      },
      {
        id: "l3-2",
        kind: "mc",
        prompt: "Which object is new?",
        options: ["The lamp", "The table", "The window", "The bed"],
        answer: "The lamp",
        explanation: "“Die Lampe ist neu.” neu = new.",
        concept: { sourceType: "vocabulary", sourceId: "lampe" },
      },
    ],
  },
  {
    id: "l3-possession",
    audio: "Ich habe einen Rucksack und ein Handy. Ich habe keine Tasche.",
    translation: "I have a backpack and a mobile phone. I have no bag.",
    questions: [
      {
        id: "l3-3",
        kind: "mc",
        prompt: "What does the speaker have?",
        options: [
          "A backpack and a mobile phone",
          "A bag and a mobile phone",
          "A backpack and a bag",
          "A book and a pen",
        ],
        answer: "A backpack and a mobile phone",
        explanation: "“Ich habe einen Rucksack und ein Handy.” einen Rucksack is a masculine direct object.",
        concept: { sourceType: "grammar", sourceId: "acc-c-einen-rucksack" },
      },
      {
        id: "l3-4",
        kind: "mc",
        prompt: "What does the speaker NOT have?",
        options: ["A bag", "A backpack", "A mobile phone", "A book"],
        answer: "A bag",
        explanation: "“Ich habe keine Tasche.” keine = no, because Tasche is feminine.",
        concept: { sourceType: "grammar", sourceId: "neg-f-tasche" },
      },
    ],
  },
  {
    id: "l3-rooms",
    audio: "Das Wohnzimmer hat ein Sofa und einen Tisch. Das Schlafzimmer hat ein Bett und einen Schrank.",
    translation: "The living room has a sofa and a table. The bedroom has a bed and a wardrobe.",
    questions: [
      {
        id: "l3-5",
        kind: "mc",
        prompt: "What is in the living room?",
        options: [
          "A sofa and a table",
          "A bed and a wardrobe",
          "A sofa and a bed",
          "A table and a wardrobe",
        ],
        answer: "A sofa and a table",
        explanation: "“Das Wohnzimmer hat ein Sofa und einen Tisch.”",
      },
      {
        id: "l3-6",
        kind: "mc",
        prompt: "Which room has a wardrobe?",
        options: ["The bedroom", "The living room", "The kitchen", "The bathroom"],
        answer: "The bedroom",
        explanation: "“Das Schlafzimmer hat ein Bett und einen Schrank.” Schlafzimmer = bedroom.",
        concept: { sourceType: "vocabulary", sourceId: "schlafzimmer" },
      },
    ],
  },
  {
    id: "l3-plural",
    audio: "Die Bücher sind neu. Das Heft ist nicht neu.",
    translation: "The books are new. The exercise book is not new.",
    questions: [
      {
        id: "l3-7",
        kind: "mc",
        prompt: "Which sentence did you hear?",
        options: [
          "Die Bücher sind neu.",
          "Das Buch ist neu.",
          "Die Bücher sind alt.",
          "Das Buch ist alt.",
        ],
        answer: "Die Bücher sind neu.",
        explanation: "Die Bücher sind = plural (the books are). Das Buch ist = singular (the book is).",
        concept: { sourceType: "vocabulary", sourceId: "buch#plural" },
      },
      {
        id: "l3-8",
        kind: "mc",
        prompt: "What is said about the exercise book?",
        options: [
          "It is not new",
          "It is new",
          "It is interesting",
          "It is small",
        ],
        answer: "It is not new",
        explanation: "“Das Heft ist nicht neu.” nicht negates the adjective neu.",
        concept: { sourceType: "grammar", sourceId: "neg-c-adjective" },
      },
    ],
  },
];

import type { ReadingPassage } from "./week2Reading";

/*
 * reading-003: two A1 passages (about 100 words each) built from Weeks 1–4.
 * They add the Week 4 verbs (fährt, trägt, nimmt, trifft), accusative
 * pronouns and the new everyday nouns. Questions with a `concept` map to a
 * reusable word or grammar item (a wrong answer feeds Mistakes and Review);
 * plain comprehension questions about the passage never do.
 *
 * In der Schule is a chunk learned earlier; no other dative is used.
 */

export const week4ReadingPassages: ReadingPassage[] = [
  {
    id: "rd4-jonas",
    title: "Jonas",
    text: "Jonas ist Schüler und wohnt in Zürich. Die Wohnung ist klein. Jonas hat einen Hund, und der Hund heißt Max. Heute ist Montag. Jonas trinkt Tee und isst ein Brötchen. Das Frühstück ist lecker. Jonas trägt eine Jacke, und er nimmt den Rucksack. Er fährt Fahrrad. In der Schule trifft er Lena. Lena hat eine Frage: „Hast du das Wörterbuch?“ Jonas sucht es, und er findet es nicht. Lena hat auch kein Wörterbuch. Jonas fragt den Lehrer. Der Lehrer hat ein Wörterbuch, und Jonas nimmt es. Die Stunde ist lang, und die Prüfung ist wichtig. Jonas ist müde. Er findet Physik sehr interessant.",
    questions: [
      {
        id: "rd4-1",
        kind: "mc",
        prompt: "What does Jonas eat for breakfast?",
        options: ["A bread roll", "An apple", "Cake", "Fish"],
        answer: "A bread roll",
        explanation: "“Jonas trinkt Tee und isst ein Brötchen.” das Brötchen = bread roll.",
        concept: { sourceType: "vocabulary", sourceId: "broetchen" },
      },
      {
        id: "rd4-2",
        kind: "mc",
        prompt: "In “Jonas sucht es”, what does es refer to?",
        options: ["The dictionary", "The dog", "The backpack", "The jacket"],
        answer: "The dictionary",
        explanation: "Lena asks “Hast du das Wörterbuch?” Wörterbuch is neuter, so es replaces das Wörterbuch.",
        concept: { sourceType: "grammar", sourceId: "pr-c-es-buch" },
      },
      {
        id: "rd4-3",
        kind: "short",
        prompt: "How does Jonas travel today? (one word, in English)",
        answer: "By bike",
        keywords: [["bike", "bicycle", "cycling", "cycles", "fahrrad"]],
        forbidden: ["car", "bus", "walks", "foot"],
        explanation: "“Er fährt Fahrrad.” fahren with Fahrrad = to ride a bike.",
        concept: { sourceType: "vocabulary", sourceId: "fahren" },
      },
      {
        id: "rd4-4",
        kind: "mc",
        prompt: "Complete from the text: Jonas fragt ___ Lehrer.",
        options: ["der", "den", "das"],
        answer: "den",
        explanation: "“Jonas fragt den Lehrer.” Jonas is the subject; der Lehrer is the direct object, so der becomes den.",
        concept: { sourceType: "grammar", sourceId: "iv-c-den-rucksack" },
      },
    ],
  },
  {
    id: "rd4-sara",
    title: "Sara",
    text: "Sara ist sechzehn und wohnt in Doha. Die Wohnung hat eine Küche, ein Wohnzimmer und zwei Schlafzimmer. Der Kühlschrank ist neu, und der Fernseher ist alt. Sara hat eine Katze. Die Katze schläft gern. Heute ist Samstag. Sara putzt das Zimmer und macht die Hausaufgaben. Sie braucht eine Jacke. Die Jacke ist teuer, und Sara hat kein Geld. Der Bruder heißt Ali, und er hat eine Jacke. Sara fragt ihn: „Brauchst du die Jacke?“ Ali braucht sie nicht. Sara trägt sie heute. Die Mutter kocht das Abendessen: Fisch und Salat. Sara isst kein Fleisch. Der Fisch ist lecker.",
    questions: [
      {
        id: "rd4-5",
        kind: "mc",
        prompt: "Why does Sara not buy a jacket?",
        options: [
          "She has no money",
          "She does not need one",
          "The jacket is too small",
          "The jacket is cheap",
        ],
        answer: "She has no money",
        explanation: "“Die Jacke ist teuer, und Sara hat kein Geld.” kein Geld = no money.",
        concept: { sourceType: "vocabulary", sourceId: "geld" },
      },
      {
        id: "rd4-6",
        kind: "mc",
        prompt: "In “Ali braucht sie nicht”, what does sie refer to?",
        options: ["The jacket", "Sara", "The cat", "The mother"],
        answer: "The jacket",
        explanation: "Sara asks “Brauchst du die Jacke?” Jacke is feminine, so die Jacke is replaced by sie.",
        concept: { sourceType: "grammar", sourceId: "pr-t-replace-tasche" },
      },
      {
        id: "rd4-7",
        kind: "short",
        prompt: "Was isst Sara nicht? (one word, in German)",
        answer: "Fleisch",
        language: "german",
        keywords: [["fleisch"]],
        forbidden: ["fisch", "salat"],
        explanation: "“Sara isst kein Fleisch.”",
        concept: { sourceType: "vocabulary", sourceId: "fleisch" },
      },
      {
        id: "rd4-8",
        kind: "mc",
        prompt: "What does “Sara putzt das Zimmer” mean?",
        options: [
          "Sara cleans the room",
          "Sara looks for the room",
          "Sara sees the room",
          "Sara uses the room",
        ],
        answer: "Sara cleans the room",
        explanation: "putzen = to clean. “Sara putzt das Zimmer und macht die Hausaufgaben.”",
        concept: { sourceType: "vocabulary", sourceId: "putzen" },
      },
    ],
  },
];

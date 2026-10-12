import type { WritingLessonConfig } from "./week2Writing";

/*
 * writing-002 content. There is no automatic marking: the learner compares
 * with an example and answers an honest self-check.
 *
 * "Das ist mein Zimmer." uses mein as a fixed phrase to learn as it is;
 * possessives are taught properly in a later week.
 */

export const roomWritingChecklist = [
  "I wrote at least 50 words",
  "I wrote at least 5 complete German sentences",
  "I used der, die, das and ein, eine correctly as the subject",
  "I used at least one accusative construction correctly (for example Ich habe einen Stuhl)",
  "I used nicht or kein correctly",
  "I checked my verb forms and the position of the verb",
];

export const roomWritingFrames = [
  "Das ist mein Zimmer.",
  "Der Tisch ist groß.",
  "Die Lampe ist neu.",
  "Das Fenster ist klein.",
  "Ich habe einen Computer.",
  "Ich habe eine Tasche.",
  "Ich habe ein Buch.",
  "Ich habe keine Lampe.",
  "Ich habe keinen Stuhl.",
  "Das Buch ist interessant.",
  "Das Heft ist nicht neu.",
  "Ich lese ein Buch.",
];

export const roomWritingCues = [
  "your room",
  "furniture",
  "school objects",
  "something you have",
  "something you do not have",
  "something big or small",
  "something new or old",
];

export const roomWriting: WritingLessonConfig = {
  taskId: "writing-002",
  kicker: "Week 3 · Writing",
  title: "My room and belongings",
  intro:
    "Write about your room, your school objects or your belongings, using what you've learned in Weeks 1 to 3. You can't be marked automatically here, so you'll compare with an example and check your own work honestly.",
  lengthLabel: "50–70 words",
  prompt: "Write 50–70 words about your room, your school objects or your belongings.",
  targetWords: { min: 50, max: 70 },
  cues: roomWritingCues,
  checklist: roomWritingChecklist,
  passScore: 5,
  sample:
    "Das ist mein Zimmer. Das Zimmer ist klein, und das Fenster ist groß. Der Tisch ist neu, und die Lampe ist alt. Ich habe ein Bett und einen Schrank. Ich habe auch einen Computer und ein Handy. Ich habe kein Sofa und keine Küche. Das Buch ist interessant, und ich lese ein Buch. Die Hefte sind nicht neu. Ich lerne Deutsch.",
  prepHeading: "Sentence structures for Week 3",
  prepText:
    "Finish or copy these sentences with your own objects. Use der, die or das for the subject, einen when a masculine noun is what you have, and kein or nicht to say no. Das ist mein Zimmer is a phrase to learn as it is for now.",
  frames: roomWritingFrames,
  planText:
    "Tick the topics you'd like to cover. You don't need all of them; aim for at least four.",
};

/** The checkpoint-003 writing task: a fresh prompt, not a replay of writing-002. */
export const checkpoint3Writing = {
  prompt: "Write 50–70 words about a classroom, a school bag or a friend's room.",
  targetWords: { min: 50, max: 70 },
  cues: [
    "what objects there are",
    "what is big, small, new or old",
    "what you have",
    "what you do not have",
    "something you read or use",
    "the articles: der, die, das, ein, eine",
  ],
  checklist: roomWritingChecklist,
  sample:
    "Das Zimmer ist groß. Der Tisch ist alt, und die Tafel ist neu. Die Schüler haben Hefte und Bücher. Ich habe einen Stift und eine Tasche. Ich habe keinen Bleistift und kein Lineal. Die Lehrerin hat einen Computer. Das Fenster ist nicht klein. Ich lese ein Buch, und ich lerne Physik. Physik ist interessant.",
};

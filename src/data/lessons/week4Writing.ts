import type { WritingLessonConfig } from "./week2Writing";

/*
 * writing-003 content. There is no automatic marking: the learner compares
 * with an example and answers an honest self-check (6 points, pass 5/6).
 * The frames use only Weeks 1–4 grammar.
 */

export const everydayWritingChecklist = [
  "I wrote at least 60 words",
  "I wrote at least 6 complete German sentences with the verb in position 2",
  "I used sein and haben correctly",
  "I used at least two direct objects correctly (den, einen, or a pronoun such as ihn or sie)",
  "I used nicht or kein correctly",
  "I checked my verb forms, including irregular ones such as fährt, nimmt or trägt",
];

export const everydayWritingFrames = [
  "Ich heiße … und ich wohne in …",
  "Die Wohnung ist klein / groß.",
  "Ich habe einen Bruder. Ich sehe ihn heute.",
  "Ich bin Schüler / Schülerin.",
  "Physik ist interessant, und ich finde Mathematik wichtig.",
  "Heute fahre ich Fahrrad.",
  "Ich trage eine Jacke und nehme den Rucksack.",
  "Ich treffe einen Freund. Ich kenne ihn gut.",
  "Ich habe keinen Hund.",
  "Die Hausaufgaben sind nicht langweilig.",
  "Ich lese gern.",
  "Ich lerne jetzt Deutsch.",
];

export const everydayWritingCues = [
  "yourself",
  "your school and subjects",
  "your home",
  "your family",
  "what you do today",
  "what you wear or carry",
  "something you have and something you do not have",
  "something you like doing",
];

export const everydayWriting: WritingLessonConfig = {
  taskId: "writing-003",
  kicker: "Week 4 · Writing",
  title: "Describing everyday life",
  intro:
    "Write about yourself, your school, your activities, your home and your belongings, using everything from October. You can't be marked automatically here, so you'll compare with an example and check your own work honestly.",
  lengthLabel: "60–80 words",
  prompt:
    "Write 60–80 words about yourself, your school, your activities, your home and your belongings.",
  targetWords: { min: 60, max: 80 },
  cues: everydayWritingCues,
  checklist: everydayWritingChecklist,
  passScore: 5,
  sample:
    "Ich heiße Omar, und ich wohne in Doha. Die Wohnung ist groß, und die Küche ist neu. Ich habe einen Bruder. Ich sehe ihn heute. Ich bin Schüler, und die Schule ist nicht klein. Physik ist interessant, und ich finde Mathematik wichtig. Heute fahre ich Fahrrad. Ich trage eine Jacke und nehme den Rucksack. Ich habe keinen Hund. Ich lese gern, und ich lerne jetzt Deutsch.",
  prepHeading: "Sentence structures for Week 4",
  prepText:
    "Finish or copy these sentences with your own information. Keep the verb in position 2, use den or einen for a masculine direct object, and replace a noun with ihn, sie or es once it is clear.",
  frames: everydayWritingFrames,
  planText:
    "Tick the topics you'd like to cover. You don't need all of them; aim for at least five.",
};

/** The checkpoint-004 writing task: a fresh prompt, not a replay of writing-003. */
export const checkpoint4Writing = {
  prompt:
    "Write 60–80 words about one ordinary school day: the morning, what you wear and take with you, school, and the evening.",
  targetWords: { min: 60, max: 80 },
  cues: [
    "breakfast",
    "what you wear or carry",
    "how you travel",
    "who you meet",
    "a lesson or an exam",
    "something you do not have",
    "the evening",
  ],
  checklist: everydayWritingChecklist,
  sample:
    "Heute ist Montag. Ich trinke Tee und esse ein Brötchen. Das Frühstück ist lecker. Ich trage eine Jacke, und ich nehme den Rucksack. Ich fahre Fahrrad. In der Schule treffe ich Lena. Ich kenne sie gut. Die Prüfung ist wichtig, und ich habe eine Frage. Der Lehrer versteht mich. Ich habe keine Zeit, und ich bin müde. Ich koche das Abendessen und mache die Hausaufgaben.",
};

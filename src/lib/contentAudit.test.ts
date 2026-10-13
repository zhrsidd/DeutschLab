import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  allVocabularyItems,
  findVocabularyItem,
} from "../data/lessons/vocabularySets";
import { week3ListeningClips } from "../data/lessons/week3Listening";

import { buildReviewExercise, toTypedQuestion } from "./reviewExercises";

/*
 * v0.8 linguistic audit. These guards use facts checked by hand against a
 * German reference, independent of the lesson data they check, so a future
 * typo in a gender or plural is caught even when the app's own tests pass.
 */

const bare = (german: string) => german.replace(/^(der|die|das)\s+/i, "");

function typedGrade(id: string, input: string, repetitions = 1) {
  const exercise = buildReviewExercise("vocabulary", id);
  if (!exercise) throw new Error(`no exercise for ${id}`);
  return toTypedQuestion(exercise, repetitions)!.grade(input);
}

/** id → "article Noun | plural" ("-" when the noun has no plural). */
const REFERENCE: Record<string, string> = {
  // Week 2
  familie: "die | Familien", mutter: "die | Mütter", vater: "der | Väter",
  eltern: "die | -", bruder: "der | Brüder", schwester: "die | Schwestern",
  sohn: "der | Söhne", tochter: "die | Töchter", geschwister: "die | -",
  grossmutter: "die | Großmütter", grossvater: "der | Großväter",
  grosseltern: "die | -", onkel: "der | Onkel", tante: "die | Tanten",
  kind: "das | Kinder", freund: "der | Freunde", freundin: "die | Freundinnen",
  schule: "die | Schulen", haus: "das | Häuser", stadt: "die | Städte",
  land: "das | Länder", geschaeft: "das | Geschäfte",
  restaurant: "das | Restaurants", park: "der | Parks",
  krankenhaus: "das | Krankenhäuser", universitaet: "die | Universitäten",
  supermarkt: "der | Supermärkte",
  // Week 3: school
  stift: "der | Stifte", bleistift: "der | Bleistifte",
  kugelschreiber: "der | Kugelschreiber", heft: "das | Hefte",
  buch: "das | Bücher", tasche: "die | Taschen", rucksack: "der | Rucksäcke",
  lineal: "das | Lineale", schere: "die | Scheren", tafel: "die | Tafeln",
  computer: "der | Computer", bildschirm: "der | Bildschirme",
  tastatur: "die | Tastaturen",
  // rooms
  zimmer: "das | Zimmer", wohnzimmer: "das | Wohnzimmer",
  schlafzimmer: "das | Schlafzimmer", kueche: "die | Küchen",
  badezimmer: "das | Badezimmer", tuer: "die | Türen", fenster: "das | Fenster",
  wand: "die | Wände", boden: "der | Böden", treppe: "die | Treppen",
  garten: "der | Gärten",
  // furniture
  tisch: "der | Tische", stuhl: "der | Stühle", bett: "das | Betten",
  sofa: "das | Sofas", schrank: "der | Schränke", regal: "das | Regale",
  lampe: "die | Lampen", spiegel: "der | Spiegel",
  // food and drink
  brot: "das | Brote", apfel: "der | Äpfel", banane: "die | Bananen",
  milch: "die | -", kaese: "der | -", ei: "das | Eier", reis: "der | -",
  kartoffel: "die | Kartoffeln", saft: "der | Säfte", suppe: "die | Suppen",
  gemuese: "das | -", wasser: "das | -", kaffee: "der | -",
  // objects
  handy: "das | Handys", schluessel: "der | Schlüssel", uhr: "die | Uhren",
  flasche: "die | Flaschen", glas: "das | Gläser", tasse: "die | Tassen",
  teller: "der | Teller", gabel: "die | Gabeln", messer: "das | Messer",
  loeffel: "der | Löffel", auto: "das | Autos", fahrrad: "das | Fahrräder",
  // people
  lehrer: "der | Lehrer", lehrerin: "die | Lehrerinnen", schueler: "der | Schüler",
  schuelerin: "die | Schülerinnen", mann: "der | Männer", frau: "die | Frauen",
  maedchen: "das | Mädchen", junge: "der | Jungen",
};

describe("noun gender and plural reference (Weeks 2–3)", () => {
  it("matches the reference for every noun", () => {
    for (const [id, expected] of Object.entries(REFERENCE)) {
      const item = findVocabularyItem(id);
      expect(item, id).toBeDefined();

      const plural = item!.plural ? bare(item!.plural) : "-";
      expect(`${item!.article} | ${plural}`, id).toBe(expected);
      expect(item!.german.startsWith(`${item!.article} `) || item!.article === undefined, id).toBe(true);
    }
  });

  it("references every Week 2 and Week 3 noun, so none can drift unnoticed", () => {
    const nouns = allVocabularyItems().filter(
      (item) => item.partOfSpeech === "noun" && item.article && !["subjects", "countries", "days", "months"].includes(item.category),
    );

    expect(nouns.map((item) => item.id).filter((id) => !(id in REFERENCE))).toEqual([]);
  });
});

describe("articles in lesson text agree with the vocabulary genders", () => {
  const dir = resolve(process.cwd(), "src/data/lessons");
  const files = readdirSync(dir).filter((name) => name.endsWith(".ts"));

  const singular = new Map<string, string>();
  const plural = new Set<string>(["Eltern", "Geschwister", "Großeltern"]);

  for (const item of allVocabularyItems()) {
    if (item.partOfSpeech !== "noun" || !item.article) continue;
    singular.set(bare(item.german), item.article);
    if (item.plural) plural.add(bare(item.plural));
  }

  const agrees: Record<string, string[]> = {
    der: ["der", "den", "ein", "einen", "kein", "keinen"],
    die: ["die", "eine", "keine"],
    das: ["das", "ein", "kein"],
  };

  /** Deliberate wrong options and fixed dative chunks, listed explicitly. */
  const INTENTIONAL = new Set(["den USA", "die Stift", "der Stift"]);

  it("finds no article that contradicts a noun's gender", () => {
    const pattern =
      /\b(der|den|dem|die|das|ein|einen|eine|kein|keinen|keine)\s+([A-ZÄÖÜ][\wäöüß]+)/g;
    const problems: string[] = [];

    for (const name of files) {
      readFileSync(resolve(dir, name), "utf8")
        .split("\n")
        .forEach((line, index) => {
          for (const match of line.matchAll(pattern)) {
            const [phrase, article, noun] = match;
            const before = line.slice(0, match.index).trim().split(/\s+/).pop()?.toLowerCase() ?? "";
            const gender = singular.get(noun);

            // Dative after a preposition (in der Schule, aus der Schweiz).
            if (/^(in|aus|mit|von|zu|bei|nach)$/.test(before)) continue;
            if (INTENTIONAL.has(phrase)) continue;
            if (gender && !agrees[gender].includes(article)) {
              if (plural.has(noun) && ["die", "keine"].includes(article)) continue;
              problems.push(`${name}:${index + 1} "${phrase}" (${noun} is ${gender})`);
            } else if (!gender && plural.has(noun) && !["die", "keine"].includes(article)) {
              problems.push(`${name}:${index + 1} "${phrase}" (${noun} is plural)`);
            }
          }
        });
    }

    expect(problems).toEqual([]);
  });
});

describe("informal variants taught in notes are accepted", () => {
  const informal = allVocabularyItems()
    .map((item) => ({ item, match: item.note?.match(/Informal: ((?:der|die|das) )?([A-ZÄÖÜ][\wäöüß]+)\./) }))
    .filter((entry) => entry.match);

  it("finds the informal variants this audit expects", () => {
    expect(informal.map((entry) => entry.match![0]).sort()).toEqual([
      "Informal: Mama.",
      "Informal: Oma.",
      "Informal: Opa.",
      "Informal: Papa.",
      "Informal: der Kuli.",
    ]);
  });

  it("accepts each variant as the German answer (regression: Oma, Opa, Mama, Papa, Kuli were rejected)", () => {
    for (const { item, match } of informal) {
      const word = match![2];
      const withArticle = `${match![1] ?? ""}${word}`;

      if (item.requireArticle) {
        expect(typedGrade(item.id, withArticle).correct, item.id).toBe(true);
        expect(typedGrade(item.id, word).correct, `${item.id} without article`).toBe(false);
      } else {
        expect(typedGrade(item.id, word).correct, item.id).toBe(true);
        expect(typedGrade(item.id, `${item.article} ${word}`).correct, item.id).toBe(true);
      }
    }
  });

  it("still accepts the standard word and rejects an unrelated one", () => {
    expect(typedGrade("grossmutter", "Großmutter").correct).toBe(true);
    expect(typedGrade("grossmutter", "Grossmutter").correct).toBe(true);
    expect(typedGrade("grossmutter", "Oma Opa").correct).toBe(false);
    expect(typedGrade("grossmutter", "Tante").correct).toBe(false);
    expect(typedGrade("mutter", "Vater").correct).toBe(false);
  });
});

describe("accepted variants for Week 3 nouns", () => {
  it("accepts common synonyms with the article, never without it", () => {
    expect(typedGrade("sofa", "die Couch").correct).toBe(true);
    expect(typedGrade("sofa", "Couch").correct).toBe(false);
    expect(typedGrade("sofa", "das Sofa").correct).toBe(true);
    expect(typedGrade("sofa", "der Sofa").correct).toBe(false);
    expect(typedGrade("bildschirm", "der Monitor").correct).toBe(true);
    expect(typedGrade("handy", "das Smartphone").correct).toBe(true);
    expect(typedGrade("handy", "die Smartphone").correct).toBe(false);
  });

  it("accepts common English variants for German → English", () => {
    for (const [id, english] of [
      ["kugelschreiber", "pen"],
      ["tafel", "chalkboard"],
      ["schrank", "closet"],
      ["tasse", "mug"],
      ["gemuese", "veggies"],
      ["wohnzimmer", "lounge"],
      ["lampe", "light"],
    ] as const) {
      expect(typedGrade(id, english, 0).correct, id).toBe(true);
    }

    expect(typedGrade("tasse", "glass", 0).correct).toBe(false);
  });
});

describe("listening-003 clips are semantically consistent", () => {
  it("does not say the books are new and then that a book is not new", () => {
    const plural = week3ListeningClips.find((clip) => clip.id === "l3-plural")!;

    expect(plural.audio).toBe("Die Bücher sind neu. Das Heft ist nicht neu.");
    expect(plural.audio).not.toMatch(/Das Buch/);
    expect(plural.translation).toBe("The books are new. The exercise book is not new.");
    expect(plural.questions[1].prompt).toMatch(/exercise book/);
  });
});

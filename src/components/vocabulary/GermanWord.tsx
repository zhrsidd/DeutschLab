/*
 * Vocabulary typography (DESIGN.md §12, §14). The article is part of the
 * word, so it is set apart in gold; letters rise in when a card changes.
 * PluralShift shows singular → plural and marks only what changes (the
 * article, an umlaut, an ending), so the learner notices the pattern.
 * All of it reads correctly as static text; motion only draws attention.
 */

const ARTICLES = new Set(["der", "die", "das"]);

function split(word: string) {
  const [first, ...rest] = word.split(" ");
  return ARTICLES.has(first) && rest.length > 0
    ? { article: first, noun: rest.join(" ") }
    : { article: null, noun: word };
}

function Letters({ text, offset = 0 }: { text: string; offset?: number }) {
  return (
    <>
      {Array.from(text).map((letter, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="dl-letter"
          style={{ ["--i" as string]: index + offset }}
        >
          {letter === " " ? " " : letter}
        </span>
      ))}
    </>
  );
}

/** "der Stift" with the article in gold; a plain word for verbs and phrases. */
export function GermanWord({ word }: { word: string }) {
  const { article, noun } = split(word);

  return (
    <span lang="de" className="inline-block">
      <span className="sr-only">{word}</span>
      {article ? (
        <>
          <span className="text-highlight">
            <Letters text={article} />
          </span>{" "}
        </>
      ) : null}
      <Letters text={noun} offset={article ? article.length + 1 : 0} />
    </span>
  );
}

/** Longest shared start, so "Buch → Bücher" marks "ücher" and "Stift → Stifte" marks "e". */
function sharedStart(a: string, b: string) {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1;
  return index;
}

/** Visual singular → plural shift; the accessible text stays in the caller's own line. */
export function PluralShift({ singular, plural }: { singular: string; plural: string }) {
  const from = split(singular);
  const to = split(plural);
  const stem = sharedStart(from.noun, to.noun);
  const articleChanged = from.article !== null && to.article !== null && from.article !== to.article;

  return (
    <span aria-hidden="true" lang="de" className="dl-plural mt-3 inline-flex flex-wrap items-baseline gap-x-2.5 text-lg">
      <span className="text-fg-3">
        {from.article ? `${from.article} ` : ""}
        {from.noun}
      </span>
      <span className="dl-plural__arrow text-fg-3">→</span>
      <span className="dl-plural__to font-medium text-fg">
        {to.article ? (
          <span className={articleChanged ? "text-highlight" : ""}>{to.article} </span>
        ) : null}
        {to.noun.slice(0, stem)}
        {stem < to.noun.length ? (
          <mark className="dl-plural__change rounded-sm bg-highlight/15 px-0.5 text-highlight">{to.noun.slice(stem)}</mark>
        ) : null}
      </span>
      {stem >= to.noun.length && to.noun === from.noun ? (
        <span className="text-xs text-fg-3">(same form)</span>
      ) : null}
    </span>
  );
}

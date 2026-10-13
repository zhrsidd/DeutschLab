import type { TeachingPage } from "../../data/lessons/grammarCourseTypes";
import KineticSentence from "../lesson/KineticSentence";

export default function TeachingPageView({ page }: { page: TeachingPage }) {
  return (
    <>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">
        {page.heading}
      </h2>

      <div className="mt-6 space-y-5">
        {page.blocks.map((block, index) => {
          if (block.type === "text") {
            return (
              <p key={index} className="leading-7 text-neutral-500">
                {block.text}
              </p>
            );
          }

          if (block.type === "kinetic") {
            return <KineticSentence key={index} title={block.title} steps={block.steps} />;
          }

          if (block.type === "table") {
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-black/5 bg-white"
              >
                <div
                  className="grid gap-4 border-b border-black/5 bg-neutral-50 px-5 py-3 text-xs font-medium uppercase tracking-wider text-neutral-400"
                  style={{
                    gridTemplateColumns: `repeat(${block.headers.length}, minmax(0, 1fr))`,
                  }}
                >
                  {block.headers.map((header, i) => (
                    <span key={i}>{header}</span>
                  ))}
                </div>

                {block.rows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={[
                      "grid items-center gap-4 px-5 py-3",
                      rowIndex !== block.rows.length - 1
                        ? "border-b border-black/5"
                        : "",
                    ].join(" ")}
                    style={{
                      gridTemplateColumns: `repeat(${block.headers.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {row.map((cell, cellIndex) => (
                      <span
                        key={cellIndex}
                        className={cellIndex === 0 ? "text-neutral-500" : "font-medium"}
                      >
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            );
          }

          if (block.type === "examples") {
            return (
              <div key={index} className="space-y-3">
                {block.items.map((item) => (
                  <div
                    key={item.german}
                    className="rounded-xl border border-black/5 bg-white p-5"
                  >
                    <p className="text-lg font-medium">{item.german}</p>
                    <p className="mt-1 text-neutral-500">{item.english}</p>
                    {item.note ? (
                      <p className="mt-3 text-sm leading-6 text-neutral-400">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div
              key={index}
              className="rounded-xl bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-500"
            >
              <p className="font-medium text-fg">{block.title}</p>
              <p className="mt-1">{block.text}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

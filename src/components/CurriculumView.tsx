import { unit1Curriculum } from "../data/unit1";
import type { WeekSummary } from "../lib/progress";

/** Unit 1 overview: implemented weeks show progress, later weeks are planned. */
export default function CurriculumView({ summaries }: { summaries: WeekSummary[] }) {
  const byWeek = new Map(summaries.map((summary) => [summary.week, summary]));

  return (
    <div className="dl-enter px-5 py-6 md:px-10 md:py-9">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-neutral-400">
            October 2026 → January 2027
          </p>

          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Unit 1 · A0 → Strong A1
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-neutral-500">
            Build strong pronunciation, grammar, vocabulary, listening and
            speaking foundations before beginning A2. DeutschLab v1.0 covers
            October (Weeks 1–4); the later months are the plan ahead.
          </p>
        </header>

        <div className="space-y-5">
          {unit1Curriculum.map((month) => (
            <section
              key={month.month}
              aria-label={month.month}
              className="rounded-2xl border border-black/5 bg-white p-5 md:p-6"
            >
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{month.month}</h2>
                  <p className="mt-1 text-sm text-neutral-400">{month.subtitle}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {month.weeks.map((week) => {
                  const summary = byWeek.get(week.week);
                  const status = !summary
                    ? "Planned"
                    : summary.mastered
                      ? "Mastered"
                      : summary.done > 0
                        ? `${summary.done} of ${summary.tasks.length} done`
                        : "Available";

                  return (
                    <div
                      key={week.week}
                      className={[
                        "rounded-xl border border-black/5 p-4",
                        summary ? "bg-neutral-50" : "bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                          Week {week.week}
                        </p>
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            summary?.mastered
                              ? "bg-neutral-900 text-white"
                              : summary
                                ? "bg-white text-neutral-600 ring-1 ring-black/5"
                                : "text-neutral-400 ring-1 ring-black/5",
                          ].join(" ")}
                        >
                          {status}
                        </span>
                      </div>

                      <h3 className={["mt-2 font-medium", summary ? "" : "text-neutral-500"].join(" ")}>
                        {week.title}
                      </h3>

                      <ul className="mt-3 space-y-1.5">
                        {week.topics.map((topic) => (
                          <li key={topic} className="flex items-start gap-2 text-sm text-neutral-500">
                            <span className="mt-1.75 h-1 w-1 shrink-0 rounded-full bg-neutral-300" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

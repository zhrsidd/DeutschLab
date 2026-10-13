import { starterTasks, taskWeek, type LessonType } from "../../data/unit1";
import type { ProgressData } from "../../lib/db";
import { iconForType } from "../lessonIcons";
import { Page, PageHeader, Section } from "../shell/AppShell";

/*
 * Practice by skill. It exposes only what exists: every lesson can be
 * re-run, and open mistakes point at the lessons that need it. It does not
 * duplicate Review (spaced recall lives there).
 */

const SKILLS: { type: LessonType; label: string; note: string }[] = [
  { type: "vocabulary", label: "Vocabulary", note: "Batches, checks and a mixed quiz; nouns with article and plural." },
  { type: "grammar", label: "Grammar", note: "Explanations, tables and typed practice." },
  { type: "pronunciation", label: "Pronunciation", note: "German sounds with model audio." },
  { type: "listening", label: "Listening", note: "Clips with Play and Slower; the transcript stays hidden until you answer." },
  { type: "reading", label: "Reading", note: "Short texts with evidence for every answer." },
  { type: "writing", label: "Writing", note: "Guided paragraphs with a saved draft and an honest self-check." },
  { type: "speaking", label: "Speaking", note: "Prompts and a timed talk; nothing is recorded." },
];

interface PracticeViewProps {
  progress: ProgressData | null;
  completedTasks: string[];
  startLesson: (taskId: string) => void;
}

export default function PracticeView({ progress, completedTasks, startLesson }: PracticeViewProps) {
  const latest = new Map(
    (progress?.lessonScores ?? []).map((score) => [score.taskId, `${score.latestScore}/${score.latestTotal}`]),
  );
  const weak = (progress?.openMistakesByLesson ?? []).filter((entry) =>
    starterTasks.some((task) => task.id === entry.lessonId),
  );

  return (
    <Page>
      <PageHeader kicker="Practice" title="Practise by skill">
        Re-run any lesson you like. For spaced recall of single words and patterns, use Review.
      </PageHeader>

      <Section title="Needs attention" label="Weak spots">
        {weak.length === 0 ? (
          <p className="text-sm leading-6 text-fg-2">
            {progress
              ? "No open mistakes. When you miss something, the lesson it came from appears here."
              : "Loading…"}
          </p>
        ) : (
          <ul>
            {weak.slice(0, 5).map((entry) => {
              const task = starterTasks.find((item) => item.id === entry.lessonId)!;
              return (
                <li key={entry.lessonId} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => startLesson(task.id)}
                    className="dl-press group grid w-full grid-cols-[1fr_auto] items-baseline gap-4 py-3 text-left"
                  >
                    <span>
                      <span className="block font-medium group-hover:underline group-hover:underline-offset-4">
                        {task.title}
                      </span>
                      <span className="text-sm text-fg-2">Week {taskWeek(task)}</span>
                    </span>
                    <span className="tabular text-sm text-fg-2">
                      {entry.count} open {entry.count === 1 ? "mistake" : "mistakes"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="mt-2 grid gap-x-12 lg:grid-cols-2">
        {SKILLS.map((skill) => {
          const tasks = starterTasks.filter((task) => task.type === skill.type);
          if (tasks.length === 0) return null;
          const Icon = iconForType[skill.type];

          return (
            <Section key={skill.type} title={skill.label}>
              <p className="-mt-2 mb-3 flex items-start gap-2 text-sm text-fg-2">
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0 text-fg-3" />
                {skill.note}
              </p>
              <ul>
                {tasks.map((task) => (
                  <li key={task.id} className="border-t border-line">
                    <button
                      type="button"
                      onClick={() => startLesson(task.id)}
                      className="dl-press group grid w-full grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-3 py-2.5 text-left"
                    >
                      <span className="tabular text-xs text-fg-3">Week {taskWeek(task)}</span>
                      <span className="truncate text-sm font-medium group-hover:underline group-hover:underline-offset-4">
                        {task.title}
                      </span>
                      <span className="tabular text-xs text-fg-2">
                        {latest.get(task.id) ?? (completedTasks.includes(task.id) ? "done" : "not yet")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          );
        })}
      </div>
    </Page>
  );
}

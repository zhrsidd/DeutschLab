import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import {
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  GraduationCap,
  Headphones,
  Languages,
  Mic,
  NotebookPen,
  Target,
  Volume2,
} from "lucide-react";

import GrammarLesson from "./components/GrammarLesson";
import ListeningLesson from "./components/ListeningLesson";
import PronunciationLesson from "./components/PronunciationLesson";
import VocabularyLesson from "./components/VocabularyLesson";

import {
  starterTasks,
  unit1Curriculum,
  type LessonTask,
  type LessonType,
} from "./data/unit1";

import {
  getCompletedTaskIds,
  initialiseDatabase,
  markTaskComplete,
  markTaskIncomplete,
  saveLessonAttempt,
} from "./lib/db";

type View = "today" | "curriculum";

const iconForType: Record<LessonType, ElementType> = {
  vocabulary: Languages,
  grammar: BookOpen,
  pronunciation: Volume2,
  listening: Headphones,
  speaking: Mic,
  writing: NotebookPen,
  review: Target,
};

function App() {
  const [view, setView] = useState<View>("today");

  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [databaseReady, setDatabaseReady] = useState(false);

  const [selectedTask, setSelectedTask] = useState<LessonTask | null>(
    starterTasks[0] ?? null,
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      try {
        await initialiseDatabase();

        const completed = await getCompletedTaskIds();

        setCompletedTasks(completed);
        setDatabaseReady(true);
      } catch (error) {
        console.error(
          "Failed to initialise DeutschLab database:",
          error,
        );
      }
    }

    void loadProgress();
  }, []);

  const totalMinutes = useMemo(
    () =>
      starterTasks.reduce(
        (sum, task) => sum + task.minutes,
        0,
      ),
    [],
  );

  const completedMinutes = useMemo(
    () =>
      starterTasks
        .filter((task) =>
          completedTasks.includes(task.id),
        )
        .reduce(
          (sum, task) => sum + task.minutes,
          0,
        ),
    [completedTasks],
  );

  const progress =
    starterTasks.length === 0
      ? 0
      : Math.round(
          (completedTasks.length /
            starterTasks.length) *
            100,
        );

  const nextIncompleteTask =
    starterTasks.find(
      (task) =>
        !completedTasks.includes(task.id),
    ) ?? null;

  const toggleTask = async (id: string) => {
    const isComplete =
      completedTasks.includes(id);

    try {
      if (isComplete) {
        await markTaskIncomplete(id);

        setCompletedTasks((current) =>
          current.filter(
            (taskId) => taskId !== id,
          ),
        );
      } else {
        await markTaskComplete(id);

        setCompletedTasks((current) =>
          current.includes(id)
            ? current
            : [...current, id],
        );
      }
    } catch (error) {
      console.error(
        "Failed to update task progress:",
        error,
      );
    }
  };

  const finishLesson = async (
    taskId: string,
  ) => {
    try {
      await markTaskComplete(taskId);

      setCompletedTasks((current) =>
        current.includes(taskId)
          ? current
          : [...current, taskId],
      );

      setActiveLessonId(null);
      setView("today");
    } catch (error) {
      console.error(
        "Failed to finish lesson:",
        error,
      );
    }
  };

  if (!databaseReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-sm text-neutral-400">
          Opening DeutschLab…
        </div>
      </div>
    );
  }

  /*
   * Lesson mode
   *
   * We render the lesson by itself instead of
   * keeping the normal sidebar visible.
   */
  if (activeLessonId === "vocab-001") {
    return (
      <VocabularyLesson
        onBack={() =>
          setActiveLessonId(null)
        }
        onSaveAttempt={(score, total) =>
          saveLessonAttempt(
            "vocab-001",
            score,
            total,
          )
        }
        onFinish={() =>
          finishLesson("vocab-001")
        }
      />
    );
  }

  if (activeLessonId === "listening-001") {
    return (
      <ListeningLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("listening-001", score, total)
        }
        onFinish={() => finishLesson("listening-001")}
      />
    );
  }

  if (activeLessonId === "grammar-001") {
    return (
      <GrammarLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-001", score, total)
        }
        onFinish={() => finishLesson("grammar-001")}
      />
    );
  }

  if (activeLessonId === "pronunciation-001") {
    return (
      <PronunciationLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("pronunciation-001", score, total)
        }
        onFinish={() => finishLesson("pronunciation-001")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-900">
      <div className="mx-auto flex min-h-screen max-w-375">
        <aside className="w-64 shrink-0 border-r border-black/5 bg-white px-5 py-6">
          <div className="mb-9 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <GraduationCap
                size={21}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <div className="font-semibold tracking-tight">
                DeutschLab
              </div>

              <div className="text-xs text-neutral-400">
                German for ETH
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarButton
              active={view === "today"}
              onClick={() =>
                setView("today")
              }
            >
              <Target size={18} />
              Today
            </SidebarButton>

            <SidebarButton
              active={
                view === "curriculum"
              }
              onClick={() =>
                setView("curriculum")
              }
            >
              <BookOpen size={18} />
              Unit 1
            </SidebarButton>
          </nav>

          <div className="mt-10 border-t border-black/5 pt-6">
            <p className="px-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
              Current level
            </p>

            <div className="mt-3 px-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  A1 Foundations
                </span>

                <span className="text-neutral-400">
                  Week 1
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      6,
                      progress,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {view === "today" ? (
            <TodayView
              completedTasks={
                completedTasks
              }
              completedMinutes={
                completedMinutes
              }
              totalMinutes={totalMinutes}
              progress={progress}
              selectedTask={selectedTask}
              setSelectedTask={
                setSelectedTask
              }
              toggleTask={toggleTask}
              nextIncompleteTask={
                nextIncompleteTask
              }
              startLesson={(taskId) =>
                setActiveLessonId(taskId)
              }
            />
          ) : (
            <CurriculumView />
          )}
        </main>
      </div>
    </div>
  );
}

interface TodayViewProps {
  completedTasks: string[];
  completedMinutes: number;
  totalMinutes: number;
  progress: number;

  selectedTask: LessonTask | null;

  setSelectedTask: (
    task: LessonTask,
  ) => void;

  toggleTask: (
    id: string,
  ) => Promise<void>;

  nextIncompleteTask:
    | LessonTask
    | null;

  startLesson: (
    taskId: string,
  ) => void;
}

function TodayView({
  completedTasks,
  completedMinutes,
  totalMinutes,
  progress,
  selectedTask,
  setSelectedTask,
  toggleTask,
  nextIncompleteTask,
  startLesson,
}: TodayViewProps) {
  const remainingMinutes = Math.max(
    0,
    totalMinutes - completedMinutes,
  );

  return (
    <div className="px-10 py-9">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-400">
              Unit 1 · Week 1
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.03em]">
              Guten Morgen.
            </h1>

            <p className="mt-2 max-w-xl text-neutral-500">
              Today we're building the
              foundations: pronunciation,
              basic vocabulary and your first
              German sentences.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-3 text-sm text-neutral-500">
            <Clock3 size={16} />

            {remainingMinutes} min
            remaining
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-black/5 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Today's session
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                {completedTasks.length} of{" "}
                {starterTasks.length}{" "}
                activities complete
              </p>
            </div>

            <div className="text-sm font-medium">
              {progress}%
            </div>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-neutral-900 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] gap-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold tracking-tight">
                Today's activities
              </h2>

              <span className="text-sm text-neutral-400">
                {totalMinutes} minutes
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
              {starterTasks.map(
                (task, index) => {
                  const Icon =
                    iconForType[
                      task.type
                    ];

                  const complete =
                    completedTasks.includes(
                      task.id,
                    );

                  const selected =
                    selectedTask?.id ===
                    task.id;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() =>
                        setSelectedTask(
                          task,
                        )
                      }
                      className={[
                        "flex w-full items-center gap-4 px-5 py-4 text-left transition",
                        index !==
                        starterTasks.length -
                          1
                          ? "border-b border-black/5"
                          : "",
                        selected
                          ? "bg-neutral-50"
                          : "hover:bg-neutral-50/70",
                      ].join(" ")}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                        <Icon
                          size={19}
                          strokeWidth={
                            1.8
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "font-medium",
                              complete
                                ? "text-neutral-400 line-through"
                                : "",
                            ].join(
                              " ",
                            )}
                          >
                            {
                              task.title
                            }
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-neutral-400">
                          {
                            task.description
                          }
                        </p>
                      </div>

                      <span className="shrink-0 text-sm text-neutral-400">
                        {task.minutes}{" "}
                        min
                      </span>

                      {complete ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white">
                          <Check
                            size={15}
                          />
                        </div>
                      ) : (
                        <ChevronRight
                          size={18}
                          className="text-neutral-300"
                        />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <aside>
            {selectedTask ? (
              <div className="sticky top-8 rounded-2xl border border-black/5 bg-white p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Selected activity
                </p>

                <h2 className="mt-3 text-xl font-semibold tracking-tight">
                  {
                    selectedTask.title
                  }
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {
                    selectedTask.description
                  }
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm text-neutral-400">
                  <Clock3 size={15} />

                  Around{" "}
                  {
                    selectedTask.minutes
                  }{" "}
                  minutes
                </div>

                {selectedTask.id === "vocab-001" ||
                selectedTask.id === "pronunciation-001" ||
                selectedTask.id === "grammar-001" ||
                selectedTask.id === "listening-001" ? (
                  <button
                    type="button"
                    onClick={() =>
                      startLesson(
                        selectedTask.id,
                      )
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    {completedTasks.includes(
                      selectedTask.id,
                    )
                      ? "Review lesson"
                      : "Start lesson"}

                    <ChevronRight
                      size={16}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      void toggleTask(
                        selectedTask.id,
                      )
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    {completedTasks.includes(
                      selectedTask.id,
                    ) ? (
                      <>
                        <Circle
                          size={16}
                        />
                        Mark incomplete
                      </>
                    ) : (
                      <>
                        <Check
                          size={16}
                        />
                        Mark complete
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : null}

            {nextIncompleteTask ===
              null && (
              <div className="mt-4 rounded-2xl border border-black/5 bg-white p-6">
                <p className="font-medium">
                  Session complete 🎉
                </p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  You're done for
                  today. Consistency
                  matters more than
                  grinding extra
                  lessons.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function CurriculumView() {
  return (
    <div className="px-10 py-9">
      <div className="mx-auto max-w-5xl">
        <header className="mb-9">
          <p className="mb-2 text-sm font-medium text-neutral-400">
            October 2026 → January
            2027
          </p>

          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Unit 1 · A0 → Strong A1
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-neutral-500">
            Build strong pronunciation,
            grammar, vocabulary,
            listening and speaking
            foundations before
            beginning A2.
          </p>
        </header>

        <div className="space-y-5">
          {unit1Curriculum.map(
            (month) => (
              <section
                key={month.month}
                className="rounded-2xl border border-black/5 bg-white p-6"
              >
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    {month.month}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-400">
                    {month.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {month.weeks.map(
                    (week) => (
                      <div
                        key={
                          week.week
                        }
                        className="rounded-xl border border-black/5 bg-neutral-50 p-4"
                      >
                        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                          Week{" "}
                          {week.week}
                        </p>

                        <h3 className="mt-2 font-medium">
                          {
                            week.title
                          }
                        </h3>

                        <div className="mt-3 space-y-1.5">
                          {week.topics.map(
                            (
                              topic,
                            ) => (
                              <div
                                key={
                                  topic
                                }
                                className="flex items-start gap-2 text-sm text-neutral-500"
                              >
                                <span className="mt-1.75 h-1 w-1 shrink-0 rounded-full bg-neutral-300" />

                                {topic}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

interface SidebarButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function SidebarButton({
  active,
  onClick,
  children,
}: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
        active
          ? "bg-neutral-100 font-medium text-neutral-900"
          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default App;
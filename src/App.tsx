import {
  Fragment,
  useCallback,
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
  RotateCcw,
  Mic,
  NotebookPen,
  Target,
  Volume2,
} from "lucide-react";

import GrammarLesson from "./components/GrammarLesson";
import ListeningLesson from "./components/ListeningLesson";
import ReviewView, { formatReviewDate } from "./components/ReviewView";
import SpeakingLesson from "./components/SpeakingLesson";
import WeekCheckpoint from "./components/WeekCheckpoint";
import {
  week2VocabularySet,
  week3VocabularySet,
} from "./data/lessons/vocabularySets";
import CommonVerbsLesson from "./components/CommonVerbsLesson";
import WritingLesson from "./components/WritingLesson";
import Week2ListeningLesson from "./components/Week2ListeningLesson";
import Week2ReadingLesson from "./components/Week2ReadingLesson";
import Week3ListeningLesson from "./components/Week3ListeningLesson";
import Week3ReadingLesson from "./components/Week3ReadingLesson";
import { roomWriting } from "./data/lessons/week3Writing";
import {
  week2CheckpointDefinition,
  week3CheckpointDefinition,
} from "./lib/checkpointDefinitions";
import AccusativeLesson from "./components/AccusativeLesson";
import ArticlesLesson from "./components/ArticlesLesson";
import HabenLesson from "./components/HabenLesson";
import NegationLesson from "./components/NegationLesson";
import QuestionsLesson from "./components/QuestionsLesson";
import RegularVerbsLesson from "./components/RegularVerbsLesson";
import PronunciationLesson from "./components/PronunciationLesson";
import VocabularyLesson from "./components/VocabularyLesson";

import {
  starterTasks,
  unit1Curriculum,
  taskWeek,
  type LessonTask,
  type LessonType,
} from "./data/unit1";

import {
  getCompletedTaskIds,
  getPlannerData,
  getStudyMinutes,
  initialiseDatabase,
  markTaskComplete,
  markTaskIncomplete,
  saveCheckpointAttempt,
  saveLessonAttempt,
  setStudyMinutes,
  type PlannerData,
} from "./lib/db";

import {
  CHECKPOINT_ID,
  WEEK2_CHECKPOINT_ID,
  WEEK3_CHECKPOINT_ID,
  isWeek1Mastered,
  isWeek2Mastered,
  isWeek3Mastered,
} from "./lib/checkpointScoring";

import {
  DEFAULT_STUDY_MINUTES,
  STUDY_TIME_OPTIONS,
  generateDailyPlan,
  type DailyPlan,
  type PlanItem,
} from "./lib/dailyPlanner";

type View = "today" | "curriculum" | "review";

const iconForType: Record<LessonType, ElementType> = {
  vocabulary: Languages,
  grammar: BookOpen,
  pronunciation: Volume2,
  listening: Headphones,
  speaking: Mic,
  writing: NotebookPen,
  reading: BookOpen,
  review: Target,
};

/** Tasks that open a real lesson (the rest use the manual toggle). */
const IMPLEMENTED_LESSON_IDS = new Set(starterTasks.map((task) => task.id));

function App() {
  const [view, setView] = useState<View>("today");

  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [databaseReady, setDatabaseReady] = useState(false);

  const [selectedTask, setSelectedTask] = useState<LessonTask | null>(
    starterTasks[0] ?? null,
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlannerData>({
    attemptedCheckpointIds: [],
    dueReviewCount: 0,
    dueReviewKeys: [],
    unresolvedMistakes: [],
    nextDueAt: null,
  });
  const [studyMinutes, setStudyMinutesState] = useState(
    DEFAULT_STUDY_MINUTES,
  );
  // Weak-area items practised this session; kept in memory only.
  // Review-session size requested by a Today plan card (null = default).
  const [reviewLimit, setReviewLimit] = useState<number | null>(null);
  const [dismissedMistakes, setDismissedMistakes] = useState<number[]>([]);

  useEffect(() => {
    async function loadProgress() {
      try {
        await initialiseDatabase();

        const completed = await getCompletedTaskIds();

        const savedMinutes = await getStudyMinutes();

        setCompletedTasks(completed);

        if (
          savedMinutes !== null &&
          (STUDY_TIME_OPTIONS as readonly number[]).includes(savedMinutes)
        ) {
          setStudyMinutesState(savedMinutes);
        }

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

  const refreshPlanData = useCallback(async () => {
    try {
      setPlanData(await getPlannerData());
    } catch (error) {
      console.error("Failed to load planner data:", error);
    }
  }, []);

  // Refresh review/mistake data on load and whenever we return to Today
  // from a lesson or the Review view.
  useEffect(() => {
    if (databaseReady && activeLessonId === null) {
      void refreshPlanData();
    }
  }, [databaseReady, activeLessonId, view, refreshPlanData]);

  const plan: DailyPlan = useMemo(
    () =>
      generateDailyPlan({
        tasks: starterTasks,
        completedTaskIds: completedTasks,
        dueReviewCount: planData.dueReviewCount,
        dueReviewKeys: planData.dueReviewKeys,
        unresolvedMistakes: planData.unresolvedMistakes,
        dismissedMistakeIds: dismissedMistakes,
        attemptedCheckpointIds: planData.attemptedCheckpointIds,
        budgetMinutes: studyMinutes,
      }),
    [completedTasks, planData, dismissedMistakes, studyMinutes],
  );

  const changeStudyMinutes = async (minutes: number) => {
    setStudyMinutesState(minutes);

    try {
      await setStudyMinutes(minutes);
    } catch (error) {
      console.error("Failed to save study time:", error);
    }
  };

  const startPlanItem = (item: PlanItem) => {
    if (item.mistakeId !== undefined) {
      const id = item.mistakeId;
      setDismissedMistakes((current) => [...current, id]);
    }

    if (item.target.type === "review") {
      setReviewLimit(item.reviewLimit ?? null);
      setView("review");
    } else {
      setActiveLessonId(item.target.taskId);
    }
  };

  const totalMinutes = useMemo(
    () =>
      starterTasks.reduce(
        (sum, task) => sum + task.minutes,
        0,
      ),
    [],
  );

  // Progress and the sidebar bar track Week 1; Week 2 appears below it.
  const week1Tasks = starterTasks.filter((task) => taskWeek(task) === 1);

  const progress =
    week1Tasks.length === 0
      ? 0
      : Math.round(
          (week1Tasks.filter((task) => completedTasks.includes(task.id))
            .length /
            week1Tasks.length) *
            100,
        );

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
  if (activeLessonId === "vocab-002") {
    return (
      <VocabularyLesson
        set={week2VocabularySet}
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("vocab-002", score, total)
        }
        onFinish={() => finishLesson("vocab-002")}
      />
    );
  }

  if (activeLessonId === "vocab-003") {
    return (
      <VocabularyLesson
        set={week3VocabularySet}
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("vocab-003", score, total)
        }
        onFinish={() => finishLesson("vocab-003")}
      />
    );
  }

  if (activeLessonId === "grammar-006") {
    return (
      <ArticlesLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-006", score, total)
        }
        onFinish={() => finishLesson("grammar-006")}
      />
    );
  }

  if (activeLessonId === "grammar-007") {
    return (
      <AccusativeLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-007", score, total)
        }
        onFinish={() => finishLesson("grammar-007")}
      />
    );
  }

  if (activeLessonId === "grammar-008") {
    return (
      <NegationLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-008", score, total)
        }
        onFinish={() => finishLesson("grammar-008")}
      />
    );
  }

  if (activeLessonId === "grammar-004") {
    return (
      <HabenLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-004", score, total)
        }
        onFinish={() => finishLesson("grammar-004")}
      />
    );
  }

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

  if (activeLessonId === "speaking-001") {
    return (
      <SpeakingLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("speaking-001", score, total)
        }
        onFinish={() => finishLesson("speaking-001")}
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

  if (activeLessonId === "grammar-005") {
    return (
      <CommonVerbsLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-005", score, total)
        }
        onFinish={() => finishLesson("grammar-005")}
      />
    );
  }

  if (activeLessonId === "writing-001") {
    return (
      <WritingLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("writing-001", score, total)
        }
        onFinish={() => finishLesson("writing-001")}
      />
    );
  }

  if (activeLessonId === "reading-001") {
    return (
      <Week2ReadingLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("reading-001", score, total)
        }
        onFinish={() => finishLesson("reading-001")}
      />
    );
  }

  if (activeLessonId === "listening-002") {
    return (
      <Week2ListeningLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("listening-002", score, total)
        }
        onFinish={() => finishLesson("listening-002")}
      />
    );
  }

  if (activeLessonId === "reading-002") {
    return (
      <Week3ReadingLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("reading-002", score, total)
        }
        onFinish={() => finishLesson("reading-002")}
      />
    );
  }

  if (activeLessonId === "listening-003") {
    return (
      <Week3ListeningLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("listening-003", score, total)
        }
        onFinish={() => finishLesson("listening-003")}
      />
    );
  }

  if (activeLessonId === "writing-002") {
    return (
      <WritingLesson
        config={roomWriting}
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("writing-002", score, total)
        }
        onFinish={() => finishLesson("writing-002")}
      />
    );
  }

  if (activeLessonId === WEEK3_CHECKPOINT_ID) {
    return (
      <WeekCheckpoint
        definition={week3CheckpointDefinition}
        unfinishedLessons={
          starterTasks.filter(
            (task) =>
              taskWeek(task) === 3 &&
              task.id !== WEEK3_CHECKPOINT_ID &&
              !completedTasks.includes(task.id),
          ).length
        }
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(result) =>
          saveCheckpointAttempt(WEEK3_CHECKPOINT_ID, result)
        }
        onFinish={() => finishLesson(WEEK3_CHECKPOINT_ID)}
        onOpenTarget={(target) => {
          if (target.type === "review") {
            setReviewLimit(null);
            setActiveLessonId(null);
            setView("review");
          } else {
            setActiveLessonId(target.taskId);
          }
        }}
      />
    );
  }

  if (activeLessonId === WEEK2_CHECKPOINT_ID) {
    return (
      <WeekCheckpoint
        definition={week2CheckpointDefinition}
        unfinishedLessons={
          starterTasks.filter(
            (task) =>
              taskWeek(task) === 2 &&
              task.id !== WEEK2_CHECKPOINT_ID &&
              !completedTasks.includes(task.id),
          ).length
        }
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(result) =>
          saveCheckpointAttempt(WEEK2_CHECKPOINT_ID, result)
        }
        onFinish={() => finishLesson(WEEK2_CHECKPOINT_ID)}
        onOpenTarget={(target) => {
          if (target.type === "review") {
            setReviewLimit(null);
            setActiveLessonId(null);
            setView("review");
          } else {
            setActiveLessonId(target.taskId);
          }
        }}
      />
    );
  }

  if (activeLessonId === CHECKPOINT_ID) {
    return (
      <WeekCheckpoint
        unfinishedLessons={
          starterTasks.filter(
            (task) =>
              taskWeek(task) === 1 &&
              task.id !== CHECKPOINT_ID &&
              !completedTasks.includes(task.id),
          ).length
        }
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(result) =>
          saveCheckpointAttempt(CHECKPOINT_ID, result)
        }
        onFinish={() => finishLesson(CHECKPOINT_ID)}
        onOpenTarget={(target) => {
          if (target.type === "review") {
            setReviewLimit(null);
            setActiveLessonId(null);
            setView("review");
          } else {
            setActiveLessonId(target.taskId);
          }
        }}
      />
    );
  }

  if (activeLessonId === "grammar-002") {
    return (
      <RegularVerbsLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-002", score, total)
        }
        onFinish={() => finishLesson("grammar-002")}
      />
    );
  }

  if (activeLessonId === "grammar-003") {
    return (
      <QuestionsLesson
        onBack={() => setActiveLessonId(null)}
        onSaveAttempt={(score, total) =>
          saveLessonAttempt("grammar-003", score, total)
        }
        onFinish={() => finishLesson("grammar-003")}
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

            <SidebarButton
              active={view === "review"}
              onClick={() => {
                setReviewLimit(null);
                setView("review");
              }}
            >
              <RotateCcw size={18} />
              Review
              {planData.dueReviewCount > 0 ? (
                <span className="ml-auto rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                  {planData.dueReviewCount}
                </span>
              ) : null}
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
              totalMinutes={totalMinutes}
              selectedTask={selectedTask}
              setSelectedTask={
                setSelectedTask
              }
              toggleTask={toggleTask}
              startLesson={(taskId) =>
                setActiveLessonId(taskId)
              }
              plan={plan}
              week1Mastered={isWeek1Mastered(completedTasks)}
              week2Mastered={isWeek2Mastered(completedTasks)}
              week3Mastered={isWeek3Mastered(completedTasks)}
              nextReviewAt={planData.nextDueAt}
              studyMinutes={studyMinutes}
              setStudyMinutes={(minutes) =>
                void changeStudyMinutes(minutes)
              }
              startPlanItem={startPlanItem}
            />
          ) : view === "review" ? (
            <ReviewView
              sessionLimit={reviewLimit}
              onChange={() => {
                setReviewLimit(null);
                void refreshPlanData();
              }}
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
  totalMinutes: number;

  selectedTask: LessonTask | null;

  setSelectedTask: (
    task: LessonTask,
  ) => void;

  toggleTask: (
    id: string,
  ) => Promise<void>;

  startLesson: (
    taskId: string,
  ) => void;

  plan: DailyPlan;
  week1Mastered: boolean;
  week2Mastered: boolean;
  week3Mastered: boolean;
  nextReviewAt: string | null;
  studyMinutes: number;
  setStudyMinutes: (minutes: number) => void;
  startPlanItem: (item: PlanItem) => void;
}

function TodayView({
  completedTasks,
  totalMinutes,
  selectedTask,
  setSelectedTask,
  toggleTask,
  startLesson,
  plan,
  week1Mastered,
  week2Mastered,
  week3Mastered,
  nextReviewAt,
  studyMinutes,
  setStudyMinutes,
  startPlanItem,
}: TodayViewProps) {
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

          <div>
            <p className="mb-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-400">
              Study time today
            </p>

            <div className="flex rounded-xl border border-black/5 bg-white p-1">
              {STUDY_TIME_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setStudyMinutes(minutes)}
                  className={[
                    "rounded-lg px-3.5 py-2 text-sm transition",
                    minutes === studyMinutes
                      ? "bg-neutral-900 font-medium text-white"
                      : "text-neutral-500 hover:bg-neutral-50",
                  ].join(" ")}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>
        </header>

        <WeekProgressCard
          label="Week 1"
          tasks={starterTasks.filter((task) => taskWeek(task) === 1)}
          completedTasks={completedTasks}
          mastered={week1Mastered}
        />

        <WeekProgressCard
          label="Week 2"
          tasks={starterTasks.filter((task) => taskWeek(task) === 2)}
          completedTasks={completedTasks}
          mastered={week2Mastered}
        />

        <WeekProgressCard
          label="Week 3"
          tasks={starterTasks.filter((task) => taskWeek(task) === 3)}
          completedTasks={completedTasks}
          mastered={week3Mastered}
        />

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight">
              Today's plan
            </h2>

            <span className="text-sm text-neutral-400">
              {plan.totalMinutes} of {plan.budgetMinutes} min ·{" "}
              {plan.dueReviewCount}{" "}
              {plan.dueReviewCount === 1 ? "review" : "reviews"} due
            </span>
          </div>

          {plan.done ? (
            <div className="rounded-2xl border border-black/5 bg-white p-6">
              <p className="font-medium">You're done for today.</p>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {nextReviewAt
                  ? `Next review: ${formatReviewDate(nextReviewAt)}.`
                  : "No reviews are scheduled yet."}{" "}
                Consistency matters more than grinding extra lessons.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
              {plan.items.map((item, index) => {
                const Icon =
                  item.kind === "lesson"
                    ? iconForType[
                        starterTasks.find(
                          (task) => task.id === item.sourceId,
                        )?.type ?? "review"
                      ]
                    : RotateCcw;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => startPlanItem(item)}
                    className={[
                      "flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-neutral-50/70",
                      index !== plan.items.length - 1
                        ? "border-b border-black/5"
                        : "",
                    ].join(" ")}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                      <Icon size={19} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 truncate text-sm text-neutral-400">
                        {item.reason} · {item.description}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm text-neutral-400">
                      {item.minutes} min
                    </span>

                    <ChevronRight
                      size={18}
                      className="text-neutral-300"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] gap-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold tracking-tight">
                Activities
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

                  const startsNewWeek =
                    index > 0 &&
                    taskWeek(task) !==
                      taskWeek(starterTasks[index - 1]);

                  return (
                    <Fragment key={task.id}>
                      {startsNewWeek ? (
                        <div className="border-y border-black/5 bg-neutral-50 px-5 py-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
                          Week {taskWeek(task)}
                        </div>
                      ) : null}

                    <button
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
                    </Fragment>
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

                {IMPLEMENTED_LESSON_IDS.has(selectedTask.id) ? (
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
          </aside>
        </div>
      </div>
    </div>
  );
}

function WeekProgressCard({
  label,
  tasks,
  completedTasks,
  mastered,
}: {
  label: string;
  tasks: LessonTask[];
  completedTasks: string[];
  mastered: boolean;
}) {
  const done = tasks.filter((task) => completedTasks.includes(task.id)).length;
  const percent = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  return (
    <section className="mb-4 rounded-2xl border border-black/5 bg-white p-6 last:mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {label} progress{mastered ? " · Mastered" : ""}
          </p>

          <p className="mt-1 text-sm text-neutral-400">
            {done} of {tasks.length} {label} activities complete
          </p>
        </div>

        <div className="text-sm font-medium">{percent}%</div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
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
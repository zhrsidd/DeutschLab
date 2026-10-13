import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  BookOpen,
  GraduationCap,
  HardDrive,
  RotateCcw,
  Target,
} from "lucide-react";

import AccusativeLesson from "./components/AccusativeLesson";
import ArticlesLesson from "./components/ArticlesLesson";
import CommonVerbsLesson from "./components/CommonVerbsLesson";
import CurriculumView from "./components/CurriculumView";
import DataView from "./components/DataView";
import GrammarLesson from "./components/GrammarLesson";
import HabenLesson from "./components/HabenLesson";
import IrregularVerbsLesson from "./components/IrregularVerbsLesson";
import ListeningLesson from "./components/ListeningLesson";
import NegationLesson from "./components/NegationLesson";
import PronounsLesson from "./components/PronounsLesson";
import PronunciationLesson from "./components/PronunciationLesson";
import QuestionsLesson from "./components/QuestionsLesson";
import RegularVerbsLesson from "./components/RegularVerbsLesson";
import ReviewView from "./components/ReviewView";
import SpeakingLesson from "./components/SpeakingLesson";
import TodayView from "./components/today/TodayView";
import VocabularyLesson from "./components/VocabularyLesson";
import WeekCheckpoint from "./components/WeekCheckpoint";
import Week2ListeningLesson from "./components/Week2ListeningLesson";
import Week2ReadingLesson from "./components/Week2ReadingLesson";
import Week3ListeningLesson from "./components/Week3ListeningLesson";
import Week3ReadingLesson from "./components/Week3ReadingLesson";
import Week4ListeningLesson from "./components/Week4ListeningLesson";
import Week4ReadingLesson from "./components/Week4ReadingLesson";
import WritingLesson from "./components/WritingLesson";

import {
  week2VocabularySet,
  week3VocabularySet,
  week4VocabularySet,
} from "./data/lessons/vocabularySets";
import { roomWriting } from "./data/lessons/week3Writing";
import { week4SpeakingConfig } from "./data/lessons/week4Speaking";
import { everydayWriting } from "./data/lessons/week4Writing";
import { starterTasks, taskWeek } from "./data/unit1";

import {
  week1CheckpointDefinition,
  week2CheckpointDefinition,
  week3CheckpointDefinition,
  week4CheckpointDefinition,
  type CheckpointDefinition,
} from "./lib/checkpointDefinitions";
import type { CheckpointResult } from "./lib/checkpointScoring";
import {
  DEFAULT_STUDY_MINUTES,
  STUDY_TIME_OPTIONS,
  generateDailyPlan,
  type DailyPlan,
  type PlanItem,
  type PlanTarget,
} from "./lib/dailyPlanner";
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
import { allWeeksMastered, currentWeek, weekSummaries } from "./lib/progress";

type View = "today" | "curriculum" | "review" | "data";

/** Tasks that open a real lesson (the rest use the manual toggle). */
const IMPLEMENTED_LESSON_IDS = new Set(starterTasks.map((task) => task.id));

interface LessonProps {
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

/** Every lesson, by task id. Lessons render full-screen without the sidebar. */
const LESSONS: Record<string, (props: LessonProps) => ReactNode> = {
  // Week 1
  "vocab-001": (props) => <VocabularyLesson {...props} />,
  "pronunciation-001": (props) => <PronunciationLesson {...props} />,
  "grammar-001": (props) => <GrammarLesson {...props} />,
  "grammar-002": (props) => <RegularVerbsLesson {...props} />,
  "grammar-003": (props) => <QuestionsLesson {...props} />,
  "listening-001": (props) => <ListeningLesson {...props} />,
  "speaking-001": (props) => <SpeakingLesson {...props} />,
  // Week 2
  "vocab-002": (props) => <VocabularyLesson set={week2VocabularySet} {...props} />,
  "grammar-004": (props) => <HabenLesson {...props} />,
  "grammar-005": (props) => <CommonVerbsLesson {...props} />,
  "writing-001": (props) => <WritingLesson {...props} />,
  "reading-001": (props) => <Week2ReadingLesson {...props} />,
  "listening-002": (props) => <Week2ListeningLesson {...props} />,
  // Week 3
  "vocab-003": (props) => <VocabularyLesson set={week3VocabularySet} {...props} />,
  "grammar-006": (props) => <ArticlesLesson {...props} />,
  "grammar-007": (props) => <AccusativeLesson {...props} />,
  "grammar-008": (props) => <NegationLesson {...props} />,
  "reading-002": (props) => <Week3ReadingLesson {...props} />,
  "listening-003": (props) => <Week3ListeningLesson {...props} />,
  "writing-002": (props) => <WritingLesson config={roomWriting} {...props} />,
  // Week 4
  "vocab-004": (props) => <VocabularyLesson set={week4VocabularySet} {...props} />,
  "grammar-009": (props) => <PronounsLesson {...props} />,
  "grammar-010": (props) => <IrregularVerbsLesson {...props} />,
  "reading-003": (props) => <Week4ReadingLesson {...props} />,
  "listening-004": (props) => <Week4ListeningLesson {...props} />,
  "writing-003": (props) => <WritingLesson config={everydayWriting} {...props} />,
  "speaking-002": (props) => <SpeakingLesson config={week4SpeakingConfig} {...props} />,
};

const CHECKPOINTS: Record<string, CheckpointDefinition> = {
  "checkpoint-001": week1CheckpointDefinition,
  "checkpoint-002": week2CheckpointDefinition,
  "checkpoint-003": week3CheckpointDefinition,
  "checkpoint-004": week4CheckpointDefinition,
};

function App() {
  const [view, setView] = useState<View>("today");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [planData, setPlanData] = useState<PlannerData>({
    attemptedCheckpointIds: [],
    dueReviewCount: 0,
    dueReviewKeys: [],
    unresolvedMistakes: [],
    nextDueAt: null,
  });
  const [studyMinutes, setStudyMinutesState] = useState(DEFAULT_STUDY_MINUTES);
  // Review-session size requested by a Today plan card (null = default).
  const [reviewLimit, setReviewLimit] = useState<number | null>(null);
  // Weak-area items practised this session; kept in memory only.
  const [dismissedMistakes, setDismissedMistakes] = useState<number[]>([]);

  const loadProgress = useCallback(async () => {
    setDatabaseError(false);

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
      console.error("Failed to initialise DeutschLab database:", error);
      setDatabaseError(true);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

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

  const summaries = useMemo(
    () => weekSummaries(starterTasks, completedTasks),
    [completedTasks],
  );

  const changeStudyMinutes = async (minutes: number) => {
    setStudyMinutesState(minutes);

    try {
      await setStudyMinutes(minutes);
    } catch (error) {
      console.error("Failed to save study time:", error);
    }
  };

  const openReview = (limit: number | null) => {
    setReviewLimit(limit);
    setActiveLessonId(null);
    setView("review");
  };

  const openTarget = (target: PlanTarget) => {
    if (target.type === "review") openReview(null);
    else setActiveLessonId(target.taskId);
  };

  const startPlanItem = (item: PlanItem) => {
    if (item.mistakeId !== undefined) {
      const id = item.mistakeId;
      setDismissedMistakes((current) => [...current, id]);
    }

    if (item.target.type === "review") openReview(item.reviewLimit ?? null);
    else setActiveLessonId(item.target.taskId);
  };

  const toggleTask = async (id: string) => {
    try {
      if (completedTasks.includes(id)) {
        await markTaskIncomplete(id);
        setCompletedTasks((current) => current.filter((taskId) => taskId !== id));
      } else {
        await markTaskComplete(id);
        setCompletedTasks((current) => (current.includes(id) ? current : [...current, id]));
      }
    } catch (error) {
      console.error("Failed to update task progress:", error);
    }
  };

  const finishLesson = async (taskId: string) => {
    try {
      await markTaskComplete(taskId);
    } catch (error) {
      console.error("Failed to finish lesson:", error);
      // The lesson shows its own error and lets the learner try again.
      throw error;
    }

    setCompletedTasks((current) => (current.includes(taskId) ? current : [...current, taskId]));
    setActiveLessonId(null);
    setView("today");
  };

  if (databaseError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div role="alert" className="max-w-md rounded-2xl border border-black/5 bg-white p-6">
          <p className="font-semibold">DeutschLab could not open its database.</p>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Nothing was changed or deleted. Try again; if it keeps happening,
            quit and reopen the app.
          </p>
          <button
            type="button"
            onClick={() => void loadProgress()}
            className="mt-5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!databaseReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div role="status" className="text-sm text-neutral-400">
          Opening DeutschLab…
        </div>
      </div>
    );
  }

  /*
   * Lesson mode: the lesson renders by itself, without the sidebar.
   */
  if (activeLessonId !== null) {
    const id = activeLessonId;
    const back = () => setActiveLessonId(null);
    const definition = CHECKPOINTS[id];
    const task = starterTasks.find((entry) => entry.id === id);

    if (definition && task) {
      return (
        <WeekCheckpoint
          definition={definition}
          unfinishedLessons={
            starterTasks.filter(
              (entry) =>
                taskWeek(entry) === taskWeek(task) &&
                entry.id !== id &&
                !completedTasks.includes(entry.id),
            ).length
          }
          onBack={back}
          onSaveAttempt={(result: CheckpointResult) => saveCheckpointAttempt(id, result)}
          onFinish={() => finishLesson(id)}
          onOpenTarget={openTarget}
        />
      );
    }

    const lesson = LESSONS[id];

    if (lesson) {
      return lesson({
        onBack: back,
        onSaveAttempt: (score, total) => saveLessonAttempt(id, score, total),
        onFinish: () => finishLesson(id),
      });
    }
  }

  const week = currentWeek(summaries);
  const complete = allWeeksMastered(summaries);
  const totalTasks = summaries.reduce((sum, summary) => sum + summary.tasks.length, 0);
  const doneTasks = summaries.reduce((sum, summary) => sum + summary.done, 0);
  const octoberPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-paper text-neutral-900">
      <div className="mx-auto flex min-h-screen max-w-375 flex-col md:flex-row">
        <aside className="shrink-0 border-b border-black/5 bg-white px-4 py-3 md:w-60 md:border-r md:border-b-0 md:px-5 md:py-6">
          <div className="flex items-center gap-4 md:block">
            <div className="flex items-center gap-3 md:mb-9 md:px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white md:h-10 md:w-10">
                <GraduationCap size={20} strokeWidth={1.8} />
              </div>

              <div className="hidden sm:block">
                <div className="font-semibold tracking-tight">DeutschLab</div>
                <div className="text-xs text-neutral-400">German for ETH</div>
              </div>
            </div>

            <nav
              aria-label="Main"
              className="flex flex-1 gap-1 overflow-x-auto md:block md:space-y-1"
            >
              <SidebarButton active={view === "today"} onClick={() => setView("today")}>
                <Target size={18} />
                Today
              </SidebarButton>

              <SidebarButton active={view === "curriculum"} onClick={() => setView("curriculum")}>
                <BookOpen size={18} />
                Unit 1
              </SidebarButton>

              <SidebarButton active={view === "review"} onClick={() => openReview(null)}>
                <RotateCcw size={18} />
                Review
                {planData.dueReviewCount > 0 ? (
                  <span className="tabular ml-auto rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                    {planData.dueReviewCount}
                  </span>
                ) : null}
              </SidebarButton>

              <SidebarButton active={view === "data"} onClick={() => setView("data")}>
                <HardDrive size={18} />
                Your data
              </SidebarButton>
            </nav>
          </div>

          <div className="mt-10 hidden border-t border-black/5 pt-6 md:block">
            <p className="px-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
              October Foundations
            </p>

            <div className="mt-3 px-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{complete ? "Complete" : `Week ${week} of 4`}</span>
                <span className="tabular text-neutral-400">{octoberPercent}%</span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-[width] duration-500"
                  style={{ width: `${Math.max(4, octoberPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {view === "today" ? (
            <TodayView
              completedTasks={completedTasks}
              summaries={summaries}
              implementedLessonIds={IMPLEMENTED_LESSON_IDS}
              plan={plan}
              nextReviewAt={planData.nextDueAt}
              studyMinutes={studyMinutes}
              setStudyMinutes={(minutes) => void changeStudyMinutes(minutes)}
              startPlanItem={startPlanItem}
              startLesson={(taskId) => setActiveLessonId(taskId)}
              toggleTask={toggleTask}
            />
          ) : view === "review" ? (
            <ReviewView
              sessionLimit={reviewLimit}
              onChange={() => {
                setReviewLimit(null);
                void refreshPlanData();
              }}
            />
          ) : view === "data" ? (
            <DataView />
          ) : (
            <CurriculumView summaries={summaries} />
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={[
        "flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition-colors md:w-full md:py-2.5",
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

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import AccusativeLesson from "./components/AccusativeLesson";
import ArticlesLesson from "./components/ArticlesLesson";
import CommonVerbsLesson from "./components/CommonVerbsLesson";
import Celebration, { type CelebrationData } from "./components/celebrate/Celebration";
import CourseView from "./components/course/CourseView";
import HomeView from "./components/home/HomeView";
import { MotionProvider } from "./components/motion";
import PracticeView from "./components/practice/PracticeView";
import ProgressView from "./components/progress/ProgressView";
import SettingsView from "./components/settings/SettingsView";
import AppShell, { type View } from "./components/shell/AppShell";
import Intro from "./components/shell/Intro";
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
  getProgressData,
  getStudyMinutes,
  initialiseDatabase,
  markTaskComplete,
  saveCheckpointAttempt,
  saveLessonAttempt,
  setStudyMinutes,
  type PlannerData,
  type ProgressData,
} from "./lib/db";
import { celebrationFor } from "./lib/celebration";
import { allWeeksMastered, currentWeek, weekSummaries } from "./lib/progress";
import { dailyActivity, windowStart } from "./lib/progressStats";
import { BrandLoader } from "./components/shell/Loaders";

/** Days of history loaded for Home (last 7) and Progress (last 28). */
const HISTORY_DAYS = 28;

interface LessonProps {
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
  /** Opens another lesson (AI feedback links to recommended practice). */
  onOpenLesson: (taskId: string) => void;
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
  "speaking-001": (props) => <SpeakingLesson taskId="speaking-001" {...props} />,
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
  "speaking-002": (props) => <SpeakingLesson taskId="speaking-002" config={week4SpeakingConfig} {...props} />,
};

const CHECKPOINTS: Record<string, CheckpointDefinition> = {
  "checkpoint-001": week1CheckpointDefinition,
  "checkpoint-002": week2CheckpointDefinition,
  "checkpoint-003": week3CheckpointDefinition,
  "checkpoint-004": week4CheckpointDefinition,
};

function App() {
  const [view, setView] = useState<View>("home");
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
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  // A completion moment, set only after the completion has been saved.
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

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

    try {
      setProgressData(await getProgressData(windowStart(HISTORY_DAYS)));
    } catch (error) {
      console.error("Failed to load progress data:", error);
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


  const finishLesson = async (taskId: string) => {
    try {
      await markTaskComplete(taskId);
    } catch (error) {
      console.error("Failed to finish lesson:", error);
      // The lesson shows its own error and lets the learner try again.
      throw error;
    }

    // Saved: only now may the app present the completion as final, and only
    // the first time (reopening a finished lesson never replays it).
    if (!completedTasks.includes(taskId)) {
      setCelebration(celebrationFor(taskId, completedTasks));
    }

    setCompletedTasks((current) => (current.includes(taskId) ? current : [...current, taskId]));
    setActiveLessonId(null);
    setView("home");
  };

  return (
    <MotionProvider>
      {renderContent()}
      {celebration && activeLessonId === null ? (
        <Celebration data={celebration} onDone={() => setCelebration(null)} />
      ) : null}
      <Intro ready={databaseReady} failed={databaseError} />
    </MotionProvider>
  );

  function renderContent() {
    if (databaseError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
          <div role="alert" className="max-w-md rounded-lg border border-line bg-elevated p-6">
            <p className="font-semibold">DeutschLab could not open its database.</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Nothing was changed or deleted. Try again; if it keeps happening,
              quit and reopen the app.
            </p>
            <button
              type="button"
              onClick={() => void loadProgress()}
              className="dl-press mt-5 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    if (!databaseReady) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <BrandLoader label="Opening DeutschLab…" />
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
        // Keyed by id so a lesson opened from AI feedback always starts fresh.
        return (
          <Fragment key={id}>
            {lesson({
              onBack: back,
              onSaveAttempt: (score, total) => saveLessonAttempt(id, score, total),
              onFinish: () => finishLesson(id),
              onOpenLesson: (next) => setActiveLessonId(next),
            })}
          </Fragment>
        );
      }
    }

    const week = currentWeek(summaries);
    const complete = allWeeksMastered(summaries);
    const weekSummary = summaries.find((summary) => summary.week === week);
    const history = dailyActivity(progressData?.activity ?? [], HISTORY_DAYS);

    return (
        <AppShell
          view={view}
          onNavigate={(next) => (next === "review" ? openReview(null) : setView(next))}
          dueReviewCount={planData.dueReviewCount}
          weekLabel={complete ? "October complete" : `Week ${week} of 4`}
          weekDetail={weekSummary ? `${weekSummary.done} of ${weekSummary.tasks.length} activities` : ""}
          weekShare={complete ? 1 : weekSummary ? weekSummary.done / Math.max(1, weekSummary.tasks.length) : 0}
        >
          {view === "home" ? (
            <HomeView
              completedTasks={completedTasks}
              summaries={summaries}
              plan={plan}
              nextReviewAt={planData.nextDueAt}
              days={history.slice(-7)}
              activityLoaded={progressData !== null}
              startPlanItem={startPlanItem}
              openReview={() => openReview(null)}
              openSettings={() => setView("settings")}
            />
          ) : view === "course" ? (
            <CourseView
              summaries={summaries}
              completedTasks={completedTasks}
              startLesson={(taskId) => setActiveLessonId(taskId)}
            />
          ) : view === "practice" ? (
            <PracticeView
              progress={progressData}
              completedTasks={completedTasks}
              startLesson={(taskId) => setActiveLessonId(taskId)}
            />
          ) : view === "review" ? (
            <ReviewView
              sessionLimit={reviewLimit}
              onChange={() => {
                setReviewLimit(null);
                void refreshPlanData();
              }}
            />
          ) : view === "progress" ? (
            <ProgressView progress={progressData} days={history} summaries={summaries} />
          ) : (
            <SettingsView
              studyMinutes={studyMinutes}
              setStudyMinutes={(minutes) => void changeStudyMinutes(minutes)}
            />
          )}
        </AppShell>
    );
  }
}

export default App;

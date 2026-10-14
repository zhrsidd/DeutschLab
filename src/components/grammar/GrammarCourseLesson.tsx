import { useState } from "react";

import { ArrowRight, RotateCcw } from "lucide-react";

import type { GrammarCourse } from "../../data/lessons/grammarCourseTypes";

import {
  ErrorMessage,
  LessonShell,
  ProgressBar,
  Stat,
} from "../lesson/LessonParts";

import CoursePractice from "./CoursePractice";
import TeachingPageView from "./TeachingPageView";

type Stage = "intro" | "teach" | "practice" | "results";

export interface GrammarCourseLessonProps {
  course: GrammarCourse;
  onBack: () => void;
  onFinish: () => Promise<void>;
  onSaveAttempt: (score: number, total: number) => Promise<void>;
}

/*
 * Data-driven flow for the Week 1 grammar lessons:
 * intro → teaching pages → practice → results.
 */
export default function GrammarCourseLesson({
  course,
  onBack,
  onFinish,
  onSaveAttempt,
}: GrammarCourseLessonProps) {
  const questions = course.questions;
  const total = questions.length;
  const passingScore = Math.ceil(total * 0.8);

  const [stage, setStage] = useState<Stage>("intro");
  const [pageIndex, setPageIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passed = score >= passingScore;
  const question = questions[index];

  const startPractice = () => {
    setError(null);
    setIndex(0);
    setScore(0);
    setStage("practice");
  };

  const nextPage = () => {
    if (pageIndex < course.pages.length - 1) {
      setPageIndex((current) => current + 1);
    } else {
      startPractice();
    }
  };

  const nextQuestion = async () => {
    setError(null);

    if (index < total - 1) {
      setIndex((current) => current + 1);
      return;
    }

    try {
      setSavingAttempt(true);
      await onSaveAttempt(score, total);
      setStage("results");
    } catch (saveError) {
      console.error("Failed to save lesson attempt:", saveError);
      setError("Your score could not be saved. Please try again.");
    } finally {
      setSavingAttempt(false);
    }
  };

  const finishLesson = async () => {
    try {
      setError(null);
      setFinishing(true);
      await onFinish();
    } catch (finishError) {
      console.error("Failed to finish lesson:", finishError);
      setError(
        "DeutschLab could not mark the lesson as complete. Please try again.",
      );
      setFinishing(false);
    }
  };

  if (stage === "intro") {
    return (
      <LessonShell onBack={onBack}>
        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            {course.kicker ?? "Week 1 · Grammar"}
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {course.title}
          </h1>

          <p className="mt-4 max-w-xl text-lg leading-8 text-neutral-500">
            {course.summary}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Learn" value={`${course.pages.length} steps`} />
            <Stat label="Practice" value={`${total} Qs`} />
            <Stat label="Pass" value={`${passingScore}/${total}`} />
          </div>

          <div className="mt-10 rounded-2xl border border-black/5 bg-neutral-50 p-5">
            <p className="text-sm font-medium">Goal</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {course.goal}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPageIndex(0);
              setStage("teach");
            }}
            className="mt-8 flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Begin lesson
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  if (stage === "teach") {
    const last = pageIndex === course.pages.length - 1;

    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={((pageIndex + 1) / course.pages.length) * 100} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <p className="text-sm font-medium text-neutral-400">
            Learn · {pageIndex + 1} of {course.pages.length}
          </p>

          <TeachingPageView page={course.pages[pageIndex]} />

          <button
            type="button"
            onClick={nextPage}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {last ? "Start practice" : "Continue"}
            <ArrowRight size={17} />
          </button>
        </div>
      </LessonShell>
    );
  }

  if (stage === "practice") {
    return (
      <LessonShell onBack={onBack}>
        <ProgressBar value={((index + 1) / total) * 100} />

        <div className="mx-auto max-w-2xl px-8 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">
              Practice · {index + 1} of {total}
            </p>
            <p className="text-sm text-neutral-400">Score {score}</p>
          </div>

          <div className="mt-6">
            <CoursePractice
              key={question.id}
              question={question}
              isLast={index === total - 1}
              disabled={savingAttempt}
              onAnswered={(correct) => {
                if (correct) setScore((current) => current + 1);
              }}
              onNext={() => void nextQuestion()}
            />
          </div>

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        </div>
      </LessonShell>
    );
  }

  return (
    <LessonShell onBack={onBack}>
      <div className="mx-auto max-w-2xl px-8 py-12 text-center">
        <p className="text-sm font-medium text-neutral-400">
          Lesson complete
        </p>

        <div className="mt-8 text-7xl font-semibold tracking-tighter">
          {score}/{total}
        </div>

        <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-progress transition-all duration-300"
            style={{ width: `${(score / total) * 100}%` }}
          />
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight">
          {passed ? "Nice work." : "One more pass."}
        </h1>

        <p className="mx-auto mt-3 max-w-md leading-7 text-neutral-500">
          {passed ? course.passMessage : course.failMessage}
        </p>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        {passed ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPageIndex(0);
                setStage("teach");
              }}
              disabled={finishing}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
            >
              <RotateCcw size={17} />
              Review again
            </button>

            <button
              type="button"
              onClick={() => void finishLesson()}
              disabled={finishing}
              className="rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              {finishing ? "Finishing…" : "Finish lesson"}
            </button>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPageIndex(0);
                setStage("teach");
              }}
              className="rounded-xl border border-black/10 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Review lesson
            </button>

            <button
              type="button"
              onClick={startPractice}
              className="flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <RotateCcw size={17} />
              Retry practice
            </button>
          </div>
        )}
      </div>
    </LessonShell>
  );
}

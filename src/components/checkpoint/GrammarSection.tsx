import { useState } from "react";

import type { CourseQuestion } from "../../data/lessons/grammarCourseTypes";
import { lessonIdFor } from "../../lib/reviewExercises";

import CoursePractice from "../grammar/CoursePractice";

interface GrammarSectionProps {
  questions: CourseQuestion[];
  /** Reports the score and which grammar lessons had misses. */
  onComplete: (score: number, missedLessonIds: string[]) => void;
}

export default function GrammarSection({
  questions,
  onComplete,
}: GrammarSectionProps) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  return (
    <div className="mt-4">
      <p className="mb-6 text-sm font-medium text-neutral-400">
        {index + 1} of {questions.length}
      </p>

      <CoursePractice
        key={question.id}
        question={question}
        isLast={isLast}
        trackCorrect={false}
        onAnswered={(correct) => {
          if (correct) {
            setScore((current) => current + 1);
          } else {
            const lessonId = lessonIdFor("grammar", question.id);
            setMissed((current) =>
              current.includes(lessonId) ? current : [...current, lessonId],
            );
          }
        }}
        onNext={() => {
          if (isLast) onComplete(score, missed);
          else setIndex((current) => current + 1);
        }}
      />
    </div>
  );
}

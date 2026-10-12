import { useState } from "react";

import { trackAnswer } from "../../lib/db";
import {
  mistakeExpected,
  mistakePrompt,
  type VocabQuestion,
} from "../../lib/vocabularyExercises";

import type { Speech } from "../review/types";
import RecallQuestion from "../vocabulary/RecallQuestion";

interface VocabularySectionProps {
  questions: VocabQuestion[];
  speech: Speech;
  onComplete: (score: number) => void;
}

export default function VocabularySection({
  questions,
  speech,
  onComplete,
}: VocabularySectionProps) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  return (
    <div className="mt-4">
      <p className="mb-6 text-sm font-medium text-neutral-400">
        {index + 1} of {questions.length}
      </p>

      <RecallQuestion
        key={question.id}
        question={question}
        speech={speech}
        continueLabel={isLast ? "Finish section" : "Next question"}
        onAnswered={(correct, answer) => {
          if (correct) setScore((current) => current + 1);

          // Only missed vocabulary feeds Review.
          if (!correct) {
            trackAnswer({
              sourceType: "vocabulary",
              sourceId: question.reviewId,
              category: "vocabulary",
              prompt: mistakePrompt(question),
              expected: mistakeExpected(question),
              userAnswer: answer,
              correct: false,
              audioText: question.audioText,
            });
          }
        }}
        onNext={() => {
          speech.stop();

          if (isLast) onComplete(score);
          else setIndex((current) => current + 1);
        }}
      />
    </div>
  );
}

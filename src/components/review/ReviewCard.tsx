import { useMemo } from "react";

import {
  resolveExercise,
  toChoiceQuestion,
  toTypedQuestion,
} from "../../lib/reviewExercises";

import AudioReview from "./AudioReview";
import LegacyReview from "./LegacyReview";
import TypedReview from "./TypedReview";
import type { ReviewCardProps } from "./types";

/** Picks the right exercise component for one review item. */
export default function ReviewCard(props: ReviewCardProps) {
  const { item } = props;

  const { typed, choice } = useMemo(() => {
    const exercise = resolveExercise(
      item.exerciseJson,
      item.sourceType,
      item.sourceId,
    );

    return {
      typed: exercise ? toTypedQuestion(exercise, item.repetitions) : null,
      choice: exercise ? toChoiceQuestion(exercise) : null,
    };
  }, [item]);

  if (typed) return <TypedReview {...props} question={typed} />;
  if (choice) return <AudioReview {...props} question={choice} />;

  return <LegacyReview {...props} />;
}

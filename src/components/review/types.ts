import type { ReviewItem } from "../../data/reviewTypes";
import type { useGermanSpeech } from "../../hooks/useGermanSpeech";

export type Speech = ReturnType<typeof useGermanSpeech>;

export const NORMAL_RATE = 0.88;
export const SLOW_RATE = 0.7;

export interface ReviewCardProps {
  item: ReviewItem;
  speech: Speech;
  isLast: boolean;
  /** Reports the graded result; resolves once it has been saved. */
  onGraded: (correct: boolean) => Promise<void>;
  /** Moves to the next item. */
  onNext: () => void;
}

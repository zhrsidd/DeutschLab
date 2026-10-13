import type { ElementType } from "react";

import {
  BookOpen,
  Headphones,
  Languages,
  Mic,
  NotebookPen,
  Target,
  Volume2,
} from "lucide-react";

import type { LessonType } from "../data/unit1";

/** One quiet line icon per activity type. */
export const iconForType: Record<LessonType, ElementType> = {
  vocabulary: Languages,
  grammar: BookOpen,
  pronunciation: Volume2,
  listening: Headphones,
  speaking: Mic,
  writing: NotebookPen,
  reading: BookOpen,
  review: Target,
};

import { irregularVerbsCourse } from "../data/lessons/week4IrregularVerbs";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-010: irregular verbs and accusative consolidation. */
export default function IrregularVerbsLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={irregularVerbsCourse} {...props} />;
}

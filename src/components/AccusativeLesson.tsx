import { accusativeCourse } from "../data/lessons/week3Accusative";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-007: the accusative case. */
export default function AccusativeLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={accusativeCourse} {...props} />;
}

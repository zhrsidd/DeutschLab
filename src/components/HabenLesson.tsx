import { habenCourse } from "../data/lessons/week2Haben";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-004: haben. */
export default function HabenLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={habenCourse} {...props} />;
}

import { negationCourse } from "../data/lessons/week3Negation";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-008: nicht and kein. */
export default function NegationLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={negationCourse} {...props} />;
}

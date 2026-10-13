import { pronounsCourse } from "../data/lessons/week4Pronouns";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-009: accusative personal pronouns. */
export default function PronounsLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={pronounsCourse} {...props} />;
}

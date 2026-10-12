import { commonVerbsCourse } from "../data/lessons/week2CommonVerbs";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-005: common present-tense verbs. */
export default function CommonVerbsLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={commonVerbsCourse} {...props} />;
}

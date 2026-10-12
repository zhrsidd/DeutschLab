import { regularVerbsCourse } from "../data/lessons/week1RegularVerbs";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-002: regular verbs + verb-second word order. */
export default function RegularVerbsLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={regularVerbsCourse} {...props} />;
}

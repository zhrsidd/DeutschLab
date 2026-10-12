import { articlesCourse } from "../data/lessons/week3Articles";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-006: nouns, articles and plurals. */
export default function ArticlesLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={articlesCourse} {...props} />;
}

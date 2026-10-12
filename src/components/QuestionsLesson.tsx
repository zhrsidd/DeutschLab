import { questionsCourse } from "../data/lessons/week1Questions";

import GrammarCourseLesson, {
  type GrammarCourseLessonProps,
} from "./grammar/GrammarCourseLesson";

/** grammar-003: yes/no questions + W-questions. */
export default function QuestionsLesson(
  props: Omit<GrammarCourseLessonProps, "course">,
) {
  return <GrammarCourseLesson course={questionsCourse} {...props} />;
}

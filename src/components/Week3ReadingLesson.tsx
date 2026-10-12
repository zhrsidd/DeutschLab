import { week3ReadingPassages } from "../data/lessons/week3Reading";

import ComprehensionLesson, {
  type ComprehensionLessonProps,
} from "./ComprehensionLesson";

/** reading-002: Week 3 reading. */
export default function Week3ReadingLesson(
  props: Pick<ComprehensionLessonProps, "onBack" | "onFinish" | "onSaveAttempt">,
) {
  return (
    <ComprehensionLesson
      kicker="Week 3 · Reading"
      title="Objects and descriptions"
      summary="Read two short texts about a room and a school bag, then answer questions about them. Each answer shows the line in the text that proves it."
      mode="reading"
      groups={week3ReadingPassages.map((passage) => ({
        id: passage.id,
        heading: passage.title,
        passage: passage.text,
        questions: passage.questions,
      }))}
      {...props}
    />
  );
}

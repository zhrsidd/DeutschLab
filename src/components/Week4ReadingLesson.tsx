import { week4ReadingPassages } from "../data/lessons/week4Reading";

import ComprehensionLesson, {
  type ComprehensionLessonProps,
} from "./ComprehensionLesson";

/** reading-003: everyday descriptions. */
export default function Week4ReadingLesson(
  props: Pick<ComprehensionLessonProps, "onBack" | "onFinish" | "onSaveAttempt">,
) {
  return (
    <ComprehensionLesson
      kicker="Week 4 · Reading"
      title="Everyday descriptions"
      summary="Read two short texts about a school day and a home, then answer questions about them. Watch who ihn, sie and es refer to. Each answer shows the line in the text that proves it."
      mode="reading"
      groups={week4ReadingPassages.map((passage) => ({
        id: passage.id,
        heading: passage.title,
        passage: passage.text,
        questions: passage.questions,
      }))}
      {...props}
    />
  );
}

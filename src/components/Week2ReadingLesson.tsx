import { readingPassages } from "../data/lessons/week2Reading";

import ComprehensionLesson, {
  type ComprehensionLessonProps,
} from "./ComprehensionLesson";

/** reading-001: Week 2 reading. */
export default function Week2ReadingLesson(
  props: Pick<ComprehensionLessonProps, "onBack" | "onFinish" | "onSaveAttempt">,
) {
  return (
    <ComprehensionLesson
      kicker="Week 2 · Reading"
      title="Week 2 reading"
      summary="Read two short texts built from Week 1 and Week 2 language, then answer questions about them. Each answer shows the line in the text that proves it."
      mode="reading"
      groups={readingPassages.map((passage) => ({
        id: passage.id,
        heading: passage.title,
        passage: passage.text,
        questions: passage.questions,
      }))}
      {...props}
    />
  );
}

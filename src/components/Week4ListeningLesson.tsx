import { week4ListeningClips } from "../data/lessons/week4Listening";

import ComprehensionLesson, {
  type ComprehensionLessonProps,
} from "./ComprehensionLesson";

/** listening-004: everyday conversations. */
export default function Week4ListeningLesson(
  props: Pick<ComprehensionLessonProps, "onBack" | "onFinish" | "onSaveAttempt">,
) {
  return (
    <ComprehensionLesson
      kicker="Week 4 · Listening"
      title="Everyday conversations"
      summary="Listen to four short clips about school, people, plans and shopping. They are longer than last week's, and two are conversations. Play each clip as often as you like, or use Slower. The text stays hidden until you answer."
      mode="listening"
      groups={week4ListeningClips.map((clip, index) => ({
        id: clip.id,
        heading: `Clip ${index + 1}`,
        questions: clip.questions.map((question) => ({
          ...question,
          audio: clip.audio,
          translation: clip.translation,
        })),
      }))}
      {...props}
    />
  );
}

import { week2ListeningClips } from "../data/lessons/week2Listening";

import ComprehensionLesson, {
  type ComprehensionLessonProps,
} from "./ComprehensionLesson";

/** listening-002: Week 2 listening. */
export default function Week2ListeningLesson(
  props: Pick<ComprehensionLessonProps, "onBack" | "onFinish" | "onSaveAttempt">,
) {
  return (
    <ComprehensionLesson
      kicker="Week 2 · Listening"
      title="Week 2 listening"
      summary="Listen to four short clips about family, daily life, school and time. Play each clip as often as you like, or use Slower. The text stays hidden until you answer."
      mode="listening"
      groups={week2ListeningClips.map((clip, index) => ({
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

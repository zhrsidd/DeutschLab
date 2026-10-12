import { week3ListeningClips } from "../data/lessons/week3Listening";

import ComprehensionLesson, {
  type ComprehensionLessonProps,
} from "./ComprehensionLesson";

/** listening-003: objects and possession. */
export default function Week3ListeningLesson(
  props: Pick<ComprehensionLessonProps, "onBack" | "onFinish" | "onSaveAttempt">,
) {
  return (
    <ComprehensionLesson
      kicker="Week 3 · Listening"
      title="Objects and possession"
      summary="Listen to four short clips about objects, what people have and what they do not have. Play each clip as often as you like, or use Slower. The text stays hidden until you answer."
      mode="listening"
      groups={week3ListeningClips.map((clip, index) => ({
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

import type { Grade } from "../../lib/reviewExercises";

export default function ReviewFeedback({ grade }: { grade: Grade }) {
  return (
    <div
      className={[
        "mt-6 rounded-xl px-5 py-4",
        grade.correct
          ? "bg-emerald-50 text-emerald-900"
          : "bg-red-50 text-red-900",
      ].join(" ")}
    >
      <p className="font-medium">
        {grade.correct ? "Correct." : "Not quite."}
      </p>

      {!grade.correct ? (
        <p className="mt-1 text-sm leading-6">
          Answer: <strong>{grade.expected}</strong>
        </p>
      ) : null}

      {grade.note ? (
        <p className="mt-1 text-sm leading-6">{grade.note}</p>
      ) : null}

      {grade.explanation ? (
        <p className="mt-1 text-sm leading-6 opacity-80">
          {grade.explanation}
        </p>
      ) : null}
    </div>
  );
}

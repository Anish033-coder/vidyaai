import { useState } from "react";

export default function MCQPanel({ data }) {
  const questions = data?.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function choose(qIndex, optionIndex) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  }

  const score = questions.reduce(
    (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
    0
  );
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const allAnswered = Object.keys(answers).length >= questions.length;

  return (
    <div>
      <div className="mb-6 flex items-baseline gap-3">
        <span className="font-ui text-[11.5px] text-vermillion-400">Quiz</span>
        <h2 className="font-display text-[22px] leading-none text-bone-50">
          {data?.title || "Practice quiz"}
        </h2>
        <span className="h-px flex-1 origin-left animate-rule bg-ink-800" />
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="mb-7 last:mb-0">
          <div className="flex gap-3.5">
            <span className="pt-[5px] font-read text-[13px] leading-none text-vermillion-500 tabular-nums">
              {qi + 1}.
            </span>
            <p className="flex-1 font-read text-[16.5px] leading-snug text-bone-50">
              {q.question}
            </p>
          </div>

          <div className="ml-7 mt-3">
            {(q.options || []).map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = q.correctIndex === oi;

              let text = "text-bone-400";
              let rule = "bg-ink-800";
              let mark = "";

              if (selected && !submitted) {
                text = "text-bone-50";
                rule = "bg-vermillion-500";
              }

              if (submitted) {
                if (isCorrect) {
                  text = "text-sage-400";
                  rule = "bg-sage-500";
                  mark = "✓";
                } else if (selected) {
                  text = "text-vermillion-400";
                  rule = "bg-vermillion-500";
                  mark = "✕";
                } else {
                  text = "text-bone-600";
                }
              }

              return (
                <button
                  key={oi}
                  type="button"
                  onClick={() => choose(qi, oi)}
                  disabled={submitted}
                  className={`group relative block w-full py-2 pl-4 pr-6 text-left transition-colors ${
                    submitted ? "cursor-default" : "cursor-pointer hover:bg-ink-900"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-[18px] w-px -translate-y-1/2 transition-colors ${rule}`}
                  />
                  <span className={`font-read text-[15.5px] transition-colors ${text}`}>
                    {opt}
                  </span>
                  {mark && <span className={`ml-2 font-ui text-[12px] ${text}`}>{mark}</span>}
                </button>
              );
            })}
          </div>

          {submitted && answers[qi] !== q.correctIndex && q.explanation && (
            <p className="ml-7 mt-2.5 border-l border-ink-700 pl-4 font-read text-[14.5px] italic leading-relaxed text-bone-500">
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      <div className="mt-8">
        <span className="mb-4 block h-px w-full bg-ink-800" />

        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className={`group font-ui text-[13px] ${
              allAnswered ? "text-bone-50" : "cursor-not-allowed text-bone-600"
            }`}
          >
            {allAnswered
              ? "Check answers"
              : `${Object.keys(answers).length} of ${questions.length} answered`}
            {allAnswered && (
              <>
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
                <span className="mt-1.5 block h-px bg-vermillion-500" />
              </>
            )}
          </button>
        ) : (
          <div className="flex animate-settle items-baseline gap-3">
            <span className="font-display text-[34px] leading-none text-bone-50">
              {score}
              <span className="text-[20px] text-bone-600">/{questions.length}</span>
            </span>
            <span
              className={`font-read text-[15px] italic ${
                pct >= 60 ? "text-sage-400" : "text-vermillion-400"
              }`}
            >
              {pct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

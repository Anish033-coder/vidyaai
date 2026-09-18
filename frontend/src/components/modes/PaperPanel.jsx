import { useState } from "react";

export default function PaperPanel({ data, onSubmit }) {
  const questions = data?.questions || [];
  const title = data?.title || "Practice paper";
  const instructions = data?.instructions || "";

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalMarks =
    result?.totalMarks ?? questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  function updateAnswer(index, value) {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }

  async function submitPaper() {
    const answerSheet = questions.map((q, i) => ({
      question: q.question,
      marks: q.marks || 0,
      answer: answers[i] || "",
    }));

    try {
      setLoading(true);
      if (!onSubmit) {
        console.error("onSubmit not provided");
        return;
      }
      const evaluation = await onSubmit(answerSheet);
      if (evaluation) {
        setResult(evaluation);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Paper evaluation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function downloadPaper() {
    const text = `${title}\n\n${instructions}\n\n${questions
      .map(
        (q, i) =>
          `${i + 1}. ${q.question} (${q.marks} marks)\n\nAnswer:\n${answers[i] || ""}\n`
      )
      .join("\n")}`;

    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "practice-paper.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-ui text-[11.5px] text-vermillion-400">Exam</span>
        <h2 className="font-display text-[22px] leading-none text-bone-50">{title}</h2>
        <span className="h-px flex-1 origin-left animate-rule bg-ink-800" />
        <button
          onClick={downloadPaper}
          className="font-ui text-[11.5px] text-bone-500 transition-colors hover:text-bone-200"
        >
          Download
        </button>
      </div>

      {instructions && (
        <p className="mb-1 font-read text-[14.5px] italic leading-relaxed text-bone-500">
          {instructions}
        </p>
      )}

      {totalMarks > 0 && (
        <p className="mb-6 font-ui text-[11.5px] text-bone-600">
          {questions.length} questions · {totalMarks} marks
        </p>
      )}

      <div className="space-y-7">
        {questions.map((q, i) => {
          const graded = result?.results?.[i];
          return (
            <div key={i}>
              <div className="flex gap-3.5">
                <span className="pt-[5px] font-read text-[13px] leading-none text-vermillion-500 tabular-nums">
                  {i + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-read text-[16.5px] leading-snug text-bone-50">
                    {q.question}
                  </p>
                  {q.marks ? (
                    <span className="mt-1 block font-ui text-[11px] text-bone-600">
                      {q.marks} marks
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="ml-7 mt-3">
                <div className="relative">
                  <span className="absolute inset-x-0 top-0 h-px bg-ink-800" />
                  <span
                    className={`absolute inset-x-0 top-0 h-px origin-left bg-vermillion-500 transition-transform duration-500 ${
                      (answers[i] || "").trim() ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                  <textarea
                    className="thin-scroll mt-3 min-h-[84px] w-full resize-y bg-transparent font-read text-[15.5px] leading-relaxed text-bone-50 placeholder-bone-600 outline-none disabled:opacity-60"
                    placeholder="Write your answer…"
                    disabled={submitted || loading}
                    value={answers[i] || ""}
                    onChange={(e) => updateAnswer(i, e.target.value)}
                  />
                </div>

                {graded && (
                  <div className="mt-2 animate-settle border-l border-ink-700 pl-4">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-read text-[13px] italic text-bone-500">examiner</span>
                      <span
                        className={`font-display text-[17px] leading-none ${
                          graded.marksAwarded >= (graded.maxMarks ?? q.marks) * 0.6
                            ? "text-sage-400"
                            : "text-vermillion-400"
                        }`}
                      >
                        {graded.marksAwarded}
                        <span className="text-[12px] text-bone-600">
                          /{graded.maxMarks ?? q.marks}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1.5 font-read text-[14.5px] leading-relaxed text-bone-400">
                      {graded.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <span className="mb-4 block h-px w-full bg-ink-800" />

        {!submitted && (
          <button
            onClick={submitPaper}
            disabled={loading}
            className="group font-ui text-[13px] text-bone-50 disabled:opacity-50"
          >
            {loading ? "Grading your answers…" : "Submit answer sheet"}
            {!loading && (
              <>
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
                <span className="mt-1.5 block h-px bg-vermillion-500" />
              </>
            )}
          </button>
        )}

        {result && (
          <div className="animate-settle">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[34px] leading-none text-bone-50">
                {result.score}
                {totalMarks > 0 && <span className="text-[20px] text-bone-600">/{totalMarks}</span>}
              </span>
              {totalMarks > 0 && (
                <span
                  className={`font-read text-[15px] italic ${
                    result.score / totalMarks >= 0.6 ? "text-sage-400" : "text-vermillion-400"
                  }`}
                >
                  {Math.round((result.score / totalMarks) * 100)}%
                </span>
              )}
            </div>
            {result.summary && (
              <p className="mt-2 font-read text-[15px] leading-relaxed text-bone-400">
                {result.summary}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import InterviewAvatar from "../avatar/InterviewAvatar";

const DIFFICULTY_TEXT = {
  easy: "text-sage-400",
  medium: "text-vermillion-400",
  hard: "text-rose-300",
};

export default function InterviewPanel({ data, onAnswer }) {
  const question = data?.question;
  const evaluation = data?.evaluation;
  const difficulty = data?.difficulty;

  const [speaking, setSpeaking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [questionCount, setQuestionCount] = useState(1);
  const maxQuestions = 5;
  const [finished, setFinished] = useState(false);

  function speak(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.onstart = () => setSpeaking(true);
    speech.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(speech);
  }

  useEffect(() => {
    if (!question) return;
    const t = setTimeout(() => speak(question), 200);
    return () => clearTimeout(t);
  }, [question]);

  function handleSend() {
    if (!answer.trim() || finished) return;
    onAnswer?.(answer);
    setAnswer("");
    setQuestionCount((prev) => {
      const next = prev + 1;
      if (next > maxQuestions) setFinished(true);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-ui text-[11.5px] text-vermillion-400">Interview</span>
        <span className="font-read text-[14px] italic text-bone-500">
          question {Math.min(questionCount, maxQuestions)} of {maxQuestions}
        </span>
        {difficulty && (
          <span className={`font-ui text-[11px] ${DIFFICULTY_TEXT[difficulty] || "text-bone-500"}`}>
            {difficulty}
          </span>
        )}
        <span className="h-px flex-1 origin-left animate-rule bg-ink-800" />
      </div>

      {/* Progress as five rules */}
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: maxQuestions }).map((_, i) => (
          <span
            key={i}
            className={`h-px flex-1 transition-colors duration-500 ${
              i < questionCount - 1 ? "bg-vermillion-500" : "bg-ink-800"
            }`}
          />
        ))}
      </div>

      <div className="mb-6 flex justify-center">
        <InterviewAvatar speaking={speaking} />
      </div>

      {evaluation && typeof evaluation.score === "number" && (
        <div className="mb-6 border-l border-ink-700 pl-4">
          <div className="flex items-baseline gap-2.5">
            <span className="font-read text-[13px] italic text-bone-500">your last answer</span>
            <span
              className={`font-display text-[20px] leading-none ${
                evaluation.score >= 7
                  ? "text-sage-400"
                  : evaluation.score >= 4
                  ? "text-vermillion-400"
                  : "text-rose-400"
              }`}
            >
              {evaluation.score}
              <span className="text-[13px] text-bone-600">/10</span>
            </span>
          </div>
          {evaluation.feedback && (
            <p className="mt-1.5 font-read text-[14.5px] leading-relaxed text-bone-400">
              {evaluation.feedback}
            </p>
          )}
        </div>
      )}

      <p className="font-read text-[17.5px] leading-relaxed text-bone-50">
        {question || "Preparing your first question…"}
      </p>

      {!finished ? (
        <div className="mt-5">
          <div className="group relative">
            <span className="absolute inset-x-0 top-0 h-px bg-ink-800" />
            <span
              className={`absolute inset-x-0 top-0 h-px origin-left bg-vermillion-500 transition-transform duration-500 ${
                answer.trim() ? "scale-x-100" : "scale-x-0"
              }`}
            />
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer…"
              rows={3}
              className="thin-scroll mt-4 w-full resize-none bg-transparent font-read text-[16px] leading-relaxed text-bone-50 placeholder-bone-600 outline-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!answer.trim()}
            className={`group mt-1 font-ui text-[13px] ${
              answer.trim() ? "text-bone-50" : "cursor-not-allowed text-bone-600"
            }`}
          >
            Submit answer
            {answer.trim() && (
              <>
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
                <span className="mt-1.5 block h-px bg-vermillion-500" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="mt-6 animate-settle">
          <span className="mb-4 block h-px w-full bg-ink-800" />
          <p className="font-display text-[22px] leading-none text-bone-50">Interview complete</p>
          <p className="mt-2 max-w-md font-read text-[15px] leading-relaxed text-bone-400">
            All {maxQuestions} answered. Generate the report to see how you did.
          </p>
          <button
            onClick={() => onAnswer?.("__INTERVIEW_END__")}
            className="group mt-4 font-ui text-[13px] text-bone-50"
          >
            Generate report
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
            <span className="mt-1.5 block h-px bg-sage-500" />
          </button>
        </div>
      )}
    </div>
  );
}

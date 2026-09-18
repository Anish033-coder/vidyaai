const CAPABILITIES = [
  ["Understand", "ask, and read an answer that cites the page it came from"],
  ["Test yourself", "quizzes drawn from your course, not the internet"],
  ["Interview prep", "a mock interviewer that adapts as you answer"],
  ["Exam prep", "practice papers, graded with partial marks"],
];

export default function EmptyState({ onNewChat }) {
  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-[680px] flex-col justify-center px-10 py-16">
        <p className="animate-settle font-ui text-[11.5px] tracking-wide text-bone-600">
          VidyaAI
        </p>

        <h1 className="mt-5 animate-settle font-display text-[clamp(2.6rem,6vw,4.25rem)] font-normal leading-[1.02] tracking-[-0.02em] text-bone-50 [animation-delay:60ms]">
          Your syllabus,
          <br />
          <span className="italic text-vermillion-400">answered</span> — with
          <br />
          the page it came from.
        </h1>

        <p className="mt-7 max-w-[30rem] animate-settle font-read text-[17.5px] leading-relaxed text-bone-400 [animation-delay:120ms]">
          Most study chatbots guess. This one reads your own course material
          first, then answers — and shows you exactly which passage it used, so
          you can check it.
        </p>

        <div className="mt-9 animate-settle [animation-delay:180ms]">
          <button
            onClick={() => onNewChat?.(null)}
            className="group font-ui text-[13px] text-bone-50"
          >
            Start a session
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
            <span className="mt-1.5 block h-px bg-vermillion-500" />
          </button>
        </div>

        <div className="mt-16 animate-settle [animation-delay:240ms]">
          <span className="mb-5 block h-px w-full origin-left animate-rule bg-ink-850" />

          <ol className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {CAPABILITIES.map(([label, desc], i) => (
              <li key={label} className="flex items-baseline gap-3">
                <span className="font-read text-[12px] tabular-nums text-vermillion-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="font-ui text-[13px] font-medium text-bone-200">
                    {label}
                  </span>
                  <span className="mt-0.5 block font-read text-[14.5px] leading-snug text-bone-500">
                    {desc}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-14 animate-settle font-read text-[13px] italic text-bone-600 [animation-delay:300ms]">
          One pipeline — Amazon Bedrock Knowledge Base, Titan embeddings,
          OpenSearch Serverless, Guardrails.
        </p>
      </div>
    </div>
  );
}

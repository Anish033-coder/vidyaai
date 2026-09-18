import { useState } from "react";

function matchPercent(score) {
  if (typeof score !== "number") return null;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export default function Citations({ citations = [] }) {
  const [openId, setOpenId] = useState(null);

  if (!Array.isArray(citations) || citations.length === 0) return null;

  return (
    <div className="mt-9">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-read text-[13px] italic text-bone-400">
          Grounded in {citations.length}{" "}
          {citations.length === 1 ? "passage" : "passages"} from your syllabus
        </span>
        <span className="h-px flex-1 origin-left animate-rule bg-ink-800" />
      </div>

      <ol className="space-y-px">
        {citations.map((c, i) => {
          const id = c.id ?? i + 1;
          const pct = matchPercent(c.score);
          const isOpen = openId === id;
          const snippet = c.snippet || "";

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : id)}
                className="group -mx-3 flex w-[calc(100%+1.5rem)] gap-3.5 rounded-md px-3 py-2 text-left transition-colors duration-200 hover:bg-ink-900"
              >
                {/* Footnote numeral */}
                <span className="pt-[3px] font-read text-[13px] leading-none text-vermillion-500 tabular-nums">
                  {id}.
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-ui text-[12.5px] font-medium text-bone-200">
                      {c.source || "Course material"}
                    </span>
                    {pct !== null && (
                      <>
                        <span className="h-px w-3 flex-shrink-0 bg-ink-700" />
                        <span className="flex-shrink-0 font-ui text-[11px] tabular-nums text-bone-500">
                          {pct}% match
                        </span>
                      </>
                    )}
                  </span>

                  {snippet && (
                    <span
                      className={`mt-1 block font-read text-[14px] italic leading-relaxed text-bone-500 transition-colors group-hover:text-bone-400 ${
                        isOpen ? "" : "line-clamp-1"
                      }`}
                    >
                      “{snippet}”
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

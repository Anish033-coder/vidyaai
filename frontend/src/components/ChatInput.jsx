import { useState } from "react";

const MODES = [
  { id: "normal", label: "Ask", hint: "Ask anything from your course…" },
  { id: "teacher", label: "Teach", hint: "Explain a concept, step by step…" },
  { id: "mcq", label: "Quiz", hint: "Quiz me on…" },
  { id: "interview", label: "Interview", hint: "Interview me on…" },
  { id: "paper", label: "Exam", hint: "Set a practice paper on…" },
];

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("normal");

  const active = MODES.find((m) => m.id === mode) || MODES[0];

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, mode);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = Boolean(text.trim());

  return (
    <div className="relative flex-shrink-0 px-10 pb-7">
      <div className="mx-auto max-w-[660px]">
        {/* Mode — set as a line of text, not a pill group */}
        <div className="mb-3 flex items-baseline gap-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`font-ui text-[12px] transition-colors duration-200 ${
                mode === m.id
                  ? "text-vermillion-400"
                  : "text-bone-600 hover:text-bone-400"
              }`}
            >
              {m.label}
              {mode === m.id && (
                <span className="mt-1 block h-px origin-left animate-rule bg-vermillion-400" />
              )}
            </button>
          ))}
        </div>

        <div className="group relative">
          <span className="absolute inset-x-0 top-0 h-px bg-ink-800" />
          <span
            className={`absolute inset-x-0 top-0 h-px origin-left bg-vermillion-500 transition-transform duration-500 ${
              canSend ? "scale-x-100" : "scale-x-0"
            }`}
          />

          <div className="flex items-end gap-4 pt-4">
            <textarea
              className="thin-scroll max-h-[190px] min-h-[32px] flex-1 resize-none bg-transparent font-read text-[17px] leading-relaxed text-bone-50 placeholder-bone-600 outline-none"
              rows={text.split("\n").length > 1 ? 3 : 1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={active.hint}
            />

            <button
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send"
              className={`mb-1 font-ui text-[12.5px] transition-all duration-300 ${
                canSend
                  ? "text-vermillion-400 hover:text-vermillion-500"
                  : "cursor-not-allowed text-bone-600"
              }`}
            >
              Send →
            </button>
          </div>
        </div>

        <p className="mt-3 font-read text-[12.5px] italic text-bone-600">
          Answers cite your own material. Off-topic questions are declined.
        </p>
      </div>
    </div>
  );
}

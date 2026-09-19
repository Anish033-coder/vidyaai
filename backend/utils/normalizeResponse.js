// Models drift on the response shape the prompt asks for — "exam_paper" instead
// of "paper", `text` instead of `question`. The UI switches on `type`, so an
// unrecognised variant renders as raw JSON on screen. Normalise here so the
// frontend has one contract whichever provider answered.

const TYPE_ALIASES = {
  paper: "paper",
  exam: "paper",
  exam_paper: "paper",
  practice_paper: "paper",
  mcq: "mcq",
  quiz: "mcq",
  multiple_choice: "mcq",
  interview: "interview",
  text: "text",
};

function normalizeQuestion(q, i) {
  if (!q || typeof q !== "object") return q;
  return {
    ...q,
    id: q.id ?? q.questionId ?? i + 1,
    question: q.question ?? q.text ?? q.prompt ?? "",
    options: q.options ?? q.choices,
    correctIndex: q.correctIndex ?? q.answerIndex,
    marks: q.marks ?? q.maxMarks,
  };
}

export function normalizeResponse(res) {
  if (!res || typeof res !== "object") return res;

  const rawType = String(res.type || "").toLowerCase();
  const type = TYPE_ALIASES[rawType] || res.type;

  const out = { ...res, type };

  if (Array.isArray(res.questions)) {
    out.questions = res.questions.map(normalizeQuestion);
  }

  // The interview prompt asks for an evaluation of the *previous* answer, but
  // models fill it in on the first question too — showing a 0/10 before the
  // candidate has said anything. Drop an evaluation that carries no real signal.
  if (type === "interview" && out.evaluation) {
    const { score, feedback } = out.evaluation;
    const unevaluated =
      typeof feedback === "string" && /not evaluated|no answer|n\/a/i.test(feedback);
    if (unevaluated || (score === 0 && !feedback)) delete out.evaluation;
  }

  return out;
}

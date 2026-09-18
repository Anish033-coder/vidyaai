import Message from "../models/Message.js";
import { retrieveContextWithCitations } from "./retrieveContext.js";

/**
 * Public entry point.
 * Retrieves course context + citations ONCE, builds the prompt,
 * and returns both so the controller can show citations in the UI.
 */
export async function buildPrompt(chat, userMessage, chatId, mode, conversationContext = "") {

  if (!userMessage || typeof userMessage !== "string") {
    throw new Error("User message missing in prompt builder");
  }

  if (!mode) {
    mode = "normal";
  }

  // Retrieve course RAG context (+ citations) if this is a course chat.
  let context = "";
  let citations = [];

  if (chat.courseId) {
    try {
      const retrieved = await retrieveContextWithCitations(chat.courseId, userMessage);
      context = retrieved.context;
      citations = retrieved.citations;
    } catch (err) {
      console.error("Context retrieval failed:", err.message);
      context = "";
      citations = [];
    }
  }

  const prompt = buildPromptString(chat, userMessage, chatId, mode, conversationContext, context);

  return { prompt, citations };
}

/**
 * Builds the mode-specific prompt string from an already-retrieved context.
 * (Pure string assembly — no I/O.)
 */
function buildPromptString(chat, userMessage, chatId, mode, conversationContext, context) {

  const historyText = conversationContext || "No previous conversation.";

  const baseRules = `
You are an advanced AI Tutor designed to help students learn deeply.

Core behavior rules:
- Prefer COURSE CONTEXT if available.
- Be educational, structured and concise.
- If JSON is requested you MUST output ONLY JSON.
- Never add explanations outside JSON when JSON is requested.
- Do not use markdown when JSON is required.
- If the user asks something unrelated to course context, answer normally.
`;

  // ======================
  // TEACHER MODE
  // ======================

  if (mode === "teacher") {

    return `
${baseRules}

You are a PROFESSIONAL TEACHER.

Teach the concept step by step.

Teaching style:
- Simple explanations
- Examples
- Short summaries
- Return result in proper markdown so that UI is better

COURSE CONTEXT:
${context}

CHAT HISTORY:
${historyText}

STUDENT QUESTION:
${userMessage}

Return normal text explanation.
`;

  }

  // ======================
  // MCQ MODE
  // ======================

  if (mode === "mcq") {

return `
You are an AI tutor creating a quiz.

STRICT RULES:
- Output must be valid JSON
- No explanation outside JSON
- No markdown
- Only return JSON

FORMAT:

{
 "type":"mcq",
 "title":"Quiz Title",
 "questions":[
  {
   "id":1,
   "question":"string",
   "options":["string","string","string","string"],
   "correctIndex":0,
   "explanation":"short explanation"
  }
 ]
}

RULES:
- Generate 5-10 MCQs
- Each must have 4 options
- correctIndex between 0-3
- explanation max 1 sentence

Topic:
${userMessage}

Course Context:
${context}

Return JSON only.
`;
}

  // ======================
  // INTERVIEW MODE
  // ======================

  if (mode === "interview") {

return `
You are a PROFESSIONAL TECHNICAL INTERVIEWER running a real interview.

Behavior rules:
- Ask ONE question at a time.
- After the candidate answers, evaluate the answer.
- Then ask the NEXT follow‑up question.
- Gradually increase difficulty.
- Keep questions concise.

Return STRICT JSON only.

FORMAT:

{
 "type":"interview",
 "question":"Next interview question",
 "evaluation":{
   "score":0-10,
   "feedback":"short feedback"
 },
 "difficulty":"easy | medium | hard"
}

Candidate topic or latest answer:
${userMessage}

Course context:
${context}

Conversation history:
${historyText}

Return JSON only.
`;
}
  // ======================
  // PAPER MODE
  // ======================

  // ======================
// PAPER MODE
// ======================

if (mode === "paper") {

const isEvaluation =
  userMessage.includes("question") &&
  userMessage.includes("answer");

if (!isEvaluation) {

return `
You are a university professor generating an exam paper.

OUTPUT MUST BE JSON ONLY.

FORMAT:

{
 "type":"paper",
 "title":"Exam Paper",
 "instructions":"Short instructions",
 "questions":[
  {
   "id":1,
   "question":"...",
   "marks":5,
   "expectedAnswer":"short answer guideline"
  }
 ]
}

Rules:
- Generate 6-8 questions
- Mix conceptual and applied questions
- marks between 5-10
- include expectedAnswer for evaluation
- make it realistic for university exams

COURSE CONTEXT:
${context}

CHAT HISTORY:
${historyText}

USER REQUEST:
${userMessage}

Return JSON only.
`;

}


// ======================
// PAPER EVALUATION
// ======================

return `
You are a strict university professor grading an exam.

You must grade fairly and give PARTIAL MARKS when applicable.

Rules:

- Never give only 0 or full marks unless necessary.
- If answer is partially correct give partial marks.
- Always explain WHY marks were deducted.
- Marks awarded must be <= question marks.
- Be strict but fair.

Return STRICT JSON ONLY.

FORMAT:

{
 "type":"paper_result",
 "totalMarks":50,
 "score":32,
 "results":[
  {
   "questionId":1,
   "marksAwarded":3,
   "maxMarks":5,
   "feedback":"Answer is partially correct but missing explanation of time complexity."
  }
 ]
}

Student Answers:

${userMessage}

Course Context:
${context}

Chat History:
${historyText}

Return JSON only.
`;

}
return `
You are an AI tutor.

Conversation:
${historyText}

User:
${userMessage}

Respond helpfully.
`;
}
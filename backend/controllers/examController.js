import { callLLM } from "../services/llmService.js";

export async function evaluateTypedAnswers(req, res) {

  try {

    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: "answers missing or invalid"
      });
    }

    const prompt = `
You are a university professor grading answers.

Student answers:
${JSON.stringify(answers)}

Rules:
- Give partial marks if answer is partially correct
- Never give marks higher than the question marks
- Give short feedback explaining mistakes

Return STRICT JSON:

{
 "results":[
  {
   "questionId":1,
   "marksAwarded":3,
   "feedback":"..."
  }
 ],
 "score":20,
 "summary":"overall performance"
}
`;

    const result = await callLLM(prompt);

    res.json(result);

  } catch (err) {

    console.error("Paper evaluation failed:", err);

    res.status(500).json({
      error: err.message
    });

  }

}
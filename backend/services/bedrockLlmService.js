// ============================================================
// Amazon Bedrock LLM service (Converse API)
// ------------------------------------------------------------
// Drop-in replacement for the Groq-based callLLM. Same input
// (a single prompt string) and same output contract (parsed JSON
// object when the prompt asked for JSON, else { type, content }).
//
// Optionally wraps every call in a Bedrock Guardrail so unsafe /
// off-topic questions are blocked or redacted — important for a
// tutor used by young students (responsible-AI story for judges).
//
// Requires (set in .env):
//   AWS_REGION            e.g. us-east-1
//   BEDROCK_MODEL_ID      e.g. anthropic.claude-3-5-sonnet-20240620-v1:0
//                          or amazon.nova-lite-v1:0 / meta.llama3-70b-instruct-v1:0
// Optional (Guardrails):
//   BEDROCK_GUARDRAIL_ID
//   BEDROCK_GUARDRAIL_VERSION   (e.g. "DRAFT" or "1")
// ============================================================

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const REGION = process.env.AWS_REGION || "us-east-1";
const MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

const client = new BedrockRuntimeClient({ region: REGION });

export async function callBedrock(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt is empty");
  }

  const commandInput = {
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 1024, temperature: 0.2, topP: 0.9 },
  };

  // Attach a Guardrail if one is configured.
  if (process.env.BEDROCK_GUARDRAIL_ID) {
    commandInput.guardrailConfig = {
      guardrailIdentifier: process.env.BEDROCK_GUARDRAIL_ID,
      guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION || "DRAFT",
    };
  }

  const response = await client.send(new ConverseCommand(commandInput));

  // If a Guardrail intervened, surface a clean, student-friendly message.
  if (response.stopReason === "guardrail_intervened") {
    return {
      type: "text",
      content:
        "I can only help with your course material and safe, study-related questions. Try rephrasing your question about the course.",
      guardrail: true,
    };
  }

  let text = response.output?.message?.content?.[0]?.text || "";

  // Same markdown-stripping the Groq service did.
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch {
    return { type: "text", content: text };
  }
}

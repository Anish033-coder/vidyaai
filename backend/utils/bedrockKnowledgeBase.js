// ============================================================
// Amazon Bedrock Knowledge Base retrieval
// ------------------------------------------------------------
// Replaces the Jina-embeddings + MongoDB Atlas $vectorSearch path
// with a managed Amazon Bedrock Knowledge Base (backed by
// OpenSearch Serverless + Titan embeddings).
//
// Unlike the old retrieveContext (which returned a bare string),
// this returns BOTH the joined context text AND a structured
// `citations` array, so the tutor UI can show students exactly
// which source each answer came from.
//
// Per-course isolation is preserved via a `courseId` metadata
// filter — the same semantics as the old Atlas filter, just
// managed by Bedrock instead of hand-rolled.
//
// Requires (set in .env once your KB is live):
//   AWS_REGION        e.g. us-east-1
//   BEDROCK_KB_ID     the Knowledge Base ID from the console
// AWS creds come from the standard provider chain (env / role).
// ============================================================

import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const REGION = process.env.AWS_REGION || "us-east-1";

const client = new BedrockAgentRuntimeClient({ region: REGION });

// Pull a human-readable source label out of a Bedrock location object.
// Bedrock returns different shapes depending on the data source
// (S3, web, Confluence, ...). We handle S3 first, then fall back.
function extractSource(location = {}) {
  if (!location || typeof location !== "object") return "Course material";

  if (location.s3Location?.uri) {
    // s3://bucket/path/Unit-3-Trees.pdf  ->  Unit-3-Trees.pdf
    const uri = location.s3Location.uri;
    return uri.split("/").pop() || uri;
  }
  if (location.webLocation?.url) return location.webLocation.url;
  if (location.confluenceLocation?.url) return location.confluenceLocation.url;

  return location.type || "Course material";
}

/**
 * Retrieve the most relevant course chunks from the Bedrock KB.
 *
 * @param {string} courseId  Mongo course id used as a metadata filter.
 * @param {string} question  The student's question.
 * @returns {Promise<{ context: string, citations: Array }>}
 */
export async function retrieveFromKnowledgeBase(courseId, question) {
  const knowledgeBaseId = process.env.BEDROCK_KB_ID;

  if (!knowledgeBaseId) {
    throw new Error("BEDROCK_KB_ID is not set");
  }

  const vectorSearchConfiguration = { numberOfResults: 5 };

  // Preserve per-course isolation (old code filtered on courseId).
  if (courseId) {
    vectorSearchConfiguration.filter = {
      equals: { key: "courseId", value: String(courseId) },
    };
  }

  const command = new RetrieveCommand({
    knowledgeBaseId,
    retrievalQuery: { text: question },
    retrievalConfiguration: { vectorSearchConfiguration },
  });

  const response = await client.send(command);
  const results = response.retrievalResults || [];

  const citations = results.map((r, i) => ({
    id: i + 1,
    source: extractSource(r.location),
    snippet: (r.content?.text || "").slice(0, 240),
    score: r.score ?? null,
  }));

  const context = results
    .map((r, i) => `[${i + 1}] ${r.content?.text || ""}`)
    .join("\n\n");

  return { context, citations };
}

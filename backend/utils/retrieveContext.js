import CourseEmbedding from "../models/CourseEmbedding.js";
import { createEmbedding } from "../services/embeddingService.js";
import { retrieveFromKnowledgeBase } from "./bedrockKnowledgeBase.js";

// Legacy path: Jina embeddings + MongoDB Atlas $vectorSearch.
// Kept as a fallback so the tutor still runs for anyone without
// AWS configured.
async function retrieveFromAtlas(courseId, question) {
  const queryEmbedding = await createEmbedding(question);

  const results = await CourseEmbedding.aggregate([
    {
      $vectorSearch: {
        index: "vector_index_1",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: 5,
        filter: {
          courseId: courseId
        }
      }
    },
    {
      $project: {
        chunkText: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ]);

  const citations = results.map((r, i) => ({
    id: i + 1,
    source: "Course material",
    snippet: (r.chunkText || "").slice(0, 240),
    score: r.score ?? null,
  }));

  return {
    context: results.map((r, i) => `[${i + 1}] ${r.chunkText}`).join("\n\n"),
    citations,
  };
}

/**
 * Retrieve course context AND citations.
 * Uses Amazon Bedrock Knowledge Bases when BEDROCK_KB_ID is set,
 * otherwise falls back to the legacy Atlas path.
 */
export async function retrieveContextWithCitations(courseId, question) {
  if (process.env.BEDROCK_KB_ID) {
    return retrieveFromKnowledgeBase(courseId, question);
  }
  return retrieveFromAtlas(courseId, question);
}

/**
 * Backward-compatible helper: returns just the context string.
 */
export async function retrieveContext(courseId, question) {
  const { context } = await retrieveContextWithCitations(courseId, question);
  return context;
}
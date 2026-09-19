import cron from "node-cron";
import { syncEmbeddings } from "../scripts/syncEmbeddings.js";

// Periodic re-embedding belongs to the legacy Jina/Atlas path only. On the
// Bedrock path ingestion is an S3 upload plus a Knowledge Base sync, so this
// would spend a Jina call every minute for nothing. Off unless asked for.
export function startScheduler() {
  if (process.env.ENABLE_EMBEDDING_SYNC !== "true") return;

  if (process.env.BEDROCK_KB_ID) {
    console.log("Embedding sync skipped: retrieval is served by the Bedrock Knowledge Base.");
    return;
  }

  console.log("Embedding sync scheduled (legacy Jina path).");

  cron.schedule("*/1 * * * *", async () => {
    try {
      await syncEmbeddings();
    } catch (err) {
      // An unhandled rejection inside a cron callback can take the process down.
      console.error("Embedding sync failed:", err.message);
    }
  });
}

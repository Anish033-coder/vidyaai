import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cors from "cors";

import { connectDatabases } from "./config/db.js";
import { startScheduler } from "./services/scheduler.js";

import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js"
import examRoutes from "./routes/examRoutes.js";


// Groq is only used on the legacy fallback path, so requiring it unconditionally
// would crash-loop a Bedrock-only deployment that has no Groq key.
if (process.env.USE_BEDROCK !== "true" && !process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing in .env (required unless USE_BEDROCK=true)");
  process.exit(1);
}

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3001",
  "https://ai-tutor-sepia-eight.vercel.app",
  "http://ai.lmsbytle.codes",
  "https://ai.lmsbytle.codes",
  ...(process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
  res.send("AI Tutor Backend Running");
});

app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/exam", examRoutes);
const PORT = process.env.PORT || 5000;

async function start() {

  await connectDatabases();

  startScheduler();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

}

start();
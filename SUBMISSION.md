# VidyaAI — First Commit submission

**Team Null_Pointers** · Anish Kumawat, Prasoon Patel, Sushant Verma, Pranav Panmand
**Track:** Ship It

| | |
|---|---|
| **Repository** | `<REPO URL>` |
| **Live URL** | `<APP RUNNER / AMPLIFY URL>` |
| **Demo video** | `<YOUTUBE LINK — unlisted, under 3:00>` |

---

## The problem

A student in a tier-2 or tier-3 college has the material but nobody to ask at 11pm. The PDFs are right there — lecture notes, unit handouts, past papers — and there is no way to interrogate them.

The obvious fix is to paste it into a general chatbot, and that fails in a specific way: it answers confidently from whatever it absorbed during training, not from *your* syllabus. When it is wrong you cannot tell, because it cannot show you where the answer came from. For an exam, a confident wrong answer is worse than no answer.

We wanted the opposite property: an answer you can **check**.

## What we built

VidyaAI turns a course into a tutor that reads the student's own material before it answers, and shows the passage it used.

- **Ask** — a grounded answer, with the source PDF, the matching passage and a relevance score under every response
- **Teach** — the same material explained step by step
- **Quiz** — MCQs generated from the course, graded, with an explanation on every wrong answer
- **Interview** — a mock interviewer that scores each answer out of 10 and adapts difficulty
- **Exam** — a full practice paper, graded with partial marks and per-question feedback

The point is that these are not five features. They are five prompts on **one pipeline** — every mode routes through the same `buildPrompt() → callLLM()` path, so all of them are grounded in the student's syllabus and all of them are wrapped in the same safety layer. One brain, several hats.

## Where AWS fits

| Service | How we use it |
|---|---|
| **Amazon S3** | Stores the course PDFs, each with a `.metadata.json` sidecar carrying its `courseId` |
| **Amazon Bedrock Knowledge Base** | Managed RAG — chunks, embeds and indexes the PDFs on sync; `Retrieve` returns passages *with citation metadata* |
| **Amazon Titan Text Embeddings V2** | The embedding model behind the Knowledge Base |
| **Amazon OpenSearch Serverless** | Vector store backing the Knowledge Base |
| **Amazon Bedrock — Converse API** | Answer generation (Amazon Nova Lite / Claude 3.5 Sonnet) |
| **Amazon Bedrock Guardrails** | Denied topics and unsafe-content filtering, applied on every call |
| **AWS App Runner** | Hosts the Node/Express backend, with an IAM instance role instead of access keys |
| **AWS Amplify Hosting** | Hosts the React frontend |

Two details we think matter more than the service count:

**Retrieval is filtered per course.** Each `Retrieve` call passes an `equals` filter on the `courseId` metadata attribute, so a student asking about Data Structures cannot pull passages out of someone else's Thermodynamics notes. That filter is configured on the Knowledge Base data source, not hand-rolled in application code.

**Citations are real.** They are not the model claiming a source. They come back from the Knowledge Base as structured data — `location.s3Location.uri`, the passage text, and a relevance score — and are stored on the message and rendered under the answer. The student can check the tutor.

## What we built during the event

This repository contains only the tutor. It builds on an LMS the team had written previously, and the retrieval and generation pipeline was rewritten during First Commit:

| | Before | After |
|---|---|---|
| Retrieval | Jina embeddings + MongoDB Atlas `$vectorSearch` | Amazon Bedrock Knowledge Base (Titan V2 + OpenSearch Serverless) |
| Generation | Groq `llama-3.3-70b` | Amazon Bedrock Converse (Nova Lite / Claude 3.5 Sonnet) |
| Safety | none | Amazon Bedrock Guardrails |
| Citations | none — chunk text was concatenated into the prompt and discarded | source document, passage and score, persisted and rendered |
| Hosting | Vercel + Render | AWS App Runner + Amplify Hosting |

The switch is env-flag driven (`BEDROCK_KB_ID`, `USE_BEDROCK`), so the legacy path still runs for a teammate without AWS credentials. That turned out to be a double-edged decision — see below.

## What we learned

**A silent fallback is a trap.** Because the AWS path is selected by environment variables, a misconfigured Bedrock setup does not throw — it quietly falls back to the old provider and returns an answer that looks fine, just without citations. You can demo a "working" app that is not touching AWS at all. We wrote `npm run preflight`, which mirrors the exact routing logic in `retrieveContext.js` and `llmService.js`, reports which path each leg will take, then live-tests Knowledge Base retrieval, generation and a Guardrail intervention, and exits non-zero if anything is still on the legacy path.

**Managed RAG removes more than the embedding call.** Moving to a Knowledge Base deleted our chunking, our embedding calls, our vector index and the retrieval query — the whole ingestion half of the system became an S3 upload and a sync.

**Citation metadata has shape.** `RetrieveCommand` returns a `location` that differs by data source (`s3Location`, `webLocation`, `confluenceLocation`), so reading it needs a real extractor rather than one optimistic property access.

**Metadata filtering is a two-step setup.** Uploading the `.metadata.json` sidecars is not enough — the field has to be registered as filterable on the data source after the first sync, or the filter silently matches nothing.

## AI coding tools used

- **Claude Code (Anthropic)** — code review, refactoring, debugging, the preflight script, the architecture diagram, and documentation.

## Credits

Built on an earlier LMS project by the wider team, used with permission. The Bedrock pipeline, citations, Guardrails integration, preflight tooling and interface in this repository are the work of this submission.

# AWS Runbook — Stand up the Bedrock tutor (do this on your AWS account)

I can't touch your AWS account from here, so this is the part **you** run. It's console-first on purpose — fastest for a 4-day sprint, no Terraform to debug. Order matters: the two ⏳ steps can take time to approve, so do them **first, today**.

Region: pick **one** and use it everywhere (this doc assumes `us-east-1` — it has the widest Bedrock model choice). All the code reads `AWS_REGION`.

---

## Step 0 ⏳ — Account, student verification, credits (today)

1. Create/sign in to your **AWS Builder Center** profile and complete **student verification** — mandatory to be scored, and it unlocks the $100 credits.
2. Create an AWS account (debit/RuPay works; expect a tiny temporary auth charge).
3. Apply the credits so you're not spending real money during the sprint.

## Step 1 ⏳ — Enable Bedrock model access (today — approval can lag)

Bedrock console → **Model access** → request access to:
- **Amazon Titan Text Embeddings V2** (`amazon.titan-embed-text-v2:0`) — used by the Knowledge Base.
- One text model for answers: **Amazon Nova Lite** (`amazon.nova-lite-v1:0`, cheapest/fast) or **Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20240620-v1:0`, best quality).

Most Amazon-owned models approve instantly; some Anthropic ones take a bit. Request now so you're not blocked on Day 1.

---

## Step 2 — Put course content in S3

1. S3 → create a bucket, e.g. `nullpointers-tutor-content` (same region).
2. Upload 2–3 real course PDFs (the ones you'll demo).
3. **Per-course isolation** (the code filters retrieval by `courseId`): give each file a metadata sidecar so the KB can filter on it. For an object `Unit3-Trees.pdf`, upload alongside it a file named **`Unit3-Trees.pdf.metadata.json`**:

   ```json
   { "metadataAttributes": { "courseId": "PASTE_THE_MONGO_COURSE_ID" } }
   ```

   Use the real Mongo `courseId` string your app uses for that course. (If you skip this, retrieval still works — it just won't isolate by course. Fine for a first end-to-end test, but do it before the demo.)

## Step 3 — Create the Knowledge Base (console wizard does the hard part)

Bedrock console → **Knowledge Bases** → **Create**:
1. Data source = **S3**, point at your bucket.
2. Embeddings model = **Titan Text Embeddings V2**.
3. Vector store = **Quick create a new vector store** → this provisions **OpenSearch Serverless** for you (no manual setup).
4. Create, then **Sync** the data source. Wait for "Ready."
5. Copy the **Knowledge Base ID** (looks like `ABCD1234XY`).

> Filtering note: after the first sync, in the data source's **metadata field mapping**, make sure `courseId` is set as a filterable metadata field so the code's `equals` filter works.

## Step 4 — (Recommended) Create a Guardrail

Bedrock console → **Guardrails** → **Create**:
- Block obvious unsafe categories (violence, sexual, etc.) and set a denied-topics rule like "anything not related to studying / the course."
- Optionally enable **PII redaction**.
- Create → copy the **Guardrail ID** and note the **version** (`DRAFT` while testing).

This is your on-camera "responsible AI for students" moment — worth the 10 minutes.

---

## Step 5 — Point the app at AWS (local test first)

In `backend/.env` (copy from the new `.env.example`):

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...        # a scoped IAM user for local dev, or use a role
AWS_SECRET_ACCESS_KEY=...
BEDROCK_KB_ID=ABCD1234XY     # from Step 3
USE_BEDROCK=true
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
BEDROCK_GUARDRAIL_ID=...     # from Step 4 (optional)
BEDROCK_GUARDRAIL_VERSION=DRAFT
```

Then:

```
cd backend
npm install            # pulls the two new @aws-sdk/* packages
npm run dev
```

The IAM identity needs: `bedrock:Retrieve` (on your KB), `bedrock:InvokeModel` / `bedrock:Converse`, and if using Guardrails `bedrock:ApplyGuardrail`. Start with the managed **`AmazonBedrockFullAccess`** policy for the sprint; tighten later.

**Verify:** open a course chat, ask a question from a PDF → you should get an answer with a **Sources** list under it. Ask something off-topic → the Guardrail should redirect. If `BEDROCK_KB_ID` is unset or `USE_BEDROCK=false`, it silently falls back to the old Jina/Groq path — good for teammates without AWS.

## Step 6 — Deploy for the Ship It URL

Ship It needs a live link judges can open. Fastest paths:
- **Backend** (`backend`): **AWS App Runner** — point it at the repo/Dockerfile, set the same env vars, attach an **IAM instance role** with Bedrock permissions (no keys in env in prod). Gives you an HTTPS URL.
- **Frontend** (`frontend`): **AWS Amplify Hosting** — connect the repo, set `VITE_BACKEND_URL` to the App Runner URL, deploy.

That's the whole hero path live on AWS. Everything else in the LMS can stay where it is for this event.

---

## Cost sanity (mention this on the cost slide)

For a demo you'll spend cents: OpenSearch Serverless is the only always-on piece (has a minimum OCU cost — **delete the KB/collection after the event** to stop it), Bedrock Retrieve/Converse are pay-per-call, S3 is trivial. Keep the $100 credits as headroom.

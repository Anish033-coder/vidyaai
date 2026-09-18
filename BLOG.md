# The tutor that had to show its working

*Moving a RAG pipeline off third-party APIs onto Amazon Bedrock Knowledge Bases — and the four things that fought back.*

---

## The problem we actually had

Every one of us has a folder of course PDFs. Unit notes, slide exports, a couple of past papers. At 11pm before an exam, that folder is useless — you cannot ask it anything.

The obvious move is to paste a chunk into a general chatbot, and it fails in a particular way. It answers from whatever it learned in training, not from your syllabus, and it answers *confidently*. You cannot tell the difference between a correct answer and a fluent wrong one, because there is nothing to check it against. Before an exam, a confident wrong answer is worse than silence.

So we set ourselves a narrower goal than "build an AI tutor." We wanted an answer a student could **verify** — where every response points at the passage it came from, and you can read that passage and decide for yourself.

## Where we started

We already had a tutor of sorts, built on:

- **Jina** for embeddings
- **MongoDB Atlas** `$vectorSearch` as the vector store
- **Groq** running `llama-3.3-70b` for generation

It worked. It also had no citations at all — retrieval concatenated the matching chunk text into the prompt and threw the source information away. And there was no safety layer of any kind, in a product aimed at students.

## Where we moved it

| | Before | After |
|---|---|---|
| Retrieval | Jina + Atlas `$vectorSearch` | **Amazon Bedrock Knowledge Base** |
| Embeddings | Jina | **Amazon Titan Text Embeddings V2** |
| Vector store | MongoDB Atlas | **Amazon OpenSearch Serverless** |
| Generation | Groq `llama-3.3-70b` | **Amazon Bedrock Converse** (Nova Lite / Claude 3.5 Sonnet) |
| Safety | none | **Amazon Bedrock Guardrails** |
| Citations | none | source document + passage + relevance score |

The thing that surprised us most: moving to a Knowledge Base didn't just swap the embedding provider. It **deleted an entire half of our system**. Our chunking logic, our embedding calls, our vector index definition, our retrieval aggregation pipeline — all of it became "upload the PDFs to S3 and press Sync." The ingestion code we were most proud of turned out to be the code we no longer needed.

## Four things that fought back

### 1. The silent fallback

We kept the old path behind environment flags — `BEDROCK_KB_ID` for retrieval, `USE_BEDROCK` for generation — so a teammate without AWS credentials could still run the app.

That felt like good engineering. It nearly cost us the demo.

Because when the flags are unset, nothing throws. The app quietly routes to Jina and Groq, returns a perfectly reasonable-looking answer, and the only visible difference is that the Sources block is missing — which is easy to miss if you are not specifically watching for it. You can record a three-minute video of a "working AWS app" that never touched AWS.

So we wrote a preflight script. It mirrors the exact routing logic in `retrieveContext.js` and `llmService.js`, prints which path each leg will take, then live-tests all three legs:

```
1. Which path will the app take?
  PASS  Retrieval -> Amazon Bedrock Knowledge Base (ABCD1234XY)
  PASS  Generation -> Amazon Bedrock (amazon.nova-lite-v1:0) in us-east-1
  PASS  Guardrail  -> attached (gr-xxxx, version DRAFT)

2. Live Knowledge Base retrieval
  PASS  5 chunks retrieved for courseId='68f2...'
        [1] Unit3-Trees.pdf  score=0.94
```

It exits non-zero if any leg is still on the legacy path. "Do not record yet" became a hard signal instead of a judgement call at 2am.

### 2. The AWS-native deploy blocked by a third-party API key

Reading the server before deploying, we found this at the top of `server.js`:

```js
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing in .env");
  process.exit(1);
}
```

A hard exit. Which means the clean, Bedrock-only deployment — the one with no Groq key anywhere, an IAM instance role, and nothing third-party in the environment — would crash-loop on boot. The most AWS-native configuration was the only one guaranteed to fail.

One conditional fixed it. But it is a good example of a check that was correct when it was written and quietly became wrong when the architecture moved underneath it.

### 3. Metadata filtering is two steps, and the second one is silent

Our tutor has to be per-course: a Data Structures question must not retrieve passages from someone's Thermodynamics notes. Bedrock supports this through metadata filtering — you upload a `Unit3-Trees.pdf.metadata.json` alongside each PDF:

```json
{ "metadataAttributes": { "courseId": "68f2a91c4b7d..." } }
```

and pass an `equals` filter on `Retrieve`.

What the tutorial path does not shout about: uploading the sidecars is not enough. After the first sync you also have to register `courseId` as a **filterable** field on the data source. Skip it and nothing errors — your filter simply matches nothing, and retrieval returns an empty list forever. We built the check for this into the preflight script, because we would rather find it on a Friday than on camera.

### 4. Citation metadata has a shape

`RetrieveCommand` gives you back a `location` object, and its shape depends on the data source — `s3Location`, `webLocation`, `confluenceLocation`. Reaching straight for `location.s3Location.uri` works right up until it doesn't. It needs a real extractor with a fallback, which is about six lines and obvious in hindsight.

## What the citations changed

We expected showing sources to be a trust feature. It turned out to change the interface.

Once every answer carries a source document, a passage and a relevance score, the answer stops being a chat bubble and starts being something closer to an article with footnotes. We ended up rebuilding the UI around that idea — the question set as a heading, the answer set in a serif at reading size, and the sources as numbered footnotes underneath with the passage quoted inline rather than hidden behind a tooltip.

That last detail mattered more than it sounds. Our first version put the passage in a `title` attribute, which shows on hover — and is completely invisible in a screen recording. The single most important thing our project does was, for a while, impossible to see in the demo.

## What we would tell ourselves on Thursday

- Request Bedrock model access **first**. It is asynchronous and everything is downstream of it.
- If you build a fallback path, build the thing that tells you which path you are on, at the same time. A fallback you cannot see is a bug you will ship.
- Managed RAG deletes more code than it adds. Budget for what you get to throw away.
- The feature that proves your project works has to be visible **in the recording**, not just in the app.

---

*Built for First Commit on the Bharat Builds Tour, by team Null_Pointers.*
*AI coding tools used: Claude Code (Anthropic).*

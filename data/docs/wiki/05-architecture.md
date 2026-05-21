# Architecture

The codebase is intentionally small and split into three layers: a `lib/`
folder for reusable RAG logic, an `app/` folder for Next.js routes and UI,
and a `scripts/` folder for command-line entry points.

## File layout

```
app/
  api/
    chat/route.ts        NDJSON-streaming chat endpoint
    ingest/route.ts      Token-protected re-index endpoint
  globals.css
  layout.tsx
  page.tsx               Chat UI (client component)
lib/
  env.ts                 Env parsing with required-var checks
  embeddings.ts          Local HF transformer embeddings
  vectorstore.ts         Chroma helpers
  llm.ts                 ChatOpenAI pointed at OpenRouter
  rag.ts                 Retrieval + prompt + streaming generator
  ingest.ts              Walk → split → embed → upsert
scripts/
  ingest.ts              CLI for npm run ingest
data/
  docs/                  Source documentation files
  chroma/                Chroma persistence volume
```

## Module responsibilities

### `lib/env.ts`

Centralized environment-variable parsing. Throws on missing required vars
(currently only `OPENROUTER_API_KEY`). Exports a strongly typed `env`
object grouped by concern (`openrouter`, `chroma`, `embedding`, `ingest`,
`retrieval`).

### `lib/embeddings.ts`

Returns a cached `HuggingFaceTransformersEmbeddings` instance. The model is
loaded lazily on first call and runs entirely in-process via
`@xenova/transformers`.

### `lib/vectorstore.ts`

Two helpers:

- `getVectorStore()` — connect to an existing collection (used by the chat
  endpoint).
- `getOrCreateVectorStore()` — connect and create the collection if
  necessary (used by ingestion).

### `lib/llm.ts`

Constructs a `ChatOpenAI` instance configured for OpenRouter: the OpenAI
SDK base URL is overridden, and `HTTP-Referer` / `X-Title` headers are
attached for OpenRouter attribution. Streaming is enabled at construction.

### `lib/rag.ts`

- `retrieveContext(question)` — top-k similarity search; returns documents
  plus a `RetrievedSource[]` projection for the UI.
- `streamAnswer(question, history, docs)` — async generator that yields
  tokens. Builds the prompt with a strict grounding system message, the
  recent conversation history (last 6 messages), the formatted context, and
  the new question.

### `lib/ingest.ts`

Walks `DOCS_PATH` for supported extensions, splits with
`RecursiveCharacterTextSplitter`, attaches `{source, chunkIndex}` metadata,
**deletes the collection** via the raw `ChromaClient`, then adds all
documents back. The delete-then-add pattern keeps ingest idempotent
without needing to compute per-chunk IDs.

## Request flow

```
Browser
  └─ POST /api/chat  { question, history }
        └─ retrieveContext()
              └─ Chroma similarity search
        ├─ emit "sources" event (NDJSON)
        └─ streamAnswer()
              └─ ChatOpenAI.stream → OpenRouter
                    └─ emit "token" events as they arrive
        └─ emit "done" event
```

The browser parses the NDJSON line-by-line and updates the assistant
message in place as tokens arrive.

## Why NDJSON instead of SSE or the Vercel AI SDK

- Simpler to parse on both ends than SSE (no `data:` prefix, no double
  newlines).
- Cleanly multiplexes sources, tokens, and errors into one stream.
- Avoids pulling in the `ai` package as a dependency.

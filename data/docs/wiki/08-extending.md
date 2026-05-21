# Extending

## Add PDF support

PDFs are not enabled by default but require only a small change.

1. Install a PDF parser: `npm install pdf-parse`.
2. In `lib/ingest.ts`, add `.pdf` to `SUPPORTED_EXTENSIONS`.
3. In the file-reading loop, branch on extension: for `.pdf`, call
   `pdf-parse` and use the returned `text`; otherwise keep the existing
   UTF-8 read.

The same splitter, embeddings, and storage path apply afterward.

## Swap the embedding model

Edit `lib/embeddings.ts`. The current implementation uses
`HuggingFaceTransformersEmbeddings` from `@langchain/community`. To use a
hosted provider instead:

- **OpenAI**: import `OpenAIEmbeddings` from `@langchain/openai` and pass
  an API key plus `model: "text-embedding-3-small"`. Cheap and high
  quality.
- **Voyage / Cohere / Mistral**: each has a LangChain integration with
  the same interface.

After swapping, you must re-ingest because the new embeddings will have
different dimensions and Chroma rejects mixed-dimension collections.

## Use a different LLM provider

Anything OpenAI-compatible works. Edit `lib/llm.ts` and change the base
URL and headers. Examples:

- **Local Ollama**: set `baseURL: "http://localhost:11434/v1"` and a model
  slug like `llama3.1:8b`.
- **Together / Groq / DeepInfra**: each exposes an OpenAI-compatible API;
  point `baseURL` at theirs.

For providers that aren't OpenAI-compatible, swap `ChatOpenAI` for the
matching LangChain chat model class.

## Add multiple collections

Right now the app uses a single `CHROMA_COLLECTION_NAME`. To support
multiple corpora:

1. Make `CHROMA_COLLECTION_NAME` a request-level parameter (e.g. accept
   `collection` in the `/api/chat` body or as a route segment).
2. Pass it through `getVectorStore` and `ingestDocs`.
3. Expose collection selection in the UI.

## Add reranking

For better answer quality on large corpora:

1. Retrieve `k * 3` documents instead of `k`.
2. Run them through a reranker like `cohere-rerank` or a local
   cross-encoder.
3. Keep the top `k` and pass those to the model.

## Add authentication to the UI

The chat endpoint is currently open. To gate it:

1. Add NextAuth (or any auth provider) under `app/api/auth/`.
2. In `app/api/chat/route.ts`, check the session at the top of `POST`
   and return `401` if absent.
3. Wrap `app/page.tsx` in a session check or redirect.

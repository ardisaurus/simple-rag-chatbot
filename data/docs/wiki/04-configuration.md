# Configuration

All configuration is environment-variable driven. The canonical list lives
in `.env.example`; this page explains each variable.

## OpenRouter

- `OPENROUTER_API_KEY` — **required**. Your OpenRouter API key. Obtain at
  <https://openrouter.ai/keys>.
- `OPENROUTER_MODEL` — model slug to call. Default: `openai/gpt-4o-mini`.
  Any model listed on OpenRouter works (e.g. `anthropic/claude-3.5-sonnet`,
  `meta-llama/llama-3.1-70b-instruct`).
- `OPENROUTER_BASE_URL` — default: `https://openrouter.ai/api/v1`. Override
  only if you proxy OpenRouter behind a gateway.
- `OPENROUTER_SITE_URL` — sent as the `HTTP-Referer` header for OpenRouter
  attribution and rate-limit policies. Default: `http://localhost:3000`.
- `OPENROUTER_APP_NAME` — sent as the `X-Title` header. Default:
  `Simple RAG Chatbot`.

## Chroma

- `CHROMA_URL` — HTTP URL of the Chroma server. Default:
  `http://localhost:8000`.
- `CHROMA_COLLECTION_NAME` — collection to read from and write to.
  Default: `docs`. Use different names if you want to keep separate corpora.

## Embeddings

- `EMBEDDING_MODEL` — any `@xenova/transformers` feature-extraction model.
  Default: `Xenova/all-MiniLM-L6-v2` (384-dim, fast, English-leaning).
  If you change this, you **must** re-ingest because the existing vectors
  have a different dimensionality.

## Ingestion

- `DOCS_PATH` — directory walked by the ingest script. Default:
  `./data/docs`. Subdirectories are included; only files with extensions
  `.md`, `.markdown`, or `.txt` are read.
- `CHUNK_SIZE` — chunk size in characters used by the recursive splitter.
  Default: `1000`.
- `CHUNK_OVERLAP` — overlap between adjacent chunks. Default: `150`.

## Retrieval

- `RETRIEVAL_K` — number of chunks returned for each question. Default: `5`.
  Lower if your model has a small context window or you are getting noisy
  answers; raise if questions need synthesis across many sections.

## HTTP ingest endpoint

- `INGEST_TOKEN` — if set, enables `POST /api/ingest`. Callers must send
  `Authorization: Bearer <token>`. Leave **empty** to disable the endpoint
  entirely; the CLI (`npm run ingest`) is always available.

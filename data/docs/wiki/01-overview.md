# Project Overview

Simple RAG Chatbot is a minimal, self-hostable retrieval-augmented generation
(RAG) chatbot for product documentation. It is built with Next.js (App
Router), TypeScript, LangChain.js, ChromaDB, and OpenRouter.

## What it does

A user asks a question in the web UI. The app:

1. Embeds the question locally.
2. Retrieves the top-k most relevant chunks from ChromaDB.
3. Sends those chunks plus the question to an LLM via OpenRouter.
4. Streams the answer back to the browser, along with the source chunks.

The model is instructed to answer **only** from the retrieved context. If the
answer is not in the context, it says it does not know. Each answer includes
the source file names and chunk indices that grounded it.

## Stack

- **Framework**: Next.js 14 with the App Router.
- **Language**: TypeScript.
- **Chat model**: any model on OpenRouter (default `openai/gpt-4o-mini`).
- **Embeddings**: local, in-process, via `@xenova/transformers`
  (default model `Xenova/all-MiniLM-L6-v2`). No second API key needed.
- **Vector store**: ChromaDB, run locally via Docker Compose.
- **UI**: Tailwind CSS, streaming responses, collapsible source citations.
- **Orchestration**: LangChain.js for splitting, embedding, and chat.

## Design principles

- **Self-hosted by default**: the only paid dependency is OpenRouter token
  usage. Embeddings, vector store, and UI all run locally.
- **Low cost**: `openai/gpt-4o-mini` costs fractions of a cent per question.
- **Strict grounding**: the system prompt forbids using outside knowledge.
- **Small surface area**: one `lib/` folder, one `app/` folder, one ingest
  script. Easy to read end-to-end.
- **Idempotent ingest**: re-running `npm run ingest` drops the collection
  and re-indexes, so it never accumulates stale chunks.

# Ingestion and Retrieval

## Supported file types

Ingestion reads three extensions out of the box: `.md`, `.markdown`, and
`.txt`. The list is defined as `SUPPORTED_EXTENSIONS` in `lib/ingest.ts`.
Any file matching another extension is silently skipped.

## Walking the docs folder

`DOCS_PATH` (default `./data/docs`) is walked recursively. Sub-folders are
included, so you can organize docs into a hierarchy. Each file's path
relative to `DOCS_PATH` is stored as the chunk's `source` metadata.

## Chunking

Splitting is done by LangChain's `RecursiveCharacterTextSplitter` with two
configurable knobs:

- `CHUNK_SIZE` — target chunk size in characters. Default: `1000`.
- `CHUNK_OVERLAP` — overlap between adjacent chunks. Default: `150`.

The recursive splitter tries to break on paragraph boundaries first, then
lines, then sentences, then characters. Overlap helps the model see
context that spans a chunk boundary.

For Markdown specifically, the default character-based splitter works
well. If you want heading-aware splits, swap in
`MarkdownTextSplitter` from `langchain/text_splitter`.

## Metadata attached to each chunk

```ts
{
  source: "subdir/file.md",  // path relative to DOCS_PATH
  chunkIndex: 3              // 0-based index within the file
}
```

This metadata is what the model cites in answers and what the UI displays
in the "Sources" disclosure under each assistant message.

## Why ingestion drops the collection first

To make `npm run ingest` truly idempotent, `lib/ingest.ts` calls
`ChromaClient.deleteCollection({ name })` before re-adding. Otherwise,
running ingest after deleting or renaming a source file would leave
orphan chunks in the vector store.

This trade-off matters: ingestion is a wipe-and-replace operation, not an
incremental update. For most documentation use cases (a few hundred to a
few thousand chunks) this completes in seconds. For very large corpora
you would want to switch to ID-based upserts.

## Retrieval

`retrieveContext(question)` in `lib/rag.ts` does a single similarity
search:

```ts
const docs = await store.similaritySearch(question, env.retrieval.k);
```

There is no reranking, no MMR diversification, and no query rewriting.
Default `k = 5`. Bump `RETRIEVAL_K` if you find answers are missing
context; lower it if the model is getting confused by noise.

## Prompt assembly

The chat prompt is assembled in `streamAnswer()` and looks like this:

- **System message**: strict grounding instructions — answer only from
  context, say "I don't know" otherwise, cite sources.
- **User message**: the recent conversation (up to the last 6 messages),
  the retrieved chunks formatted as `[n] (source.md #chunk)\n...`, and
  the current question.

Each chunk is numbered so the model can reference it by index, but the
real citation anchor is the parenthesized source tag, which matches the
metadata returned to the UI.

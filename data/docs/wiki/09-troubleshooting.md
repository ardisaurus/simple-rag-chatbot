# Troubleshooting

## "Missing required environment variable: OPENROUTER_API_KEY"

The app could not find your OpenRouter key. Make sure `.env` exists in the
project root (copy from `.env.example`) and that it contains a non-empty
`OPENROUTER_API_KEY=...` line. Restart `npm run dev` after editing.

## "ECONNREFUSED 127.0.0.1:8000" or "fetch failed" on first question

Chroma is not running. Start it with `npm run chroma` and wait a few
seconds for the container to come up. Verify with
`curl http://localhost:8000/api/v2/heartbeat`.

## "No supported files found" from `npm run ingest`

The ingest script walks `DOCS_PATH` (default `./data/docs`) for `.md`,
`.markdown`, or `.txt` files. Check that:

- The directory exists and contains files with those extensions.
- You're not pointing `DOCS_PATH` at an empty folder.
- Files don't all have an unsupported extension (e.g. `.mdx`).

## The first question is very slow

The local embedding model is downloaded on first use (not at install) and
cached under `node_modules/@xenova/transformers/`. Once cached, subsequent
queries are fast (tens of milliseconds for a single embedding).

## Answers say "I don't know" when the info is in the docs

A few things to check, in order:

1. Did `npm run ingest` actually run? Re-run and confirm it printed a
   non-zero "Indexed N chunks from M file(s)" line.
2. Is `CHROMA_COLLECTION_NAME` the same in the ingest run and the dev
   server? They share the same env, so this only matters if you set
   different values in different shells.
3. Bump `RETRIEVAL_K` (default 5) to retrieve more chunks.
4. Raise `CHUNK_SIZE` (default 1000) so each chunk has more surrounding
   context.

## Model returns markdown source tags that don't match real files

The model occasionally invents citations. Two mitigations:

- Lower the temperature in `lib/llm.ts` (already set to 0.1).
- Tighten the system prompt to instruct the model to copy source tags
  verbatim from the context.

The UI's source panel always shows the **actual** retrieved chunks, which
is the ground truth — trust that over what appears inside the model's
prose.

## "TypeError: Cannot find module 'onnxruntime-node'"

`@xenova/transformers` ships native bindings that webpack tries to bundle.
The project's `next.config.mjs` marks them as externals, but if the error
appears, ensure:

- `experimental.serverComponentsExternalPackages` includes
  `@xenova/transformers` and `onnxruntime-node`.
- The webpack hook also pushes those names into `config.externals`.

Both are already configured in `next.config.mjs`.

## Re-ingesting old docs leaves orphan chunks

It shouldn't — `lib/ingest.ts` calls `ChromaClient.deleteCollection`
before re-adding. If you see stale chunks, manually delete the collection
once via the Chroma API and re-run ingest.

## Chroma container loses data across restarts

The compose file mounts `./data/chroma` as the persistence volume. Don't
delete that folder unless you want to start fresh. The folder is in
`.gitignore` so it is local-only.

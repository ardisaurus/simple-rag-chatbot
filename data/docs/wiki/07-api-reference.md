# API Reference

The app exposes two HTTP endpoints, both implemented as Next.js route
handlers under `app/api/`.

## `POST /api/chat`

Stream a chat completion grounded in the indexed documents.

### Request

```json
{
  "question": "How do I configure the timeout?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

- `question` (string, required) — the new user question.
- `history` (array, optional) — previous turns. Each item must have
  `role: "user" | "assistant"` and `content: string`. The server keeps
  the last 6 messages from this list.

### Response

`Content-Type: application/x-ndjson; charset=utf-8`. One JSON object per
line, in this order:

1. `{"type": "sources", "sources": [...]}` — emitted once before any
   tokens. Each source has `source`, `chunkIndex`, and `preview`.
2. `{"type": "token", "value": "..."}` — emitted repeatedly as tokens
   stream from the model.
3. `{"type": "done"}` — emitted once at the end of a successful stream.

On failure, the server emits `{"type": "error", "message": "..."}` and
closes the stream. Errors are non-fatal to the connection; the client is
expected to surface them and let the user retry.

### Example with `curl`

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I install the product?", "history": []}'
```

## `POST /api/ingest`

Trigger a re-index of `DOCS_PATH`. **Disabled by default.** To enable, set
`INGEST_TOKEN` in `.env` to a long random string.

### Authorization

Send the bearer token in the `Authorization` header:

```
Authorization: Bearer <INGEST_TOKEN>
```

Mismatched or missing tokens return `401 Unauthorized`. When the env var
is unset, the endpoint returns `403 Forbidden` with a message explaining
that the CLI is the supported path.

### Request

No body. The endpoint always re-indexes the configured `DOCS_PATH`.

### Response

`200 OK` with JSON:

```json
{
  "filesIndexed": 4,
  "chunksIndexed": 27,
  "files": ["overview.md", "setup.md", "..."]
}
```

`500` on ingestion failure with the error message as the response body.

### Example

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer $INGEST_TOKEN"
```

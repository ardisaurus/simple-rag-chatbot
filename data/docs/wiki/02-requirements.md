# Requirements

## Software prerequisites

Install these before starting:

- **Node.js** 18.18 or newer, or any 20.x release. Required by Next.js 14.
  Check with `node --version`.
- **npm** 9 or newer. Ships with Node. Yarn and pnpm also work if you prefer.
- **Docker** 20 or newer. Used to run ChromaDB locally.
- **Docker Compose v2 plugin**. Bundled with Docker Desktop on macOS and
  Windows. On Linux, install the `docker-compose-plugin` package.

## Hardware

- ~500 MB free disk space (node_modules ~250 MB + embedding model cache
  ~30 MB + Chroma data).
- ~2 GB free RAM (embedding model runs in-process, Chroma uses ~200 MB).

## Accounts and keys

- An **OpenRouter account**. Sign up at <https://openrouter.ai/> and create a
  key at <https://openrouter.ai/keys>. Pricing is pay-as-you-go and the
  default model is among the cheapest available.

No other keys are required. Embeddings run locally and ChromaDB is
self-hosted, so OpenRouter is the only external dependency.

## Networking

- Port 3000 free for the Next.js dev server.
- Port 8000 free for ChromaDB. Override with `CHROMA_URL` if you need
  something else.
- Outbound HTTPS to `openrouter.ai` for chat calls.

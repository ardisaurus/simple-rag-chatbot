# Setup

## 1. Install dependencies

```bash
npm install
```

The first run downloads the embedding model (~30 MB) into the
`@xenova/transformers` cache the first time it is used at runtime, not at
install time.

## 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set at least `OPENROUTER_API_KEY`. All other variables have
sensible defaults for local development. See the Configuration page for
details on every variable.

## 3. Start ChromaDB

```bash
npm run chroma
```

This runs `docker compose up -d chroma`, which starts the official Chroma
container on `http://localhost:8000` and persists data to `./data/chroma`.

To stop it later: `npm run chroma:down`.

## 4. Add your docs

Drop `.md`, `.markdown`, or `.txt` files into `./data/docs/`. Subdirectories
are walked recursively. To use a different folder, set `DOCS_PATH` in
`.env`.

## 5. Index the docs

```bash
npm run ingest
```

This walks `DOCS_PATH`, splits each file into overlapping chunks, embeds
them locally, and stores them in Chroma. The collection is dropped first
so the operation is idempotent.

To index a different folder ad-hoc:

```bash
npm run ingest -- ./path/to/other/docs
```

## 6. Run the app

```bash
npm run dev
```

Open <http://localhost:3000> and ask questions.

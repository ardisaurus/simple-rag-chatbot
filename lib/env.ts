import "dotenv/config";

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function intOr(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  openrouter: {
    apiKey: required("OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY),
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    siteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    appName: process.env.OPENROUTER_APP_NAME || "Simple RAG Chatbot",
  },
  chroma: {
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collection: process.env.CHROMA_COLLECTION_NAME || "docs",
  },
  embedding: {
    model: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  },
  ingest: {
    docsPath: process.env.DOCS_PATH || "./data/docs",
    chunkSize: intOr(process.env.CHUNK_SIZE, 1000),
    chunkOverlap: intOr(process.env.CHUNK_OVERLAP, 150),
    token: process.env.INGEST_TOKEN || "",
  },
  retrieval: {
    k: intOr(process.env.RETRIEVAL_K, 5),
  },
} as const;

export type Env = typeof env;

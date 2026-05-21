import { promises as fs } from "node:fs";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChromaClient } from "chromadb";
import { env } from "./env";
import { getOrCreateVectorStore } from "./vectorstore";

const SUPPORTED_EXTENSIONS = new Set([".md", ".markdown", ".txt"]);

export type IngestResult = {
  filesIndexed: number;
  chunksIndexed: number;
  files: string[];
};

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      if (
        entry.isFile() &&
        SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ) {
        return [full];
      }
      return [];
    }),
  );
  return files.flat();
}

async function resetCollection(): Promise<void> {
  const client = new ChromaClient({ path: env.chroma.url });
  try {
    await client.deleteCollection({ name: env.chroma.collection });
  } catch {
    // Collection didn't exist — fine.
  }
}

export async function ingestDocs(docsPath?: string): Promise<IngestResult> {
  const root = path.resolve(docsPath ?? env.ingest.docsPath);
  const stat = await fs.stat(root).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Docs path is not a directory: ${root}`);
  }

  const files = await walk(root);
  if (files.length === 0) {
    return { filesIndexed: 0, chunksIndexed: 0, files: [] };
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: env.ingest.chunkSize,
    chunkOverlap: env.ingest.chunkOverlap,
  });

  const docs: Document[] = [];
  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    const relSource = path.relative(root, file).replace(/\\/g, "/");
    const chunks = await splitter.splitText(text);
    chunks.forEach((chunk, i) => {
      docs.push(
        new Document({
          pageContent: chunk,
          metadata: {
            source: relSource,
            chunkIndex: i,
          },
        }),
      );
    });
  }

  await resetCollection();
  const store = await getOrCreateVectorStore();
  await store.addDocuments(docs);

  return {
    filesIndexed: files.length,
    chunksIndexed: docs.length,
    files: files.map((f) => path.relative(root, f).replace(/\\/g, "/")),
  };
}

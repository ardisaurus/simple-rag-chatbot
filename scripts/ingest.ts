import { ingestDocs } from "../lib/ingest";
import { env } from "../lib/env";

async function main() {
  const arg = process.argv[2];
  const docsPath = arg && !arg.startsWith("-") ? arg : env.ingest.docsPath;

  console.log(`Ingesting docs from: ${docsPath}`);
  console.log(`Chroma URL:          ${env.chroma.url}`);
  console.log(`Collection:          ${env.chroma.collection}`);
  console.log(`Embedding model:     ${env.embedding.model}`);
  console.log("");

  const start = Date.now();
  const result = await ingestDocs(docsPath);
  const seconds = ((Date.now() - start) / 1000).toFixed(1);

  if (result.filesIndexed === 0) {
    console.warn("No supported files found (.md, .markdown, .txt).");
    return;
  }

  console.log(
    `Indexed ${result.chunksIndexed} chunks from ${result.filesIndexed} file(s) in ${seconds}s.`,
  );
  for (const f of result.files) console.log(`  - ${f}`);
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});

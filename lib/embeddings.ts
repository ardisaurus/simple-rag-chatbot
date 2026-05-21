import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { env } from "./env";

let cached: HuggingFaceTransformersEmbeddings | null = null;

export function getEmbeddings(): HuggingFaceTransformersEmbeddings {
  if (cached) return cached;
  cached = new HuggingFaceTransformersEmbeddings({
    model: env.embedding.model,
  });
  return cached;
}

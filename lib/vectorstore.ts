import { Chroma } from "@langchain/community/vectorstores/chroma";
import { env } from "./env";
import { getEmbeddings } from "./embeddings";

export async function getVectorStore(): Promise<Chroma> {
  return Chroma.fromExistingCollection(getEmbeddings(), {
    collectionName: env.chroma.collection,
    url: env.chroma.url,
  });
}

export async function getOrCreateVectorStore(): Promise<Chroma> {
  const store = new Chroma(getEmbeddings(), {
    collectionName: env.chroma.collection,
    url: env.chroma.url,
  });
  await store.ensureCollection();
  return store;
}

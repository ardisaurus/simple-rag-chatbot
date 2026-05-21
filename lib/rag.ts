import type { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "./llm";
import { getVectorStore } from "./vectorstore";
import { env } from "./env";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RetrievedSource = {
  source: string;
  chunkIndex: number | null;
  preview: string;
};

const SYSTEM_PROMPT = `You are a documentation assistant. Answer only using the provided context.
If the answer is not in the context, say you do not know.
Cite the source file names or chunk metadata in your response.
Keep answers concise and faithful to the context. Do not invent information.`;

function formatContext(docs: Document[]): string {
  return docs
    .map((doc, i) => {
      const src = (doc.metadata?.source as string) ?? "unknown";
      const chunk = doc.metadata?.chunkIndex;
      const tag = chunk != null ? `${src} #${chunk}` : src;
      return `[${i + 1}] (${tag})\n${doc.pageContent}`;
    })
    .join("\n\n---\n\n");
}

function toSources(docs: Document[]): RetrievedSource[] {
  return docs.map((doc) => ({
    source: (doc.metadata?.source as string) ?? "unknown",
    chunkIndex:
      typeof doc.metadata?.chunkIndex === "number"
        ? (doc.metadata.chunkIndex as number)
        : null,
    preview: doc.pageContent.slice(0, 200),
  }));
}

export async function retrieveContext(question: string): Promise<{
  docs: Document[];
  sources: RetrievedSource[];
}> {
  const store = await getVectorStore();
  const docs = await store.similaritySearch(question, env.retrieval.k);
  return { docs, sources: toSources(docs) };
}

export async function* streamAnswer(
  question: string,
  history: ChatMessage[],
  docs: Document[],
): AsyncGenerator<string> {
  const context = formatContext(docs);
  const llm = getChatModel();

  const recentHistory = history.slice(-6); // last 3 turns
  const historyText = recentHistory
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const userPrompt = [
    historyText && `Conversation so far:\n${historyText}`,
    `Context:\n${context || "(no context retrieved)"}`,
    `Question: ${question}`,
    `Answer using only the context above. Cite sources by file name.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const stream = await llm.stream([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userPrompt),
  ]);

  for await (const chunk of stream) {
    const text =
      typeof chunk.content === "string"
        ? chunk.content
        : Array.isArray(chunk.content)
          ? chunk.content
              .map((c) => ("text" in c ? (c.text as string) : ""))
              .join("")
          : "";
    if (text) yield text;
  }
}

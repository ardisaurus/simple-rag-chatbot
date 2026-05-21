import { NextRequest } from "next/server";
import { retrieveContext, streamAnswer, type ChatMessage } from "@/lib/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  question?: unknown;
  history?: unknown;
};

function isChatMessage(v: unknown): v is ChatMessage {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string"
  );
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return new Response("Missing 'question'", { status: 400 });
  }
  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history.filter(isChatMessage)
    : [];

  const encoder = new TextEncoder();
  const write = (controller: ReadableStreamDefaultController, obj: unknown) => {
    controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { docs, sources } = await retrieveContext(question);
        write(controller, { type: "sources", sources });

        for await (const token of streamAnswer(question, history, docs)) {
          write(controller, { type: "token", value: token });
        }

        write(controller, { type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        write(controller, { type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

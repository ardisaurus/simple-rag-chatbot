"use client";

import { useEffect, useRef, useState } from "react";

type Source = {
  source: string;
  chunkIndex: number | null;
  preview: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isStreaming]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isStreaming) return;

    setError(null);
    setInput("");
    const history = messages;
    const next: Message[] = [
      ...messages,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ];
    setMessages(next);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: { type: string; value?: string; sources?: Source[]; message?: string };
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          if (event.type === "sources" && event.sources) {
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                sources: event.sources,
              };
              return copy;
            });
          } else if (event.type === "token" && event.value) {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = {
                ...last,
                content: last.content + event.value,
              };
              return copy;
            });
          } else if (event.type === "error") {
            throw new Error(event.message || "Unknown error");
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          copy.pop();
        }
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Documentation Assistant</h1>
        <p className="text-sm text-neutral-600">
          Ask questions grounded in your indexed docs. Answers cite their sources.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Ask your first question to get started.
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((m, i) => (
              <li key={i} className="space-y-2">
                <div
                  className={
                    m.role === "user"
                      ? "ml-auto w-fit max-w-[85%] rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white"
                      : "mr-auto w-fit max-w-[95%] whitespace-pre-wrap rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-900"
                  }
                >
                  {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
                </div>
                {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                  <details className="ml-1 text-xs text-neutral-600">
                    <summary className="cursor-pointer select-none">
                      Sources ({m.sources.length})
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {m.sources.map((s, j) => (
                        <li
                          key={j}
                          className="rounded border border-neutral-200 bg-neutral-50 p-2"
                        >
                          <div className="font-mono text-[11px] text-neutral-700">
                            {s.source}
                            {s.chunkIndex != null ? ` #${s.chunkIndex}` : ""}
                          </div>
                          <div className="mt-1 text-neutral-600">
                            {s.preview}
                            {s.preview.length >= 200 ? "…" : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the docs…"
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-neutral-900"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isStreaming ? "Thinking…" : "Send"}
        </button>
      </form>
    </main>
  );
}

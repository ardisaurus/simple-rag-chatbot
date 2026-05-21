import { NextRequest } from "next/server";
import { ingestDocs } from "@/lib/ingest";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest) {
  if (!env.ingest.token) {
    return new Response(
      "INGEST_TOKEN is not set on the server. Use the CLI (`npm run ingest`) or set the token.",
      { status: 403 },
    );
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== env.ingest.token) return unauthorized();

  try {
    const result = await ingestDocs();
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Ingest failed: ${message}`, { status: 500 });
  }
}

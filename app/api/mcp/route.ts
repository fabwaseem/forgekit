import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { formatCitations } from "@/lib/ai/citations";
import { searchKnowledge } from "@/lib/ai/rag";
import { userForApiKey } from "@/lib/keys";
import { consumeRateLimit } from "@/lib/rate-limit";

async function authorize(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  return userForApiKey(token);
}

async function handle(request: Request) {
  const key = await authorize(request);
  if (!key) return new Response("Unauthorized", { status: 401 });
  const limit = await consumeRateLimit(key.userId);
  if (!limit.success) return new Response("Rate limit exceeded", { status: 429 });

  const server = new McpServer({ name: "forgekit", version: "0.1.0" });
  server.registerTool(
    "search_knowledge",
    {
      title: "Search knowledge",
      description: "Search this user's Forgekit documents and return cited excerpts.",
      inputSchema: z.object({
        query: z.string().describe("What to look up in the user's documents"),
        limit: z.number().int().min(1).max(8).optional(),
      }),
    },
    async ({ query, limit }) => {
      const sources = await searchKnowledge(key.userId, query, limit ?? 5);
      const text = sources.length ? formatCitations(sources) : "No matching passages.";
      return { content: [{ type: "text" as const, text }] };
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;

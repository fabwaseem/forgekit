import { createApiKey, listApiKeys } from "@/lib/keys";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ keys: await listApiKeys(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const key = await createApiKey(user.id, body.name ?? "MCP key");
  return Response.json({ key });
}

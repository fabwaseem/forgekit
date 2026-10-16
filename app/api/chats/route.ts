import { createChat, listChats } from "@/lib/chats";
import { findModel, listModels } from "@/lib/ai/models";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const chats = await listChats(user.id);
  return Response.json({ chats });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { modelId?: string };
  const fallback = listModels()[0]?.id ?? "ollama:llama3.2";
  const modelId = body.modelId && findModel(body.modelId) ? body.modelId : fallback;
  const chat = await createChat(user.id, modelId);
  return Response.json({ chat });
}

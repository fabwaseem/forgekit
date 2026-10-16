import { deleteChat, getChat, loadMessages } from "@/lib/chats";
import { getCurrentUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const chat = await getChat(user.id, id);
  if (!chat) return Response.json({ error: "Not found" }, { status: 404 });
  const messages = await loadMessages(id);
  return Response.json({ chat, messages });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const removed = await deleteChat(user.id, id);
  if (!removed) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

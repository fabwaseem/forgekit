import { deleteApiKey } from "@/lib/keys";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const removed = await deleteApiKey(user.id, id);
  if (!removed) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

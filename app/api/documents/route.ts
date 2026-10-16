import { ingestUpload, listDocuments } from "@/lib/documents";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

export const maxDuration = 60;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ documents: await listDocuments(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const limit = await consumeRateLimit(user.id);
  if (!limit.success) return Response.json({ error: "Rate limit exceeded" }, { status: 429 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Attach a file" }, { status: 400 });
  try {
    const document = await ingestUpload(user.id, file);
    return Response.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}

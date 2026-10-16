import { getCurrentUser } from "@/lib/session";
import { usageSummary } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await usageSummary(user.id));
}

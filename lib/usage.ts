import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { usageEvent } from "@/lib/db/schema";

export async function recordUsage(input: {
  userId: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}) {
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  const totalTokens = input.totalTokens ?? inputTokens + outputTokens;
  await db.insert(usageEvent).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    modelId: input.modelId,
    inputTokens,
    outputTokens,
    totalTokens,
  });
}

export async function usageSummary(userId: string) {
  const [totals] = await db
    .select({
      inputTokens: sql<number>`coalesce(sum(${usageEvent.inputTokens}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${usageEvent.outputTokens}), 0)::int`,
      totalTokens: sql<number>`coalesce(sum(${usageEvent.totalTokens}), 0)::int`,
      calls: sql<number>`count(*)::int`,
    })
    .from(usageEvent)
    .where(eq(usageEvent.userId, userId));

  const byModel = await db
    .select({
      modelId: usageEvent.modelId,
      inputTokens: sql<number>`coalesce(sum(${usageEvent.inputTokens}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${usageEvent.outputTokens}), 0)::int`,
      totalTokens: sql<number>`coalesce(sum(${usageEvent.totalTokens}), 0)::int`,
      calls: sql<number>`count(*)::int`,
    })
    .from(usageEvent)
    .where(eq(usageEvent.userId, userId))
    .groupBy(usageEvent.modelId)
    .orderBy(desc(sql`sum(${usageEvent.totalTokens})`));

  const recent = await db
    .select()
    .from(usageEvent)
    .where(eq(usageEvent.userId, userId))
    .orderBy(desc(usageEvent.createdAt))
    .limit(20);

  return {
    totals: totals ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0, calls: 0 },
    byModel,
    recent,
  };
}

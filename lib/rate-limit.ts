import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimitHit } from "@/lib/db/schema";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export function rateLimitSettings(env: Record<string, string | undefined> = process.env) {
  const limit = Number(env.RATE_LIMIT_REQUESTS ?? 30);
  const windowSeconds = Number(env.RATE_LIMIT_WINDOW_SECONDS ?? 60);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 30,
    windowSeconds:
      Number.isFinite(windowSeconds) && windowSeconds > 0 ? Math.floor(windowSeconds) : 60,
  };
}

export function decideSlidingWindow(timestamps: number[], now: number, limit: number, windowMs: number) {
  const recent = timestamps.filter((timestamp) => timestamp > now - windowMs).sort((a, b) => a - b);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    return { success: false, limit, remaining: 0, reset: oldest + windowMs };
  }
  return {
    success: true,
    limit,
    remaining: Math.max(limit - recent.length - 1, 0),
    reset: now + windowMs,
  };
}

let upstash: Ratelimit | null | undefined;

function upstashLimiter() {
  if (upstash !== undefined) return upstash;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstash = null;
    return upstash;
  }
  const { limit, windowSeconds } = rateLimitSettings();
  upstash = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: "forgekit",
    analytics: false,
  });
  return upstash;
}

async function consumePostgres(userId: string): Promise<RateLimitResult> {
  const { limit, windowSeconds } = rateLimitSettings();
  const now = Date.now();
  const windowStart = new Date(now - windowSeconds * 1000);

  return db.transaction(async (tx) => {
    await tx.delete(rateLimitHit).where(sql`${rateLimitHit.createdAt} < ${windowStart}`);
    const rows = await tx
      .select({ createdAt: rateLimitHit.createdAt })
      .from(rateLimitHit)
      .where(and(eq(rateLimitHit.userId, userId), gt(rateLimitHit.createdAt, windowStart)));
    const decision = decideSlidingWindow(
      rows.map((row) => row.createdAt.getTime()),
      now,
      limit,
      windowSeconds * 1000,
    );
    if (!decision.success) return decision;
    await tx.insert(rateLimitHit).values({ id: crypto.randomUUID(), userId });
    return decision;
  });
}

export async function consumeRateLimit(userId: string): Promise<RateLimitResult> {
  const limiter = upstashLimiter();
  if (limiter) {
    const result = await limiter.limit(userId);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
  return consumePostgres(userId);
}

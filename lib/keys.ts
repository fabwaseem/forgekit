import { createHash, randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKey } from "@/lib/db/schema";

export function hashApiKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function listApiKeys(userId: string) {
  const rows = await db
    .select({
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
    })
    .from(apiKey)
    .where(eq(apiKey.userId, userId))
    .orderBy(desc(apiKey.createdAt));
  return rows;
}

export async function createApiKey(userId: string, name: string) {
  const secret = `fk_${randomBytes(24).toString("base64url")}`;
  const id = crypto.randomUUID();
  await db.insert(apiKey).values({
    id,
    userId,
    name: name.trim() || "MCP key",
    keyHash: hashApiKey(secret),
    prefix: secret.slice(0, 10),
  });
  return { id, token: secret, prefix: secret.slice(0, 10) };
}

export async function deleteApiKey(userId: string, keyId: string) {
  const [row] = await db.select().from(apiKey).where(eq(apiKey.id, keyId)).limit(1);
  if (!row || row.userId !== userId) return false;
  await db.delete(apiKey).where(eq(apiKey.id, keyId));
  return true;
}

export async function userForApiKey(token: string) {
  if (!token.startsWith("fk_")) return null;
  const [row] = await db.select().from(apiKey).where(eq(apiKey.keyHash, hashApiKey(token))).limit(1);
  if (!row) return null;
  await db.update(apiKey).set({ lastUsedAt: new Date() }).where(eq(apiKey.id, row.id));
  return row;
}

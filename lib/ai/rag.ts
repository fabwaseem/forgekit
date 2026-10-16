import { cosineDistance, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chunk, document } from "@/lib/db/schema";
import { excerpt, type Citation } from "./citations";
import { embedQuery } from "./embeddings";

export async function searchKnowledge(userId: string, query: string, limit = 5): Promise<Citation[]> {
  const embedding = await embedQuery(query);
  const similarity = sql<number>`1 - (${cosineDistance(chunk.embedding, embedding)})`;
  const rows = await db
    .select({
      content: chunk.content,
      documentName: document.name,
      score: similarity,
    })
    .from(chunk)
    .innerJoin(document, eq(document.id, chunk.documentId))
    .where(eq(chunk.userId, userId))
    .orderBy(desc(similarity))
    .limit(Math.min(Math.max(limit, 1), 8));

  return rows.map((row, index) => ({
    index: index + 1,
    documentName: row.documentName,
    excerpt: excerpt(row.content),
    score: Number(row.score),
  }));
}

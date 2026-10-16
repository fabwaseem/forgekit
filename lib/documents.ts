import { desc, eq } from "drizzle-orm";
import { extractText } from "unpdf";
import { db } from "@/lib/db";
import { chunk, document } from "@/lib/db/schema";
import { chunkText } from "@/lib/ai/chunk";
import { embedTexts } from "@/lib/ai/embeddings";

const MAX_BYTES = 8 * 1024 * 1024;

export async function listDocuments(userId: string) {
  return db
    .select()
    .from(document)
    .where(eq(document.userId, userId))
    .orderBy(desc(document.createdAt));
}

export async function deleteDocument(userId: string, documentId: string) {
  const [row] = await db.select().from(document).where(eq(document.id, documentId)).limit(1);
  if (!row || row.userId !== userId) return false;
  await db.delete(document).where(eq(document.id, documentId));
  return true;
}

async function readUpload(file: File) {
  if (file.size > MAX_BYTES) throw new Error("Files must be 8 MB or smaller");
  const name = file.name || "untitled";
  const lower = name.toLowerCase();
  const buffer = new Uint8Array(await file.arrayBuffer());
  if (lower.endsWith(".pdf") || file.type === "application/pdf") {
    const extracted = await extractText(buffer, { mergePages: true });
    const text = Array.isArray(extracted.text) ? extracted.text.join("\n\n") : extracted.text;
    return { name, mediaType: "application/pdf", text, bytes: buffer.byteLength };
  }
  if (lower.endsWith(".md") || lower.endsWith(".txt") || file.type.startsWith("text/")) {
    return {
      name,
      mediaType: file.type || "text/plain",
      text: new TextDecoder().decode(buffer),
      bytes: buffer.byteLength,
    };
  }
  throw new Error("Upload a PDF, Markdown, or text file");
}

export async function ingestUpload(userId: string, file: File) {
  const parsed = await readUpload(file);
  const pieces = chunkText(parsed.text);
  if (pieces.length === 0) throw new Error("That file has no extractable text");
  const embeddings = await embedTexts(pieces);
  const documentId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(document).values({
      id: documentId,
      userId,
      name: parsed.name,
      mediaType: parsed.mediaType,
      bytes: parsed.bytes,
    });
    await tx.insert(chunk).values(
      pieces.map((content, ordinal) => ({
        id: crypto.randomUUID(),
        documentId,
        userId,
        ordinal,
        content,
        embedding: embeddings[ordinal] ?? [],
      })),
    );
  });
  return { id: documentId, name: parsed.name, chunks: pieces.length, bytes: parsed.bytes };
}

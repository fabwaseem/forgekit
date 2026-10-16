import { asc, desc, eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { db } from "@/lib/db";
import { chat, message } from "@/lib/db/schema";

export async function listChats(userId: string) {
  return db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.updatedAt));
}

export async function getChat(userId: string, chatId: string) {
  const [row] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);
  if (!row || row.userId !== userId) return null;
  return row;
}

export async function createChat(userId: string, modelId: string) {
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(chat)
    .values({ id, userId, modelId, title: "New chat" })
    .returning();
  return row;
}

export async function deleteChat(userId: string, chatId: string) {
  const existing = await getChat(userId, chatId);
  if (!existing) return false;
  await db.delete(chat).where(eq(chat.id, chatId));
  return true;
}

export async function loadMessages(chatId: string): Promise<UIMessage[]> {
  const rows = await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(asc(message.createdAt));
  return rows.map((row) => ({
    id: row.id,
    role: row.role as UIMessage["role"],
    parts: row.parts,
  }));
}

function titleFromMessage(uiMessage: UIMessage) {
  const text = uiMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  return text.length > 72 ? `${text.slice(0, 71).trimEnd()}…` : text;
}

export async function saveMessages(chatId: string, messages: UIMessage[], modelId: string) {
  const titleSource = messages.find((item) => item.role === "user");
  await db.transaction(async (tx) => {
    await tx.delete(message).where(eq(message.chatId, chatId));
    if (messages.length > 0) {
      await tx.insert(message).values(
        messages.map((item) => ({
          id: item.id,
          chatId,
          role: item.role,
          parts: item.parts,
        })),
      );
    }
    const [current] = await tx.select().from(chat).where(eq(chat.id, chatId)).limit(1);
    const nextTitle =
      current?.title === "New chat" && titleSource ? titleFromMessage(titleSource) : null;
    await tx
      .update(chat)
      .set({
        modelId,
        updatedAt: new Date(),
        ...(nextTitle ? { title: nextTitle } : {}),
      })
      .where(eq(chat.id, chatId));
  });
}

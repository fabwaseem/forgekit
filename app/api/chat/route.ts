import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getChat, loadMessages, saveMessages } from "@/lib/chats";
import { resolveLanguageModel } from "@/lib/ai/providers";
import { createChatTools, SYSTEM_PROMPT } from "@/lib/ai/tools";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { recordUsage } from "@/lib/usage";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await consumeRateLimit(user.id);
  if (!limit.success) {
    return Response.json(
      { error: "Rate limit exceeded. Try again shortly.", reset: limit.reset },
      { status: 429, headers: { "Retry-After": "30" } },
    );
  }

  const body = (await request.json()) as {
    id?: string;
    message?: UIMessage;
    modelId?: string;
    useKnowledge?: boolean;
  };
  if (!body.id || !body.message || body.message.role !== "user" || !body.modelId) {
    return Response.json({ error: "Chat, model, and a user message are required" }, { status: 400 });
  }

  const chat = await getChat(user.id, body.id);
  if (!chat) return Response.json({ error: "Chat not found" }, { status: 404 });

  const resolved = resolveLanguageModel(body.modelId);
  if (!resolved) {
    return Response.json({ error: "That model is not configured" }, { status: 400 });
  }

  const history = await loadMessages(chat.id);
  const messages = [...history, body.message];
  const tools = createChatTools(user.id, Boolean(body.useKnowledge));

  const result = streamText({
    model: resolved.model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(6),
    onEnd: async ({ totalUsage }) => {
      await recordUsage({
        userId: user.id,
        modelId: body.modelId!,
        inputTokens: totalUsage.inputTokens,
        outputTokens: totalUsage.outputTokens,
        totalTokens: totalUsage.totalTokens,
      });
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      sendSources: true,
      // Give assistant messages a stable id so each reply saves as its own row.
      generateMessageId: () => crypto.randomUUID(),
      onEnd: async ({ messages: nextMessages, isAborted }) => {
        if (isAborted) return;
        await saveMessages(chat.id, nextMessages, body.modelId!);
      },
    }),
  });
}

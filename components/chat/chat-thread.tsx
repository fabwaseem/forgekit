"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ToolCard } from "@/components/chat/tool-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModelOption = { id: string; label: string; provider: string };

const chatSettings = new Map<string, { modelId: string; useKnowledge: boolean }>();

export function ChatThread({ id }: { id: string }) {
  const router = useRouter();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelId, setModelId] = useState("");
  const [useKnowledge, setUseKnowledge] = useState(true);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id: chatId }) => ({
          body: {
            id: chatId,
            message: messages.at(-1),
            modelId: chatSettings.get(chatId)?.modelId ?? "",
            useKnowledge: chatSettings.get(chatId)?.useKnowledge ?? true,
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id,
    transport,
  });

  useEffect(() => {
    void Promise.all([fetch("/api/models").then((response) => response.json()), fetch(`/api/chats/${id}`).then((response) => response.json())])
      .then(([modelBody, chatBody]: [{ models: ModelOption[] }, { chat?: { modelId: string }; messages?: UIMessage[]; error?: string }]) => {
        const available = modelBody.models ?? [];
        setModels(available);
        if (chatBody.error) {
          toast.error(chatBody.error);
          router.push("/chat");
          return;
        }
        const initial = available.some((model) => model.id === chatBody.chat?.modelId)
          ? chatBody.chat?.modelId
          : available[0]?.id;
        if (initial) {
          setModelId(initial);
          chatSettings.set(id, { modelId: initial, useKnowledge: true });
        }
        setMessages(chatBody.messages ?? []);
        setReady(true);
      })
      .catch(() => toast.error("Could not load this chat"));
  }, [id, router, setMessages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    if (!modelId) {
      toast.error("Add a provider key or start Ollama before sending");
      return;
    }
    setInput("");
    void sendMessage({ text });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {ready && messages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center">
              <h1 className="text-4xl tracking-tight">Ask with tools on the table.</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Weather, arithmetic, public pages, and your uploaded library are available from the first message.
              </p>
            </div>
          ) : null}
          {messages.map((message) => (
            <article key={message.id} className={message.role === "user" ? "ml-auto max-w-[85%]" : "max-w-full"}>
              <div
                className={
                  message.role === "user"
                    ? "rounded-3xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                    : "rounded-3xl border border-border bg-card px-4 py-3"
                }
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return message.role === "user" ? (
                      <p key={index} className="whitespace-pre-wrap leading-6">
                        {part.text}
                      </p>
                    ) : (
                      <div
                        key={index}
                        className="space-y-2 text-sm leading-6 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      >
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    );
                  }
                  if (part.type.startsWith("tool-")) {
                    return <ToolCard key={index} part={part} />;
                  }
                  return null;
                })}
              </div>
            </article>
          ))}
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
          <div ref={bottom} />
        </div>
      </div>
      <form
        className="border-t border-border px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={modelId}
              onValueChange={(value) => {
                if (!value) return;
                setModelId(value);
                chatSettings.set(id, { modelId: value, useKnowledge });
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder={models.length ? "Choose a model" : "No models configured"} />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={useKnowledge}
                onChange={(event) => {
                  const next = event.target.checked;
                  setUseKnowledge(next);
                  chatSettings.set(id, { modelId, useKnowledge: next });
                }}
              />
              Search knowledge
            </label>
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Forgekit…"
              rows={2}
              className="min-h-16 flex-1"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            {busy ? (
              <Button type="button" variant="outline" onClick={() => void stop()}>
                Stop
              </Button>
            ) : (
              <Button type="submit">Send</Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

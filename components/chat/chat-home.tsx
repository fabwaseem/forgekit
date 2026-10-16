"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ModelOption = { id: string; label: string };

export function ChatHome() {
  const router = useRouter();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetch("/api/models")
      .then((response) => response.json())
      .then((body: { models: ModelOption[] }) => setModels(body.models ?? []))
      .catch(() => setModels([]));
  }, []);

  async function create() {
    setPending(true);
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ modelId: models[0]?.id }),
    });
    setPending(false);
    if (!response.ok) {
      toast.error("Could not create a chat");
      return;
    }
    const body = (await response.json()) as { chat: { id: string } };
    router.push(`/chat/${body.chat.id}`);
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-6">
      <p className="text-xs tracking-[0.2em] text-primary uppercase">Workspace</p>
      <h1 className="mt-3 text-5xl tracking-tight">Start a thread.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {models.length
          ? `${models.length} model${models.length === 1 ? "" : "s"} ready: ${models.map((model) => model.label).join(", ")}.`
          : "No provider keys are set yet. Add one to .env, or set OLLAMA_BASE_URL for a local model."}
      </p>
      <Button className="mt-8 w-fit" onClick={() => void create()} disabled={pending}>
        {pending ? "Creating…" : "New chat"}
      </Button>
    </div>
  );
}

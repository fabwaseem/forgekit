import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ChatThread } from "@/components/chat/chat-thread";

async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <ChatThread id={id} />
    </AppShell>
  );
}

export default function ChatThreadPage({ params }: PageProps<"/chat/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="grid h-dvh place-items-center text-sm text-muted-foreground">Opening chat…</div>
      }
    >
      <Thread params={params} />
    </Suspense>
  );
}

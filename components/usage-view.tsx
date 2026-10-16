"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Usage = {
  totals: { inputTokens: number; outputTokens: number; totalTokens: number; calls: number };
  byModel: Array<{ modelId: string; inputTokens: number; outputTokens: number; totalTokens: number; calls: number }>;
};

type KeyRow = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null };

export function UsageView() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [name, setName] = useState("Laptop MCP");
  const [freshToken, setFreshToken] = useState<string | null>(null);

  async function refresh() {
    const [usageResponse, keyResponse] = await Promise.all([fetch("/api/usage"), fetch("/api/keys")]);
    if (usageResponse.ok) setUsage((await usageResponse.json()) as Usage);
    if (keyResponse.ok) {
      const body = (await keyResponse.json()) as { keys: KeyRow[] };
      setKeys(body.keys);
    }
  }

  useEffect(() => {
    void Promise.all([fetch("/api/usage"), fetch("/api/keys")])
      .then(async ([usageResponse, keyResponse]) => {
        if (usageResponse.ok) setUsage((await usageResponse.json()) as Usage);
        if (keyResponse.ok) {
          const body = (await keyResponse.json()) as { keys: KeyRow[] };
          setKeys(body.keys);
        }
      })
      .catch(() => undefined);
  }, []);

  async function createKey(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as { key?: { token: string }; error?: string };
    if (!response.ok || !body.key) {
      toast.error(body.error ?? "Could not create a key");
      return;
    }
    setFreshToken(body.key.token);
    await refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
      <div>
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Meter</p>
        <h1 className="mt-3 text-5xl tracking-tight">Usage</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Token totals are recorded when a response finishes. Chat and MCP requests share a per-user limit.
          Upstash is used when configured; otherwise the limit lives in Postgres.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Calls", usage?.totals.calls ?? 0],
            ["Input", usage?.totals.inputTokens ?? 0],
            ["Output", usage?.totals.outputTokens ?? 0],
            ["Total", usage?.totals.totalTokens ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-heading text-3xl">{Number(value).toLocaleString("en-US")}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-4 space-y-2 text-sm">
          {(usage?.byModel ?? []).map((row) => (
            <li key={row.modelId} className="flex justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2">
              <span className="truncate">{row.modelId}</span>
              <span className="text-muted-foreground">{Number(row.totalTokens).toLocaleString("en-US")} tokens</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-3xl tracking-tight">MCP keys</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Send <code className="rounded bg-muted px-1">Authorization: Bearer fk_…</code> to{" "}
          <code className="rounded bg-muted px-1">/api/mcp</code>. The key is shown once.
        </p>
        <form onSubmit={createKey} className="mt-4 flex flex-wrap gap-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} className="max-w-xs" />
          <Button type="submit">Create key</Button>
        </form>
        {freshToken ? (
          <p className="mt-3 rounded-xl border border-primary/40 bg-accent px-3 py-2 font-mono text-xs break-all">
            {freshToken}
          </p>
        ) : null}
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {keys.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No keys yet.</li>
          ) : (
            keys.map((key) => (
              <li key={key.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {key.name} · <span className="font-mono text-xs">{key.prefix}…</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => void remove(key.id)}>
                  Revoke
                </Button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

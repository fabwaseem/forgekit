"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DocumentRow = { id: string; name: string; bytes: number; mediaType: string; createdAt: string };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeView() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const response = await fetch("/api/documents");
    if (!response.ok) return;
    const body = (await response.json()) as { documents: DocumentRow[] };
    setDocuments(body.documents);
  }

  useEffect(() => {
    void fetch("/api/documents")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { documents: DocumentRow[] } | null) => {
        if (body) setDocuments(body.documents);
      })
      .catch(() => undefined);
  }, []);

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/documents", { method: "POST", body: data });
    setPending(false);
    const body = (await response.json()) as { error?: string; document?: { chunks: number } };
    if (!response.ok) {
      toast.error(body.error ?? "Upload failed");
      return;
    }
    toast.success(`Indexed ${body.document?.chunks ?? 0} chunks`);
    event.currentTarget.reset();
    await refresh();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Could not delete that document");
      return;
    }
    await refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-xs tracking-[0.2em] text-primary uppercase">Library</p>
      <h1 className="mt-3 text-5xl tracking-tight">Knowledge</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        PDF, Markdown, and text files are chunked, embedded, and stored with an HNSW index. Chat and the MCP
        endpoint search the same passages.
      </p>
      <form onSubmit={onUpload} className="mt-8 flex flex-wrap items-center gap-3">
        <Input name="file" type="file" accept=".pdf,.md,.txt,text/plain,text/markdown,application/pdf" required className="max-w-sm" />
        <Button type="submit" disabled={pending}>
          {pending ? "Indexing…" : "Upload"}
        </Button>
      </form>
      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
        {documents.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted-foreground">Nothing uploaded yet.</li>
        ) : (
          documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm">{document.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(document.bytes)} · {document.mediaType}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void remove(document.id)}>
                Delete
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

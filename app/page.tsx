import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

const features = [
  {
    title: "Streaming chat",
    copy: "Saved threads, a model picker, and token-by-token responses with the AI SDK UI protocol.",
  },
  {
    title: "Tools with a face",
    copy: "Weather, public page fetch, and a safe calculator render as cards instead of raw JSON.",
  },
  {
    title: "Cited retrieval",
    copy: "Upload PDF, Markdown, or text. Chunks live in pgvector behind an HNSW index and come back numbered.",
  },
  {
    title: "Five providers",
    copy: "OpenAI, Anthropic, Gemini, and xAI when keys exist. Ollama stays available for the machine next to you.",
  },
  {
    title: "Accounts that stay local",
    copy: "Better Auth handles email and password plus optional GitHub. History belongs to the signed-in user.",
  },
  {
    title: "An MCP door",
    copy: "The same search is exposed at /api/mcp with a bearer key, so other agents can query your library.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">Open-source AI starter</p>
            <h1 className="mt-4 max-w-xl text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              Ship an AI product, not a single chat box.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Forgekit is a Next.js 16 workspace with streaming chat, tool calling, retrieval on Postgres,
              and a container you can run on your own hardware.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }))}>
                Create an account
              </Link>
              <a
                href="https://github.com/fabwaseem/forgekit"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                Read the source
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-4 shadow-[0_30px_80px_-40px_rgba(80,40,10,0.45)]">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Workspace preview</p>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">Static</span>
            </div>
            <div className="space-y-3 rounded-2xl bg-background p-4">
              <div className="ml-auto max-w-[80%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground">
                What is the weather in Lisbon, and what did the handbook say about deploy?
              </div>
              <div className="max-w-[90%] space-y-2 rounded-2xl border border-border bg-card px-3 py-3 text-sm">
                <p className="text-xs text-muted-foreground">Weather · Lisbon, Portugal</p>
                <p className="font-heading text-2xl">21°C · Clear</p>
              </div>
              <div className="max-w-[90%] rounded-2xl border border-border bg-card px-3 py-3 text-sm leading-6">
                Lisbon is clear and 21°C. The handbook says to run the app container beside Postgres and apply
                migrations on boot. <span className="text-primary">[1]</span>
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-px px-5 py-4 text-sm text-muted-foreground sm:grid-cols-5">
            {["Next.js 16", "AI SDK 7", "Better Auth", "Drizzle", "pgvector"].map((item) => (
              <p key={item} className="px-2 py-3 text-center tracking-wide">
                {item}
              </p>
            ))}
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-2xl tracking-tight">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.copy}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
          <p>MIT licensed. Built to be forked.</p>
          <a href="https://github.com/fabwaseem/forgekit" className="hover:text-foreground">
            github.com/fabwaseem/forgekit
          </a>
        </div>
      </footer>
    </div>
  );
}

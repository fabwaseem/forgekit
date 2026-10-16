<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Forgekit

Next.js 16 App Router starter. Cache Components are on. Read `node_modules/next/dist/docs/` before changing rendering behavior.

## Commands

- `pnpm dev` starts the app.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` should pass before a change is done.
- `pnpm db:generate` writes Drizzle SQL. `pnpm db:migrate` applies `./drizzle`.
- `bash scripts/setup.sh` copies `.env`, starts Postgres, and migrates.

## Map

- `lib/auth.ts` is Better Auth (email/password and optional GitHub). The Drizzle tables in `lib/db/auth-schema.ts` come from `@better-auth/cli generate`.
- `app/api/chat/route.ts` streams with AI SDK v7 (`streamText`, `toUIMessageStream`). Tools live in `lib/ai/tools.ts`.
- Retrieval is `lib/ai/rag.ts` plus the `chunk` table (`vector(1536)`, HNSW, cosine).
- `/api/mcp` exposes `search_knowledge` with bearer keys from `api_key`.
- Rate limits use Upstash when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, otherwise `rate_limit_hit` in Postgres.

## Conventions

- Keep provider keys on the server. The model list is filtered in `lib/ai/models.ts`.
- Do not follow redirects or private hosts in `webFetch`.
- UI components come from the shadcn CLI (`components/ui`). Prefer those over new primitives.
- Authenticated pages are client shells that call route handlers. Do not read the session at the top of a cached layout.

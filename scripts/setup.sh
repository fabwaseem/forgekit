#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.33.4 --activate
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  secret="$(openssl rand -base64 32 | tr -d '\n')"
  if sed --version >/dev/null 2>&1; then
    sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${secret}|" .env
  else
    sed -i '' "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${secret}|" .env
  fi
  echo "Wrote .env with a generated BETTER_AUTH_SECRET"
fi

if command -v docker >/dev/null 2>&1; then
  docker compose up -d db
  echo "Waiting for Postgres"
  for _ in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U forge -d forgekit >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
else
  echo "Docker was not found. Start Postgres yourself, then rerun pnpm db:migrate."
fi

pnpm install
pnpm db:migrate
echo "Forgekit is ready. Run pnpm dev"

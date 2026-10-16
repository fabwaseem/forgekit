import { connection } from "next/server";
import { configuredProviders, listModels } from "@/lib/ai/models";
import { embeddingProviderName } from "@/lib/ai/embeddings";

export async function GET() {
  await connection();
  return Response.json({
    models: listModels(),
    providers: configuredProviders(),
    embeddingProvider: embeddingProviderName(),
    githubAuth: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  });
}

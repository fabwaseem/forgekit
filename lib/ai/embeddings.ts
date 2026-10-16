import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";
import { ollamaBaseURL } from "./models";

type EmbeddingProvider = "openai" | "google" | "ollama";

function selectedProvider(): EmbeddingProvider | null {
  const requested = process.env.EMBEDDING_PROVIDER?.trim();
  if (requested === "openai" || requested === "google" || requested === "ollama") {
    return requested;
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  return null;
}

function embeddingModel() {
  const provider = selectedProvider();
  if (!provider) {
    throw new Error(
      "No embedding provider is configured. Set OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or OLLAMA_BASE_URL.",
    );
  }
  if (provider === "openai") {
    return {
      provider,
      model: openai.embedding(process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"),
      providerOptions: undefined,
    };
  }
  if (provider === "google") {
    return {
      provider,
      model: google.embedding(process.env.GOOGLE_EMBEDDING_MODEL || "gemini-embedding-001"),
      providerOptions: {
        google: { outputDimensionality: EMBEDDING_DIMENSIONS },
      },
    };
  }
  return {
    provider,
    model: createOllama({
      baseURL: ollamaBaseURL(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"),
    }).embedding(process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text"),
    providerOptions: {
      ollama: { dimensions: EMBEDDING_DIMENSIONS },
    },
  };
}

function assertDimensions(vectors: number[][]) {
  for (const vector of vectors) {
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding length ${vector.length} does not match the pgvector column (${EMBEDDING_DIMENSIONS}). Choose a ${EMBEDDING_DIMENSIONS}-dimension model.`,
      );
    }
  }
}

async function embedBatch(values: string[]) {
  const selected = embeddingModel();
  if (selected.provider === "google") {
    const { embeddings } = await embedMany({
      model: selected.model,
      values,
      providerOptions: { google: { outputDimensionality: EMBEDDING_DIMENSIONS } },
    });
    return embeddings;
  }
  if (selected.provider === "ollama") {
    const { embeddings } = await embedMany({
      model: selected.model,
      values,
      providerOptions: { ollama: { dimensions: EMBEDDING_DIMENSIONS } },
    });
    return embeddings;
  }
  const { embeddings } = await embedMany({ model: selected.model, values });
  return embeddings;
}

async function embedOne(value: string) {
  const selected = embeddingModel();
  if (selected.provider === "google") {
    const { embedding } = await embed({
      model: selected.model,
      value,
      providerOptions: { google: { outputDimensionality: EMBEDDING_DIMENSIONS } },
    });
    return embedding;
  }
  if (selected.provider === "ollama") {
    const { embedding } = await embed({
      model: selected.model,
      value,
      providerOptions: { ollama: { dimensions: EMBEDDING_DIMENSIONS } },
    });
    return embedding;
  }
  const { embedding } = await embed({ model: selected.model, value });
  return embedding;
}

export async function embedTexts(values: string[]) {
  if (values.length === 0) return [];
  const embeddings = await embedBatch(values);
  assertDimensions(embeddings);
  return embeddings;
}

export async function embedQuery(value: string) {
  const embedding = await embedOne(value);
  assertDimensions([embedding]);
  return embedding;
}

export function embeddingProviderName() {
  return selectedProvider();
}

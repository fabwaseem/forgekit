export const PROVIDERS = ["openai", "anthropic", "google", "xai", "ollama"] as const;

export type ProviderId = (typeof PROVIDERS)[number];

export type ModelOption = {
  id: string;
  provider: ProviderId;
  model: string;
  label: string;
};

type Env = Record<string, string | undefined>;

const CATALOG: Array<Omit<ModelOption, "id"> & { env: string }> = [
  { provider: "openai", model: "gpt-5.4-mini", label: "GPT-5.4 mini", env: "OPENAI_API_KEY" },
  { provider: "openai", model: "gpt-5.4", label: "GPT-5.4", env: "OPENAI_API_KEY" },
  { provider: "anthropic", model: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", env: "ANTHROPIC_API_KEY" },
  { provider: "anthropic", model: "claude-haiku-5-5", label: "Claude Haiku 5.5", env: "ANTHROPIC_API_KEY" },
  { provider: "google", model: "gemini-3.5-flash", label: "Gemini 3.5 Flash", env: "GOOGLE_GENERATIVE_AI_API_KEY" },
  { provider: "google", model: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", env: "GOOGLE_GENERATIVE_AI_API_KEY" },
  { provider: "xai", model: "grok-4.7", label: "Grok 4.7", env: "XAI_API_KEY" },
  { provider: "xai", model: "grok-4.6", label: "Grok 4.6", env: "XAI_API_KEY" },
];

export function ollamaBaseURL(raw: string) {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function listModels(env: Env = process.env): ModelOption[] {
  const configured = CATALOG.filter((model) => Boolean(env[model.env]?.trim())).map(
    (model) => ({
      id: `${model.provider}:${model.model}`,
      provider: model.provider,
      model: model.model,
      label: model.label,
    }),
  );

  const ollamaUrl = env.OLLAMA_BASE_URL?.trim();
  if (!ollamaUrl) return configured;

  const names = (env.OLLAMA_MODELS?.trim() || "llama3.2,qwen2.5,mistral")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const local = names.map((model) => ({
    id: `ollama:${model}`,
    provider: "ollama" as const,
    model,
    label: `Ollama · ${model}`,
  }));

  return [...configured, ...local];
}

export function findModel(modelId: string, env: Env = process.env) {
  return listModels(env).find((model) => model.id === modelId) ?? null;
}

export function configuredProviders(env: Env = process.env): ProviderId[] {
  return [...new Set(listModels(env).map((model) => model.provider))];
}

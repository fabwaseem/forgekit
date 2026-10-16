import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { createOllama } from "ollama-ai-provider-v2";
import { findModel, ollamaBaseURL, type ModelOption } from "./models";

export function languageModelFor(option: ModelOption) {
  switch (option.provider) {
    case "openai":
      return openai(option.model);
    case "anthropic":
      return anthropic(option.model);
    case "google":
      return google(option.model);
    case "xai":
      return xai(option.model);
    case "ollama":
      return createOllama({
        baseURL: ollamaBaseURL(process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"),
      }).chat(option.model);
  }
}

export function resolveLanguageModel(modelId: string) {
  const option = findModel(modelId);
  if (!option) return null;
  return { option, model: languageModelFor(option) };
}

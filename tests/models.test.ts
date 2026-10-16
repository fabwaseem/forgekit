import { describe, expect, it } from "vitest";
import { listModels, ollamaBaseURL } from "../lib/ai/models";

describe("listModels", () => {
  it("hides providers that have no key and shows Ollama when a base URL is set", () => {
    const models = listModels({
      OPENAI_API_KEY: "sk-test",
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      OLLAMA_MODELS: "llama3.2",
    });
    expect(models.map((model) => model.id)).toEqual(["openai:gpt-5.4-mini", "openai:gpt-5.4", "ollama:llama3.2"]);
  });

  it("returns no models when nothing is configured", () => {
    expect(listModels({})).toEqual([]);
  });
});

describe("ollamaBaseURL", () => {
  it("appends the API path once", () => {
    expect(ollamaBaseURL("http://127.0.0.1:11434")).toBe("http://127.0.0.1:11434/api");
    expect(ollamaBaseURL("http://127.0.0.1:11434/api/")).toBe("http://127.0.0.1:11434/api");
  });
});

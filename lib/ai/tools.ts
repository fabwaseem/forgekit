import { tool } from "ai";
import { z } from "zod";
import { evaluateExpression } from "./calculator";
import { formatCitations } from "./citations";
import { searchKnowledge } from "./rag";
import { assertPublicHttpUrl, htmlToText } from "@/lib/security/url";

const weatherCodes: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  61: "Rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Snow",
  80: "Rain showers",
  95: "Thunderstorm",
};

async function fetchJson(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<unknown>;
}

export function createChatTools(userId: string, useKnowledge: boolean) {
  return {
    weather: tool({
      description: "Get the current weather for a city or place using a public forecast.",
      inputSchema: z.object({
        location: z.string().min(1).describe("City or place name"),
      }),
      execute: async ({ location }) => {
        const geo = (await fetchJson(
          `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(location)}`,
        )) as { results?: Array<{ name: string; country?: string; latitude: number; longitude: number }> };
        const place = geo.results?.[0];
        if (!place) return { location, found: false as const };
        const forecast = (await fetchJson(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m`,
        )) as {
          current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number };
        };
        const code = forecast.current?.weather_code ?? -1;
        return {
          found: true as const,
          location: [place.name, place.country].filter(Boolean).join(", "),
          temperatureC: forecast.current?.temperature_2m ?? null,
          windKph: forecast.current?.wind_speed_10m ?? null,
          conditions: weatherCodes[code] ?? "Unknown",
        };
      },
    }),
    webFetch: tool({
      description: "Fetch a public http(s) page and return readable text. Refuses private networks.",
      inputSchema: z.object({
        url: z.string().describe("Absolute http or https URL"),
      }),
      execute: async ({ url }) => {
        const target = await assertPublicHttpUrl(url);
        const response = await fetch(target, {
          redirect: "manual",
          signal: AbortSignal.timeout(12_000),
          headers: { "user-agent": "Forgekit/0.1" },
        });
        if (response.status >= 300 && response.status < 400) {
          return { url: target.toString(), error: "Redirects are not followed" };
        }
        if (!response.ok) return { url: target.toString(), error: `Request failed (${response.status})` };
        const contentType = response.headers.get("content-type") ?? "";
        const raw = (await response.text()).slice(0, 200_000);
        const text = (contentType.includes("html") ? htmlToText(raw) : raw).slice(0, 6_000);
        return { url: target.toString(), contentType, text };
      },
    }),
    calculator: tool({
      description: "Evaluate an arithmetic expression. Supports + - * / parentheses and decimals.",
      inputSchema: z.object({
        expression: z.string().min(1),
      }),
      execute: async ({ expression }) => {
        const value = evaluateExpression(expression);
        return { expression, value };
      },
    }),
    ...(useKnowledge
      ? {
          searchKnowledge: tool({
            description:
              "Search the signed-in user's uploaded documents. Cite matches as [1], [2] using the returned indexes.",
            inputSchema: z.object({
              query: z.string().min(1),
              limit: z.number().int().min(1).max(8).optional(),
            }),
            execute: async ({ query, limit }) => {
              const sources = await searchKnowledge(userId, query, limit ?? 5);
              return { query, sources, context: formatCitations(sources) };
            },
          }),
        }
      : {}),
  };
}

export const SYSTEM_PROMPT = `You are Forgekit, a careful assistant inside a self-hosted workspace.
Use tools when they improve the answer. Use weather for live conditions, calculator for arithmetic, and webFetch for the contents of a specific public URL.
When searchKnowledge returns sources, cite them inline as [1], [2] matching those indexes. Do not invent citations.
Keep answers concise and say when a tool found nothing.`;

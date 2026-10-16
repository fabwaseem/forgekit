import { describe, expect, it } from "vitest";
import { chunkText } from "../lib/ai/chunk";

describe("chunkText", () => {
  it("returns nothing for blank input", () => {
    expect(chunkText("   \n")).toEqual([]);
  });

  it("keeps a short document in one chunk", () => {
    expect(chunkText("Hello forge.")).toEqual(["Hello forge."]);
  });

  it("overlaps long text", () => {
    const text = Array.from({ length: 40 }, (_, index) => `Sentence ${index} is long enough.`).join(" ");
    const chunks = chunkText(text, { size: 180, overlap: 40 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
    expect(chunks[0]?.slice(-20)).not.toBe("");
  });
});

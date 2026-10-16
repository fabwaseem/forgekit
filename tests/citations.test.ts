import { describe, expect, it } from "vitest";
import { excerpt, formatCitations } from "../lib/ai/citations";

describe("citations", () => {
  it("numbers sources and shortens excerpts", () => {
    const text = formatCitations([
      { index: 1, documentName: "handbook.md", excerpt: excerpt("Deploy  beside   postgres."), score: 0.81234 },
    ]);
    expect(text).toContain("[1] handbook.md (0.81)");
    expect(text).toContain("Deploy beside postgres.");
  });
});

export type Citation = {
  index: number;
  documentName: string;
  excerpt: string;
  score: number;
};

export function formatCitations(citations: Citation[]) {
  return citations
    .map(
      (citation) =>
        `[${citation.index}] ${citation.documentName} (${citation.score.toFixed(2)}): ${citation.excerpt}`,
    )
    .join("\n\n");
}

export function excerpt(text: string, max = 280) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

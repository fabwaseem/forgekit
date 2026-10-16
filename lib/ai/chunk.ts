export type ChunkOptions = {
  size?: number;
  overlap?: number;
};

export function chunkText(input: string, options: ChunkOptions = {}) {
  const size = options.size ?? 800;
  const overlap = options.overlap ?? 120;
  if (size <= 0) throw new Error("Chunk size must be positive");
  if (overlap < 0 || overlap >= size) throw new Error("Overlap must be smaller than the chunk size");

  const text = input.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const window = text.slice(start, end);
      const breakAt = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"), window.lastIndexOf(". "));
      if (breakAt > size * 0.5) end = start + breakAt + (window[breakAt] === "." ? 2 : 1);
    }
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

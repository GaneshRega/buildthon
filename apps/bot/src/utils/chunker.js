// Splits text into overlapping word-based chunks for embedding.
// CHUNK_SIZE and OVERLAP are in words (1 word ≈ 1 token for English text).
const CHUNK_SIZE = 150;
const OVERLAP = 30;

if (OVERLAP >= CHUNK_SIZE) {
  throw new Error(`OVERLAP (${OVERLAP}) must be less than CHUNK_SIZE (${CHUNK_SIZE})`);
}

export function chunkText(text) {
  if (!text || typeof text !== 'string') return [];

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks = [];
  let start = 0;
  const step = CHUNK_SIZE - OVERLAP;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    chunks.push(words.slice(start, end).join(' '));
    start += step;
  }

  return chunks;
}

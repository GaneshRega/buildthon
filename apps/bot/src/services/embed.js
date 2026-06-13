import { pipeline } from '@xenova/transformers';

// Singleton embedder — downloaded once (~25 MB) and cached to disk
let embedder;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

// Returns a 384-dimensional float array for a single string
export async function embedText(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('embedText requires a non-empty string');
  }
  const embed = await getEmbedder();
  const output = await embed(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Embeds an array of strings sequentially to avoid OOM on large batches.
// Returns an array of 384-dim vectors in the same order as the input.
export async function embedBatch(texts) {
  if (!texts || texts.length === 0) return [];
  const results = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}

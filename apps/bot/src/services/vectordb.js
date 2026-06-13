import { Pinecone } from '@pinecone-database/pinecone';

let index;

function getIndex() {
  if (!process.env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is not set');
  if (!process.env.PINECONE_INDEX_NAME) throw new Error('PINECONE_INDEX_NAME is not set');
  if (!index) {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    index = pc.index(process.env.PINECONE_INDEX_NAME);
  }
  return index;
}

// Upserts a batch of vectors. Each vector: { id, values: float[], metadata: {} }
export async function upsertVectors(vectors) {
  if (!vectors || vectors.length === 0) return;
  try {
    await getIndex().upsert(vectors);
  } catch (err) {
    throw new Error(`Pinecone upsert failed: ${err.message}`);
  }
}

// Queries top-k nearest vectors with optional metadata filter.
// Returns Pinecone match objects with { id, score, metadata }.
export async function queryVectors({ embedding, topK = 5, filter = {} }) {
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('queryVectors requires a valid embedding array');
  }
  try {
    const result = await getIndex().query({
      vector: embedding,
      topK,
      filter,
      includeMetadata: true,
    });
    return result.matches ?? [];
  } catch (err) {
    throw new Error(`Pinecone query failed: ${err.message}`);
  }
}

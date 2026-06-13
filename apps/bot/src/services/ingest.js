import { v4 as uuidv4 } from 'uuid';
import { chunkText } from '../utils/chunker.js';
import { embedBatch } from './embed.js';
import { upsertVectors } from './vectordb.js';
import { generateTags } from './llm.js';
import { query } from '../db/client.js';
import { getOrCreateUser } from '../db/users.js';

// Ingests a document into the knowledge base:
// 1. Resolves owner UUID from Slack ID
// 2. Generates topic tags via LLM
// 3. Inserts a document record in Postgres
// 4. Chunks + embeds the text
// 5. Upserts vectors to Pinecone (ownerId stored as Slack ID for scope filtering)
// 6. Saves chunk metadata to Postgres
//
// NOTE: ownerId in Pinecone metadata is the Slack user ID (not the Postgres UUID).
// This must match the ownerId filter used in ask.js scope queries.
export async function ingestDocument({ text, name, type, scope, ownerSlackId, workspaceId, teamChannelId }) {
  if (!text?.trim()) throw new Error('Document text is empty — nothing to ingest');
  if (!ownerSlackId) throw new Error('ownerSlackId is required');

  const user = await getOrCreateUser(ownerSlackId, workspaceId || ownerSlackId);
  const ownerDbId = user.id;

  const tags = await generateTags(text);

  const docResult = await query(
    `INSERT INTO documents (name, type, scope, owner_id, team_channel_id, tags)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, type, scope, ownerDbId, teamChannelId || null, tags]
  );
  const documentId = docResult.rows[0].id;

  const chunks = chunkText(text);
  if (chunks.length === 0) throw new Error('Document produced no chunks after parsing');

  const embeddings = await embedBatch(chunks);

  const vectors = chunks.map((chunk, i) => ({
    id: uuidv4(),
    values: embeddings[i],
    metadata: {
      documentId,
      docName: name,
      scope,
      ownerId: ownerSlackId,     // Slack ID — matched by ask.js scope filter
      teamChannelId: teamChannelId || '',
      content: chunk.slice(0, 500),
      chunkIndex: i,
    },
  }));

  await upsertVectors(vectors);

  for (let i = 0; i < chunks.length; i++) {
    await query(
      `INSERT INTO chunks (document_id, pinecone_vector_id, chunk_index, content_preview)
       VALUES ($1, $2, $3, $4)`,
      [documentId, vectors[i].id, i, chunks[i].slice(0, 200)]
    );
  }

  await query(`UPDATE documents SET chunk_count = $1 WHERE id = $2`, [chunks.length, documentId]);

  return { documentId, chunkCount: chunks.length, tags };
}

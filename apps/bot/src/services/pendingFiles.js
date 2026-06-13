import Redis from 'ioredis';

let redis;

function getRedis() {
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

// Files are held for 10 minutes while user picks a scope.
// After that they expire automatically and must be re-uploaded.
const TTL = 10 * 60;

export async function storePendingFile(fileId, userId, data) {
  if (!fileId || !userId) throw new Error('fileId and userId are required');
  await getRedis().setex(`pending:${fileId}:${userId}`, TTL, JSON.stringify(data));
}

export async function getPendingFile(fileId, userId) {
  if (!fileId || !userId) return null;
  try {
    const raw = await getRedis().get(`pending:${fileId}:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function deletePendingFile(fileId, userId) {
  if (!fileId || !userId) return;
  try {
    await getRedis().del(`pending:${fileId}:${userId}`);
  } catch (err) {
    console.error('Failed to delete pending file from Redis:', err.message);
  }
}

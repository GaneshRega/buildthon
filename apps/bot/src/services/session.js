import Redis from 'ioredis';

let redis;

function getRedis() {
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

const TTL = 30 * 60; // 30 minutes — session expires after this idle period
const MAX_TURNS = 4;  // keep last 4 question/answer pairs (8 messages)

// Returns the stored conversation history for a user, or [] if none.
export async function getHistory(slackUserId) {
  if (!slackUserId) return [];
  try {
    const raw = await getRedis().get(`session:${slackUserId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Appends a Q&A turn to the user's history and trims to MAX_TURNS.
export async function appendHistory(slackUserId, userMessage, assistantMessage) {
  if (!slackUserId) return;
  try {
    const history = await getHistory(slackUserId);
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: assistantMessage });
    const trimmed = history.slice(-(MAX_TURNS * 2));
    await getRedis().setex(`session:${slackUserId}`, TTL, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save session history:', err.message);
  }
}

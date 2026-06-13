import { query } from './client.js';

export async function getOrCreateUser(slackUserId, slackWorkspaceId) {
  if (!slackUserId) throw new Error('slackUserId is required');

  // ON CONFLICT handles concurrent inserts for the same user safely
  await query(
    `INSERT INTO users (slack_user_id, slack_workspace_id)
     VALUES ($1, $2)
     ON CONFLICT (slack_user_id) DO NOTHING`,
    [slackUserId, slackWorkspaceId || slackUserId]
  );

  const result = await query(
    'SELECT * FROM users WHERE slack_user_id = $1',
    [slackUserId]
  );
  return result.rows[0];
}

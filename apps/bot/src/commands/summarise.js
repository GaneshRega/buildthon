import { summarise } from '../services/llm.js';
import { query } from '../db/client.js';

const VALID_SUBCOMMANDS = ['summarise'];

export function registerSummariseCommand(app) {
  app.command('/sage', async ({ command, ack, respond, client: slackClient }) => {
    await ack();

    const parts = command.text.trim().split(/\s+/);
    if (parts[0] !== 'summarise') return;

    const isThread = parts[1] === 'thread';
    const docName = parts.slice(1).join(' ').trim();

    let textToSummarise;

    try {
      if (isThread) {
        if (!command.thread_ts) {
          await respond('Please run `/sage summarise thread` inside a thread, not in the main channel.');
          return;
        }
        const replies = await slackClient.conversations.replies({
          channel: command.channel_id,
          ts: command.thread_ts,
        });
        const messages = (replies.messages ?? []).filter((m) => !m.bot_id);
        if (!messages.length) {
          await respond('No user messages found in this thread to summarise.');
          return;
        }
        textToSummarise = messages.map((m) => `[${m.user}]: ${m.text}`).join('\n');
      } else if (docName) {
        const result = await query(
          // Fetch up to 10 chunks of the matching document accessible by this user
          `SELECT c.content_preview FROM chunks c
           JOIN documents d ON c.document_id = d.id
           WHERE d.name ILIKE $1
             AND (d.scope = 'org' OR d.owner_id = (SELECT id FROM users WHERE slack_user_id = $2))
           ORDER BY c.chunk_index
           LIMIT 10`,
          [`%${docName.replace(/[%_]/g, '\\$&')}%`, command.user_id]
        );
        if (!result.rows.length) {
          await respond(`No document found matching *"${docName}"*. Use \`/sage browse\` to see available documents.`);
          return;
        }
        textToSummarise = result.rows.map((r) => r.content_preview).join('\n\n');
      } else {
        await respond('Usage:\n• `/sage summarise thread` — summarise this thread\n• `/sage summarise <doc-name>` — summarise a document');
        return;
      }

      await respond({ text: '_Generating summary..._', response_type: 'ephemeral' });
      const summary = await summarise(textToSummarise);
      await respond(summary);
    } catch (err) {
      console.error('[summarise] error:', err.message);
      const text = err.message.includes('LLM unavailable')
        ? '❌ The AI model is not responding. Is Ollama running?'
        : `❌ Failed to generate summary: ${err.message}`;
      await respond(text);
    }
  });
}

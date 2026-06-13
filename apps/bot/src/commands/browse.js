import { query } from '../db/client.js';

const VALID_SCOPES = new Set(['personal', 'team', 'org']);

export function registerBrowseCommand(app) {
  app.command('/sage', async ({ command, ack, respond }) => {
    await ack();

    const parts = command.text.trim().split(/\s+/);
    const subcommand = parts[0];

    if (subcommand === 'browse') {
      try {
        const result = await query(
          // Return docs the user is allowed to see: org-wide, their own personal, or their team channel
          `SELECT name, type, scope, tags, chunk_count, created_at FROM documents
           WHERE scope = 'org'
              OR (scope = 'personal' AND owner_id = (SELECT id FROM users WHERE slack_user_id = $1))
              OR (scope = 'team' AND team_channel_id = $2)
           ORDER BY created_at DESC`,
          [command.user_id, command.channel_id]
        );

        if (!result.rows.length) {
          await respond('No documents in your knowledge base yet. Use `/sage upload` to add one.');
          return;
        }

        const grouped = {};
        for (const doc of result.rows) {
          const tag = Array.isArray(doc.tags) && doc.tags[0] ? doc.tags[0] : 'untagged';
          if (!grouped[tag]) grouped[tag] = [];
          grouped[tag].push(doc);
        }

        const lines = Object.entries(grouped).map(([tag, docs]) => {
          const docList = docs.map((d) => `  • *${d.name}* (${d.type}, ${d.scope}, ${d.chunk_count} chunks)`).join('\n');
          return `*#${tag}*\n${docList}`;
        });

        await respond(`*Your Knowledge Base*\n\n${lines.join('\n\n')}`);
      } catch (err) {
        console.error('[browse] error:', err.message);
        await respond('❌ Failed to load documents. Please try again.');
      }
    } else if (subcommand === 'list') {
      const scope = parts[1] || 'org';
      if (!VALID_SCOPES.has(scope)) {
        await respond(`❌ Invalid scope *"${scope}"*. Use \`personal\`, \`team\`, or \`org\`.`);
        return;
      }

      try {
        const result = await query(
          `SELECT name, type, chunk_count, created_at FROM documents
           WHERE scope = $1
           ORDER BY created_at DESC`,
          [scope]
        );

        if (!result.rows.length) {
          await respond(`No *${scope}*-scoped documents found.`);
          return;
        }

        const lines = result.rows.map((d) => `• *${d.name}* (${d.type}, ${d.chunk_count} chunks)`);
        await respond(`*${scope.charAt(0).toUpperCase() + scope.slice(1)} Documents*\n\n${lines.join('\n')}`);
      } catch (err) {
        console.error('[list] error:', err.message);
        await respond('❌ Failed to load documents. Please try again.');
      }
    } else if (subcommand === 'help') {
      await respond(`*SlackSage Commands*
• \`@SlackSage <question>\` — Ask a question
• \`/sage ask <question>\` — Ask via slash command
• \`/sage upload\` — Upload a document (PDF, DOCX, TXT)
• \`/sage upload <url>\` — Import a web page
• \`/sage summarise thread\` — Summarise current thread
• \`/sage summarise <doc-name>\` — Summarise a document
• \`/sage browse\` — Browse all accessible documents by tag
• \`/sage list [personal|team|org]\` — List documents by scope
• \`/sage help\` — Show this help`);
    }
  });
}

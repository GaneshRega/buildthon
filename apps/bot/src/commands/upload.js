import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';
import { parseFile, parseURL } from '../utils/parser.js';
import { ingestDocument } from '../services/ingest.js';
import { storePendingFile, getPendingFile, deletePendingFile } from '../services/pendingFiles.js';

const SUPPORTED_FILETYPES = ['pdf', 'docx', 'txt', 'plain_text'];

export function registerUploadCommand(app) {
  // /sage upload — prompt for a file or handle an inline URL
  app.command('/sage', async ({ command, ack, respond }) => {
    await ack();

    const parts = command.text.trim().split(' ');
    if (parts[0] !== 'upload') return;

    const url = parts[1];

    if (url) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        await respond({ response_type: 'ephemeral', text: '❌ Invalid URL — must start with http:// or https://' });
        return;
      }

      await respond({ text: '_Processing URL..._', response_type: 'ephemeral' });
      try {
        const text = await parseURL(url);
        const result = await ingestDocument({
          text,
          name: url,
          type: 'url',
          scope: 'personal',
          ownerSlackId: command.user_id,
          workspaceId: command.team_id,
          teamChannelId: command.channel_id,
        });
        await respond({
          response_type: 'ephemeral',
          blocks: [{
            type: 'section',
            text: { type: 'mrkdwn', text: `✅ *URL ingested!*\n*Source:* ${url}\n*Chunks:* ${result.chunkCount}\n*Tags:* ${result.tags.join(', ') || 'none'}` },
          }],
        });
      } catch (err) {
        console.error('[upload] URL error:', err.message);
        await respond({ response_type: 'ephemeral', text: `❌ ${err.message}` });
      }
      return;
    }

    await respond({
      response_type: 'ephemeral',
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Upload a document to SlackSage* 📎\n\nAttach a *PDF, DOCX, or TXT* file directly in this chat — I'll ask who can access it.\n\n*Or import a URL:* \`/sage upload https://your-url.com\``,
        },
      }],
    });
  });

  // File shared — parse and show scope picker buttons
  app.event('file_shared', async ({ event, client }) => {
    const channel = event.channel_id || event.user_id;
    if (!channel) return;

    let file;
    try {
      const fileInfo = await client.files.info({ file: event.file_id });
      file = fileInfo.file;
    } catch (err) {
      console.error('[upload] files.info error:', err.message);
      return;
    }

    if (!SUPPORTED_FILETYPES.includes(file.filetype)) {
      await client.chat.postMessage({
        channel,
        text: `❌ Unsupported file type *${file.filetype}*. Please upload a PDF, DOCX, or TXT file.`,
      });
      return;
    }

    await client.chat.postMessage({ channel, text: `⏳ Reading *${file.name}*...` });

    const tmpPath = path.join(os.tmpdir(), `${file.id}.${file.filetype}`);
    try {
      const response = await axios.get(file.url_private_download, {
        headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
        responseType: 'arraybuffer',
      });
      fs.writeFileSync(tmpPath, response.data);

      const text = await parseFile(tmpPath);
      if (!text?.trim()) {
        await client.chat.postMessage({ channel, text: '❌ The file appears to be empty or unreadable.' });
        return;
      }

      await storePendingFile(file.id, event.user_id, {
        text,
        fileName: file.name,
        fileType: file.filetype,
      });

      await client.chat.postMessage({
        channel,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `📎 *${file.name}* is ready.\nWho should have access to this document?` },
          },
          {
            type: 'actions',
            block_id: 'scope_picker',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Keep it Personal 🔒' },
                action_id: 'scope_personal',
                value: `${file.id}|${event.user_id}`,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Share with Everyone 🌐' },
                action_id: 'scope_org',
                style: 'primary',
                value: `${file.id}|${event.user_id}`,
              },
            ],
          },
        ],
      });
    } catch (err) {
      console.error('[upload] file processing error:', err.message);
      await client.chat.postMessage({ channel, text: `❌ Failed to process file: ${err.message}` });
    } finally {
      // Always clean up temp file, even if parsing failed
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  });

  async function handleScopeSelection(scope, { ack, body, respond }) {
    await ack();

    const value = body.actions?.[0]?.value ?? '';
    const [fileId, userId] = value.split('|');

    if (!fileId || !userId) {
      await respond({ replace_original: true, text: '❌ Invalid action. Please re-upload the file.' });
      return;
    }

    const pending = await getPendingFile(fileId, userId);
    if (!pending) {
      await respond({ replace_original: true, text: '❌ Upload expired (10 min limit). Please re-upload the file.' });
      return;
    }

    await respond({
      replace_original: true,
      text: `⏳ Ingesting *${pending.fileName}* as *${scope === 'personal' ? 'personal 🔒' : 'org-wide 🌐'}*...`,
    });

    try {
      const result = await ingestDocument({
        text: pending.text,
        name: pending.fileName,
        type: pending.fileType,
        scope,
        ownerSlackId: userId,
        workspaceId: null,
        teamChannelId: null,
      });

      await deletePendingFile(fileId, userId);

      await respond({
        replace_original: true,
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *${pending.fileName}* added to the ${scope === 'personal' ? '*personal* 🔒 (only you)' : '*org* 🌐 (everyone)'} knowledge base!\n*Chunks:* ${result.chunkCount}\n*Tags:* ${result.tags.join(', ') || 'none'}\n\nAsk me anything: _What does this document say about...?_`,
          },
        }],
      });
    } catch (err) {
      console.error('[upload] ingest error:', err.message);
      await respond({ replace_original: true, text: `❌ Failed to ingest: ${err.message}` });
    }
  }

  app.action('scope_personal', (args) => handleScopeSelection('personal', args));
  app.action('scope_org', (args) => handleScopeSelection('org', args));
}

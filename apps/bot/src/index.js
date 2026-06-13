import 'dotenv/config';
import { App } from '@slack/bolt';
import { registerAskCommand } from './commands/ask.js';
import { registerUploadCommand } from './commands/upload.js';
import { registerSummariseCommand } from './commands/summarise.js';
import { registerBrowseCommand } from './commands/browse.js';
import { embedText } from './services/embed.js';

// Fail fast if critical env vars are missing
const required = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

registerAskCommand(app);
registerUploadCommand(app);
registerSummariseCommand(app);
registerBrowseCommand(app);

// Catch unhandled promise rejections so the process doesn't crash silently
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

(async () => {
  try {
    await app.start();
    console.log('SlackSage bot connected to Slack');

    // Pre-warm embedding model so first query doesn't stall
    await embedText('warmup');
    console.log('Embedding model ready. Bot is fully operational.');
  } catch (err) {
    console.error('Failed to start bot:', err);
    process.exit(1);
  }
})();

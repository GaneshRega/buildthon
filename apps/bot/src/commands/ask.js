import { embedText } from '../services/embed.js';
import { queryVectors } from '../services/vectordb.js';
import { askLLM } from '../services/llm.js';
import { getHistory, appendHistory } from '../services/session.js';

const SCOPE_FILTER = (userId, channelId) => ({
  $or: [
    { scope: 'org' },
    { scope: 'personal', ownerId: userId },
    { scope: 'team', teamChannelId: channelId },
  ],
});

// Confidence label based on top Pinecone similarity score
const confidenceLabel = (score) =>
  score >= 0.8 ? 'High' : score >= 0.65 ? 'Medium' : 'Low';

// Builds the answer blocks for a Slack message
function answerBlocks(answer, matches) {
  const confidence = confidenceLabel(matches[0]?.score ?? 0);
  return {
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: answer } },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `*Confidence:* ${confidence} | *Sources:* ${matches.length} chunks` }],
      },
    ],
  };
}

export function registerAskCommand(app) {
  // /sage ask <question>
  app.command('/sage', async ({ command, ack, respond }) => {
    await ack();

    const [subcommand, ...rest] = command.text.trim().split(' ');
    if (subcommand !== 'ask') return;

    const question = rest.join(' ').trim();
    if (!question) {
      await respond('Please provide a question. Usage: `/sage ask <your question>`');
      return;
    }

    try {
      const history = await getHistory(command.user_id);
      const embedding = await embedText(question);
      const matches = await queryVectors({
        embedding,
        topK: 5,
        filter: SCOPE_FILTER(command.user_id, command.channel_id),
      });

      if (!matches.length) {
        await respond("I couldn't find an answer in the available knowledge base. Try uploading a relevant document first.");
        return;
      }

      const answer = await askLLM({ question, contextChunks: matches, history });
      await appendHistory(command.user_id, question, answer);
      await respond(answerBlocks(answer, matches));
    } catch (err) {
      console.error('[ask] error:', err.message);
      await respond(`❌ ${err.message.includes('LLM unavailable') ? 'The AI model is not responding. Is Ollama running?' : 'Something went wrong. Please try again.'}`);
    }
  });

  // Direct messages — only respond in DM channels (channel_type === 'im')
  app.message(async ({ message, client }) => {
    if (message.subtype || message.bot_id) return;
    if (message.channel_type !== 'im') return;

    const question = message.text?.trim();
    if (!question) return;

    let thinking;
    try {
      thinking = await client.chat.postMessage({
        channel: message.channel,
        text: '_Thinking... 🤔_',
      });
    } catch (err) {
      console.error('[dm] failed to post thinking indicator:', err.message);
      return;
    }

    try {
      const history = await getHistory(message.user);
      const embedding = await embedText(question);
      const matches = await queryVectors({
        embedding,
        topK: 5,
        filter: SCOPE_FILTER(message.user, message.channel),
      });

      if (!matches.length) {
        await client.chat.update({
          channel: message.channel,
          ts: thinking.ts,
          text: "I couldn't find an answer in the available knowledge base. Try uploading a relevant document first.",
        });
        return;
      }

      const answer = await askLLM({ question, contextChunks: matches, history });
      await appendHistory(message.user, question, answer);

      await client.chat.update({
        channel: message.channel,
        ts: thinking.ts,
        text: answer,
        ...answerBlocks(answer, matches),
      });
    } catch (err) {
      console.error('[dm] error:', err.message);
      const text = err.message.includes('LLM unavailable')
        ? '❌ The AI model is not responding. Is Ollama running?'
        : '❌ Something went wrong. Please try again.';
      await client.chat.update({ channel: message.channel, ts: thinking.ts, text }).catch(() => {});
    }
  });

  // @SlackSage mention in channels
  app.event('app_mention', async ({ event, client }) => {
    const question = event.text?.replace(/<@[^>]+>/g, '').trim();
    if (!question) {
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: 'Hi! Ask me anything from the knowledge base. e.g. _What is our leave policy?_',
      });
      return;
    }

    let thinking;
    try {
      thinking = await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: '_Thinking... 🤔_',
      });
    } catch (err) {
      console.error('[mention] failed to post thinking indicator:', err.message);
      return;
    }

    try {
      const history = await getHistory(event.user);
      const embedding = await embedText(question);
      const matches = await queryVectors({
        embedding,
        topK: 5,
        filter: SCOPE_FILTER(event.user, event.channel),
      });

      if (!matches.length) {
        await client.chat.update({
          channel: event.channel,
          ts: thinking.ts,
          text: "I couldn't find an answer in the available knowledge base.",
        });
        return;
      }

      const answer = await askLLM({ question, contextChunks: matches, history });
      await appendHistory(event.user, question, answer);

      await client.chat.update({
        channel: event.channel,
        ts: thinking.ts,
        text: answer,
        ...answerBlocks(answer, matches),
      });
    } catch (err) {
      console.error('[mention] error:', err.message);
      const text = err.message.includes('LLM unavailable')
        ? '❌ The AI model is not responding. Is Ollama running?'
        : '❌ Something went wrong. Please try again.';
      await client.chat.update({ channel: event.channel, ts: thinking.ts, text }).catch(() => {});
    }
  });
}

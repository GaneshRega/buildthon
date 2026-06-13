import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

const SYSTEM_PROMPT = `You are SlackSage, a helpful knowledge assistant for a company Slack workspace.
You have access to the conversation history and relevant knowledge base content for each question.
Rules:
- Answer directly and naturally — do NOT mention "chunks", "context", or internal retrieval details
- Use conversation history to understand follow-up questions (e.g. "what about that?" or "how do I apply?")
- Cite sources inline like this: [Source: filename.pdf]
- If the answer is not in the knowledge base, say: "I couldn't find this in the available knowledge base."
- Never use general knowledge outside what is provided. Never fabricate.
- Be concise and conversational — bullet points are fine for lists.`;

// Sends a question + retrieved context chunks + conversation history to Ollama.
// history is an array of {role, content} pairs — last 4 turns from Redis session.
export async function askLLM({ question, contextChunks, history = [] }) {
  const contextText = contextChunks
    .map((c) => {
      const source = c.metadata?.docName ?? 'unknown';
      const content = c.metadata?.content ?? '';
      return `Source: ${source}\n${content}`;
    })
    .join('\n\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: `Knowledge base content:\n${contextText}\n\nQuestion: ${question}` },
  ];

  try {
    // stream: false ensures we wait for the complete response
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: MODEL,
      messages,
      stream: false,
    });
    return response.data?.message?.content ?? 'No response from LLM.';
  } catch (err) {
    const reason = err.code === 'ECONNREFUSED' ? 'Ollama is not running' : err.message;
    throw new Error(`LLM unavailable: ${reason}`);
  }
}

// Generates 3–5 lowercase hyphenated topic tags for a document excerpt.
// Uses /api/generate (completion) instead of /api/chat for a simpler one-shot prompt.
export async function generateTags(excerpt) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: `Generate 3-5 short topic tags (lowercase, hyphenated) for this document excerpt. Return ONLY a JSON array of strings, nothing else. Example: ["hr-policy", "leave", "onboarding"]\n\nExcerpt:\n${excerpt.slice(0, 800)}`,
      stream: false,
    });
    const text = response.data?.response ?? '';
    const match = text.match(/\[.*?\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

// Summarises arbitrary text into 3–5 bullet points.
export async function summarise(text) {
  if (!text?.trim()) throw new Error('No text provided to summarise');
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: `Summarise the following content in 3–5 bullet points with key takeaways. Be concise.\n\n${text.slice(0, 4000)}`,
      stream: false,
    });
    return response.data?.response ?? 'Could not generate summary.';
  } catch (err) {
    const reason = err.code === 'ECONNREFUSED' ? 'Ollama is not running' : err.message;
    throw new Error(`LLM unavailable: ${reason}`);
  }
}

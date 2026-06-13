# SlackSage Bot

AI-powered knowledge base bot for Slack. Upload PDFs, docs, and URLs — then ask questions in plain English.

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- [Ollama](https://ollama.com) installed and running
- A Slack app with Socket Mode enabled
- A [Pinecone](https://pinecone.io) account (free tier works)

---

## Setup

### 1. Clone and install

```bash
cd apps/bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to get it |
|---|---|
| `SLACK_BOT_TOKEN` | Slack app → OAuth & Permissions → Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Slack app → Basic Information → Signing Secret |
| `SLACK_APP_TOKEN` | Slack app → Basic Information → App-Level Tokens → create with `connections:write` scope (`xapp-1-...`) |
| `PINECONE_API_KEY` | Pinecone console → API Keys |
| `PINECONE_INDEX_NAME` | Set to `slacksage` |
| `DATABASE_URL` | `postgresql://slacksage:slacksage@localhost:5432/slacksage` (default) |
| `REDIS_URL` | `redis://localhost:6379` (default) |
| `OLLAMA_URL` | `http://localhost:11434` (default) |
| `OLLAMA_MODEL` | `llama3` |

### 3. Start Postgres and Redis

```bash
# From the project root
docker-compose up -d
```

### 4. Pull and start Ollama

```bash
ollama pull llama3
ollama serve
```

### 5. Create the Pinecone index

Run once — creates the `slacksage` index with 384 dimensions (required for `all-MiniLM-L6-v2`):

```bash
node --env-file .env -e "
import { Pinecone } from '@pinecone-database/pinecone';
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
await pc.createIndex({
  name: 'slacksage',
  dimension: 384,
  metric: 'cosine',
  spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
});
console.log('Index created');
"
```

### 6. Configure your Slack app

In [api.slack.com/apps](https://api.slack.com/apps):

**Slash Commands** → Create New Command:
- Command: `/sage`
- Description: `Query the SlackSage knowledge base`
- Usage hint: `ask <question> | upload | browse | help`

**OAuth Scopes** (Bot Token):
- `chat:write`, `commands`, `files:read`, `channels:history`, `groups:history`, `im:history`, `mpim:history`

**Event Subscriptions** → Subscribe to bot events:
- `app_mention`, `file_shared`, `message.im`

**Socket Mode**: Enable it, then generate an App-Level Token with `connections:write`.

Reinstall the app to your workspace after making changes.

### 7. Start the bot

```bash
npm run dev       # development (auto-restarts on file changes)
npm start         # production
```

---

## Usage

| Action | How |
|---|---|
| Ask a question | Type in DM, or `/sage ask <question>`, or `@SlackSage <question>` |
| Upload a file | Attach PDF/DOCX/TXT in DM → choose personal 🔒 or org 🌐 |
| Import a URL | `/sage upload https://example.com` |
| Summarise a thread | `/sage summarise thread` (run inside a thread) |
| Summarise a doc | `/sage summarise <doc-name>` |
| Browse knowledge base | `/sage browse` |
| List by scope | `/sage list [personal\|team\|org]` |
| Help | `/sage help` |

---

## Architecture

```
Slack Workspace
      │ Socket Mode (WebSocket)
      ▼
Node.js + Slack Bolt
      │
      ├── /sage ask → embed query → Pinecone search → Ollama → reply
      ├── file_shared → parse → Redis (pending) → scope buttons → ingest
      └── /sage summarise → fetch chunks → Ollama → reply

Pinecone      ← vector embeddings (all-MiniLM-L6-v2, 384 dim)
PostgreSQL    ← document & chunk metadata, users
Redis         ← conversation history (30 min TTL), pending uploads (10 min TTL)
Ollama/llama3 ← LLM for Q&A, summarisation, auto-tagging
```

---

## Knowledge Scopes

| Scope | Who can see it |
|---|---|
| `personal 🔒` | Only the uploader |
| `team` | Members of the channel where it was uploaded |
| `org 🌐` | Everyone in the workspace |

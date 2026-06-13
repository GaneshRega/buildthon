# SlackSage

> AI-powered knowledge base for Slack — built for Buildthon 2025

SlackSage is a Slack bot that turns your company documents into a searchable, conversational knowledge layer. Upload PDFs, Docs, and URLs, then ask questions in plain English — directly in Slack.

---

## Features

- **Conversational Q&A** — Ask questions in any Slack DM or channel and get grounded, cited answers
- **Document upload** — PDF, DOCX, TXT, and URLs supported
- **Scope control** — Personal 🔒 (only you) or Org 🌐 (everyone)
- **Multi-turn memory** — Bot remembers your last 4 questions per session (Redis)
- **Auto-tagging** — Documents are automatically tagged on upload
- **Summarisation** — Summarise any document or Slack thread with one command
- **100% local AI** — Uses Ollama (llama3) + all-MiniLM-L6-v2 embeddings, no OpenAI/Anthropic needed

---

## Stack

| Layer | Technology |
|---|---|
| Slack Bot | Node.js + Slack Bolt SDK (Socket Mode) |
| LLM | Ollama + llama3 (local) |
| Embeddings | `@xenova/transformers` + all-MiniLM-L6-v2 (local, 384-dim) |
| Vector DB | Pinecone (free tier) |
| Database | PostgreSQL |
| Cache / Sessions | Redis |
| Admin Dashboard | React + Vite + TailwindCSS |

---

## Project Structure

```
slacksage/
├── apps/
│   ├── bot/               # Slack Bolt Node.js bot
│   │   ├── src/
│   │   │   ├── commands/  # ask, upload, summarise, browse
│   │   │   ├── services/  # embed, llm, ingest, session, vectordb
│   │   │   ├── db/        # Postgres client + schema
│   │   │   └── utils/     # chunker, parser
│   │   ├── .env.example
│   │   └── README.md      # Full bot setup guide
│   └── dashboard/         # React admin UI
├── docker-compose.yml     # Local Postgres + Redis
└── SlackSage_PRD.md       # Product Requirements Document
```

---

## Quick Start

See [`apps/bot/README.md`](apps/bot/README.md) for the full setup guide.

```bash
# 1. Start Postgres + Redis
docker-compose up -d

# 2. Start Ollama
ollama pull llama3 && ollama serve

# 3. Install and run the bot
cd apps/bot
cp .env.example .env   # fill in your Slack + Pinecone keys
npm install
npm run dev
```

---

## Slack Commands

| Command | Description |
|---|---|
| Type in DM | Ask any question from the knowledge base |
| `/sage ask <question>` | Ask via slash command |
| `/sage upload` | Upload a document |
| `/sage upload <url>` | Import a web page |
| `/sage summarise thread` | Summarise the current thread |
| `/sage summarise <doc>` | Summarise a document |
| `/sage browse` | Browse all documents by tag |
| `/sage list [personal\|team\|org]` | List documents by scope |
| `/sage help` | Show all commands |

---

*Built for Buildthon 2025 · Node.js + React + Ollama + Pinecone*

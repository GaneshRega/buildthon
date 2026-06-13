# SlackSage — Product Requirements Document
> AI-powered Knowledge Base for Slack | Buildthon 2025 Submission

---

## 1. Project Overview

**Product Name:** SlackSage  
**Tagline:** Your company's knowledge — searchable, summarisable, and always at hand.  
**Stack:** Node.js (backend) + React (admin dashboard) + Slack Bolt SDK  
**Problem Statement:** PS #2 — Intelligent Slack Knowledge Base

SlackSage is a Slack-native bot that turns scattered organisational knowledge (PDFs, Docs, URLs, Slack threads) into a unified, conversational knowledge layer — answering employee questions in real-time, grounded strictly in uploaded documents.

---

## 2. Goals & Non-Goals

### Goals
- Build a working Slack bot that answers natural language questions from a knowledge base
- Support document upload (PDF, DOCX, URL, plain text, Slack threads)
- Deliver cited, grounded answers — never hallucinate
- Support personal, team, and org-wide knowledge scopes with access control
- Show multi-turn conversation with follow-up context
- Auto-tag and organise uploaded content

### Non-Goals
- Native mobile app (Slack handles the UI)
- Replacing Google Drive or Notion entirely
- Real-time document co-editing
- Billing or subscription management

---

## 3. User Personas

| Persona | Need |
|---|---|
| **New Joiner (Priya)** | Ramp up quickly without pinging every colleague |
| **Team Lead (Arjun)** | Surface team SOPs, decisions, and references instantly |
| **HR Admin (Kavya)** | Upload company policies once; answer questions forever |
| **Engineer (Dev)** | Query architecture docs and runbooks mid-sprint |

---

## 4. Core Features & Requirements

### 4.1 Document Upload & Ingestion
- **Slack triggers:** `/sage upload`, file attachment in DM, or `@SlackSage` with a URL
- **Supported formats:** PDF, DOCX, TXT, URL (web scraping), Slack thread permalink
- **Processing pipeline:**
  1. Parse and chunk document into segments (~500 tokens with overlap)
  2. Generate embeddings via OpenAI `text-embedding-3-small` or equivalent
  3. Store vectors in **Pinecone** (or Supabase pgvector as fallback)
  4. Store metadata (filename, uploader, scope, tags, timestamp) in **PostgreSQL**
- **Auto-tagging:** Use Claude/GPT to generate 3–5 topic tags per document on ingest
- **Scope assignment:** Uploader selects `personal | team | org` at upload time
- **Confirmation:** Bot replies with summary card showing document name, tag, scope, and chunk count

### 4.2 Natural Language Q&A
- **Slack triggers:** `@SlackSage <question>` or `/sage ask <question>`
- **RAG pipeline:**
  1. Embed the user's query
  2. Retrieve top-k (k=5) relevant chunks from vector DB filtered by user's accessible scopes
  3. Compose prompt with retrieved chunks as context
  4. Call LLM (Claude Sonnet via Anthropic API) with strict grounding instruction
- **Response format:**
  - Direct answer in plain text
  - **Citations:** Filename + page/section reference for every claim
  - Confidence indicator: `High / Medium / Low` based on similarity score
- **Fallback:** If no relevant chunk found, bot replies: _"I couldn't find an answer in the available knowledge base. Try uploading a relevant document first."_ — never fabricates.

### 4.3 Document Summarisation
- **Trigger:** `/sage summarise` (reply to a Slack message with attachment) or `/sage summarise <doc-name>`
- **Output:** 3–5 bullet summary with key takeaways
- **Thread summary:** `/sage summarise thread` in any channel summarises the current thread

### 4.4 Multi-turn Conversation
- **Mechanism:** Store conversation history per user session (Redis TTL: 30 min)
- **Context window:** Pass last 4 turns + retrieved context to LLM
- **Follow-up example:**
  ```
  User: What is our leave policy?
  Bot: [answer with citation]
  User: How do I apply for it?
  Bot: [follow-up answer, still grounded in same policy doc]
  ```

### 4.5 Scoped Knowledge Layers

| Scope | Visibility | Who Can Upload |
|---|---|---|
| `personal` | Only the uploader | Any user |
| `team` | All members of the Slack workspace channel | Channel members |
| `org` | All authenticated workspace users | Admins only |

- Scope is enforced at query time by filtering vector DB with `scope + user_id/team_id` metadata
- Admins manage org-level uploads via React dashboard

### 4.6 Auto-tagging & Organisation
- On ingest, LLM generates semantic tags (e.g. `#hr-policy`, `#engineering`, `#onboarding`)
- `/sage browse` lists all documents accessible to the user, grouped by tag
- `/sage list team` shows team-scoped documents

---

## 5. Architecture

```
┌─────────────────────────────────────────────────┐
│                  Slack Workspace                │
│  User → @SlackSage or /sage command             │
└───────────────────┬─────────────────────────────┘
                    │ HTTP Event (Slack Bolt)
                    ▼
┌─────────────────────────────────────────────────┐
│          Node.js Backend (Express + Bolt)       │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │  Ingest    │  │  Q&A       │  │  Auth &   │  │
│  │  Service   │  │  Service   │  │  Scope    │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘  │
│        │               │               │         │
└────────┼───────────────┼───────────────┼─────────┘
         │               │               │
    ┌────▼────┐    ┌──────▼──────┐  ┌────▼─────┐
    │Chunker  │    │Vector Search│  │PostgreSQL│
    │Embedder │    │(Pinecone /  │  │(metadata,│
    │         │    │pgvector)    │  │users,    │
    └────┬────┘    └──────┬──────┘  │scopes)   │
         │                │         └──────────┘
         └────────┬───────┘
                  │
           ┌──────▼──────┐
           │  LLM API    │
           │ (Anthropic  │
           │  Claude)    │
           └─────────────┘

┌─────────────────────────────────────────────────┐
│         React Admin Dashboard                   │
│  - Upload org-level docs                        │
│  - View all knowledge base entries              │
│  - Manage users and scopes                      │
│  - Usage analytics                              │
└─────────────────────────────────────────────────┘
```

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Slack Bot Framework | `@slack/bolt` (Node.js) |
| Backend API | Node.js + Express |
| LLM | Anthropic Claude Sonnet (`claude-sonnet-4-6`) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector DB | Pinecone (free tier) or Supabase pgvector |
| Relational DB | PostgreSQL (via Supabase or Railway) |
| Session Cache | Redis (Upstash free tier) |
| Document Parsing | `pdf-parse`, `mammoth` (DOCX), `cheerio` (URLs) |
| Admin Dashboard | React + Vite + TailwindCSS |
| Auth | Slack OAuth (workspace install flow) |
| Hosting | Railway / Render (backend), Vercel (dashboard) |

---

## 7. Development Phases

### Phase 1 — Core Bot MVP (Day 1, Hours 1–6)
- [ ] Set up Slack app with Bolt SDK
- [ ] Implement `/sage ask` command with hardcoded dummy context (smoke test)
- [ ] Set up PostgreSQL schema (users, documents, chunks)
- [ ] Implement PDF + TXT ingestion → chunking → embedding → Pinecone upsert
- [ ] Wire up basic RAG: embed query → fetch top-5 chunks → call Claude → respond in Slack

**Milestone:** Bot answers a question from an uploaded PDF ✅

### Phase 2 — Full Ingestion & Scopes (Day 1, Hours 6–10)
- [ ] Add DOCX parsing via `mammoth`
- [ ] Add URL ingestion via `cheerio` + `axios`
- [ ] Add Slack thread ingestion (fetch thread messages via `conversations.replies`)
- [ ] Implement scope metadata on all chunks (personal / team / org)
- [ ] Enforce scope filtering in vector search queries
- [ ] Implement `/sage upload` slash command with scope selector modal

**Milestone:** Upload from 3 content types, scoped retrieval working ✅

### Phase 3 — Conversation, Summarisation & Tags (Day 1–2, Hours 10–16)
- [ ] Add Redis session store for multi-turn conversation history
- [ ] Pass last 4 turns as context to Claude on each query
- [ ] Implement `/sage summarise` for documents and threads
- [ ] Implement auto-tagging on ingest (Claude generates tags)
- [ ] Implement `/sage browse` and `/sage list` commands

**Milestone:** Full multi-turn Q&A + summarisation working ✅

### Phase 4 — Admin Dashboard & Polish (Day 2, Hours 16–22)
- [ ] Build React admin dashboard (document list, upload, user management)
- [ ] Add confidence score display in bot responses (`High / Medium / Low`)
- [ ] Add "cannot answer" fallback with graceful messaging
- [ ] Error handling, loading states, rate limiting
- [ ] Seed 50+ documents for demo load testing

**Milestone:** Polished demo-ready build ✅

### Phase 5 — Demo Prep (Final 2 Hours)
- [ ] Prepare 5 demo scenarios (new joiner questions, policy lookup, tech docs, thread summary, follow-up Q&A)
- [ ] Record backup demo video in case of live issues
- [ ] Finalise README with setup instructions
- [ ] Prepare slide deck (problem → solution → demo → architecture → metrics)

---

## 8. Database Schema

```sql
-- Users (synced from Slack OAuth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  slack_user_id TEXT UNIQUE NOT NULL,
  slack_workspace_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'member' | 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pdf' | 'docx' | 'url' | 'text' | 'slack_thread'
  scope TEXT NOT NULL, -- 'personal' | 'team' | 'org'
  owner_id UUID REFERENCES users(id),
  team_channel_id TEXT, -- for team-scoped docs
  tags TEXT[], -- auto-generated tags
  chunk_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks (stored in Postgres for metadata; vectors in Pinecone)
CREATE TABLE chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  pinecone_vector_id TEXT UNIQUE NOT NULL,
  chunk_index INT NOT NULL,
  content_preview TEXT, -- first 200 chars for debug
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  slack_user_id TEXT NOT NULL,
  history JSONB DEFAULT '[]', -- array of {role, content}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Slack Command Reference

| Command | Description |
|---|---|
| `@SlackSage <question>` | Ask a question from the knowledge base |
| `/sage ask <question>` | Same as above via slash command |
| `/sage upload` | Upload a document (opens modal) |
| `/sage summarise` | Summarise the current thread |
| `/sage summarise <doc-name>` | Summarise a specific document |
| `/sage browse` | Browse all accessible documents by tag |
| `/sage list [personal|team|org]` | List documents by scope |
| `/sage help` | Show all available commands |

---

## 10. Prompt Design

### Q&A System Prompt
```
You are SlackSage, an intelligent knowledge assistant.
Answer the user's question ONLY using the provided context chunks.
Rules:
- Cite every fact with [Source: <document_name>, Section: <chunk_preview>]
- If the answer is not in the context, say exactly: "I couldn't find this in the available knowledge base."
- Never use general knowledge. Never fabricate information.
- Be concise — 3–5 sentences max unless detail is requested.
- If confidence is low (similarity < 0.75), add a note: "Low confidence — please verify."
```

### Auto-tagging Prompt
```
Given the following document excerpt, generate 3–5 short topic tags (lowercase, hyphenated).
Return ONLY a JSON array of strings. Example: ["hr-policy", "leave", "onboarding"]
```

---

## 11. Success Metrics (Demo Targets)

| Metric | Target |
|---|---|
| Answer accuracy (grounded) | ≥ 80% relevant answers on test set |
| Response time | < 5 seconds for Q&A |
| Supported content types | PDF, DOCX, URL, Slack thread, plain text |
| Concurrent documents | ≥ 50 in knowledge base during demo |
| Scopes demonstrated | personal + team + org all working |
| Multi-turn turns | ≥ 3 follow-up turns without losing context |

---

## 12. Evaluation Criteria Mapping

| Judging Criteria | Weight | Our Approach |
|---|---|---|
| Answer quality, accuracy, groundedness | 30% | Claude with strict grounding prompt + citation |
| Slack integration depth & UX fluency | 25% | Rich Block Kit messages, modals, slash commands |
| Knowledge scope & access control | 20% | 3-tier scope with metadata-filtered vector search |
| Multi-content types & multi-turn Q&A | 15% | 5 content types + Redis session history |
| Scalability & production-readiness | 10% | Pinecone + PostgreSQL + stateless Node.js |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Slack OAuth setup takes long | Pre-configure app manifest; test with Socket Mode locally |
| Pinecone free tier limits | Use Supabase pgvector as fallback (already in stack) |
| LLM response too slow for Slack's 3s ack window | Use `ack()` immediately; stream response as follow-up message |
| DOCX parsing edge cases | Fallback to plain text extraction with `textract` |
| Hallucination risk | Strict system prompt + "not found" fallback enforced |

---

## 14. Folder Structure

```
slacksage/
├── apps/
│   ├── bot/                  # Slack Bolt Node.js app
│   │   ├── src/
│   │   │   ├── commands/     # /sage ask, upload, summarise, browse
│   │   │   ├── services/     # ingest, embed, search, llm, session
│   │   │   ├── db/           # Postgres client + queries
│   │   │   ├── utils/        # chunker, parser, tagger
│   │   │   └── index.js      # Entry point
│   │   ├── .env.example
│   │   └── package.json
│   └── dashboard/            # React admin UI
│       ├── src/
│       │   ├── pages/        # Documents, Users, Analytics
│       │   └── components/
│       └── package.json
├── docker-compose.yml        # Postgres + Redis local dev
├── README.md
└── SUBMISSION.md
```

---

## 15. Environment Variables

```env
# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_APP_TOKEN=xapp-... (for Socket Mode)

# LLM
ANTHROPIC_API_KEY=...

# Embeddings
OPENAI_API_KEY=...

# Vector DB
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=slacksage

# Database
DATABASE_URL=postgresql://...

# Cache
REDIS_URL=redis://...

# App
PORT=3000
NODE_ENV=development
```

---

## 16. README Checklist (Submission Requirement)

- [ ] Prerequisites (Node 20+, Postgres, Redis, Pinecone account)
- [ ] Step-by-step local setup with `docker-compose up`
- [ ] Slack app manifest JSON for one-click setup
- [ ] `.env.example` with all required keys documented
- [ ] How to seed test documents
- [ ] Demo script: 5 scenarios to showcase all features

---

*Built for AI Hackathon 2025 | Team: SlackSage | Stack: Node.js + React + Claude + Pinecone*

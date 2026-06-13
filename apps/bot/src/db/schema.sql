CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_user_id TEXT UNIQUE NOT NULL,
  slack_workspace_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  team_channel_id TEXT,
  tags TEXT[],
  chunk_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  pinecone_vector_id TEXT UNIQUE NOT NULL,
  chunk_index INT NOT NULL,
  content_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_user_id TEXT NOT NULL,
  history JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

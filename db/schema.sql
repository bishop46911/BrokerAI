CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'indexed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  clause TEXT NOT NULL,
  page INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS claim_sessions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  case_context TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claim_answers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES claim_sessions(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS brokers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS risk_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  weight INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  metric TEXT,
  operator TEXT,
  threshold NUMERIC,
  evidence_template TEXT,
  source_proposal_id TEXT,
  config JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS risk_cases (
  id TEXT PRIMARY KEY,
  broker_id TEXT NOT NULL REFERENCES brokers(id),
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  evidence JSONB NOT NULL,
  reviewer_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS governance_proposals (
  id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  payload JSONB NOT NULL,
  provenance JSONB NOT NULL,
  evidence JSONB NOT NULL,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  reviewed_by TEXT,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  reviewed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ
);

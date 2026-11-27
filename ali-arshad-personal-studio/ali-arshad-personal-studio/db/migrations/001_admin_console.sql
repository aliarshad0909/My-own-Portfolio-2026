-- Ali Arshad Personal Studio — Private Admin Console Schema (Neon PostgreSQL)
-- Run via `npm run admin:migrate` using DIRECT_DATABASE_URL (or DATABASE_URL).
-- Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS admin_contact_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT NOT NULL DEFAULT '',
  timeline TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  delivery_channel TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_contact_inquiries_received_at
  ON admin_contact_inquiries (received_at DESC);

CREATE TABLE IF NOT EXISTS admin_studio_applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  location_timezone TEXT NOT NULL,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio_url TEXT NOT NULL,
  availability TEXT NOT NULL,
  introduction TEXT NOT NULL,
  public_listing_opt_in BOOLEAN NOT NULL DEFAULT false,
  approximate_region TEXT NOT NULL DEFAULT '',
  moderation_status TEXT NOT NULL DEFAULT 'private_pending',
  notes TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_studio_applications_received_at
  ON admin_studio_applications (received_at DESC);

CREATE TABLE IF NOT EXISTS admin_workflow_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'project',
  status TEXT NOT NULL DEFAULT 'backlog',
  linked_slug TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_gmail_tokens (
  id TEXT PRIMARY KEY,
  account_email TEXT NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL DEFAULT '',
  expires_at BIGINT NOT NULL DEFAULT 0,
  scope TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_preferences (
  id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL DEFAULT 'Asia/Karachi',
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  default_listmonk_timezone TEXT NOT NULL DEFAULT 'America/New_York',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON admin_audit_log (created_at DESC);

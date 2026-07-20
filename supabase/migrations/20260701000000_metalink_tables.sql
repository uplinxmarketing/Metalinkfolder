-- Metalink tables migration
-- Run this in your own Supabase project's SQL editor (Project → SQL Editor).

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS metalink_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  business_name TEXT,
  industry TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  overview TEXT,
  chat_summary TEXT,
  selected_angles JSONB DEFAULT '[]'::jsonb,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metalink_onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES metalink_clients(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metalink_onboarding_responses_client ON metalink_onboarding_responses(client_id);

CREATE TABLE IF NOT EXISTS metalink_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES metalink_clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metalink_chat_messages_client ON metalink_chat_messages(client_id);

CREATE TABLE IF NOT EXISTS metalink_generated_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES metalink_clients(id) ON DELETE CASCADE,
  angle TEXT,
  primary_text TEXT,
  headline TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metalink_generated_ads_client ON metalink_generated_ads(client_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Same permissive pattern as graphics_* tables: this is an internal,
-- password-gated agency tool (not multi-tenant), and the public onboarding
-- link needs unauthenticated insert access to submit answers.

ALTER TABLE metalink_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE metalink_onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE metalink_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE metalink_generated_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metalink_clients_all" ON metalink_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "metalink_onboarding_responses_all" ON metalink_onboarding_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "metalink_chat_messages_all" ON metalink_chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "metalink_generated_ads_all" ON metalink_generated_ads FOR ALL USING (true) WITH CHECK (true);

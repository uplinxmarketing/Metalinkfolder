-- Metalink: past ad performance tracking + creative brief on generated ads
-- Run this in your own Supabase project's SQL editor (Project → SQL Editor), after the first migration.

ALTER TABLE metalink_generated_ads ADD COLUMN IF NOT EXISTS creative_brief TEXT;

CREATE TABLE IF NOT EXISTS metalink_ad_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES metalink_clients(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  angle_or_hook TEXT,
  result TEXT NOT NULL DEFAULT 'mixed' CHECK (result IN ('won', 'lost', 'mixed')),
  metric_type TEXT,
  metric_value TEXT,
  lesson TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metalink_ad_performance_client ON metalink_ad_performance(client_id);

ALTER TABLE metalink_ad_performance ENABLE ROW LEVEL SECURITY;

-- Same permissive pattern as the other metalink_* tables (see
-- 20260701000000_metalink_tables.sql): internal, password-gated agency
-- tool, not multi-tenant. Real per-admin RLS would require a proper auth
-- system rather than a shared password — flagged as a follow-up.
CREATE POLICY "metalink_ad_performance_all" ON metalink_ad_performance FOR ALL USING (true) WITH CHECK (true);

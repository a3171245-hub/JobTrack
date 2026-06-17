-- ============================================================
-- Migration 015: Apply all pending columns not yet in production
-- Idempotent — safe to run multiple times (uses IF NOT EXISTS)
--
-- Run in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/jsbbmjsyowhbpjppnqxt/editor
-- ============================================================

-- ── From 004_add_gd.sql: GD stage ────────────────────────────────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS gd_date TIMESTAMPTZ;

-- Update status constraint to include 'gd'
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
    CHECK (status IN (
      'applied', 'document', 'test', 'gd',
      'interview_1', 'interview_2', 'final',
      'offer', 'rejected', 'event'
    ));

-- ── From 006_memo_and_rls.sql: user memo ─────────────────────────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS memo TEXT;

-- ── From 013_active_and_updated_by.sql: active flag + audit ──────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT 'ai'
  CHECK (updated_by IN ('ai', 'manual'));

CREATE INDEX IF NOT EXISTS applications_user_active_idx
  ON public.applications (user_id, is_active);

-- ── From 014_sender_domain.sql: sender tracking ───────────────────────
ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS sender TEXT;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS sender_domain TEXT;

CREATE INDEX IF NOT EXISTS email_logs_user_sender_idx
  ON public.email_logs (user_id, sender);

CREATE INDEX IF NOT EXISTS applications_user_sender_domain_idx
  ON public.applications (user_id, sender_domain);

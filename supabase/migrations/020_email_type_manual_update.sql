-- Migration 020: Ensure email_logs.email_type allows 'manual_update'
--
-- Discovered while debugging the sender_domain auto-linking bug: inserting
-- email_type='manual_update' (used by the "今日の更新" status-change log)
-- fails in production with a check constraint violation. Migration
-- 001_add_test_fields.sql defines this constraint with 'manual_update'
-- included, but production apparently never had that exact constraint
-- applied — this re-applies it idempotently.
ALTER TABLE public.email_logs
  DROP CONSTRAINT IF EXISTS email_logs_email_type_check;

ALTER TABLE public.email_logs
  ADD CONSTRAINT email_logs_email_type_check
    CHECK (email_type IN ('selection', 'event', 'other', 'manual_update'));

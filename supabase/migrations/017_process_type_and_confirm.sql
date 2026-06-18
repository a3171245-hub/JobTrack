-- ============================================================
-- Migration 017: Multi-process tracking + schedule confirmation
--
-- ① interview_date_confirmed: tracks whether the user has explicitly
--    picked a date among multiple AI-extracted candidates. Defaults to
--    TRUE so existing rows (single/no candidate) don't trigger the
--    "未確定" dashboard notice retroactively.
-- ② process_type: distinguishes multiple selection processes at the
--    same company (e.g. internship vs new-grad fulltime), so a single
--    sender_domain can map to more than one applications row.
-- ============================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS interview_date_confirmed BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS process_type TEXT;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_process_type_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_process_type_check
    CHECK (process_type IS NULL OR process_type IN ('internship', 'fulltime', 'other'));

-- Multiple rows can now share a sender_domain (one per process_type),
-- so the old implicit one-to-one assumption no longer holds; no unique
-- constraint is added here on purpose.
CREATE INDEX IF NOT EXISTS applications_user_domain_process_idx
  ON public.applications (user_id, sender_domain, process_type);

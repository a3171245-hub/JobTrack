-- Migration 021: Indexes for the page-load queries on dashboard / mail / calendar
--
-- Existing indexes (013/014/017) cover (user_id, is_active) and
-- (user_id, sender_domain[, process_type]) for the auto-linking lookups.
-- They don't help the queries below, which filter by user_id and then
-- sort/range-filter on a different column:
--   - dashboard & calendar: applications WHERE user_id = ? ORDER BY updated_at DESC
--   - dashboard "today" widgets & mail list: email_logs WHERE user_id = ?
--     [AND email_type = ?] AND received_at >= ? ORDER BY received_at DESC
--   - company detail page: email_logs WHERE application_id = ? AND user_id = ?

CREATE INDEX IF NOT EXISTS applications_user_updated_idx
  ON public.applications (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS email_logs_user_received_idx
  ON public.email_logs (user_id, received_at DESC);

CREATE INDEX IF NOT EXISTS email_logs_user_type_received_idx
  ON public.email_logs (user_id, email_type, received_at DESC);

CREATE INDEX IF NOT EXISTS email_logs_application_user_idx
  ON public.email_logs (application_id, user_id);

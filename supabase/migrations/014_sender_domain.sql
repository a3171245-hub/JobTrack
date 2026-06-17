-- Add sender field to email_logs (stores the From: email address)
ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS sender TEXT;

-- Add sender_domain to applications (used to match incoming emails without AI)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS sender_domain TEXT;

-- Indexes for efficient domain lookups
CREATE INDEX IF NOT EXISTS email_logs_user_sender_idx
  ON public.email_logs (user_id, sender);

CREATE INDEX IF NOT EXISTS applications_user_sender_domain_idx
  ON public.applications (user_id, sender_domain);

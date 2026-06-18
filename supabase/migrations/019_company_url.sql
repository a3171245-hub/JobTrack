-- Migration 019: Company "my page" URL (応募者専用マイページ等)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS company_url TEXT;

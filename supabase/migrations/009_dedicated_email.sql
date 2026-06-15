-- Add dedicated_email column to users table for Chrome extension integration
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dedicated_email TEXT;

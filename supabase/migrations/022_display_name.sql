-- Migration 022: shareable display name
--
-- Lets a user set a name to show on the share card (and elsewhere) instead
-- of the raw email-derived default. Nullable — falls back to the part of
-- the email before '@' when unset.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS display_name text;

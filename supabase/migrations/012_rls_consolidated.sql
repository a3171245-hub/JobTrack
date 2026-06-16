-- Migration 012: RLS Consolidated
-- Idempotent consolidation of all RLS policies.
-- Drops old policy names from migrations 004-008 and creates clean final policies.
-- Prevents authenticated users from self-escalating their plan.

-- ─── Enable RLS on all tables (idempotent) ─────────────────────────
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- ─── users ─────────────────────────────────────────────────────────
-- Drop ALL known historical policy names
DROP POLICY IF EXISTS "Users can view own profile"   ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access users" ON public.users;
DROP POLICY IF EXISTS "users_select_own"          ON public.users;
DROP POLICY IF EXISTS "users_insert_own"          ON public.users;
DROP POLICY IF EXISTS "users_update_own"          ON public.users;
DROP POLICY IF EXISTS "users_service_role_all"    ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- UPDATE: only own row; plan column cannot be self-escalated
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent self-update of plan via column-level privilege
-- (service_role bypasses RLS and can update plan freely)
REVOKE UPDATE (plan) ON public.users FROM authenticated;

-- ─── applications ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own applications"   ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can CRUD own applications"   ON public.applications;
DROP POLICY IF EXISTS "users can manage own applications" ON public.applications;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.applications;
DROP POLICY IF EXISTS "service role bypass"               ON public.applications;
DROP POLICY IF EXISTS "Service role full access applications" ON public.applications;
DROP POLICY IF EXISTS "applications_crud_own"          ON public.applications;
DROP POLICY IF EXISTS "applications_service_role_all"  ON public.applications;

CREATE POLICY "applications_crud_own" ON public.applications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── email_logs ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own email logs"       ON public.email_logs;
DROP POLICY IF EXISTS "Service role can insert email logs"  ON public.email_logs;
DROP POLICY IF EXISTS "Service role full access email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_select_own"               ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_service_role_all"         ON public.email_logs;

-- Authenticated users can only read their own logs.
-- All writes come from service_role (Cloudflare Worker → /api/email/inbound).
CREATE POLICY "email_logs_select_own" ON public.email_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ─── calendar_events ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Service role full access calendar_events"   ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_crud_own"                   ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_service_role_all"           ON public.calendar_events;

CREATE POLICY "calendar_events_crud_own" ON public.calendar_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

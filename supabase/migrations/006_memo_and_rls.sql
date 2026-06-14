-- ============================================================
-- Migration 006: ユーザーメモ列の追加 ＋ RLSポリシーの整備
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 1) applications にユーザー自由記入メモ列を追加
--    （notes は AI 取得の企業情報メモに使用しているため別列にする）
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS memo TEXT;

-- ============================================================
-- 2) RLS を全テーブルで有効化
-- ============================================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3) users: 自分のプロフィールのみ
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile"   ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 4) applications: ログインユーザー自身のデータのみ CRUD 可
-- ============================================================
DROP POLICY IF EXISTS "Users can CRUD own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;

CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5) email_logs: 自分のログのみ閲覧可（INSERTはWebhookのservice_roleのみ）
-- ============================================================
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;

CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 6) calendar_events: 自分の予定のみ CRUD 可
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own calendar events" ON public.calendar_events;

CREATE POLICY "Users can manage their own calendar events"
  ON public.calendar_events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7) service_role（Webhook / Server Actions）は全テーブルフルアクセス
--    ※ service role key は元々 RLS をバイパスするが、明示的に付与しておく
-- ============================================================
DROP POLICY IF EXISTS "Service role full access users"          ON public.users;
DROP POLICY IF EXISTS "Service role full access applications"    ON public.applications;
DROP POLICY IF EXISTS "Service role full access email_logs"      ON public.email_logs;
DROP POLICY IF EXISTS "Service role full access calendar_events" ON public.calendar_events;

CREATE POLICY "Service role full access users"
  ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access applications"
  ON public.applications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access email_logs"
  ON public.email_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access calendar_events"
  ON public.calendar_events FOR ALL TO service_role USING (true) WITH CHECK (true);

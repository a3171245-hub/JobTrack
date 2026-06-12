-- ============================================================
-- JobTrack MVP - Supabase Schema
-- Supabase SQL Editorで実行してください
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- users テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dedicated_email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- applications テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'document', 'interview_1', 'interview_2', 'final', 'offer', 'rejected', 'event')),
  latest_email_subject TEXT,
  interview_date TIMESTAMPTZ,
  event_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own applications"
  ON public.applications FOR ALL
  USING (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- email_logs テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  subject TEXT,
  body_text TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_type TEXT NOT NULL DEFAULT 'other'
    CHECK (email_type IN ('selection', 'event', 'other'))
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- Service role は全テーブルにフルアクセス（Webhook用）
-- ============================================================
CREATE POLICY "Service role full access users"
  ON public.users FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access applications"
  ON public.applications FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access email_logs"
  ON public.email_logs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 新規ユーザー登録時に users テーブルへ自動挿入するトリガー
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_dedicated_email TEXT;
  random_part TEXT;
BEGIN
  -- ランダムな8文字の専用メールアドレスを生成
  random_part := lower(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  new_dedicated_email := random_part || '@' || current_setting('app.dedicated_email_domain', true);

  INSERT INTO public.users (id, email, dedicated_email)
  VALUES (
    NEW.id,
    NEW.email,
    new_dedicated_email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- app設定（専用ドメイン）
-- Supabase Dashboard > Settings > Database > Config で設定するか、
-- 下記をコメントアウトして直接記載してください
-- ============================================================
-- ALTER DATABASE postgres SET app.dedicated_email_domain = 'jobtrack.jp';

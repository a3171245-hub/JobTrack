-- ============================================================
-- Migration 001: 適性検査フィールド・notesカラム追加
-- Supabase SQL Editorで実行してください
-- ============================================================

-- applications テーブルに新カラム追加
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS test_type    TEXT,
  ADD COLUMN IF NOT EXISTS test_date    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS test_result  TEXT CHECK (test_result IN ('通過', '不通過', '未受検')),
  ADD COLUMN IF NOT EXISTS notes        TEXT;

-- email_logs の email_type に 'manual_update' を追加
ALTER TABLE public.email_logs
  DROP CONSTRAINT IF EXISTS email_logs_email_type_check;

ALTER TABLE public.email_logs
  ADD CONSTRAINT email_logs_email_type_check
    CHECK (email_type IN ('selection', 'event', 'other', 'manual_update'));

-- ============================================================
-- デモ用シードデータ（Google Loginなしで動作確認する場合）
-- auth.users に依存しないよう、直接 public.users に挿入可能にする
-- 本番環境では実行しないでください
-- ============================================================
-- INSERT INTO public.users (id, email, dedicated_email)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'demo@example.com', 'demo@jobtrack.jp')
-- ON CONFLICT DO NOTHING;

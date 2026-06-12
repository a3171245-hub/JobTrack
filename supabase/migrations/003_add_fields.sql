-- ============================================================
-- Migration 003: es_deadline, custom_flow を applications に追加
--                calendar_events テーブルを新規作成
-- Supabase SQL Editorで実行してください
-- ============================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS es_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_flow JSONB;

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  date        DATE        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'other',
  memo        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar events"
  ON public.calendar_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

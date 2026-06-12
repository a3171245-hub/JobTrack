-- ============================================================
-- Migration 004: GDステータスと gd_date カラムを追加
-- Supabase SQL Editorで実行してください
-- ============================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS gd_date TIMESTAMPTZ;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
    CHECK (status IN (
      'applied', 'document', 'test', 'gd',
      'interview_1', 'interview_2', 'final',
      'offer', 'rejected', 'event'
    ));

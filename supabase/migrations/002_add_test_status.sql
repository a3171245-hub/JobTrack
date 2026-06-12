-- ============================================================
-- Migration 002: applications.status に 'test' を追加
-- Supabase SQL Editorで実行してください
-- ============================================================

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
    CHECK (status IN (
      'applied', 'document', 'test',
      'interview_1', 'interview_2', 'final',
      'offer', 'rejected', 'event'
    ));

-- ① is_active: フリープランで5社ピン留め管理に使用
--    既存レコードはすべてアクティブ扱い（DEFAULT TRUE）
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ② updated_by: ステータス更新がAIによるものか手動かを記録
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT 'ai'
  CHECK (updated_by IN ('ai', 'manual'));

-- インデックス（非アクティブ企業一覧のフィルタに使用）
CREATE INDEX IF NOT EXISTS applications_user_active_idx
  ON public.applications (user_id, is_active);

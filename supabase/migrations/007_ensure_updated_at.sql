-- updated_at カラムが存在しない場合に追加する
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 既存レコードの updated_at が null の場合は created_at で埋める
UPDATE public.applications
  SET updated_at = created_at
  WHERE updated_at IS NULL;

-- 今後の INSERT / UPDATE で自動更新するトリガー関数
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーが未作成の場合のみ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'applications_set_updated_at'
  ) THEN
    CREATE TRIGGER applications_set_updated_at
      BEFORE UPDATE ON public.applications
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

-- ステータス更新が 0行で失敗する場合の RLS 修正
-- authenticated ロールに対して SELECT/INSERT/UPDATE/DELETE を明示的に許可

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーをいったん削除して再作成
DROP POLICY IF EXISTS "users can only see own applications" ON public.applications;
DROP POLICY IF EXISTS "users can manage own applications" ON public.applications;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.applications;

-- authenticated ユーザーが自分のレコードを操作できるポリシー
CREATE POLICY "users can manage own applications"
  ON public.applications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- service_role はすべてのレコードにアクセス可能（Server Action 用）
DROP POLICY IF EXISTS "service role bypass" ON public.applications;
CREATE POLICY "service role bypass"
  ON public.applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 現在のポリシー確認用クエリ（実行後に結果を確認してください）
-- SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'applications';

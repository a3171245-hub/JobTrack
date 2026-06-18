-- ============================================================
-- Step 1: Apply migration 017 (if not already applied)
-- Idempotent — safe to run even if already applied.
-- ============================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS interview_date_confirmed BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS process_type TEXT;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_process_type_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_process_type_check
    CHECK (process_type IS NULL OR process_type IN ('internship', 'fulltime', 'other'));

CREATE INDEX IF NOT EXISTS applications_user_domain_process_idx
  ON public.applications (user_id, sender_domain, process_type);

-- ============================================================
-- Step 2: Test dummy data
-- User: f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8 (dedicated_email: wataru@jobtrack.jp)
--
-- Scenario A — 株式会社サンプルテック (sender_domain: sampletech.co.jp)
--   Two parallel selection processes at the same company:
--   internship (一次面接まで進行中) + fulltime (エントリー直後)
--
-- Scenario B — 株式会社テストグループ (sender_domain: testgroup.co.jp)
--   Single process, 二次面接で3つの日程候補が未確定のまま
-- ============================================================

-- ── Scenario A: applications ─────────────────────────────────
INSERT INTO public.applications (
  id, user_id, company_name, status, latest_email_subject,
  sender_domain, process_type, is_active, updated_by,
  interview_date_confirmed, created_at, updated_at
) VALUES
  (
    'a1111111-1111-4111-8111-111111111101',
    'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8',
    '株式会社サンプルテック',
    'interview_1',
    '【書類選考結果のご連絡】株式会社サンプルテック サマーインターンシップ',
    'sampletech.co.jp',
    'internship',
    TRUE,
    'ai',
    TRUE,
    '2026-06-10T01:00:00+00:00',
    '2026-06-15T00:30:00+00:00'
  ),
  (
    'a1111111-1111-4111-8111-111111111102',
    'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8',
    '株式会社サンプルテック',
    'applied',
    '【エントリー受付完了】株式会社サンプルテック 2027年卒 新卒採用本選考',
    'sampletech.co.jp',
    'fulltime',
    TRUE,
    'ai',
    TRUE,
    '2026-06-17T09:00:00+00:00',
    '2026-06-17T09:00:00+00:00'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Scenario A: email_logs ───────────────────────────────────
INSERT INTO public.email_logs (
  id, user_id, application_id, subject, body_text, sender, received_at, email_type
) VALUES
  (
    'b1111111-1111-4111-8111-111111111101',
    'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8',
    'a1111111-1111-4111-8111-111111111101',
    '【株式会社サンプルテック】サマーインターンシップ選考 ご応募受付のご連絡',
    E'○○様\n\nこのたびは株式会社サンプルテックのサマーインターンシップ選考にご応募いただき、誠にありがとうございます。\n\n下記の内容で応募を受け付けいたしました。\n\n【応募コース】エンジニアリングコース（2週間）\n【選考フロー】書類選考 → 一次面接 → 結果通知\n\n書類選考の結果は、1週間以内を目安にメールにてご連絡いたします。\n今後ともよろしくお願いいたします。\n\n株式会社サンプルテック\n新卒採用担当',
    'recruit@sampletech.co.jp',
    '2026-06-10T01:00:00+00:00',
    'selection'
  ),
  (
    'b1111111-1111-4111-8111-111111111102',
    'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8',
    'a1111111-1111-4111-8111-111111111101',
    '【書類選考結果のご連絡】株式会社サンプルテック サマーインターンシップ',
    E'○○様\n\n株式会社サンプルテック 新卒採用担当です。\n\nこのたびはサマーインターンシップ選考にご応募いただき、ありがとうございました。\n厳正なる書類選考の結果、一次面接にお進みいただくこととなりましたので、ご連絡いたします。\n\n【次のステップ】一次面接（オンライン・30分程度）\n日程につきましては、追ってご都合をお伺いいたします。\n\n引き続きよろしくお願いいたします。\n\n株式会社サンプルテック\n新卒採用担当',
    'recruit@sampletech.co.jp',
    '2026-06-15T00:30:00+00:00',
    'selection'
  ),
  (
    'b1111111-1111-4111-8111-111111111103',
    'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8',
    'a1111111-1111-4111-8111-111111111102',
    '【エントリー受付完了】株式会社サンプルテック 2027年卒 新卒採用本選考',
    E'○○様\n\n株式会社サンプルテックの新卒採用本選考にエントリーいただき、ありがとうございます。\n\nエントリーシートを受領いたしましたので、ご連絡いたします。\n今後の選考スケジュールにつきましては、別途メールでご案内いたします。\n\n【選考フロー】ES提出 → 適性検査 → 面接（複数回） → 内定\n\nご不明点がございましたら、本メールにご返信ください。\n\n株式会社サンプルテック\n新卒採用担当',
    'recruit@sampletech.co.jp',
    '2026-06-17T09:00:00+00:00',
    'selection'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Scenario B: applications ─────────────────────────────────
INSERT INTO public.applications (
  id, user_id, company_name, status, latest_email_subject,
  interview_date, interview_date_candidates, interview_date_confirmed,
  sender_domain, process_type, is_active, updated_by, created_at, updated_at
) VALUES
  (
    'c2222222-2222-4222-8222-222222222201',
    'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8',
    '株式会社テストグループ',
    'interview_2',
    '【株式会社テストグループ】二次面接日程調整のご相談',
    '2026-07-02T05:00:00+00:00',
    ARRAY['2026-07-02T05:00:00+00:00', '2026-07-03T01:00:00+00:00', '2026-07-04T06:00:00+00:00'],
    FALSE,
    'testgroup.co.jp',
    'fulltime',
    TRUE,
    'ai',
    '2026-06-18T02:00:00+00:00',
    '2026-06-18T02:00:00+00:00'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Scenario B: email_logs ────────────────────────────────────
INSERT INTO public.email_logs (
  id, user_id, application_id, subject, body_text, sender, received_at, email_type
) VALUES
  (
    'd2222222-2222-4222-8222-222222222201',
    'f64e9d5e-0cf4-4496-bc25-90b9e58fa2c8',
    'c2222222-2222-4222-8222-222222222201',
    '【株式会社テストグループ】二次面接日程調整のご相談',
    E'○○様\n\n平素より大変お世話になっております。\n株式会社テストグループ 採用担当の鈴木です。\n\nこのたびは一次面接にご通過いただき、誠におめでとうございます。\nつきましては、二次面接の日程について、以下の候補日からご都合のよい日時をお知らせください。\n\n候補A：2026年7月2日（木）14:00〜15:00\n候補B：2026年7月3日（金）10:00〜11:00\n候補C：2026年7月4日（土）15:00〜16:00\n\n形式：オンライン（Zoom）を予定しております。\nご都合のよい候補をご返信いただけますと幸いです。\n\n何卒よろしくお願いいたします。\n\n株式会社テストグループ\n採用担当 鈴木',
    'saiyo@testgroup.co.jp',
    '2026-06-18T02:00:00+00:00',
    'selection'
  )
ON CONFLICT (id) DO NOTHING;

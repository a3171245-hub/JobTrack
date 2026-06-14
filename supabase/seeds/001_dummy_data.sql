-- ============================================================
-- JobTrack 開発確認用ダミーデータ
-- Supabase SQL Editor で実行してください
-- 前提: a3171245@gmail.com で一度ログイン済み（auth.users に存在すること）
--
-- ログインユーザーの id を auth.users から取得し、
-- applications → email_logs の順に投入します。
-- email_logs.application_id は CTE の RETURNING で自動的に紐づけます。
-- ============================================================

-- 再投入する場合は先に既存のダミーを掃除（任意）
-- DELETE FROM public.applications
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'a3171245@gmail.com')
--   AND company_name IN ('株式会社テックスタート','大手商社グループ','フューチャーコンサル','グローバルIT株式会社');

WITH u AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'a3171245@gmail.com'
  LIMIT 1
),
new_apps AS (
  INSERT INTO public.applications
    (user_id, company_name, status, latest_email_subject, interview_date, es_deadline, notes)
  SELECT
    u.user_id, a.company_name, a.status, a.latest_email_subject,
    a.interview_date, a.es_deadline, a.notes
  FROM u
  CROSS JOIN (VALUES
    (
      '株式会社テックスタート', 'interview_1',
      '【一次面接のご案内】株式会社テックスタート 採用担当',
      TIMESTAMPTZ '2026-06-22 10:00:00+09',
      TIMESTAMPTZ '2026-06-17 23:59:00+09',
      E'業界：IT/SaaS\n事業内容：中小企業向けクラウド会計ソフトの開発・提供\n採用職種：ソフトウェアエンジニア'
    ),
    (
      '大手商社グループ', 'document',
      '【エントリーシート選考結果のご連絡】',
      NULL::timestamptz,
      TIMESTAMPTZ '2026-06-19 23:59:00+09',
      E'業界：総合商社\n事業内容：食料・エネルギー・金属資源の国際取引\n採用職種：総合職'
    ),
    (
      'フューチャーコンサル', 'final',
      '【最終面接のご案内】フューチャーコンサル株式会社',
      NULL::timestamptz,
      NULL::timestamptz,
      E'業界：コンサルティング\n事業内容：経営戦略・DX推進コンサルティング\n採用職種：経営コンサルタント'
    ),
    (
      'グローバルIT株式会社', 'offer',
      '【内定のご連絡】グローバルIT株式会社',
      NULL::timestamptz,
      NULL::timestamptz,
      E'業界：IT\n事業内容：グローバル市場向けSaaSの開発・提供\n採用職種：ソフトウェアエンジニア'
    )
  ) AS a(company_name, status, latest_email_subject, interview_date, es_deadline, notes)
  RETURNING id, user_id, company_name
)
INSERT INTO public.email_logs
  (user_id, application_id, subject, body_text, received_at, email_type)
SELECT
  na.user_id, na.id, m.subject, m.body_text, m.received_at, m.email_type
FROM new_apps na
JOIN (VALUES
  (
    '株式会社テックスタート',
    '【書類選考通過のご連絡】株式会社テックスタート',
    E'この度はエントリーシートをご提出いただきありがとうございます。\n厳正な審査の結果、書類選考を通過されましたことをお知らせいたします。',
    TIMESTAMPTZ '2026-06-10 09:00:00+09', 'selection'
  ),
  (
    '株式会社テックスタート',
    '【一次面接のご案内】株式会社テックスタート 採用担当',
    E'一次面接を下記の日程で実施いたします。\n日時：2026年6月22日(月) 10:00〜',
    TIMESTAMPTZ '2026-06-14 18:30:00+09', 'selection'
  ),
  (
    '大手商社グループ',
    '【エントリーシート選考結果のご連絡】',
    E'書類選考の結果、次の選考にお進みいただきたく存じます。\nWebテストのご案内を別途お送りします。',
    TIMESTAMPTZ '2026-06-12 11:00:00+09', 'selection'
  ),
  (
    'フューチャーコンサル',
    '【最終面接のご案内】フューチャーコンサル株式会社',
    E'二次面接を通過されました。最終面接のご案内です。\n日程調整のうえご返信ください。',
    TIMESTAMPTZ '2026-06-13 14:00:00+09', 'selection'
  ),
  (
    'グローバルIT株式会社',
    '【会社説明会のご案内】グローバルIT株式会社',
    E'弊社の会社説明会にエントリーいただきありがとうございます。\n参加方法をご案内します。',
    TIMESTAMPTZ '2026-06-05 13:00:00+09', 'event'
  ),
  (
    'グローバルIT株式会社',
    '【内定のご連絡】グローバルIT株式会社',
    E'この度は弊社の選考にご参加いただきありがとうございました。\n貴殿を採用内定とすることを決定いたしましたのでご連絡いたします。',
    TIMESTAMPTZ '2026-06-15 10:00:00+09', 'selection'
  )
) AS m(company_name, subject, body_text, received_at, email_type)
  ON m.company_name = na.company_name;

import type { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row']
type EmailLog = Database['public']['Tables']['email_logs']['Row']

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'

const today = new Date()
const todayISO = today.toISOString()
const todayStr = today.toISOString().split('T')[0]

export const DUMMY_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    user_id: DUMMY_USER_ID,
    company_name: '株式会社テックスタート',
    status: 'interview_2',
    latest_email_subject: '【二次面接のご案内】株式会社テックスタート 採用担当',
    interview_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8, 10, 0).toISOString(),
    event_date: null,
    test_type: '玉手箱',
    test_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
    test_result: '通過',
    notes: '業界：IT/SaaS\n事業内容：中小企業向けクラウド会計ソフトの開発・提供\n採用職種：ソフトウェアエンジニア、プロダクトマネージャー',
    es_deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3).toISOString(),
    custom_flow: null,
    gd_date: null,
    created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 28).toISOString(),
    updated_at: todayISO,
  },
  {
    id: 'app-002',
    user_id: DUMMY_USER_ID,
    company_name: '大手商社グループ株式会社',
    status: 'document',
    latest_email_subject: '【エントリーシート選考結果のご連絡】',
    interview_date: null,
    event_date: null,
    test_type: 'SPI',
    test_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString(),
    test_result: '未受検',
    notes: '業界：総合商社\n事業内容：食料・エネルギー・金属資源の国際取引\n採用職種：総合職（国内営業・海外営業・事業投資）',
    es_deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString(),
    custom_flow: null,
    gd_date: null,
    created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 23).toISOString(),
    updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4).toISOString(),
  },
  {
    id: 'app-003',
    user_id: DUMMY_USER_ID,
    company_name: 'フューチャーコンサル株式会社',
    status: 'rejected',
    latest_email_subject: '【選考結果のご連絡】この度は誠にありがとうございました',
    interview_date: null,
    event_date: null,
    test_type: null,
    test_date: null,
    test_result: null,
    notes: '業界：コンサルティング\n事業内容：経営戦略・DX推進コンサルティング\n採用職種：経営コンサルタント',
    es_deadline: null,
    custom_flow: null,
    gd_date: null,
    created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 33).toISOString(),
    updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString(),
  },
  {
    id: 'app-004',
    user_id: DUMMY_USER_ID,
    company_name: 'グローバルIT株式会社',
    status: 'event',
    latest_email_subject: '【会社説明会・インターンシップのご案内】6月開催',
    interview_date: null,
    event_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13, 14, 0).toISOString(),
    test_type: null,
    test_date: null,
    test_result: null,
    notes: null,
    es_deadline: null,
    custom_flow: null,
    gd_date: null,
    created_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 11).toISOString(),
    updated_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString(),
  },
]

export const DUMMY_EMAIL_LOGS: EmailLog[] = [
  // テックスタート
  {
    id: 'log-001',
    user_id: DUMMY_USER_ID,
    application_id: 'app-001',
    subject: '【エントリーシート通過のご連絡】株式会社テックスタート',
    body_text: 'この度はエントリーシートをご提出いただきありがとうございます。厳正な審査の結果、書類選考を通過されましたことをお知らせいたします。',
    received_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 28).toISOString(),
    email_type: 'selection',
  },
  {
    id: 'log-002',
    user_id: DUMMY_USER_ID,
    application_id: 'app-001',
    subject: '【一次面接通過のご連絡】株式会社テックスタート 採用担当',
    body_text: '先日はご多忙の中、一次面接にお越しいただきありがとうございました。一次面接を通過されましたことをお知らせいたします。',
    received_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString(),
    email_type: 'selection',
  },
  {
    id: 'log-003',
    user_id: DUMMY_USER_ID,
    application_id: 'app-001',
    subject: '【二次面接のご案内】株式会社テックスタート 採用担当',
    body_text: '二次面接を下記の日程で実施いたします。',
    received_at: todayISO,
    email_type: 'selection',
  },
  // 大手商社
  {
    id: 'log-004',
    user_id: DUMMY_USER_ID,
    application_id: 'app-002',
    subject: '【エントリーシート選考結果のご連絡】',
    body_text: '書類選考の結果、次の選考にお進みいただきたく存じます。',
    received_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4).toISOString(),
    email_type: 'selection',
  },
  // フューチャーコンサル
  {
    id: 'log-005',
    user_id: DUMMY_USER_ID,
    application_id: 'app-003',
    subject: '【エントリーシート受付のご確認】フューチャーコンサル株式会社',
    body_text: 'エントリーシートのご提出ありがとうございます。',
    received_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 33).toISOString(),
    email_type: 'other',
  },
  {
    id: 'log-006',
    user_id: DUMMY_USER_ID,
    application_id: 'app-003',
    subject: '【選考結果のご連絡】この度は誠にありがとうございました',
    body_text: '今回は採用を見送らせていただくことになりました。ご縁がなかったものとご了承ください。',
    received_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString(),
    email_type: 'selection',
  },
  // グローバルIT
  {
    id: 'log-007',
    user_id: DUMMY_USER_ID,
    application_id: 'app-004',
    subject: '【会社説明会・インターンシップのご案内】6月開催',
    body_text: '弊社インターンシップの参加者を募集しております。',
    received_at: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString(),
    email_type: 'event',
  },
  // 今日の手動更新ログ（TodayUpdatesウィジェット用デモデータ）
  {
    id: 'log-manual-001',
    user_id: DUMMY_USER_ID,
    application_id: 'app-001',
    subject: 'ステータス変更: 1次面接 → 2次面接',
    body_text: JSON.stringify({
      company_name: '株式会社テックスタート',
      from_status: 'interview_1',
      to_status: 'interview_2',
    }),
    received_at: new Date(`${todayStr}T09:15:00+09:00`).toISOString(),
    email_type: 'manual_update',
  },
  {
    id: 'log-manual-002',
    user_id: DUMMY_USER_ID,
    application_id: 'app-002',
    subject: 'ステータス変更: 応募済 → 書類選考',
    body_text: JSON.stringify({
      company_name: '大手商社グループ株式会社',
      from_status: 'applied',
      to_status: 'document',
    }),
    received_at: new Date(`${todayStr}T11:30:00+09:00`).toISOString(),
    email_type: 'manual_update',
  },
]

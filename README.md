# JobTrack - 就活メール自動追跡サービス

専用メールアドレスを就活サイトに登録するだけで、企業からの選考メールをAIが自動解析し、カンバンボードで選考状況を一元管理できます。

## 技術スタック

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes (Server Actions)
- **Database**: Supabase (PostgreSQL + Auth)
- **メール受信**: Mailgun Webhook
- **AI解析**: OpenAI API (gpt-4o-mini)
- **認証**: Supabase Auth (Googleログイン)
- **デプロイ**: Vercel

---

## セットアップ手順

### 1. リポジトリのクローンと依存パッケージインストール

```bash
git clone <your-repo>
cd jobtrack
npm install
```

### 2. Supabase セットアップ

#### 2-1. プロジェクト作成
1. [Supabase](https://supabase.com) にアクセスしてアカウント作成
2. 「New Project」でプロジェクトを作成
3. プロジェクト設定 > API から以下を取得:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

#### 2-2. データベーステーブル作成
1. Supabase Dashboard > SQL Editor を開く
2. `supabase/schema.sql` の内容を全てコピー＆ペーストして実行
3. 専用ドメインを設定するため、最後の行のコメントを解除して実行:
   ```sql
   ALTER DATABASE postgres SET app.dedicated_email_domain = 'jobtrack.jp';
   ```

#### 2-3. Google認証の設定
1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
2. OAuth 2.0 クライアントIDを作成
   - 承認済みのリダイレクトURI に以下を追加:
     - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (ローカル開発用)
3. Supabase Dashboard > Authentication > Providers > Google を有効化
   - Client ID と Client Secret を入力

### 3. Mailgun セットアップ

#### 3-1. アカウント作成とドメイン設定
1. [Mailgun](https://www.mailgun.com) でアカウント作成
2. Sending > Domains からカスタムドメインを追加
   - ドメイン例: `jobtrack.jp`
3. DNSレコードを設定してドメインを認証

#### 3-2. 受信メール(Inbound)の設定
1. Receive > Routes から新しいルートを作成
2. Filter Expression:
   ```
   match_recipient(".*@jobtrack.jp")
   ```
3. Actions:
   ```
   forward("https://your-domain.vercel.app/api/webhook/mailgun")
   store()
   ```
4. Mailgun Dashboard > Settings > API Keys から **HTTP Webhook Signing Key** を取得
   → `MAILGUN_SIGNING_KEY` に設定

### 4. 環境変数の設定

`.env.local` を編集して各値を入力:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
OPENAI_API_KEY=sk-...
MAILGUN_SIGNING_KEY=your-webhook-signing-key
DEDICATED_EMAIL_DOMAIN=jobtrack.jp
```

### 5. ローカル開発サーバー起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス確認

---

## Vercelへのデプロイ

### 1. Vercel プロジェクト作成

```bash
npm i -g vercel
vercel
```

または [Vercel Dashboard](https://vercel.com/new) からGitHubリポジトリを連携

### 2. 環境変数の設定

Vercel Dashboard > Settings > Environment Variables で以下を設定:

| Key | Environment |
|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `OPENAI_API_KEY` | Production, Preview |
| `MAILGUN_SIGNING_KEY` | Production, Preview |
| `DEDICATED_EMAIL_DOMAIN` | All |

### 3. Supabase AuthのURLを更新

デプロイ後、Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://your-project.vercel.app`
- Redirect URLs に `https://your-project.vercel.app/auth/callback` を追加

---

## ファイル構成

```
jobtrack/
├── app/
│   ├── api/webhook/mailgun/route.ts  # Mailgunウェブフック
│   ├── auth/callback/route.ts        # OAuth コールバック
│   ├── dashboard/
│   │   ├── page.tsx                  # ダッシュボード
│   │   └── actions.ts                # Server Actions
│   ├── calendar/page.tsx             # カレンダー
│   └── page.tsx                      # ランディングページ
├── components/
│   ├── KanbanBoard.tsx               # カンバンボード（DnD）
│   ├── CalendarView.tsx              # カレンダービュー
│   ├── EventList.tsx                 # イベント一覧
│   ├── DedicatedEmailBanner.tsx      # 専用メールアドレス表示
│   ├── AddApplicationDialog.tsx      # 企業追加ダイアログ
│   └── NavBar.tsx                    # ナビゲーション
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # ブラウザ用Supabaseクライアント
│   │   └── server.ts                 # サーバー用Supabaseクライアント
│   ├── openai.ts                     # OpenAI API クライアント
│   └── constants.ts                  # カンバンステータス定義
├── types/
│   └── database.ts                   # TypeScript型定義
├── middleware.ts                      # 認証ミドルウェア
└── supabase/schema.sql               # DBスキーマ
```

---

## カンバンステータス

| ステータス | 説明 |
|-----------|------|
| `applied` | 応募済 |
| `document` | 書類選考中 |
| `interview_1` | 1次面接 |
| `interview_2` | 2次面接 |
| `final` | 最終面接 |
| `offer` | 内定 |
| `rejected` | お祈り |
| `event` | イベント・説明会 |

---

## Mailgunウェブフックのテスト

ローカルでテストする場合は [ngrok](https://ngrok.com) を使用:

```bash
ngrok http 3000
# 表示されたURLをMailgunのRoute forwardに設定
```

curlでWebhookを手動テスト:

```bash
curl -X POST http://localhost:3000/api/webhook/mailgun \
  -F "recipient=abc12345@jobtrack.jp" \
  -F "sender=recruit@example-company.co.jp" \
  -F "subject=【一次面接通過のご連絡】株式会社サンプル" \
  -F "body-plain=お世話になっております。先日は一次面接へのご参加ありがとうございました。厳正な審査の結果、二次面接にお進みいただきたいと存じます。" \
  -F "timestamp=1234567890" \
  -F "token=test" \
  -F "signature=test"
```

> 注意: 本番環境ではMailgun署名検証が有効になります。ローカル(NODE_ENV=development)では署名検証をスキップします。

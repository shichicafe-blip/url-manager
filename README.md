# URL管理アプリ

REPLUSWORKS 向けの URL 一元管理アプリ。複数会社・複数プロジェクトで使う URL をカテゴリー別・タグ別に整理し、社員で共有できます。

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)

## 機能

- URL 登録・編集・削除（タイトル / URL / カテゴリー / 説明 / タグ）
- カテゴリー管理（管理者のみ）
- タグ付け・タグ別フィルタ
- お気に入り / 最近開いた / クリック数
- 検索（タイトル・URL・説明・カテゴリー・タグ）
- カード / テーブル表示切替
- ログイン / 新規登録
- ユーザー権限（管理者 / メンバー）
- 管理者ページ（ユーザー権限変更）

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. 環境変数

```bash
cp .env.local.example .env.local
```

`.env.local` に Supabase の URL と anon key を設定します。

### 3. Supabase スキーマ

SQL Editor で順に実行:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_rls_tags.sql`
3. `supabase/seed.sql`

### 4. Supabase Auth 設定

Dashboard > **Authentication** > **URL Configuration**:

| 項目 | 値 |
|------|-----|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

Email 確認を無効にする場合（社内ツール向け）:
Dashboard > **Authentication** > **Providers** > Email > **Confirm email** を OFF

### 5. 開発サーバー

```bash
npm run dev
```

http://localhost:3000 でアクセス → ログイン画面が表示されます。

**最初に登録したユーザーが自動的に管理者**になります。

## 権限

| 権限 | 管理者 | メンバー |
|------|--------|----------|
| URL 閲覧・登録・編集・削除 | ✅ | ✅ |
| お気に入り / 履歴 | ✅ | ✅ |
| カテゴリー管理 | ✅ | ❌ |
| ユーザー権限変更 | ✅ | ❌ |

## Vercel デプロイ

### 1. GitHub にプッシュ

```bash
git add .
git commit -m "URL管理アプリ完成"
git push origin main
```

### 2. Vercel でインポート

1. https://vercel.com/new でリポジトリをインポート
2. Environment Variables に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### 3. Supabase に本番 URL を追加

Redirect URLs に `https://your-app.vercel.app/auth/callback` を追加し、Site URL も本番 URL に更新。

## ディレクトリ構成

```
src/
├── app/              # ルーティング (/ , /login , /admin)
├── components/       # UI コンポーネント
├── features/         # 機能別ロジック (actions / queries)
├── hooks/            # クライアントフック
├── lib/              # Supabase / Auth
└── types/            # 型定義
```

## 配置場所

```
REPLUSWORKS/
└── システム会社事業/
    └── システム開発/
        └── 単独アプリ/
            └── url-manager/
```

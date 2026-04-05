# work-out

Cloudflare Pages + Hono + D1 + React で作った筋トレ記録アプリです。

## Setup

```bash
npm install
cd frontend && npm install
```

## DB commands

既存データがあるDBでは、先にバックアップを取ってから `db:migrate:*` を使ってください。

```bash
# Backup only
npm run db:backup:local
npm run db:backup:remote

# Safe bootstrap for an empty DB
npm run db:setup:local
npm run db:setup:remote

# Safe migration for an existing DB
npm run db:migrate:local
npm run db:migrate:remote
```

補足:

- `db:backup:*` は `backups/` に SQL エクスポートを作成します
- `db:migrate:*` は最初にバックアップを取り、その後でスキーマを確認して必要な処理だけを行います
- `db:init` / `db:init:remote` は互換のため残していますが、中身は安全な `db:setup:*` です
- 旧来のような `DROP TABLE` ベースの初期化は行いません

## Local development

```bash
# API
npx wrangler pages dev

# Frontend
cd frontend && npm run dev
```

Vite は `1737` 番ポート、API は `8788` 番ポートでの利用を想定しています。

## Auth

Cookie ベースのセッション認証です。ログイン画面からユーザー名とパスワードを入力します。

## Deploy

```bash
npm run deploy
```

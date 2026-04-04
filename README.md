# work-out

筋トレ記録アプリ。Cloudflare Pages + Hono + D1 + React で構成。

## セットアップ

```bash
npm install
cd frontend && npm install
```

## DB初期化

```bash
# ローカル
npm run db:init

# リモート
npm run db:init:remote
```

## 開発

ターミナルを2つ使って、それぞれ起動する。

```bash
# 1. APIサーバー（wrangler pages dev）
npx wrangler pages dev

# 2. フロントエンド（Vite）
cd frontend && npm run dev
```

Vite（ポート5173）からAPIリクエストがwrangler（ポート8788）にプロキシされる。

## 認証

Cookie ベースのセッション認証。ログイン画面でユーザー名・パスワードを入力する。

## デプロイ

```bash
npm run deploy
```

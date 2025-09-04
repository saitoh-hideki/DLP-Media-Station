# DLP Media Station デプロイ手順

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名: `dlp-media-station`
4. データベースパスワードを設定

## 2. データベースのセットアップ

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-setup.sql`の内容をコピー&ペースト
3. 「Run」ボタンをクリックして実行

## 3. Edge Functionsのデプロイ

### 方法1: 自動デプロイ（推奨）

```bash
# スクリプトに実行権限を付与
chmod +x deploy-functions.sh

# デプロイスクリプトを実行
./deploy-functions.sh
```

### 方法2: 手動デプロイ

```bash
# Supabase CLIをインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトにリンク
supabase link

# Edge Functionsをデプロイ
supabase functions deploy prep-narration
supabase functions deploy prep-runway
supabase functions deploy prep-suno
```

## 4. 環境変数の設定

### Supabaseダッシュボードで設定

1. 「Settings」→「Edge Functions」を開く
2. 環境変数を追加：
   - `OPENAI_API_KEY`: あなたのOpenAI APIキー

### ローカル環境で設定

`.env.local`ファイルを作成：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 5. アプリケーションの起動

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 6. 動作確認

1. http://localhost:3000 にアクセス
2. 各タブでコンテンツ生成をテスト
3. 履歴タブでデータが保存されているか確認

## トラブルシューティング

### Edge Functionsがデプロイできない場合

1. Supabase CLIが最新版か確認
2. プロジェクトが正しくリンクされているか確認
3. ログイン状態を確認

### データベースエラーが発生する場合

1. RLSポリシーが正しく設定されているか確認
2. テーブルが正しく作成されているか確認
3. インデックスが作成されているか確認

### OpenAI APIエラーが発生する場合

1. APIキーが正しく設定されているか確認
2. APIキーに十分なクレジットがあるか確認
3. レート制限に引っかかっていないか確認
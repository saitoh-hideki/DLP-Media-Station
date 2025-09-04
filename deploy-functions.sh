#!/bin/bash

# DLP Media Station Edge Functions デプロイスクリプト

echo "🚀 DLP Media Station Edge Functions をデプロイしています..."

# Supabase CLIがインストールされているかチェック
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLIがインストールされていません"
    echo "以下のコマンドでインストールしてください："
    echo "npm install -g supabase"
    exit 1
fi

# ログイン確認
echo "🔐 Supabaseにログインしてください..."
supabase login

# プロジェクトリンク確認
echo "🔗 Supabaseプロジェクトにリンクしてください..."
supabase link

# Edge Functionsをデプロイ
echo "📦 Edge Functionsをデプロイしています..."

# prep-narration function
echo "  - prep-narration function をデプロイ中..."
supabase functions deploy prep-narration

# prep-runway function  
echo "  - prep-runway function をデプロイ中..."
supabase functions deploy prep-runway

# prep-suno function
echo "  - prep-suno function をデプロイ中..."
supabase functions deploy prep-suno

echo "✅ すべてのEdge Functionsのデプロイが完了しました！"
echo ""
echo "📋 次のステップ："
echo "1. Supabaseダッシュボードで環境変数 OPENAI_API_KEY を設定してください"
echo "2. .env.local ファイルにSupabaseのURLとキーを設定してください"
echo "3. npm run dev でアプリケーションを起動してください"
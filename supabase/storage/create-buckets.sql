-- Storageバケット作成
-- Supabase Dashboardで実行するか、supabase cliで適用

-- 生成アセット用バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-assets', 'generated-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ストレージポリシー設定
-- 全ユーザーがファイルを読み取り可能
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'generated-assets');

-- 全ユーザーがファイルをアップロード可能
CREATE POLICY "Enable upload for all users" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'generated-assets');

-- 全ユーザーがファイルを更新可能
CREATE POLICY "Enable update for all users" ON storage.objects
FOR UPDATE USING (bucket_id = 'generated-assets')
WITH CHECK (bucket_id = 'generated-assets');

-- 全ユーザーがファイルを削除可能
CREATE POLICY "Enable delete for all users" ON storage.objects
FOR DELETE USING (bucket_id = 'generated-assets');
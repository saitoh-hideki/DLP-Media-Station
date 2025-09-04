-- generated_assets テーブル作成
CREATE TABLE IF NOT EXISTS public.generated_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('narration', 'runway', 'suno')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube', 'shorts', 'tv')),
  shop_name TEXT NOT NULL,
  content JSONB NOT NULL,
  file_url TEXT,
  comments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックス作成
CREATE INDEX idx_generated_assets_shop_name ON public.generated_assets(shop_name);
CREATE INDEX idx_generated_assets_platform ON public.generated_assets(platform);
CREATE INDEX idx_generated_assets_type ON public.generated_assets(type);
CREATE INDEX idx_generated_assets_created_at ON public.generated_assets(created_at DESC);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_assets_updated_at 
  BEFORE UPDATE ON public.generated_assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 設定
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み込み可能
CREATE POLICY "Enable read access for all users" ON public.generated_assets
  FOR SELECT USING (true);

-- 全ユーザーが作成可能
CREATE POLICY "Enable insert for all users" ON public.generated_assets
  FOR INSERT WITH CHECK (true);

-- 全ユーザーが更新可能（コメントの追加）
CREATE POLICY "Enable update for all users" ON public.generated_assets
  FOR UPDATE USING (true) WITH CHECK (true);
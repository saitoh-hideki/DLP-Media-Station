import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AssetType = 'narration' | 'runway' | 'suno'
export type Platform = 'instagram' | 'youtube' | 'shorts' | 'tv'

export interface NarrationContent {
  meta: {
    platform: Platform
    lines: number
    shopName: string
    tone: string
  }
  narration: string[]
  copy_for_tts: string
}

export interface RunwayContent {
  meta: {
    platform: Platform
    aspect: string
    duration: number
    distribution: number[]
    shopName: string
    vibe: string
  }
  style_guide: {
    style_id: string
    characters: Array<{
      id: string
      name?: string
      age?: string
      gender?: string
      look_en?: string
      look_ja?: string
      wardrobe_en?: string
      wardrobe_ja?: string
    }>
    locations: Array<{
      id: string
      name?: string
      look_en?: string
      look_ja?: string
    }>
    palette: {
      primary?: string
      secondary?: string
      accents?: string[]
    }
    camera_lens: string
    lighting_en: string
    lighting_ja: string
  }
  anchor_en: string
  anchor_ja: string
  scenes: Array<{
    label: string
    seconds: number
    prompt_en: string
    prompt_ja: string
  }>
}

export interface SunoContent {
  meta: {
    platform: Platform
    bpm_range: [number, number]
    vibe: string
  }
  prompt_en: string
  styles: string[]
}

export type GeneratedAsset = {
  id: string
  type: AssetType
  platform: Platform
  shop_name: string
  content: NarrationContent | RunwayContent | SunoContent
  file_url?: string
  comments: string[]
  created_at: string
  updated_at: string
}
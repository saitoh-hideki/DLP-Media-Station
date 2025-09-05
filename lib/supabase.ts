import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AssetType = 'narration' | 'runway' | 'suno'
export type Platform = 'instagram' | 'youtube' | 'shorts' | 'tv'
export type VisualMode = 'live_action' | 'anime'

export interface CameraSpec {
  shot_size: 'CU' | 'MCU' | 'MS' | 'FS' | 'WS'
  angle: 'eye' | 'high' | 'low' | 'top'
  movement: Array<'pan' | 'tilt' | 'dolly' | 'track' | 'handheld' | 'gimbal' | 'locked'>
  zoom: 'in' | 'out' | 'none'
}

export interface LiveActionSpec {
  lens: '24mm' | '35mm' | '50mm' | '85mm' | 'macro'
  depth_of_field: 'shallow' | 'medium' | 'deep'
  camera_motion: 'locked_off' | 'tripod' | 'handheld' | 'gimbal'
}

export interface AnimeSpec {
  line_weight: 'thin' | 'medium' | 'bold'
  shading: 'flat' | 'soft' | 'hard'
  texture: 'clean' | 'film_grain' | 'paper'
  frame_rate: 'cinematic_24' | 'smooth_30'
}

export interface ColorPalette {
  primary: string
  secondary: string
  accents: string[]
}

export interface LightingSpec {
  en: string
  ja: string
}

export interface SceneInput {
  label: string
  key_points: string
  seconds: number
}

export interface StyleGuide {
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
  palette: ColorPalette
  camera_lens: string
  lighting_en: string
  lighting_ja: string
  anime?: AnimeSpec
  live?: LiveActionSpec
}

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
    mode: VisualMode
    seed?: string
    model_version?: string
  }
  style_guide: StyleGuide
  anchor_en: string
  anchor_ja: string
  scenes: Array<{
    label: string
    seconds: number
    prompt_en: string
    prompt_ja: string
  }>
  negative_en: string[]
  negative_ja: string[]
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
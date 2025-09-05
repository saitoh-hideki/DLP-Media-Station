import { CameraSpec, LiveActionSpec, AnimeSpec } from './supabase'

// モード別プリセットチップ
export const MODE_PRESETS = {
  live_action: [
    'cinematic',
    'documentary',
    'warm family',
    'corporate professional',
    'lifestyle commercial',
    'product showcase',
    'behind the scenes',
    'testimonial style'
  ],
  anime: [
    'cinematic anime',
    'clean lines',
    'retro cel',
    'studio ghibli style',
    'modern anime',
    'manga style',
    'kawaii aesthetic',
    'dramatic anime'
  ]
} as const

// ショットサイズの説明
export const SHOT_SIZE_LABELS = {
  CU: { en: 'Close-up', ja: 'クローズアップ', desc: '顔のアップ（感情表現に最適）' },
  MCU: { en: 'Medium Close-up', ja: '胸上', desc: '胸から上（人物の表情と上半身）' },
  MS: { en: 'Medium Shot', ja: '腰上', desc: '腰から上（人物の動作と表情）' },
  FS: { en: 'Full Shot', ja: '全身', desc: '人物全体（全身の動作と環境）' },
  WS: { en: 'Wide Shot', ja: '広角', desc: '環境全体（場所の雰囲気とスケール）' }
} as const

// カメラアングルの説明
export const CAMERA_ANGLE_LABELS = {
  eye: { en: 'Eye Level', ja: 'アイレベル', desc: '自然な視線の高さ（標準的な視点）' },
  high: { en: 'High Angle', ja: 'ハイアングル', desc: '上から見下ろす（小さく見える効果）' },
  low: { en: 'Low Angle', ja: 'ローアングル', desc: '下から見上げる（大きく見える効果）' },
  top: { en: 'Top Down', ja: '俯瞰', desc: '真上から見下ろす（全体俯瞰）' }
} as const

// カメラ動作の説明
export const CAMERA_MOVEMENT_LABELS = {
  pan: { en: 'Pan', ja: 'パン', desc: '左右に回転（横方向の動き）' },
  tilt: { en: 'Tilt', ja: 'チルト', desc: '上下に回転（縦方向の動き）' },
  dolly: { en: 'Dolly', ja: 'ドリー', desc: '前後に移動（奥行きの動き）' },
  track: { en: 'Track', ja: 'トラック', desc: '横方向に移動（平行移動）' },
  handheld: { en: 'Handheld', ja: 'ハンドヘルド', desc: '手持ちカメラ（自然な揺れ）' },
  gimbal: { en: 'Gimbal', ja: 'ジンバル', desc: '安定した手持ち（滑らかな動き）' },
  locked: { en: 'Locked Off', ja: '固定', desc: 'カメラ固定（安定した構図）' }
} as const

// ズームの説明
export const ZOOM_LABELS = {
  in: { en: 'Zoom In', ja: 'ズームイン', desc: '被写体に近づく（集中効果）' },
  out: { en: 'Zoom Out', ja: 'ズームアウト', desc: '被写体から離れる（全体像）' },
  none: { en: 'No Zoom', ja: 'ズームなし', desc: 'ズーム操作なし（固定焦点）' }
} as const

// 実写モード用レンズ
export const LIVE_LENS_OPTIONS = [
  { value: '24mm', label: '24mm', desc: '超広角（環境全体を捉える）' },
  { value: '35mm', label: '35mm', desc: '広角（自然な視野）' },
  { value: '50mm', label: '50mm', desc: '標準（人間の視野に近い）' },
  { value: '85mm', label: '85mm', desc: '中望遠（ポートレート向き）' },
  { value: 'macro', label: 'Macro', desc: 'マクロ（極小被写体）' }
] as const

// 実写モード用被写界深度
export const DEPTH_OF_FIELD_OPTIONS = [
  { value: 'shallow', label: 'Shallow', desc: '浅い（背景ボケ、被写体に集中）' },
  { value: 'medium', label: 'Medium', desc: '中程度（バランスの取れた描写）' },
  { value: 'deep', label: 'Deep', desc: '深い（全体にピント、環境重視）' }
] as const

// 実写モード用カメラモーション
export const CAMERA_MOTION_OPTIONS = [
  { value: 'locked_off', label: 'Locked Off', desc: '完全固定（安定した構図）' },
  { value: 'tripod', label: 'Tripod', desc: '三脚固定（微細な動き可能）' },
  { value: 'handheld', label: 'Handheld', desc: '手持ち（自然な揺れ）' },
  { value: 'gimbal', label: 'Gimbal', desc: 'ジンバル（滑らかな動き）' }
] as const

// アニメモード用線の太さ
export const LINE_WEIGHT_OPTIONS = [
  { value: 'thin', label: 'Thin', desc: '細い線（繊細で上品）' },
  { value: 'medium', label: 'Medium', desc: '中程度（バランスの取れた線）' },
  { value: 'bold', label: 'Bold', desc: '太い線（力強く印象的）' }
] as const

// アニメモード用陰影
export const SHADING_OPTIONS = [
  { value: 'flat', label: 'Flat', desc: 'フラット（平面的、ミニマル）' },
  { value: 'soft', label: 'Soft', desc: 'ソフト（柔らかい陰影）' },
  { value: 'hard', label: 'Hard', desc: 'ハード（はっきりした陰影）' }
] as const

// アニメモード用テクスチャ
export const TEXTURE_OPTIONS = [
  { value: 'clean', label: 'Clean', desc: 'クリーン（滑らかで現代的な）' },
  { value: 'film_grain', label: 'Film Grain', desc: 'フィルムグレイン（アナログ感）' },
  { value: 'paper', label: 'Paper', desc: 'ペーパー（手描き感）' }
] as const

// アニメモード用フレームレート
export const FRAME_RATE_OPTIONS = [
  { value: 'cinematic_24', label: '24fps', desc: 'シネマティック（映画的）' },
  { value: 'smooth_30', label: '30fps', desc: 'スムーズ（滑らか）' }
] as const

// 否定語彙（モード別）
export const NEGATIVE_PROMPTS = {
  common: [
    'no text overlays',
    'no watermarks',
    'no logos',
    'no brand names',
    'no written text',
    'no subtitles',
    'no captions'
  ],
  live_action: [
    'no CGI look',
    'no cartoonish outlines',
    'no anime style',
    'no illustrated look',
    'no hand-drawn appearance',
    'no cel shading',
    'no flat colors'
  ],
  anime: [
    'no messy linework',
    'no muddy colors',
    'no realistic photography',
    'no photorealistic style',
    'no live action footage',
    'no documentary style',
    'no shaky camera'
  ]
} as const

// デフォルトカラーパレット
export const DEFAULT_PALETTES = {
  live_action: {
    primary: '#C19A6B',
    secondary: '#6B4F3A',
    accents: ['#F2E6D8', '#8B4513', '#D2B48C'] as string[]
  },
  anime: {
    primary: '#FF6B9D',
    secondary: '#4ECDC4',
    accents: ['#FFE66D', '#FF8B94', '#A8E6CF'] as string[]
  }
}

// デフォルトライティング
export const DEFAULT_LIGHTING = {
  live_action: {
    en: 'warm soft lighting, golden hour, natural light',
    ja: '暖かいソフトな光、ゴールデンアワー、自然光'
  },
  anime: {
    en: 'soft studio lighting, even illumination, clean shadows',
    ja: 'ソフトなスタジオ照明、均等な照明、クリーンな影'
  }
} as const

// プラットフォーム別デフォルト配分
export const PLATFORM_DISTRIBUTIONS = {
  instagram: [3, 5, 6, 4],
  youtube: [4, 5, 6, 7, 3],
  shorts: [3, 5, 6, 6],
  tv: [3, 7, 5]
} as const

// デフォルトシーンラベル
export const DEFAULT_SCENE_LABELS = {
  instagram: ['S1-hook', 'S2-barista', 'S3-smile', 'S4-logo'],
  youtube: ['S1-opening', 'S2-barista', 'S3-guests', 'S4-ambience', 'S5-logo'],
  shorts: ['S1-hook', 'S2-barista', 'S3-smile', 'S4-logo'],
  tv: ['S1-opening', 'S2-core', 'S3-logo']
} as const

// カメラ設定のデフォルト値
export const DEFAULT_CAMERA_SPEC: CameraSpec = {
  shot_size: 'MS',
  angle: 'eye',
  movement: ['locked'],
  zoom: 'none'
}

// 実写モードのデフォルト設定
export const DEFAULT_LIVE_SPEC: LiveActionSpec = {
  lens: '50mm',
  depth_of_field: 'medium',
  camera_motion: 'tripod'
}

// アニメモードのデフォルト設定
export const DEFAULT_ANIME_SPEC: AnimeSpec = {
  line_weight: 'medium',
  shading: 'soft',
  texture: 'clean',
  frame_rate: 'cinematic_24'
}
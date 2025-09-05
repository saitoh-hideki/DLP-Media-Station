import { 
  VisualMode, 
  CameraSpec, 
  SceneInput,
  StyleGuide,
  Platform
} from './supabase'
import { 
  NEGATIVE_PROMPTS, 
  SHOT_SIZE_LABELS, 
  CAMERA_ANGLE_LABELS, 
  CAMERA_MOVEMENT_LABELS, 
  ZOOM_LABELS,
  LIVE_LENS_OPTIONS,
  DEPTH_OF_FIELD_OPTIONS,
  CAMERA_MOTION_OPTIONS,
  LINE_WEIGHT_OPTIONS,
  SHADING_OPTIONS,
  TEXTURE_OPTIONS,
  FRAME_RATE_OPTIONS
} from './runway-templates'

export interface PromptCompilerInput {
  platform: Platform
  shopName: string
  vibe: string
  mode: VisualMode
  camera: CameraSpec
  styleGuide: StyleGuide
  distribution: number[]
  scenes: SceneInput[]
  seed?: string
}

export interface CompiledPrompt {
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

export class PromptCompiler {
  private platform: Platform
  private shopName: string
  private vibe: string
  private mode: VisualMode
  private camera: CameraSpec
  private styleGuide: StyleGuide
  private distribution: number[]
  private scenes: SceneInput[]
  private seed?: string

  constructor(input: PromptCompilerInput) {
    this.platform = input.platform
    this.shopName = input.shopName
    this.vibe = input.vibe
    this.mode = input.mode
    this.camera = input.camera
    this.styleGuide = input.styleGuide
    this.distribution = input.distribution
    this.scenes = input.scenes
    this.seed = input.seed
  }

  compile(): CompiledPrompt {
    const aspect = this.getAspectRatio()
    const duration = this.distribution.reduce((a, b) => a + b, 0)
    
    // 否定語彙を生成
    const negative_en = this.generateNegativePrompts()
    const negative_ja = this.translateNegatives(negative_en)
    
    // アンカーを生成
    const anchor_en = this.generateAnchor()
    const anchor_ja = this.translateAnchor(anchor_en)
    
    // 各シーンのプロンプトを生成
    const compiledScenes = this.scenes.map((scene, index) => {
      const seconds = this.distribution[index] || 3
      const prompt_en = this.generateScenePrompt(scene, seconds)
      const prompt_ja = this.translateScenePrompt(prompt_en)
      
      return {
        label: scene.label,
        seconds,
        prompt_en,
        prompt_ja
      }
    })

    return {
      meta: {
        platform: this.platform,
        aspect,
        duration,
        distribution: this.distribution,
        shopName: this.shopName,
        vibe: this.vibe,
        mode: this.mode,
        seed: this.seed,
        model_version: 'gen-3'
      },
      style_guide: this.styleGuide,
      anchor_en,
      anchor_ja,
      scenes: compiledScenes,
      negative_en,
      negative_ja
    }
  }

  private getAspectRatio(): string {
    const aspectMap = {
      instagram: '9:16',
      youtube: '16:9',
      shorts: '9:16',
      tv: '16:9'
    }
    return aspectMap[this.platform]
  }

  private generateNegativePrompts(): string[] {
    const common = NEGATIVE_PROMPTS.common
    const modeSpecific = NEGATIVE_PROMPTS[this.mode]
    return [...common, ...modeSpecific]
  }

  private translateNegatives(negatives: string[]): string[] {
    const translations: Record<string, string> = {
      'no text overlays': 'テキストオーバーレイなし',
      'no watermarks': 'ウォーターマークなし',
      'no logos': 'ロゴなし',
      'no brand names': 'ブランド名なし',
      'no written text': '文字なし',
      'no subtitles': '字幕なし',
      'no captions': 'キャプションなし',
      'no CGI look': 'CGI風の見た目なし',
      'no cartoonish outlines': 'カートゥーン風の輪郭なし',
      'no anime style': 'アニメ風なし',
      'no illustrated look': 'イラスト風なし',
      'no hand-drawn appearance': '手描き風なし',
      'no cel shading': 'セルシェーディングなし',
      'no flat colors': 'フラットな色なし',
      'no messy linework': '乱雑な線画なし',
      'no muddy colors': '濁った色なし',
      'no realistic photography': 'リアルな写真なし',
      'no photorealistic style': 'フォトリアル風なし',
      'no live action footage': '実写映像なし',
      'no documentary style': 'ドキュメンタリー風なし',
      'no shaky camera': '手ブレなし'
    }
    
    return negatives.map(neg => translations[neg] || neg)
  }

  private generateAnchor(): string {
    const character = this.styleGuide.characters[0]
    const location = this.styleGuide.locations[0]
    const palette = this.styleGuide.palette
    
    if (character && location) {
      return `consistent look: ${character.name || 'character'} at ${location.name || 'location'} with ${palette.primary} and ${palette.secondary} color palette`
    }
    return 'consistent visual style throughout all scenes'
  }

  private translateAnchor(anchor: string): string {
    // 簡易的な翻訳（実際の実装ではより高度な翻訳が必要）
    return anchor.replace('consistent look:', '一貫性:').replace('character', 'キャラクター').replace('location', '場所')
  }

  private generateScenePrompt(scene: SceneInput, seconds: number): string {
    // 基本プロンプト構造
    const shotSize = SHOT_SIZE_LABELS[this.camera.shot_size].en
    const angle = CAMERA_ANGLE_LABELS[this.camera.angle].en
    const movements = this.camera.movement.map(m => CAMERA_MOVEMENT_LABELS[m].en).join(', ')
    const zoom = ZOOM_LABELS[this.camera.zoom].en
    
    // カメラ設定
    let cameraSpec = `${shotSize} shot, ${angle} angle`
    if (movements !== 'Locked Off') {
      cameraSpec += `, ${movements}`
    }
    if (zoom !== 'No Zoom') {
      cameraSpec += `, ${zoom}`
    }
    
    // モード別の詳細設定
    let modeSpec = ''
    if (this.mode === 'live_action' && this.styleGuide.live) {
      const lens = LIVE_LENS_OPTIONS.find(l => l.value === this.styleGuide.live!.lens)?.label || '50mm'
      const dof = DEPTH_OF_FIELD_OPTIONS.find(d => d.value === this.styleGuide.live!.depth_of_field)?.label || 'Medium'
      const motion = CAMERA_MOTION_OPTIONS.find(m => m.value === this.styleGuide.live!.camera_motion)?.label || 'Tripod'
      modeSpec = `, ${lens} lens, ${dof} depth of field, ${motion}`
    } else if (this.mode === 'anime' && this.styleGuide.anime) {
      const lineWeight = LINE_WEIGHT_OPTIONS.find(l => l.value === this.styleGuide.anime!.line_weight)?.label || 'Medium'
      const shading = SHADING_OPTIONS.find(s => s.value === this.styleGuide.anime!.shading)?.label || 'Soft'
      const texture = TEXTURE_OPTIONS.find(t => t.value === this.styleGuide.anime!.texture)?.label || 'Clean'
      const frameRate = FRAME_RATE_OPTIONS.find(f => f.value === this.styleGuide.anime!.frame_rate)?.label || '24fps'
      modeSpec = `, ${lineWeight} lines, ${shading} shading, ${texture} texture, ${frameRate}`
    }
    
    // ライティング
    const lighting = this.styleGuide.lighting_en
    
    // カラーパレット
    const palette = `color palette: ${this.styleGuide.palette.primary}, ${this.styleGuide.palette.secondary}`
    
    // シーンの内容（動画用に動きを追加）
    const sceneContent = scene.key_points || 'coffee shop scene'
    const motionDescription = this.generateMotionDescription(scene, seconds)
    
    // 否定語彙
    const negatives = this.generateNegativePrompts().join(', ')
    
    // アンカー
    const anchor = this.generateAnchor()
    
    // 動画用プロンプト（秒数表記を動きの表現に変更）
    const prompt = `${sceneContent} at ${this.shopName}, ${cameraSpec}${modeSpec}, ${lighting}, ${palette}, ${this.vibe} style, ${motionDescription}, ${negatives}, ${anchor}`
    
    return prompt
  }

  private generateMotionDescription(scene: SceneInput, seconds: number): string {
    // 動画用の動きの表現を生成（Runway Gen-3に最適化）
    const motionTemplates = {
      short: ['subtle camera movement', 'gentle pan', 'slow push-in'],
      medium: ['smooth camera work', 'character interaction', 'dynamic framing'],
      long: ['cinematic sequence', 'storytelling moment', 'dramatic reveal']
    }
    
    let motionType = 'short'
    if (seconds >= 5) motionType = 'long'
    else if (seconds >= 3) motionType = 'medium'
    
    const motions = motionTemplates[motionType as keyof typeof motionTemplates]
    const selectedMotion = motions[Math.floor(Math.random() * motions.length)]
    
    // シーンの内容に基づいて動きを調整
    if (scene.key_points?.toLowerCase().includes('barista') || scene.key_points?.toLowerCase().includes('staff')) {
      return `${selectedMotion}, barista preparing coffee with natural gestures, hands working with coffee equipment`
    } else if (scene.key_points?.toLowerCase().includes('customer') || scene.key_points?.toLowerCase().includes('guest')) {
      return `${selectedMotion}, customer enjoying coffee, relaxed atmosphere, sipping coffee`
    } else if (scene.key_points?.toLowerCase().includes('interior') || scene.key_points?.toLowerCase().includes('shop')) {
      return `${selectedMotion}, establishing shot of coffee shop interior, ambient activity, people in background`
    } else if (scene.key_points?.toLowerCase().includes('hook') || scene.key_points?.toLowerCase().includes('opening')) {
      return `${selectedMotion}, attention-grabbing opening, dynamic composition, engaging visual`
    } else if (scene.key_points?.toLowerCase().includes('logo') || scene.key_points?.toLowerCase().includes('brand')) {
      return `${selectedMotion}, brand reveal, logo appearance, memorable closing`
    } else {
      return `${selectedMotion}, coffee shop atmosphere, ${seconds} second video sequence`
    }
  }

  private translateScenePrompt(prompt: string): string {
    // 簡易的な翻訳（実際の実装ではより高度な翻訳が必要）
    const translations: Record<string, string> = {
      'shot': 'ショット',
      'angle': 'アングル',
      'lens': 'レンズ',
      'depth of field': '被写界深度',
      'lines': '線画',
      'shading': '陰影',
      'texture': 'テクスチャ',
      'color palette': 'カラーパレット',
      'style': 'スタイル',
      'coffee shop': 'コーヒーショップ',
      'warm': '温かい',
      'soft': 'ソフトな',
      'lighting': '照明',
      'golden hour': 'ゴールデンアワー',
      'natural light': '自然光',
      'cinematic': 'シネマティック',
      'documentary': 'ドキュメンタリー',
      'professional': 'プロフェッショナル',
      'lifestyle': 'ライフスタイル',
      'commercial': 'コマーシャル',
      'product showcase': '商品紹介',
      'behind the scenes': '舞台裏',
      'testimonial': 'お客様の声',
      'anime': 'アニメ',
      'clean lines': 'クリーンな線',
      'retro cel': 'レトロセル',
      'studio ghibli': 'スタジオジブリ',
      'modern anime': 'モダンアニメ',
      'manga': 'マンガ',
      'kawaii': 'かわいい',
      'dramatic': 'ドラマチック'
    }
    
    let translated = prompt
    Object.entries(translations).forEach(([en, ja]) => {
      translated = translated.replace(new RegExp(en, 'gi'), ja)
    })
    
    return translated
  }
}

// ヘルパー関数
export function compileRunwayPrompt(input: PromptCompilerInput): CompiledPrompt {
  const compiler = new PromptCompiler(input)
  return compiler.compile()
}

// プロンプトの差分を検出する関数
export function detectPromptChanges(current: CompiledPrompt, previous: CompiledPrompt): {
  scenes: Array<{ index: number; changes: string[] }>
  meta: string[]
  style_guide: string[]
} {
  const changes = {
    scenes: [] as Array<{ index: number; changes: string[] }>,
    meta: [] as string[],
    style_guide: [] as string[]
  }

  // メタデータの変更を検出
  Object.keys(current.meta).forEach(key => {
    if (current.meta[key as keyof typeof current.meta] !== previous.meta[key as keyof typeof previous.meta]) {
      changes.meta.push(`${key}: ${previous.meta[key as keyof typeof previous.meta]} → ${current.meta[key as keyof typeof current.meta]}`)
    }
  })

  // スタイルガイドの変更を検出
  if (JSON.stringify(current.style_guide) !== JSON.stringify(previous.style_guide)) {
    changes.style_guide.push('Style guide has been updated')
  }

  // シーンの変更を検出
  current.scenes.forEach((scene, index) => {
    const prevScene = previous.scenes[index]
    if (!prevScene) return

    const sceneChanges: string[] = []
    if (scene.prompt_en !== prevScene.prompt_en) {
      sceneChanges.push('English prompt updated')
    }
    if (scene.prompt_ja !== prevScene.prompt_ja) {
      sceneChanges.push('Japanese prompt updated')
    }
    if (scene.seconds !== prevScene.seconds) {
      sceneChanges.push(`Duration: ${prevScene.seconds}s → ${scene.seconds}s`)
    }
    if (scene.label !== prevScene.label) {
      sceneChanges.push(`Label: ${prevScene.label} → ${scene.label}`)
    }

    if (sceneChanges.length > 0) {
      changes.scenes.push({ index, changes: sceneChanges })
    }
  })

  return changes
}
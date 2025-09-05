'use client'

import { useState, useEffect } from 'react'
import { supabase, type RunwayContent, type VisualMode, type CameraSpec, type LiveActionSpec, type AnimeSpec, type StyleGuide, type SceneInput, type Platform } from '@/lib/supabase'
import { useCMConfig } from './CMConfig'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Loader2, Copy, Settings, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { 
  MODE_PRESETS, 
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
  FRAME_RATE_OPTIONS,
  DEFAULT_PALETTES,
  DEFAULT_LIGHTING,
  PLATFORM_DISTRIBUTIONS,
  DEFAULT_SCENE_LABELS,
  DEFAULT_CAMERA_SPEC,
  DEFAULT_LIVE_SPEC,
  DEFAULT_ANIME_SPEC
} from '@/lib/runway-templates'
import { compileRunwayPrompt, detectPromptChanges } from '@/lib/prompt-compiler'

interface RunwayGeneratorV2Props {
  onGenerated: () => void
}

export default function RunwayGeneratorV2({ onGenerated }: RunwayGeneratorV2Props) {
  const { config } = useCMConfig()
  
  // 基本状態
  const [mode, setMode] = useState<VisualMode>('live_action')
  const [customVibe, setCustomVibe] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RunwayContent | null>(null)
  const [error, setError] = useState('')
  const [showStyleGuide, setShowStyleGuide] = useState(false)
  const [showNegatives, setShowNegatives] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [previousResult, setPreviousResult] = useState<RunwayContent | null>(null)

  // カメラ設定
  const [camera, setCamera] = useState<CameraSpec>(DEFAULT_CAMERA_SPEC)
  
  // モード別設定
  const [liveSpec, setLiveSpec] = useState<LiveActionSpec>(DEFAULT_LIVE_SPEC)
  const [animeSpec, setAnimeSpec] = useState<AnimeSpec>(DEFAULT_ANIME_SPEC)
  
  // スタイルガイド
  const [styleGuide, setStyleGuide] = useState<StyleGuide>({
    style_id: 'COFFEE_CM_STYLE_001',
    characters: [{
      id: 'CHAR_A',
      name: 'Lead Barista',
      age: '30s',
      gender: 'unspecified',
      look_en: 'friendly barista with short dark hair',
      look_ja: '短めの黒髪の親しみやすいバリスタ',
      wardrobe_en: 'navy apron, white shirt',
      wardrobe_ja: 'ネイビーのエプロンと白シャツ'
    }],
    locations: [{
      id: 'LOC_A',
      name: `${config.shopName || 'Coffee Shop'} Interior`,
      look_en: 'modern cozy coffee shop interior with wooden tables and large window',
      look_ja: '木のテーブルと大きな窓があるモダンで居心地の良い店内'
    }],
    palette: DEFAULT_PALETTES.live_action,
    camera_lens: '50mm',
    lighting_en: DEFAULT_LIGHTING.live_action.en,
    lighting_ja: DEFAULT_LIGHTING.live_action.ja
  })

  // シーン設定
  const [scenes, setScenes] = useState<SceneInput[]>([])
  const [distribution, setDistribution] = useState<number[]>([])

  // 初期化
  useEffect(() => {
    const platformDistribution = PLATFORM_DISTRIBUTIONS[config.platform as keyof typeof PLATFORM_DISTRIBUTIONS] || [3, 5, 6, 4]
    const sceneLabels = DEFAULT_SCENE_LABELS[config.platform as keyof typeof DEFAULT_SCENE_LABELS] || ['S1-hook', 'S2-barista', 'S3-smile', 'S4-logo']
    
    setDistribution([...platformDistribution])
    setScenes(sceneLabels.map((label, index) => ({
      label,
      key_points: '',
      seconds: platformDistribution[index] || 3
    })))
  }, [config.platform])

  // モード変更時の処理
  useEffect(() => {
    const newPalette = DEFAULT_PALETTES[mode]
    const newLighting = DEFAULT_LIGHTING[mode]
    
    setStyleGuide(prev => ({
      ...prev,
      palette: newPalette,
      lighting_en: newLighting.en,
      lighting_ja: newLighting.ja,
      [mode === 'live_action' ? 'live' : 'anime']: mode === 'live_action' ? DEFAULT_LIVE_SPEC : DEFAULT_ANIME_SPEC
    }))
  }, [mode])

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    
    try {
      const vibe = (customVibe === 'default' ? '' : customVibe) || config.visualStyle
      
      // プロンプトをコンパイル
      const compiledPrompt = compileRunwayPrompt({
        platform: config.platform as Platform,
        shopName: config.shopName,
        vibe,
        mode,
        camera,
        styleGuide: {
          ...styleGuide,
          [mode === 'live_action' ? 'live' : 'anime']: mode === 'live_action' ? liveSpec : animeSpec
        },
        distribution,
        scenes
      })

      // 前回の結果を保存
      if (result) {
        setPreviousResult(result)
      }

      setResult(compiledPrompt)
      
      // データベースに保存
      const { error: dbError } = await supabase
        .from('generated_assets')
        .insert({
          type: 'runway',
          platform: config.platform,
          shop_name: config.shopName,
          content: compiledPrompt
        })

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(`データベースエラー: ${dbError.message}`)
      }
      
      onGenerated()
    } catch (err: unknown) {
      console.error('Generate error:', err)
      setError((err as Error).message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getChanges = () => {
    if (!result || !previousResult) return null
    return detectPromptChanges(result, previousResult)
  }

  const changes = getChanges()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Runway映像プロンプト生成 v2
        </CardTitle>
        <CardDescription>
          初心者でも迷わず操作できる設定UIで、アニメ/実写モードを選択可能なRunway Gen-3用プロンプトを生成します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 現在の設定表示 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">現在の設定</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <div>店舗名: {config.shopName || '未設定'}</div>
            <div>プラットフォーム: {config.platform}</div>
            <div>映像スタイル: {config.visualStyle}</div>
            <div>尺: {distribution.reduce((a, b) => a + b, 0)}秒</div>
          </div>
        </div>

        <Tabs defaultValue="mode" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mode">モード</TabsTrigger>
            <TabsTrigger value="camera">カメラ</TabsTrigger>
            <TabsTrigger value="style">スタイル</TabsTrigger>
            <TabsTrigger value="scenes">シーン</TabsTrigger>
          </TabsList>

          {/* モード選択タブ */}
          <TabsContent value="mode" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">ビジュアルモード</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={mode === 'live_action' ? 'default' : 'outline'}
                    onClick={() => setMode('live_action')}
                    className="flex-1"
                  >
                    実写モード
                  </Button>
                  <Button
                    variant={mode === 'anime' ? 'default' : 'outline'}
                    onClick={() => setMode('anime')}
                    className="flex-1"
                  >
                    アニメモード
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {mode === 'live_action' ? 'リアルな映像スタイル' : 'アニメーション風のスタイル'}
                </p>
              </div>

              <div>
                <Label htmlFor="customVibe">カスタム映像スタイル（オプション）</Label>
                <Select value={customVibe} onValueChange={setCustomVibe}>
                  <SelectTrigger id="customVibe">
                    <SelectValue placeholder="プリセットから選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">デフォルト設定を使用</SelectItem>
                    {MODE_PRESETS[mode].map((preset) => (
                      <SelectItem key={preset} value={preset}>
                        {preset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  空欄の場合は「映像スタイル」の設定が使用されます
                </p>
              </div>
            </div>
          </TabsContent>

          {/* カメラ設定タブ */}
          <TabsContent value="camera" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ショットサイズ */}
              <div>
                <Label htmlFor="shotSize">ショットサイズ</Label>
                <Select 
                  value={camera.shot_size} 
                  onValueChange={(value: 'CU' | 'MCU' | 'MS' | 'FS' | 'WS') => setCamera(prev => ({ ...prev, shot_size: value }))}
                >
                  <SelectTrigger id="shotSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SHOT_SIZE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{label.ja}</div>
                          <div className="text-sm text-gray-500">{label.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* カメラアングル */}
              <div>
                <Label htmlFor="cameraAngle">カメラアングル</Label>
                <Select 
                  value={camera.angle} 
                  onValueChange={(value: 'eye' | 'high' | 'low' | 'top') => setCamera(prev => ({ ...prev, angle: value }))}
                >
                  <SelectTrigger id="cameraAngle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAMERA_ANGLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{label.ja}</div>
                          <div className="text-sm text-gray-500">{label.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* カメラ動作 */}
              <div>
                <Label htmlFor="cameraMovement">カメラ動作</Label>
                <Select 
                  value={camera.movement[0] || 'locked'} 
                  onValueChange={(value: 'pan' | 'tilt' | 'dolly' | 'track' | 'handheld' | 'gimbal' | 'locked') => setCamera(prev => ({ ...prev, movement: [value] }))}
                >
                  <SelectTrigger id="cameraMovement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAMERA_MOVEMENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{label.ja}</div>
                          <div className="text-sm text-gray-500">{label.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ズーム */}
              <div>
                <Label htmlFor="zoom">ズーム</Label>
                <Select 
                  value={camera.zoom} 
                  onValueChange={(value: 'in' | 'out' | 'none') => setCamera(prev => ({ ...prev, zoom: value }))}
                >
                  <SelectTrigger id="zoom">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ZOOM_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div className="font-medium">{label.ja}</div>
                          <div className="text-sm text-gray-500">{label.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* モード別詳細設定 */}
            {mode === 'live_action' && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">実写モード詳細設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="lens">レンズ</Label>
                    <Select 
                      value={liveSpec.lens} 
                      onValueChange={(value: '24mm' | '35mm' | '50mm' | '85mm' | 'macro') => setLiveSpec(prev => ({ ...prev, lens: value }))}
                    >
                      <SelectTrigger id="lens">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIVE_LENS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="depthOfField">被写界深度</Label>
                    <Select 
                      value={liveSpec.depth_of_field} 
                      onValueChange={(value: 'shallow' | 'medium' | 'deep') => setLiveSpec(prev => ({ ...prev, depth_of_field: value }))}
                    >
                      <SelectTrigger id="depthOfField">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPTH_OF_FIELD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cameraMotion">カメラモーション</Label>
                    <Select 
                      value={liveSpec.camera_motion} 
                      onValueChange={(value: 'locked_off' | 'tripod' | 'handheld' | 'gimbal') => setLiveSpec(prev => ({ ...prev, camera_motion: value }))}
                    >
                      <SelectTrigger id="cameraMotion">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMERA_MOTION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {mode === 'anime' && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">アニメモード詳細設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lineWeight">線の太さ</Label>
                    <Select 
                      value={animeSpec.line_weight} 
                      onValueChange={(value: 'thin' | 'medium' | 'bold') => setAnimeSpec(prev => ({ ...prev, line_weight: value }))}
                    >
                      <SelectTrigger id="lineWeight">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINE_WEIGHT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="shading">陰影</Label>
                    <Select 
                      value={animeSpec.shading} 
                      onValueChange={(value: 'flat' | 'soft' | 'hard') => setAnimeSpec(prev => ({ ...prev, shading: value }))}
                    >
                      <SelectTrigger id="shading">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHADING_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="texture">テクスチャ</Label>
                    <Select 
                      value={animeSpec.texture} 
                      onValueChange={(value: 'clean' | 'film_grain' | 'paper') => setAnimeSpec(prev => ({ ...prev, texture: value }))}
                    >
                      <SelectTrigger id="texture">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEXTURE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="frameRate">フレームレート</Label>
                    <Select 
                      value={animeSpec.frame_rate} 
                      onValueChange={(value: 'cinematic_24' | 'smooth_30') => setAnimeSpec(prev => ({ ...prev, frame_rate: value }))}
                    >
                      <SelectTrigger id="frameRate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FRAME_RATE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* スタイル設定タブ */}
          <TabsContent value="style" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">カラーパレット</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label htmlFor="primaryColor" className="text-sm">プライマリ</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={styleGuide.palette.primary}
                      onChange={(e) => setStyleGuide(prev => ({
                        ...prev,
                        palette: { ...prev.palette, primary: e.target.value }
                      }))}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-sm">セカンダリ</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={styleGuide.palette.secondary}
                      onChange={(e) => setStyleGuide(prev => ({
                        ...prev,
                        palette: { ...prev.palette, secondary: e.target.value }
                      }))}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accentColor" className="text-sm">アクセント</Label>
                    <Input
                      id="accentColor"
                      type="color"
                      value={styleGuide.palette.accents[0] || '#000000'}
                      onChange={(e) => setStyleGuide(prev => ({
                        ...prev,
                        palette: { 
                          ...prev.palette, 
                          accents: [e.target.value, ...prev.palette.accents.slice(1)]
                        }
                      }))}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="lightingEn" className="text-base font-medium">ライティング（英語）</Label>
                <Input
                  id="lightingEn"
                  value={styleGuide.lighting_en}
                  onChange={(e) => setStyleGuide(prev => ({ ...prev, lighting_en: e.target.value }))}
                  placeholder="warm soft lighting, golden hour"
                />
              </div>

              <div>
                <Label htmlFor="lightingJa" className="text-base font-medium">ライティング（日本語）</Label>
                <Input
                  id="lightingJa"
                  value={styleGuide.lighting_ja}
                  onChange={(e) => setStyleGuide(prev => ({ ...prev, lighting_ja: e.target.value }))}
                  placeholder="暖かいソフトな光、ゴールデンアワー"
                />
              </div>
            </div>
          </TabsContent>

          {/* シーン設定タブ */}
          <TabsContent value="scenes" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">シーン設定</h4>
                <div className="text-sm text-gray-500">
                  合計: {distribution.reduce((a, b) => a + b, 0)}秒
                </div>
              </div>
              
              {scenes.map((scene, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-20">
                      <Label htmlFor={`sceneLabel-${index}`} className="text-sm">ラベル</Label>
                      <Input
                        id={`sceneLabel-${index}`}
                        value={scene.label}
                        onChange={(e) => {
                          const newScenes = [...scenes]
                          newScenes[index].label = e.target.value
                          setScenes(newScenes)
                        }}
                        className="text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <Label htmlFor={`sceneSeconds-${index}`} className="text-sm">秒数</Label>
                      <Input
                        id={`sceneSeconds-${index}`}
                        type="number"
                        value={scene.seconds}
                        onChange={(e) => {
                          const newScenes = [...scenes]
                          newScenes[index].seconds = parseInt(e.target.value) || 3
                          setScenes(newScenes)
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`sceneKeyPoints-${index}`} className="text-sm">シーンの要点</Label>
                    <Input
                      id={`sceneKeyPoints-${index}`}
                      value={scene.key_points}
                      onChange={(e) => {
                        const newScenes = [...scenes]
                        newScenes[index].key_points = e.target.value
                        setScenes(newScenes)
                      }}
                      placeholder="このシーンで表現したい内容を入力"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 生成ボタン */}
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !config.shopName}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            'プロンプト生成'
          )}
        </Button>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 生成結果 */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">生成結果</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStyleGuide(!showStyleGuide)}
                >
                  {showStyleGuide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showStyleGuide ? 'スタイルガイドを隠す' : 'スタイルガイドを表示'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNegatives(!showNegatives)}
                >
                  {showNegatives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  否定語彙
                </Button>
                {previousResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiff(!showDiff)}
                  >
                    {showDiff ? '差分を隠す' : '差分を表示'}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-500">アスペクト比: {result.meta.aspect}</span>
                <span className="text-gray-500">尺: {result.meta.duration}秒</span>
                <span className="text-gray-500">シーン数: {result.scenes.length}</span>
                <span className="text-gray-500">モード: {result.meta.mode === 'live_action' ? '実写' : 'アニメ'}</span>
              </div>
            </div>

            {/* 差分表示 */}
            {showDiff && changes && (
              <div className="bg-yellow-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-yellow-900">前回からの変更点</h4>
                {changes.meta.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-800">メタデータ:</h5>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {changes.meta.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {changes.scenes.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-800">シーン:</h5>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {changes.scenes.map((scene, i) => (
                        <li key={i}>
                          シーン{scene.index + 1}: {scene.changes.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 否定語彙表示 */}
            {showNegatives && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-900">否定語彙</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">英語</h5>
                    <div className="space-y-1">
                      {result.negative_en.map((neg, i) => (
                        <div key={i} className="text-gray-600">• {neg}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">日本語</h5>
                    <div className="space-y-1">
                      {result.negative_ja.map((neg, i) => (
                        <div key={i} className="text-gray-600">• {neg}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* スタイルガイド表示 */}
            {showStyleGuide && (
              <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-purple-900">スタイルガイド</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-purple-800 mb-2">キャラクター</h5>
                    {result.style_guide.characters.map((char, i) => (
                      <div key={i} className="mb-2 p-2 bg-white rounded">
                        <div className="font-medium">{char.name} ({char.age})</div>
                        <div className="text-gray-600">{char.look_ja}</div>
                        <div className="text-gray-500">{char.wardrobe_ja}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-purple-800 mb-2">ロケーション</h5>
                    {result.style_guide.locations.map((loc, i) => (
                      <div key={i} className="mb-2 p-2 bg-white rounded">
                        <div className="font-medium">{loc.name}</div>
                        <div className="text-gray-600">{loc.look_ja}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-purple-800 mb-1">カラーパレット</h5>
                    <div className="flex gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: result.style_guide.palette.primary }}
                        title={result.style_guide.palette.primary}
                      />
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: result.style_guide.palette.secondary }}
                        title={result.style_guide.palette.secondary}
                      />
                      {result.style_guide.palette.accents.map((color, i) => (
                        <div 
                          key={i}
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-purple-800 mb-1">カメラレンズ</h5>
                    <div className="text-gray-600">{result.style_guide.camera_lens}</div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-purple-800 mb-1">ライティング</h5>
                    <div className="text-gray-600">{result.style_guide.lighting_ja}</div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded">
                  <h5 className="font-medium text-purple-800 mb-1">一貫性アンカー</h5>
                  <div className="text-sm text-gray-600">
                    <div><strong>英語:</strong> {result.anchor_en}</div>
                    <div><strong>日本語:</strong> {result.anchor_ja}</div>
                  </div>
                </div>
              </div>
            )}

            {/* シーンプロンプト表示 */}
            <div className="space-y-3">
              {result.scenes.map((scene: { label: string; seconds: number; prompt_en: string; prompt_ja: string }, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium">{scene.label}</span>
                      <span className="text-sm text-gray-500 ml-2">({scene.seconds}秒)</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(scene.prompt_en)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 mb-1">英語プロンプト</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {scene.prompt_en}
                      </p>
                    </div>
                    
                    {scene.prompt_ja && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-1">日本語訳</h5>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {scene.prompt_ja}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
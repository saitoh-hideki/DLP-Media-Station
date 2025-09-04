'use client'

import { useState, createContext, useContext, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Save, Settings } from 'lucide-react'

export interface CMConfig {
  shopName: string
  platform: string
  targetAudience: string
  brandTone: string
  keyMessage: string
  callToAction: string
  duration: string
  visualStyle: string
  musicStyle: string
  narrationStyle: string
}

const defaultConfig: CMConfig = {
  shopName: '',
  platform: 'youtube',
  targetAudience: '20-40代の男女',
  brandTone: '温かく上質で親しみやすい',
  keyMessage: '',
  callToAction: '今すぐお試しください',
  duration: '15',
  visualStyle: 'jazz',
  musicStyle: 'jazz',
  narrationStyle: '温かく上質で親しみやすい'
}

const CMConfigContext = createContext<{
  config: CMConfig
  updateConfig: (updates: Partial<CMConfig>) => void
  resetConfig: () => void
}>({
  config: defaultConfig,
  updateConfig: () => {},
  resetConfig: () => {}
})

export const useCMConfig = () => useContext(CMConfigContext)

interface CMConfigProviderProps {
  children: ReactNode
}

export function CMConfigProvider({ children }: CMConfigProviderProps) {
  const [config, setConfig] = useState<CMConfig>(defaultConfig)

  const updateConfig = (updates: Partial<CMConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const resetConfig = () => {
    setConfig(defaultConfig)
  }

  return (
    <CMConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </CMConfigContext.Provider>
  )
}

interface CMConfigPanelProps {
  onConfigChange?: (config: CMConfig) => void
}

export function CMConfigPanel({ onConfigChange }: CMConfigPanelProps) {
  const { config, updateConfig, resetConfig } = useCMConfig()

  const handleSave = () => {
    if (onConfigChange) {
      onConfigChange(config)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          CM設定
        </CardTitle>
        <CardDescription>
          共通のCM設定を管理し、ナレーション・映像・BGMのプロンプト生成に使用します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shopName">店舗名 *</Label>
            <Input
              id="shopName"
              placeholder="Sunrise Coffee"
              value={config.shopName}
              onChange={(e) => updateConfig({ shopName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">配信プラットフォーム</Label>
            <Select value={config.platform} onValueChange={(value) => updateConfig({ platform: value })}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram Reels (9:16)</SelectItem>
                <SelectItem value="youtube">YouTube (16:9)</SelectItem>
                <SelectItem value="shorts">YouTube Shorts (9:16)</SelectItem>
                <SelectItem value="tv">TV CM (16:9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">ターゲット層</Label>
            <Input
              id="targetAudience"
              placeholder="20-40代の男女"
              value={config.targetAudience}
              onChange={(e) => updateConfig({ targetAudience: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">尺（秒）</Label>
            <Select value={config.duration} onValueChange={(value) => updateConfig({ duration: value })}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15秒</SelectItem>
                <SelectItem value="30">30秒</SelectItem>
                <SelectItem value="60">60秒</SelectItem>
                <SelectItem value="90">90秒</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keyMessage">キーメッセージ</Label>
          <Textarea
            id="keyMessage"
            placeholder="お客様に伝えたい核心的なメッセージ"
            value={config.keyMessage}
            onChange={(e) => updateConfig({ keyMessage: e.target.value })}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="callToAction">コールトゥアクション</Label>
          <Input
            id="callToAction"
            placeholder="今すぐお試しください"
            value={config.callToAction}
            onChange={(e) => updateConfig({ callToAction: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brandTone">ブランドトーン</Label>
            <Input
              id="brandTone"
              placeholder="温かく上質で親しみやすい"
              value={config.brandTone}
              onChange={(e) => updateConfig({ brandTone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visualStyle">映像スタイル</Label>
            <Select value={config.visualStyle} onValueChange={(value) => updateConfig({ visualStyle: value })}>
              <SelectTrigger id="visualStyle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jazz">Jazz (温かみのある)</SelectItem>
                <SelectItem value="ambient">Ambient (幻想的な)</SelectItem>
                <SelectItem value="acoustic">Acoustic (自然な)</SelectItem>
                <SelectItem value="electronic">Electronic (モダンな)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="musicStyle">音楽スタイル</Label>
            <Select value={config.musicStyle} onValueChange={(value) => updateConfig({ musicStyle: value })}>
              <SelectTrigger id="musicStyle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jazz">Jazz (warm, cozy)</SelectItem>
                <SelectItem value="ambient">Ambient (ethereal, atmospheric)</SelectItem>
                <SelectItem value="acoustic">Acoustic (organic, intimate)</SelectItem>
                <SelectItem value="electronic">Electronic (modern, chill)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            設定を保存
          </Button>
          <Button variant="outline" onClick={resetConfig}>
            リセット
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CMConfigPanel
'use client'

import { useState } from 'react'
import { supabase, type RunwayContent } from '@/lib/supabase'
import { useCMConfig } from './CMConfig'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Loader2, Copy, Settings } from 'lucide-react'

interface RunwayGeneratorProps {
  onGenerated: () => void
}

export default function RunwayGenerator({ onGenerated }: RunwayGeneratorProps) {
  const { config } = useCMConfig()
  const [customVibe, setCustomVibe] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RunwayContent | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    
    try {
      const vibe = (customVibe === 'default' ? '' : customVibe) || config.visualStyle
      const { data, error: fnError } = await supabase.functions.invoke('prep-runway', {
        body: { 
          shopName: config.shopName, 
          platform: config.platform, 
          vibe,
          keyMessage: config.keyMessage,
          callToAction: config.callToAction,
          targetAudience: config.targetAudience,
          duration: config.duration
        }
      })

      if (fnError) {
        console.error('Function error:', fnError)
        if (fnError.message?.includes('CORS')) {
          throw new Error('CORSエラー: サーバーの設定を確認してください')
        } else if (fnError.message?.includes('Failed to fetch')) {
          throw new Error('ネットワークエラー: インターネット接続を確認してください')
        } else {
          throw fnError
        }
      }

      if (!data) {
        throw new Error('サーバーからデータが返されませんでした')
      }

      setResult(data)
      
      const { error: dbError } = await supabase
        .from('generated_assets')
        .insert({
          type: 'runway',
          platform: config.platform,
          shop_name: config.shopName,
          content: data
        })

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(`データベースエラー: ${dbError.message}`)
      }
      
      onGenerated()
    } catch (err: any) {
      console.error('Generate error:', err)
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Runway映像プロンプト生成
        </CardTitle>
        <CardDescription>
          CM設定に基づいてRunway Gen-3用のプロンプトを生成します。設定は「CM設定」タブで変更できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">現在の設定</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <div>店舗名: {config.shopName || '未設定'}</div>
            <div>プラットフォーム: {config.platform}</div>
            <div>映像スタイル: {config.visualStyle}</div>
            <div>尺: {config.duration}秒</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customVibe">カスタム映像スタイル（オプション）</Label>
          <Select value={customVibe} onValueChange={setCustomVibe}>
            <SelectTrigger id="customVibe">
              <SelectValue placeholder="設定を上書きする場合は選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">デフォルト設定を使用</SelectItem>
              <SelectItem value="jazz">Jazz (温かみのある)</SelectItem>
              <SelectItem value="ambient">Ambient (幻想的な)</SelectItem>
              <SelectItem value="acoustic">Acoustic (自然な)</SelectItem>
              <SelectItem value="electronic">Electronic (モダンな)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            空欄の場合は「映像スタイル」の設定が使用されます
          </p>
        </div>

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
            '生成'
          )}
        </Button>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">生成結果</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-500">アスペクト比: {result.meta.aspect}</span>
                <span className="text-gray-500">尺: {result.meta.duration}秒</span>
                <span className="text-gray-500">シーン数: {result.scenes.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              {result.scenes.map((scene: any, index: number) => (
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
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {scene.prompt_en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
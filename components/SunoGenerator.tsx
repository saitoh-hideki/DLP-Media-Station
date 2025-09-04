'use client'

import { useState } from 'react'
import { supabase, type SunoContent } from '@/lib/supabase'
import { useCMConfig } from './CMConfig'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Loader2, Copy, Settings } from 'lucide-react'

interface SunoGeneratorProps {
  onGenerated: () => void
}

export default function SunoGenerator({ onGenerated }: SunoGeneratorProps) {
  const { config } = useCMConfig()
  const [customVibe, setCustomVibe] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SunoContent | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    
    try {
      const vibe = (customVibe === 'default' ? '' : customVibe) || config.musicStyle
      const { data, error: fnError } = await supabase.functions.invoke('prep-suno', {
        body: { 
          platform: config.platform, 
          vibe,
          keyMessage: config.keyMessage,
          callToAction: config.callToAction,
          targetAudience: config.targetAudience,
          duration: config.duration
        }
      })

      if (fnError) throw fnError

      setResult(data)
      
      const { error: dbError } = await supabase
        .from('generated_assets')
        .insert({
          type: 'suno',
          platform: config.platform,
          shop_name: config.shopName || '-',
          content: data
        })

      if (dbError) throw dbError
      
      onGenerated()
    } catch (err: any) {
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
          Suno BGMプロンプト生成
        </CardTitle>
        <CardDescription>
          CM設定に基づいてSuno AI用のBGMプロンプトを生成します。設定は「CM設定」タブで変更できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">現在の設定</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <div>プラットフォーム: {config.platform}</div>
            <div>音楽スタイル: {config.musicStyle}</div>
            <div>尺: {config.duration}秒</div>
            <div>店舗名: {config.shopName || '未設定'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customVibe">カスタム音楽スタイル（オプション）</Label>
          <Select value={customVibe} onValueChange={setCustomVibe}>
            <SelectTrigger id="customVibe">
              <SelectValue placeholder="設定を上書きする場合は選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">デフォルト設定を使用</SelectItem>
              <SelectItem value="jazz">Jazz (warm, cozy)</SelectItem>
              <SelectItem value="ambient">Ambient (ethereal, atmospheric)</SelectItem>
              <SelectItem value="acoustic">Acoustic (organic, intimate)</SelectItem>
              <SelectItem value="electronic">Electronic (modern, chill)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            空欄の場合は「音楽スタイル」の設定が使用されます
          </p>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={loading}
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
            
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  BPM: {result.meta.bpm_range[0]}-{result.meta.bpm_range[1]}
                </span>
                <span className="text-gray-500">スタイル: {result.meta.vibe}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">プロンプト</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(result.prompt_en)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.prompt_en}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">スタイルタグ</h4>
              <div className="flex flex-wrap gap-2">
                {result.styles.map((style: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white rounded-md text-xs border border-gray-200"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
'use client'

import { useState } from 'react'
import { supabase, type NarrationContent } from '@/lib/supabase'
import { useCMConfig } from './CMConfig'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Loader2, Copy, Settings } from 'lucide-react'

interface NarrationGeneratorProps {
  onGenerated: () => void
}

export default function NarrationGenerator({ onGenerated }: NarrationGeneratorProps) {
  const { config } = useCMConfig()
  const [customTone, setCustomTone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NarrationContent | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    
    try {
      const tone = customTone || config.brandTone
      const { data, error: fnError } = await supabase.functions.invoke('prep-narration', {
        body: { 
          shopName: config.shopName, 
          platform: config.platform, 
          tone,
          keyMessage: config.keyMessage,
          callToAction: config.callToAction,
          targetAudience: config.targetAudience
        }
      })

      if (fnError) throw fnError

      setResult(data)
      
      const { error: dbError } = await supabase
        .from('generated_assets')
        .insert({
          type: 'narration',
          platform: config.platform,
          shop_name: config.shopName,
          content: data
        })

      if (dbError) throw dbError
      
      onGenerated()
    } catch (err: unknown) {
      setError((err as Error).message || 'エラーが発生しました')
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
          ナレーション生成
        </CardTitle>
        <CardDescription>
          CM設定に基づいてナレーションを生成します。設定は「CM設定」タブで変更できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">現在の設定</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <div>店舗名: {config.shopName || '未設定'}</div>
            <div>プラットフォーム: {config.platform}</div>
            <div>ターゲット: {config.targetAudience}</div>
            <div>ブランドトーン: {config.brandTone}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customTone">カスタムトーン（オプション）</Label>
          <Input
            id="customTone"
            placeholder="設定を上書きする場合は入力してください"
            value={customTone}
            onChange={(e) => setCustomTone(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            空欄の場合は「ブランドトーン」の設定が使用されます
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
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">プラットフォーム: {result.meta.platform}</span>
                <span className="text-sm text-gray-500">行数: {result.meta.lines}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">ナレーション</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(result.narration.join('\n'))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-medium text-gray-600 mb-1">日本語ナレーション</h5>
                  {result.narration.map((line: string, index: number) => (
                    <p key={index} className="text-sm">
                      {index + 1}. {line}
                    </p>
                  ))}
                </div>
                
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {result.copy_for_tts}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { supabase, type GeneratedAsset } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Copy, MessageSquare, Film, Music, FileText, X } from 'lucide-react'

export default function AssetHistory() {
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null)
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_assets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setAssets(data || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'narration': return <FileText className="h-4 w-4" />
      case 'runway': return <Film className="h-4 w-4" />
      case 'suno': return <Music className="h-4 w-4" />
      default: return null
    }
  }

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case 'narration': return 'ナレーション'
      case 'runway': return '映像プロンプト'
      case 'suno': return 'BGM'
      default: return type
    }
  }

  const copyToClipboard = (content: unknown) => {
    const text = JSON.stringify(content, null, 2)
    navigator.clipboard.writeText(text)
  }

  const addComment = async () => {
    if (!selectedAsset || !newComment.trim()) return

    setSavingComment(true)
    try {
      const updatedComments = [...selectedAsset.comments, newComment.trim()]
      
      const { error } = await supabase
        .from('generated_assets')
        .update({ comments: updatedComments })
        .eq('id', selectedAsset.id)

      if (error) throw error

      setSelectedAsset({
        ...selectedAsset,
        comments: updatedComments
      })
      setNewComment('')
      fetchAssets()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSavingComment(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderContent = (asset: GeneratedAsset) => {
    const content = asset.content

    if (asset.type === 'narration' && 'narration' in content && content.narration) {
      return (
        <div className="space-y-1">
          {content.narration.map((line: string, i: number) => (
            <p key={i} className="text-sm">{line}</p>
          ))}
        </div>
      )
    }

    if (asset.type === 'runway' && 'scenes' in content && content.scenes) {
      return (
        <div className="space-y-2">
          {content.scenes.map((scene: { label: string; seconds: number }, i: number) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{scene.label}</span>
              <span className="text-gray-500 ml-1">({scene.seconds}秒)</span>
            </div>
          ))}
        </div>
      )
    }

    if (asset.type === 'suno' && 'prompt_en' in content && content.prompt_en) {
      return (
        <p className="text-sm text-gray-700 line-clamp-3">
          {content.prompt_en}
        </p>
      )
    }

    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>生成履歴</CardTitle>
          <CardDescription>
            過去に生成したアセットの一覧とコメント管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだ生成されたアセットがありません
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAssetIcon(asset.type)}
                      <span className="font-medium text-sm">
                        {getAssetTypeLabel(asset.type)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {asset.platform}
                    </span>
                  </div>

                  {asset.shop_name !== '-' && (
                    <p className="font-semibold text-sm mb-2">
                      {asset.shop_name}
                    </p>
                  )}

                  <div className="text-gray-600 text-sm mb-2 line-clamp-3">
                    {renderContent(asset)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(asset.created_at)}</span>
                    {asset.comments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{asset.comments.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getAssetIcon(selectedAsset.type)}
                <span className="font-semibold">
                  {getAssetTypeLabel(selectedAsset.type)} - {selectedAsset.shop_name}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedAsset(null)
                  setNewComment('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">コンテンツ</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedAsset.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(selectedAsset.content, null, 2)}
                </pre>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">コメント</h4>
                
                {selectedAsset.comments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAsset.comments.map((comment, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">{comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">コメントはまだありません</p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="comment">新しいコメントを追加</Label>
                  <Textarea
                    id="comment"
                    placeholder="改善点や次回への指示を入力..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={addComment}
                    disabled={!newComment.trim() || savingComment}
                    className="w-full"
                  >
                    {savingComment ? '保存中...' : 'コメントを追加'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
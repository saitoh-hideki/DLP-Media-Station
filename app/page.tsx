'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CMConfigProvider, CMConfigPanel } from '@/components/CMConfig'
import NarrationGenerator from '@/components/NarrationGenerator'
import RunwayGenerator from '@/components/RunwayGenerator'
import SunoGenerator from '@/components/SunoGenerator'
import AssetHistory from '@/components/AssetHistory'

export default function Home() {
  const [refreshHistory, setRefreshHistory] = useState(0)

  return (
    <CMConfigProvider>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">DLP Media Station</h1>
          <p className="text-gray-600">AI CM制作プラットフォーム - Runway, Suno, ElevenLabs連携</p>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="config">CM設定</TabsTrigger>
            <TabsTrigger value="narration">ナレーション</TabsTrigger>
            <TabsTrigger value="runway">映像プロンプト</TabsTrigger>
            <TabsTrigger value="suno">BGM</TabsTrigger>
            <TabsTrigger value="history">履歴</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <CMConfigPanel />
          </TabsContent>

          <TabsContent value="narration">
            <NarrationGenerator onGenerated={() => setRefreshHistory(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="runway">
            <RunwayGenerator onGenerated={() => setRefreshHistory(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="suno">
            <SunoGenerator onGenerated={() => setRefreshHistory(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="history">
            <AssetHistory key={refreshHistory} />
          </TabsContent>
        </Tabs>
      </main>
    </CMConfigProvider>
  )
}

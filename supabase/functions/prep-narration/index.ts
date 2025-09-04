import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const PLATFORM_CONFIG = {
  instagram: { lines: 4, maxChars: 30 },
  youtube: { lines: 5, maxChars: 35 },
  shorts: { lines: 4, maxChars: 30 },
  tv: { lines: 4, maxChars: 35 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { shopName, platform = 'youtube', tone = '温かく上質で親しみやすい' } = await req.json()

    if (!shopName) {
      throw new Error('shopName is required')
    }

    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.youtube
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const prompt = `
あなたは高級CM制作のプロコピーライターです。
店名: ${shopName}
配信先: ${platform}
トーン: ${tone}
行数: ${config.lines}行

以下の条件で日本語ナレーション原稿を作成してください：
- 各行は20-${config.maxChars}文字以内（読点は最大1つ）
- 要素：温かさ・香り・笑顔・くつろぎ・特別感
- 禁止：40文字超、早口連結、語尾の連続
- 最後の行は「${shopName} — [5-8文字のキャッチコピー]」形式

プラットフォーム別の特徴：
- instagram: 冒頭で掴む、視覚的なインパクト重視
- youtube: ナレーション重視、物語性
- shorts: テンポ重視、簡潔で印象的
- tv: 印象優先、ブランドイメージ重視

回答は以下のJSON形式のみで返してください：
{
  "narration": ["行1", "行2", ...],
  "copy_for_tts": "上記を行ごとに読み上げ"
}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a professional copywriter for luxury commercials. Always respond in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    const output = {
      meta: { 
        platform, 
        lines: config.lines,
        shopName,
        tone 
      },
      narration: result.narration,
      copy_for_tts: result.copy_for_tts || "上記を行ごとに読み上げ"
    }

    return new Response(
      JSON.stringify(output),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
})
// @ts-ignore - Deno環境でのインポート
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno環境でのインポート
import { corsHeaders } from "../_shared/cors.ts"

// Deno環境の型定義
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const PLATFORM_BPM = {
  instagram: { min: 88, max: 92 },
  youtube: { min: 78, max: 82 },
  shorts: { min: 88, max: 92 },
  tv: { min: 78, max: 82 }
}

const VIBE_STYLES = {
  jazz: ['jazz', 'instrumental', 'cozy', 'warm', 'acoustic', 'lo-fi texture'],
  ambient: ['ambient', 'instrumental', 'ethereal', 'atmospheric', 'minimal', 'soft'],
  acoustic: ['acoustic', 'instrumental', 'folk', 'warm', 'organic', 'intimate'],
  electronic: ['electronic', 'instrumental', 'chill', 'modern', 'ambient', 'downtempo']
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { platform = 'youtube', vibe = 'jazz' } = await req.json()

    const bpmRange = PLATFORM_BPM[platform as keyof typeof PLATFORM_BPM] || PLATFORM_BPM.youtube
    const styles = VIBE_STYLES[vibe as keyof typeof VIBE_STYLES] || VIBE_STYLES.jazz
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const prompt = `
You are a professional music prompt creator for Suno AI.
Create a BGM prompt for a coffee shop commercial.

Platform: ${platform}
BPM Range: ${bpmRange.min}-${bpmRange.max}
Vibe: ${vibe}
Styles: ${styles.join(', ')}

Requirements:
1. Must be instrumental only (no vocals)
2. Include specific BPM range
3. Mention instruments appropriate for the vibe
4. Simple A-B structure that's easy to edit
5. Should work well for ${platform === 'tv' || platform === 'youtube' ? '30' : '15-20'} second cuts
6. Include texture elements (vinyl, lo-fi, etc.)

Platform-specific needs:
- instagram/shorts: More energetic, clear beat, modern feel
- youtube/tv: More atmospheric, emotional, sophisticated

Create a single comprehensive prompt (100-150 words) that Suno can use directly.

Return as JSON:
{
  "prompt_en": "...",
  "styles": ["style1", "style2", ...]
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
          { role: 'system', content: 'You are a professional music prompt creator. Always respond in valid JSON format.' },
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
        bpm_range: [bpmRange.min, bpmRange.max],
        vibe 
      },
      prompt_en: result.prompt_en,
      styles: result.styles || styles
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
      JSON.stringify({ error: (error as Error).message }),
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
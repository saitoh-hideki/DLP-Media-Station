import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const PLATFORM_CONFIG = {
  instagram: { aspect: '9:16', duration: 18, scenes: 4, distribution: [3, 5, 6, 4] },
  youtube: { aspect: '16:9', duration: 30, scenes: 5, distribution: [4, 5, 6, 7, 3] },
  shorts: { aspect: '9:16', duration: 20, scenes: 4, distribution: [3, 5, 6, 6] },
  tv: { aspect: '16:9', duration: 15, scenes: 3, distribution: [3, 7, 5] }
}

const FIXED_VOCAB = 'cinematic, warm soft lighting, shallow depth of field, 50mm lens look, gentle pan/push-in, golden hour, subtle film grain, natural light'
const NEGATIVE_PROMPT = 'no street food cart, no tea house, no retro diner'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { shopName, platform = 'youtube', vibe = 'jazz' } = await req.json()

    if (!shopName) {
      throw new Error('shopName is required')
    }

    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.youtube
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const prompt = `
You are a professional video prompt creator for Runway Gen-3.
Create ${config.scenes} scene prompts for a ${shopName} commercial.

Platform: ${platform}
Aspect Ratio: ${config.aspect}
Total Duration: ${config.duration} seconds
Scene Distribution: ${config.distribution.join(', ')} seconds
Vibe: ${vibe}

Rules:
1. Each prompt must include: "${FIXED_VOCAB}"
2. Each prompt must end with: "${NEGATIVE_PROMPT}"
3. Scene types should vary: exterior, barista action, customer interaction, logo
4. Keep prompts under 150 words each
5. Include duration hint like (~3s) at the end

Platform-specific guidelines:
- instagram: Hook in first 3 seconds, vertical framing emphasis
- youtube: Storytelling flow, establish-develop-resolve
- shorts: Fast-paced, visually striking moments
- tv: Brand-focused, polished, memorable closing

Return as JSON:
{
  "scenes": [
    {
      "label": "S1-hook",
      "seconds": 3,
      "prompt_en": "..."
    }
  ]
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
          { role: 'system', content: 'You are a professional video prompt creator. Always respond in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
        aspect: config.aspect,
        duration: config.duration,
        shopName,
        vibe 
      },
      scenes: result.scenes
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
// supabase/functions/prep-runway/index.ts
// @ts-ignore - Deno環境でのインポート
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno環境でのインポート
import { corsHeaders } from "../_shared/cors.ts";

// Deno環境の型定義
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// --- Platform presets (既存) ---
const PLATFORM_CONFIG = {
  instagram: { aspect: "9:16", duration: 18, scenes: 4, distribution: [3, 5, 6, 4] },
  youtube:   { aspect: "16:9", duration: 30, scenes: 5, distribution: [4, 5, 6, 7, 3] },
  shorts:    { aspect: "9:16", duration: 20, scenes: 4, distribution: [3, 5, 6, 6] },
  tv:        { aspect: "16:9", duration: 15, scenes: 3, distribution: [3, 7, 5] }
} as const;

// --- 新しい型定義 ---
type VisualMode = 'live_action' | 'anime';

interface CameraSpec {
  shot_size: 'CU' | 'MCU' | 'MS' | 'FS' | 'WS';
  angle: 'eye' | 'high' | 'low' | 'top';
  movement: Array<'pan' | 'tilt' | 'dolly' | 'track' | 'handheld' | 'gimbal' | 'locked'>;
  zoom: 'in' | 'out' | 'none';
}

interface LiveActionSpec {
  lens: '24mm' | '35mm' | '50mm' | '85mm' | 'macro';
  depth_of_field: 'shallow' | 'medium' | 'deep';
  camera_motion: 'locked_off' | 'tripod' | 'handheld' | 'gimbal';
}

interface AnimeSpec {
  line_weight: 'thin' | 'medium' | 'bold';
  shading: 'flat' | 'soft' | 'hard';
  texture: 'clean' | 'film_grain' | 'paper';
  frame_rate: 'cinematic_24' | 'smooth_30';
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accents: string[];
}

interface StyleGuide {
  style_id: string;
  characters: Array<{
    id: string;
    name?: string;
    age?: string;
    gender?: string;
    look_en?: string;
    look_ja?: string;
    wardrobe_en?: string;
    wardrobe_ja?: string;
  }>;
  locations: Array<{
    id: string;
    name?: string;
    look_en?: string;
    look_ja?: string;
  }>;
  palette: ColorPalette;
  camera_lens: string;
  lighting_en: string;
  lighting_ja: string;
  anime?: AnimeSpec;
  live?: LiveActionSpec;
}

interface SceneInput {
  label: string;
  key_points: string;
  seconds: number;
}

// --- Consistency & safety ---
const FIXED_VOCAB =
  "cinematic, warm soft lighting, shallow depth of field, 50mm lens look, gentle pan or gentle push-in, golden hour, subtle film grain, natural light";
const NEGATIVE_PROMPT = "no street food cart, no tea house, no retro diner";

// シーンのラベル（配信先別の標準順序）
const DEFAULT_LABELS: Record<string, string[]> = {
  instagram: ["S1-hook", "S2-barista", "S3-smile", "S4-logo"],
  shorts:    ["S1-hook", "S2-barista", "S3-smile", "S4-logo"],
  youtube:   ["S1-opening", "S2-barista", "S3-guests", "S4-ambience", "S5-logo"],
  tv:        ["S1-opening", "S2-core", "S3-logo"]
};

type StyleGuideInput = {
  style_id?: string;
  characters?: Array<{
    id: string; // "CHAR_A" など
    name?: string;
    age?: string;
    gender?: string;
    look_en?: string;
    look_ja?: string;
    wardrobe_en?: string;
    wardrobe_ja?: string;
  }>;
  locations?: Array<{
    id: string; // "LOC_A"
    name?: string;
    look_en?: string;
    look_ja?: string;
  }>;
  palette?: {
    primary?: string;     // "#C19A6B"等
    secondary?: string;
    accents?: string[];   // ["#..."]
  };
  camera_lens?: string;    // "50mm"
  lighting_en?: string;    // "warm soft lighting, golden hour"
  lighting_ja?: string;
};

function ensureTrailing(sentence: string, tail: string) {
  const has = sentence.toLowerCase().includes(tail.toLowerCase());
  return has ? sentence : (sentence.endsWith(".") ? `${sentence} ${tail}` : `${sentence}; ${tail}`);
}

function injectAnchors(scenePrompt: string, anchor: string) {
  const has = scenePrompt.toLowerCase().includes(anchor.toLowerCase());
  return has ? scenePrompt : `${scenePrompt} ${anchor}`;
}

// 否定語彙を生成する関数
function generateNegativePrompts(mode: VisualMode): string[] {
  const common = [
    'no text overlays',
    'no watermarks',
    'no logos',
    'no brand names',
    'no written text',
    'no subtitles',
    'no captions'
  ];
  
  const modeSpecific = mode === 'live_action' ? [
    'no CGI look',
    'no cartoonish outlines',
    'no anime style',
    'no illustrated look',
    'no hand-drawn appearance',
    'no cel shading',
    'no flat colors'
  ] : [
    'no messy linework',
    'no muddy colors',
    'no realistic photography',
    'no photorealistic style',
    'no live action footage',
    'no documentary style',
    'no shaky camera'
  ];
  
  return [...common, ...modeSpecific];
}

// 否定語彙を日本語に翻訳する関数
function translateNegatives(negatives: string[]): string[] {
  const translations: Record<string, string> = {
    'no text overlays': 'テキストオーバーレイなし',
    'no watermarks': 'ウォーターマークなし',
    'no logos': 'ロゴなし',
    'no brand names': 'ブランド名なし',
    'no written text': '文字なし',
    'no subtitles': '字幕なし',
    'no captions': 'キャプションなし',
    'no CGI look': 'CGI風の見た目なし',
    'no cartoonish outlines': 'カートゥーン風の輪郭なし',
    'no anime style': 'アニメ風なし',
    'no illustrated look': 'イラスト風なし',
    'no hand-drawn appearance': '手描き風なし',
    'no cel shading': 'セルシェーディングなし',
    'no flat colors': 'フラットな色なし',
    'no messy linework': '乱雑な線画なし',
    'no muddy colors': '濁った色なし',
    'no realistic photography': 'リアルな写真なし',
    'no photorealistic style': 'フォトリアル風なし',
    'no live action footage': '実写映像なし',
    'no documentary style': 'ドキュメンタリー風なし',
    'no shaky camera': '手ブレなし'
  };
  
  return negatives.map(neg => translations[neg] || neg);
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      shopName,
      platform = "youtube",
      vibe = "jazz",
      mode = "live_action",
      camera,
      styleGuide,
      distribution,
      scenes,
      seed
    } = body ?? {};

    if (!shopName) throw new Error("shopName is required");

    const config = (PLATFORM_CONFIG as any)[platform] || PLATFORM_CONFIG.youtube;
    const labels = DEFAULT_LABELS[platform] || DEFAULT_LABELS.youtube;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY is not configured");

    // LLM への要求：英語プロンプト＋日本語訳、スタイルガイド生成/反映、秒配分を固定
    const system = `
You are a professional video prompt creator for Runway Gen-3.
Always respond with VALID JSON ONLY that matches the requested schema. 
Every scene prompt MUST be copy-ready for Runway and must maintain visual consistency across scenes.
`;

    const user = `
Goal: Create ${config.scenes} scene prompts for a ${shopName} commercial optimized for ${platform}.
Aspect: ${config.aspect}
Total duration: ${config.duration}s
Scene distribution (seconds): ${config.distribution.join(", ")}
Vibe: ${vibe}

Fixed vocab (must appear in EVERY scene):
"${FIXED_VOCAB}"

Negative clause (must appear at end of EVERY scene):
"${NEGATIVE_PROMPT}"

Platform-specific intent:
- instagram/shorts: hook in first 3s, fast-paced, strong visual
- youtube: story flow (establish → develop → resolve)
- tv: brand-focused, clean, memorable close

Consistency requirements:
- Use the SAME character(s), SAME location, SAME palette, SAME camera lens, SAME lighting wording across ALL scenes.
- Keep names/age/wardrobe consistent. Do not change hair color or outfit.
- Include a short "anchor_en" and "anchor_ja" that, when appended to each scene prompt, helps keep consistency (character + location + palette in one clause).

If a style guide is provided, use it verbatim. If not, generate a concise style guide.

${
  styleGuide
    ? `Provided styleGuide (use as-is):
${JSON.stringify(styleGuide)}`
    : "No external style guide provided. Generate one for a modern cozy coffee shop."
}

Return JSON EXACTLY in this shape:
{
  "style_guide": {
    "style_id": "string",
    "characters": [{"id":"CHAR_A","name":"string","age":"string","gender":"string","look_en":"string","look_ja":"string","wardrobe_en":"string","wardrobe_ja":"string"}],
    "locations": [{"id":"LOC_A","name":"string","look_en":"string","look_ja":"string"}],
    "palette": {"primary":"#hex","secondary":"#hex","accents":["#hex"]},
    "camera_lens": "50mm",
    "lighting_en": "warm soft lighting, golden hour",
    "lighting_ja": "日本語の説明"
  },
  "anchor_en": "single short clause to append for consistency (character + location + palette)",
  "anchor_ja": "上記anchor_enの日本語版（短い一文）",
  "scenes": [
    {
      "label": "${labels[0]}",
      "seconds": ${config.distribution[0]},
      "prompt_en": "one-line English prompt ending with (~${config.distribution[0]}s)",
      "prompt_ja": "上記の日本語訳（同じ意味）"
    }
    // ... repeat for remaining scenes (labels, seconds from distribution)
  ]
}

Rules:
- Each "prompt_en" must be ONE sentence (<= 150 words), explicitly mention "modern cozy coffee shop interior or exterior", include the fixed vocab, and end with the negative clause + "(~Ns)".
- Each "prompt_ja" is a faithful Japanese translation of "prompt_en".
- DO NOT include any extra keys or comments.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 安定してJSON返す軽量モデル。必要なら gpt-4o に変更可
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    let content: any;
    try {
      content = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    } catch {
      throw new Error("Failed to parse JSON from OpenAI");
    }

    // ---- 事後バリデーション＆不足項目の補完 ----
    // 1) scenes の長さ・ラベル・秒数を配分に合わせて補正
    const contentScenes = Array.isArray(content.scenes) ? content.scenes : [];
    const fixedScenes = config.distribution.map((sec: number, i: number) => {
      const fallback = {
        label: labels[i] ?? `S${i + 1}`,
        seconds: sec,
        prompt_en: "",
        prompt_ja: ""
      };
      const s = contentScenes[i] ?? fallback;

      // ラベル/秒数の強制
      s.label = labels[i] ?? s.label ?? `S${i + 1}`;
      s.seconds = sec;

      // プロンプト末尾にネガティブ指定・(~Ns)・固定語彙・アンカーを保証
      const anchor_en: string = content.anchor_en ?? "";
      const needNs = `(~${sec}s)`;

      let pen = (s.prompt_en ?? "").trim();
      // 固定語彙
      if (!pen.toLowerCase().includes("warm soft lighting")) {
        pen = `${pen}${pen ? " " : ""}${FIXED_VOCAB}.`;
      }
      // (~Ns)
      if (!pen.includes(needNs)) pen = `${pen} ${needNs}`;
      // negative
      pen = ensureTrailing(pen, NEGATIVE_PROMPT + ".");
      // anchor
      if (anchor_en) pen = injectAnchors(pen, anchor_en);

      s.prompt_en = pen;

      // 日本語訳が空なら英語からの注釈訳だけでも入れる（簡易フォールバック）
      let pja = (s.prompt_ja ?? "").trim();
      if (!pja) {
        pja = "（英語プロンプト参照）一貫性: 同じ人物・同じ店舗・同じ配色を維持。";
      }
      s.prompt_ja = pja;

      return s;
    });

    // 2) style_guide の最低限保証
    const sg = content.style_guide ?? {};
    sg.style_id = sg.style_id ?? "COFFEE_CM_STYLE_001";
    sg.camera_lens = sg.camera_lens ?? "50mm";
    sg.lighting_en = sg.lighting_en ?? "warm soft lighting, golden hour";
    sg.lighting_ja = sg.lighting_ja ?? "暖かいソフトな光、ゴールデンアワーの雰囲気";
    sg.palette = sg.palette ?? { primary: "#C19A6B", secondary: "#6B4F3A", accents: ["#F2E6D8"] };
    if (!Array.isArray(sg.characters) || sg.characters.length === 0) {
      sg.characters = [{
        id: "CHAR_A",
        name: "Lead Barista",
        age: "30s",
        gender: "unspecified",
        look_en: "friendly barista with short dark hair",
        look_ja: "短めの黒髪の親しみやすいバリスタ",
        wardrobe_en: "navy apron, white shirt",
        wardrobe_ja: "ネイビーのエプロンと白シャツ"
      }];
    }
    if (!Array.isArray(sg.locations) || sg.locations.length === 0) {
      sg.locations = [{
        id: "LOC_A",
        name: `${shopName} Interior`,
        look_en: "modern cozy coffee shop interior with wooden tables and large window",
        look_ja: "木のテーブルと大きな窓があるモダンで居心地の良い店内"
      }];
    }

    // 否定語彙を生成
    const negative_en = generateNegativePrompts(mode);
    const negative_ja = translateNegatives(negative_en);

    const output = {
      meta: {
        platform,
        aspect: config.aspect,
        duration: config.duration,
        distribution: config.distribution,
        shopName,
        vibe,
        mode,
        seed,
        model_version: 'gen-3'
      },
      style_guide: sg,
      anchor_en: content.anchor_en ?? "consistent look: same barista CHAR_A at LOC_A with brand palette.",
      anchor_ja: content.anchor_ja ?? "一貫性: CHAR_A（同じバリスタ）とLOC_A（同じ店舗）とブランド配色を維持。",
      scenes: fixedScenes,
      negative_en,
      negative_ja
    };

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
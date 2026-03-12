import { CreativityLevel, Season, BackgroundSuggestion, RenderingStyle } from "./types";

export const SEASONAL_DATA: Record<Season, { label: string, suggestions: BackgroundSuggestion[] }> = {
  winter: {
    label: 'Winter',
    suggestions: [
      { id: 'w1', label: 'Verschneite Berge', prompt: 'snow-capped mountains background, clear winter sky, bright sunlight, hyper-crisp high contrast' },
      { id: 'w2', label: 'Zugefrorener See', prompt: 'frozen lake background, frost-covered trees, brilliant afternoon sun, crystal clear atmosphere' },
      { id: 'w3', label: 'Winterliche Stadt', prompt: 'modern cityscape in winter, architectural lighting, sharp neon accents, cinematic contrast' },
      { id: 'w4', label: 'Nordlichter', prompt: 'vibrant aurora borealis in dark clear night sky, luminous snowy landscape, glowing contrast' },
      { id: 'w5', label: 'Eisiger Wald', prompt: 'dense pine forest with heavy pristine snow, deep blue shadows, piercing dramatic sunbeams through trees' }
    ]
  },
  summer: {
    label: 'Sommer',
    suggestions: [
      { id: 's1', label: 'Seepromenade', prompt: 'vibrant summer lake promenade, crystal clear water reflection, bright midday sun, vivid colors' },
      { id: 's2', label: 'Grüne Hügel', prompt: 'lush green rolling hills, vivid blue summer sky, brilliant sunlight, sharp vibrant nature' },
      { id: 's3', label: 'Sommerlicher Park', prompt: 'lush summer park vegetation, golden hour lighting, warm sunbeams, highly detailed leaves' },
      { id: 's4', label: 'Lavendelfelder', prompt: 'vibrant purple lavender fields, bright warm summer sun, beautiful depth of field' },
      { id: 's5', label: 'Städtischer Kontext', prompt: 'modern urban landscape, clean contemporary architecture background, bright clear summer day' }
    ]
  },
  autumn: {
    label: 'Herbst',
    suggestions: [
      { id: 'a1', label: 'Bunter Wald', prompt: 'dense autumn forest, vibrant gold and red leaves, crisp morning air, dramatic golden hour lighting' },
      { id: 'a2', label: 'Nebeliger Weinberg', prompt: 'autumn vineyard, piercing warm golden sunrise light, high contrast architecture' },
      { id: 'a3', label: 'Erntefelder', prompt: 'rural idyllic harvest fields, low angle dramatic autumn sun, rich warm color palette' },
      { id: 'a4', label: 'Dörfliche Idylle', prompt: 'picturesque village background, warm inviting autumn afternoon, clear crisp lighting' },
      { id: 'a5', label: 'Herbstlicher See', prompt: 'tranquil autumn lake reflecting vibrant fall colors, clear crisp atmosphere, bright illuminating afternoon light' }
    ]
  },
  spring: {
    label: 'Frühling',
    suggestions: [
      { id: 'p1', label: 'Kirschblüten', prompt: 'blooming vibrant cherry blossom trees, fresh spring morning, bright clear beautiful lighting' },
      { id: 'p2', label: 'Frisches Bergpanorama', prompt: 'fresh spring mountain panorama, vivid green meadows, brilliant clear high-altitude sunlight' },
      { id: 'p3', label: 'Frühlingsgarten', prompt: 'manicured spring garden, fresh green foliage, bright cheerful sunlight, sharp botanical details' },
      { id: 'p4', label: 'Wildblumenwiese', prompt: 'colorful wildflower meadow, bright sunny day, macro-level sharp details in foreground' },
      { id: 'p5', label: 'Erwachender Wald', prompt: 'sunlit spring forest, fresh bright green leaves, dappled sunlight, rich contrast' }
    ]
  }
};

// Styles auch auf reine Keywords reduziert
export const STYLE_PROMPTS: Record<RenderingStyle, string> = {
  photorealistic: "ultra-realistic architectural photography, 8k resolution, octane render, unreal engine 5, masterpiece, flawless materials, hyper-detailed",
  sketch: "high-end architectural sketch, precise clean lines, professional presentation, hand-drawn aesthetic",
  abstract: "abstract architectural concept, bold geometric forms, dramatic studio lighting",
  watercolor: "premium architectural watercolor painting, fluid professional colors, precise architectural edges",
  minimalist: "minimalist architectural visualization, clean precise lines, pure lighting, uncluttered pristine composition",
  blueprint: "technical blueprint style, deep blue background, ultra-sharp white technical lines, CAD export look"
};

export const getSystemPrompt = (
  level: CreativityLevel, 
  userDescription: string, 
  season?: Season, 
  background?: BackgroundSuggestion,
  style: RenderingStyle = 'photorealistic'
): string => {
  
  // 1. Architektur & Materialien (Fokus)
  const architecture = userDescription.trim() 
    ? userDescription 
    : "high-end contemporary architecture, vertical timber cladding in warm oak, seamless grey Terrazzo stone floor, matte white plaster, matte anthracite metal window profiles";

  // 2. Szene & Hintergrund
  const environment = background ? background.prompt : "clean neutral background";

  // 3. Stil & Rendering-Qualität
  const renderQuality = STYLE_PROMPTS[style];

  // 4. Licht-Hack: Erzwingt harte Kontraste und Schatteneffekte, damit Winter/Herbst nicht matschig werden.
  const lightingOverride = season === 'summer' 
    ? "bright natural daylight, sharp shadows" 
    : "hyper-crisp dramatic lighting, strong directional light, cinematic high contrast, razor-sharp shadows, crystal clear definition, pristine physical materials, NO blur, NO softness";

  // ZUSAMMENBAU: Ein String, nur durch Kommas getrennt. Keine langen Befehle mehr!
  return `${architecture}, set in ${environment}, ${renderQuality}, ${lightingOverride}`;
};

export const MODEL_NAME = 'gemini-2.5-flash-image'; // Oder imagen-3.0-generate-001 falls das dein Image-Modell ist
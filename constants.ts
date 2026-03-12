import { CreativityLevel, Season, BackgroundSuggestion, RenderingStyle } from "./types";

// GLOBAL QUALITY ENFORCEMENT
const QUALITY_ENFORCEMENT = "8k resolution, photorealistic, highly detailed, sharp focus, octane render, unreal engine 5, architectural photography, volumetric lighting, crisp edges, masterpiece";

export const SEASONAL_DATA: Record<Season, { label: string, suggestions: BackgroundSuggestion[] }> = {
  winter: {
    label: 'Winter',
    suggestions: [
      { id: 'w1', label: 'Verschneite Berge', prompt: 'Crisp winter morning, snow-capped mountains in background, clear blue sky, bright illuminating sunlight, sharp shadows' },
      { id: 'w2', label: 'Zugefrorener See', prompt: 'Frozen lake background, frost-covered trees, brilliant winter afternoon sun, high contrast lighting, crystal clear atmosphere' },
      { id: 'w3', label: 'Winterliche Stadt', prompt: 'Modern cityscape in winter, architectural lighting, dramatic twilight, sharp neon accents, cinematic contrast, detailed snowflakes' },
      { id: 'w4', label: 'Nordlichter', prompt: 'Vibrant aurora borealis in dark clear night sky, luminous snowy landscape, long exposure photography style, glowing contrast' },
      { id: 'w5', label: 'Eisiger Wald', prompt: 'Dense pine forest with heavy pristine snow, deep blue shadows, piercing dramatic sunbeams through trees, high definition frost' }
    ]
  },
  summer: {
    label: 'Sommer',
    suggestions: [
      { id: 's1', label: 'Seepromenade', prompt: 'Vibrant summer lake promenade, crystal clear water reflection, bustling lively atmosphere, bright midday sun, sharp vivid colors' },
      { id: 's2', label: 'Grüne Hügel', prompt: 'Lush green rolling hills, vivid blue summer sky, brilliant sunlight, deep atmospheric perspective, sharp vibrant nature' },
      { id: 's3', label: 'Sommerlicher Park', prompt: 'Lush summer park vegetation, golden hour lighting, warm sunbeams, highly detailed leaves, rich contrast, inviting atmosphere' },
      { id: 's4', label: 'Lavendelfelder', prompt: 'Endless vibrant purple lavender fields, bright warm summer sun, sharp detailed foreground, beautiful depth of field' },
      { id: 's5', label: 'Städtischer Kontext', prompt: 'Modern urban landscape, clean contemporary architecture background, bright clear summer day, sharp architectural shadows' }
    ]
  },
  autumn: {
    label: 'Herbst',
    suggestions: [
      { id: 'a1', label: 'Bunter Wald', prompt: 'Dense autumn forest, vibrant gold and red leaves, crisp morning air, dramatic golden hour lighting, sharp leaf details' },
      { id: 'a2', label: 'Nebeliger Weinberg', prompt: 'Autumn vineyard, cinematic morning mist, piercing warm golden sunrise light, high contrast between mist and focused architecture' },
      { id: 'a3', label: 'Erntefelder', prompt: 'Rural idyllic harvest fields, low angle dramatic autumn sun, rich warm color palette, sharp detailed textures' },
      { id: 'a4', label: 'Dörfliche Idylle', prompt: 'Picturesque village background, warm inviting autumn afternoon, traditional architecture context, clear crisp lighting' },
      { id: 'a5', label: 'Herbstlicher See', prompt: 'Tranquil autumn lake reflecting vibrant fall colors, clear crisp atmosphere, bright illuminating afternoon light, sharp reflections' }
    ]
  },
  spring: {
    label: 'Frühling',
    suggestions: [
      { id: 'p1', label: 'Kirschblüten', prompt: 'Blooming vibrant cherry blossom trees, fresh spring morning, bright clear beautiful lighting, highly detailed floral foreground' },
      { id: 'p2', label: 'Frisches Bergpanorama', prompt: 'Fresh spring mountain panorama, melting snow, vivid green meadows, brilliant clear high-altitude sunlight' },
      { id: 'p3', label: 'Frühlingsgarten', prompt: 'Manicured spring garden, fresh green foliage, morning dew, bright cheerful sunlight, sharp botanical details' },
      { id: 'p4', label: 'Wildblumenwiese', prompt: 'Colorful wildflower meadow, gentle spring breeze, bright sunny day, macro-level sharp details in foreground vegetation' },
      { id: 'p5', label: 'Erwachender Wald', prompt: 'Sunlit spring forest, fresh bright green leaves, dappled sunlight, highly detailed bark and leaf textures, rich contrast' }
    ]
  }
};

export const STYLE_PROMPTS: Record<RenderingStyle, string> = {
  photorealistic: "AESTHETIC: Ultra-realistic architectural photography. NO artistic filters. Flawless materials.",
  sketch: "AESTHETIC: High-end architectural sketch. Artistic precise lines, visible clean pencil strokes, professional presentation.",
  abstract: "AESTHETIC: Abstract architectural concept. Focus on bold geometric forms, dramatic studio lighting.",
  watercolor: "AESTHETIC: Premium architectural watercolor painting. Fluid professional colors, precise architectural edges despite watercolor style.",
  minimalist: "AESTHETIC: Minimalist architectural visualization. Clean precise lines, pure lighting, uncluttered pristine composition.",
  blueprint: "AESTHETIC: Technical blueprint style. Deep blue background with ultra-sharp white technical lines, professional CAD export look."
};

export const getSystemPrompt = (
  level: CreativityLevel, 
  userDescription: string, 
  season?: Season, 
  background?: BackgroundSuggestion,
  style: RenderingStyle = 'photorealistic'
): string => {
  
  // 1. ISOLATE ENVIRONMENT/ATMOSPHERE
  let environmentContext = "";
  if (season && background) {
    environmentContext = `
--- ENVIRONMENT & ATMOSPHERE ---
SEASON: ${season.toUpperCase()}
BACKGROUND & LIGHTING: ${background.prompt}
CRITICAL INSTRUCTION: The environment (weather/background) MUST NOT degrade the sharpness or quality of the main architecture. Maintain ${QUALITY_ENFORCEMENT} regardless of atmosphere.
--------------------------------`;
  }

  // 2. ISOLATE USER DETAILS OR FALLBACK
  const userRequestedDetails = userDescription.trim() 
    ? userDescription 
    : `High-end architecture with premium materials: vertical timber cladding (Holzschalung) in warm oak, seamless grey Terrazzo stone floor, matte white plaster ceiling, matte anthracite metal window profiles.`;

  const detailsContext = `
--- ARCHITECTURAL DETAILS ---
${userRequestedDetails}
-----------------------------`;

  // 3. ISOLATE STYLE & QUALITY
  const stylePrompt = `
--- STYLE & RENDER QUALITY ---
${STYLE_PROMPTS[style]}
GLOBAL QUALITY MODIFIERS: ${QUALITY_ENFORCEMENT}
------------------------------`;

  // 4. THE MASTER INSTRUCTION (Always returned to enforce geometry)
  const MASTER_PROMPT = `TASK: PIXEL-PERFECT ARCHITECTURAL TRACE-OVER (STRICT GEOMETRY).

1. GEOMETRY & STRUCTURE (ABSOLUTE PRIORITY):
- TREAT THE INPUT IMAGE AS A RIGID STRUCTURAL SKELETON.
- DO NOT ADD, MOVE, OR REMOVE any walls, columns, window frames, or structural boundaries.
- The spatial layout, perspective, and vanishing points MUST BE 100% IDENTICAL to the reference.
- Maintain every line of the provided architectural shell with surgical precision.

2. HUMAN SCALE & STAFFAGE:
- Render people as FULL-SIZED ADULTS (standard 1.75m - 1.85m height).
- Humans and furniture must appear realistically scaled to the existing structure.

${environmentContext}
${detailsContext}
${stylePrompt}`;

  return MASTER_PROMPT; 
};

export const MODEL_NAME = 'gemini-2.5-flash-image';
import { CreativityLevel, Season, BackgroundSuggestion, RenderingStyle } from "./types";

export const SEASONAL_DATA: Record<Season, { label: string, suggestions: BackgroundSuggestion[] }> = {
  winter: {
    label: 'Winter',
    suggestions: [
      { id: 'w1', label: 'Waldrand / Bäume (Winter)', prompt: 'large bare winter trees in foreground, frost covered thick branches framing the view, crisp winter morning sunlight, sharp bark textures, pristine snow on ground' },
      { id: 'w2', label: 'Vorgarten (Winter)', prompt: 'structured winter garden in foreground, low snow-covered shrubs, sharp geometric frost details, low-angle bright winter sun, grounded perspective' },
      { id: 'w3', label: 'Dorf / Vorstadt (Winter)', prompt: 'quiet traditional village street in background, pitched roofs covered in fresh snow, warm low winter sunshine, cozy atmosphere, sharp frosty details' },
      { id: 'w4', label: 'Urbane Straße (Winter)', prompt: 'clean modern urban street in foreground, bare street trees, sharp architectural shadows from cold low sun, clear winter blue sky, elegant metropolitan setting' }
    ]
  },
  summer: {
    label: 'Sommer',
    suggestions: [
      { id: 's1', label: 'Waldrand / Bäume (Sommer)', prompt: 'lush mature deciduous trees in foreground, heavy green leaf canopy framing the view, warm golden hour dappled lighting, sharp leaf details, rich summer tones' },
      { id: 's2', label: 'Vorgarten (Sommer)', prompt: 'vibrant manicured summer garden in foreground, blooming low shrubs and vivid flowers, bright midday overhead sun, grounded perspective, sharp botanical details' },
      { id: 's3', label: 'Dorf / Vorstadt (Sommer)', prompt: 'idyllic European village street in background, terracotta roofs, warm inviting afternoon sunlight, mature hedgerows, clear blue summer sky' },
      { id: 's4', label: 'Urbane Straße (Sommer)', prompt: 'clean modern asphalt street in foreground, lush green street trees casting sharp shadows, brilliant intense summer sunlight, elegant urban metropolitan setting' }
    ]
  },
  autumn: {
    label: 'Herbst',
    suggestions: [
      { id: 'a1', label: 'Waldrand / Bäume (Herbst)', prompt: 'large mature trees in peak autumn color, vivid red and gold foliage framing the view, crisp morning sunlight, falling leaves, warm earth tones' },
      { id: 'a2', label: 'Vorgarten (Herbst)', prompt: 'landscaped autumn garden in foreground, low ornamental grasses, vivid orange and yellow foliage, dramatic golden hour side-lighting, grounded perspective' },
      { id: 'a3', label: 'Dorf / Vorstadt (Herbst)', prompt: 'traditional village street background, warm autumn colors, long crisp afternoon shadows, quaint neighborhood atmosphere, clear autumn sky' },
      { id: 'a4', label: 'Urbane Straße (Herbst)', prompt: 'clean modern urban street in foreground, street trees with golden autumn leaves, dramatic low-angle sunlight, long sharp shadows, elegant urban setting' }
    ]
  },
  spring: {
    label: 'Frühling',
    suggestions: [
      { id: 'p1', label: 'Waldrand / Bäume (Frühling)', prompt: 'large mature trees with fresh bright green spring foliage framing the view, blooming branches, bright clear morning sunlight, vivid lively atmosphere' },
      { id: 'p2', label: 'Vorgarten (Frühling)', prompt: 'blooming spring garden in foreground, vibrant tulips and daffodils, fresh manicured lawn, cheerful bright sunlight, sharp botanical textures, grounded perspective' },
      { id: 'p3', label: 'Dorf / Vorstadt (Frühling)', prompt: 'traditional picturesque village street background, blooming fruit trees in neighbors yards, fresh crisp spring sunlight, inviting neighborhood setting' },
      { id: 'p4', label: 'Urbane Straße (Frühling)', prompt: 'clean modern urban street in foreground, blossoming street trees framing the view, bright cheerful spring sunlight, sharp shadows, elegant metropolitan setting' }
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
    ? "brilliant intense sunlight, razor-sharp shadows, vivid saturated colors, crystal clear atmosphere, high contrast, NO blur, NO softness" 
    : "hyper-crisp dramatic lighting, strong directional light, cinematic high contrast, razor-sharp shadows, crystal clear definition, pristine physical materials, NO blur, NO softness";

  // ZUSAMMENBAU: Ein String, nur durch Kommas getrennt. Keine langen Befehle mehr!
  return `${architecture}, set in ${environment}, ${renderQuality}, ${lightingOverride}`;
};

export const MODEL_NAME = 'gemini-2.5-flash-image'; // Oder imagen-3.0-generate-001 falls das dein Image-Modell ist
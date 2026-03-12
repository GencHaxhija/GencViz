import { CreativityLevel, Season, BackgroundSuggestion, RenderingStyle } from "./types";

export const SEASONAL_DATA: Record<Season, { label: string, suggestions: BackgroundSuggestion[] }> = {
  winter: {
    label: 'Winter',
    suggestions: [
      { id: 'w1', label: 'Verschneite Berge', prompt: 'pristine snow-capped alpine mountains, deep blue winter sky, brilliant low-angle sunlight, long crisp shadows on white snow, ultra-sharp frozen landscape' },
      { id: 'w2', label: 'Zugefrorener See', prompt: 'frozen lake with polished ice surface, frost-covered birch trees, cold brilliant afternoon sun, crystal clear winter atmosphere, sharp ice textures' },
      { id: 'w3', label: 'Winterliche Stadt', prompt: 'modern city skyline in winter, fresh snow on rooftops, cold clear blue sky, strong low winter sun, precise architectural silhouettes, crisp urban atmosphere' },
      { id: 'w4', label: 'Nordlichter', prompt: 'vivid green and purple aurora borealis across dark sky, snow-covered silent landscape, starry night, cold blue ambient light, wide panoramic vista' },
      { id: 'w5', label: 'Eisiger Wald', prompt: 'dense snow-laden pine forest, deep blue-white shadows, single beam of low winter sun cutting through trees, frozen bark details, pristine untouched snow' }
    ]
  },
  summer: {
    label: 'Sommer',
    suggestions: [
      { id: 's1', label: 'Seepromenade', prompt: 'mediterranean lake promenade in full summer, turquoise crystal clear water, bright overhead sun, sharp water reflections, vivid saturated colors, warm stone textures' },
      { id: 's2', label: 'Grüne Hügel', prompt: 'sweeping green rolling hills under vivid blue sky, brilliant direct sunlight, defined cloud formations, sharp grass textures, deep atmospheric perspective' },
      { id: 's3', label: 'Sommerlicher Park', prompt: 'mature deciduous park trees in full leaf, warm golden hour side-lighting, defined tree shadows on manicured lawn, rich green and gold tones, sharp leaf details' },
      { id: 's4', label: 'Lavendelfelder', prompt: 'endless rows of deep purple lavender in full bloom, warm golden afternoon light, sharp foreground detail fading to soft horizon, rich violet and gold palette' },
      { id: 's5', label: 'Städtischer Kontext', prompt: 'sleek modern metropolitan skyline, glass and steel towers, sharp geometric reflections, strong directional sunlight, crisp blue sky, defined architectural shadows' }
    ]
  },
  autumn: {
    label: 'Herbst',
    suggestions: [
      { id: 'a1', label: 'Bunter Wald', prompt: 'dense deciduous forest in peak autumn color, vivid orange red and gold canopy, crisp morning light, defined individual leaf details, warm earth tones, sharp branch silhouettes' },
      { id: 'a2', label: 'Nebeliger Weinberg', prompt: 'terraced autumn vineyard with golden vines, thin morning mist in valley below, warm piercing sunrise breaking through, sharp vine row geometry, rich amber tones' },
      { id: 'a3', label: 'Erntefelder', prompt: 'golden harvested wheat fields stretching to horizon, dramatic low-angle autumn sun, long warm shadows, sharp straw textures, rich amber and ochre color palette' },
      { id: 'a4', label: 'Dörfliche Idylle', prompt: 'traditional European village with pitched roofs, colorful autumn trees lining streets, warm afternoon side-light, sharp cobblestone detail, cozy inviting atmosphere' },
      { id: 'a5', label: 'Herbstlicher See', prompt: 'calm mountain lake with mirror-perfect reflection of autumn foliage, vivid red and gold treeline, crystal clear still water, bright crisp afternoon light, sharp shoreline detail' }
    ]
  },
  spring: {
    label: 'Frühling',
    suggestions: [
      { id: 'p1', label: 'Kirschblüten', prompt: 'full canopy of pale pink cherry blossoms in peak bloom, soft petals falling, bright fresh morning light, sharp branch detail against clear blue sky, delicate natural beauty' },
      { id: 'p2', label: 'Frisches Bergpanorama', prompt: 'alpine spring panorama with melting snow peaks, vivid green high meadows, wildflowers in foreground, brilliant clear mountain sunlight, sharp distant ridgelines' },
      { id: 'p3', label: 'Frühlingsgarten', prompt: 'professionally landscaped spring garden, fresh bright green hedges, blooming tulips and daffodils, crisp morning sunlight, sharp botanical textures, manicured lawn edges' },
      { id: 'p4', label: 'Wildblumenwiese', prompt: 'dense colorful wildflower meadow in full spring bloom, poppies cornflowers daisies, bright warm sunlight, sharp macro-level petal details, vivid natural color palette' },
      { id: 'p5', label: 'Erwachender Wald', prompt: 'deciduous forest with fresh bright green leaf canopy, warm dappled sunlight filtering through, defined trunk silhouettes, fern-covered forest floor, rich green and brown tones' }
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
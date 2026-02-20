import { CreativityLevel, Season, BackgroundSuggestion } from "./types";

export const SEASONAL_DATA: Record<Season, { label: string, suggestions: BackgroundSuggestion[] }> = {
  winter: {
    label: 'Winter',
    suggestions: [
      { id: 'w1', label: 'Verschneite Berge', prompt: 'Verschneite Berglandschaft im Hintergrund mit klarem Winterhimmel' },
      { id: 'w2', label: 'Zugefrorener See', prompt: 'Zugefrorener See mit kahlen, frostbedeckten Bäumen im Hintergrund' },
      { id: 'w3', label: 'Winterliche Stadt', prompt: 'Moderne Stadtlandschaft im dichten Winternebel und sanftem Schneefall' }
    ]
  },
  summer: {
    label: 'Sommer',
    suggestions: [
      { id: 's1', label: 'Sonniger Strand', prompt: 'Sonniger Strand mit Palmen und türkisblauem Meer im Hintergrund' },
      { id: 's2', label: 'Grüne Hügel', prompt: 'Saftig grüne Hügellandschaft unter strahlend blauem Sommerhimmel' },
      { id: 's3', label: 'Sommerlicher Park', prompt: 'Belebte sommerliche Parkanlage mit üppiger Vegetation und warmem Licht' }
    ]
  },
  autumn: {
    label: 'Herbst',
    suggestions: [
      { id: 'a1', label: 'Bunter Wald', prompt: 'Dichter Wald mit leuchtend bunten Herbstblättern in Gold und Rot' },
      { id: 'a2', label: 'Nebeliger Weinberg', prompt: 'Nebeliger Weinberg im warmen Licht des herbstlichen Sonnenuntergangs' },
      { id: 'a3', label: 'Erntefelder', prompt: 'Ländliche Idylle mit abgeernteten Feldern und tiefstehender Herbstsonne' }
    ]
  },
  spring: {
    label: 'Frühling',
    suggestions: [
      { id: 'p1', label: 'Kirschblüten', prompt: 'Blühende Wiesen und Kirschblütenbäume in voller Pracht' },
      { id: 'p2', label: 'Frisches Bergpanorama', prompt: 'Frisches Bergpanorama mit schmelzendem Schnee und ersten grünen Wiesen' },
      { id: 'p3', label: 'Frühlingsgarten', prompt: 'Gepflegte Gartenanlage mit ersten Frühlingsblumen und zartem Grün' }
    ]
  }
};

export const getSystemPrompt = (
  level: CreativityLevel, 
  userDescription: string, 
  season?: Season, 
  background?: BackgroundSuggestion
): string => {
  let contextPrompt = "";
  if (season && background) {
    contextPrompt = `ATMOSPHERE & BACKGROUND: The scene is set in ${season}. BACKGROUND DETAIL: ${background.prompt}. Ensure the lighting and colors reflect this season.`;
  }

  const baseDescription = userDescription.trim() 
    ? `SPECIFIC SCENE DETAILS (USER REQUEST): ${userDescription}. ${contextPrompt}` 
    : `SCENE DETAILS: High-end restaurant with lake view, timber cladding, and terrazzo floors. ${contextPrompt}`;

  const STRICT_PROMPT = `TASK: PIXEL-PERFECT ARCHITECTURAL TRACE-OVER (STRICT GEOMETRY).

1. GEOMETRY & STRUCTURE (ABSOLUTE PRIORITY):
- TREAT THE INPUT IMAGE AS A RIGID STRUCTURAL SKELETON.
- DO NOT ADD, MOVE, OR REMOVE any walls, columns, window frames, or structural boundaries.
- The spatial layout, perspective, and vanishing points MUST BE 100% IDENTICAL to the reference.
- Maintain every line of the provided architectural shell with surgical precision.

${baseDescription}

2. HUMAN SCALE & STAFFAGE:
- Render people as FULL-SIZED ADULTS (standard 1.75m - 1.85m height).
- Humans and furniture must appear SUBSTANTIALLY LARGER to match the real scale.
- Patrons should look like real restaurant guests (well-dressed, interacting).

3. MATERIALS & FINISHES:
- WALLS: Vertical timber cladding (Holzschalung) in warm oak slats.
- FLOOR: Seamless grey Terrazzo stone.
- CEILING: Matte white plaster.
- WINDOWS: Matte anthracite metal profiles.

AESTHETIC: Ultra-realistic architectural photography. NO artistic filters.`;

  const BALANCED_PROMPT = `TASK: BALANCED ARCHITECTURAL VISUALIZATION.

1. GEOMETRY & STRUCTURE:
- Respect the main structural layout and perspective of the input image.
- You may intelligently refine minor structural details (window joinery, lighting fixtures) to make them more realistic.
- Keep the main walls and columns in place, but ensure materials wrap around them correctly.

${baseDescription}

2. HUMAN SCALE:
- Ensure people and furniture are scaled realistically for a high-end restaurant.
- Populate the scene naturally.

3. MATERIALS:
- High-end timber cladding, terrazzo floors, and clean plaster ceilings.
- Focus on photorealistic lighting and textures.

AESTHETIC: Professional architectural rendering, inviting and warm.`;

  const CREATIVE_PROMPT = `TASK: CREATIVE ARCHITECTURAL INTERPRETATION.

1. GEOMETRY & STRUCTURE:
- Use the input image as a LOOSE SPATIAL REFERENCE only.
- You are free to reimagine the structural details, expand the space, or adjust the ceiling height to create a more dramatic composition.
- Improve the architecture where the sketch is lacking.

${baseDescription}

2. ATMOSPHERE & SCENE:
- Focus on creating a mood. 
- You may add new furniture arrangements, decorative lighting, and staffage that fits the vibe, even if not in the original sketch.

3. MATERIALS:
- Interpret the requested materials (Timber, Terrazzo) in a creative, high-design way.

AESTHETIC: Dramatic, award-winning architectural design concept.`;

  switch (level) {
    case 'strict': return STRICT_PROMPT;
    case 'creative': return CREATIVE_PROMPT;
    default: return BALANCED_PROMPT;
  }
};

export const MODEL_NAME = 'gemini-2.5-flash-image';
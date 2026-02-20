import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from "../constants";

export const editImage = async (
  base64Image: string,
  editPrompt: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          { text: editPrompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated.");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    throw new Error(error.message || "Failed to edit image.");
  }
};

export const generateRendering = async (
  base64Image: string,
  fullSystemPrompt: string,
  apiKey: string,
  count: number = 2,
  baseSeed?: number
): Promise<string[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  
  // If no seed provided, create a random one for this batch
  const batchSeed = baseSeed ?? Math.floor(Math.random() * 1000000);

  const generateSingleImage = async (index: number): Promise<string> => {
    try {
      // Use the batch seed plus index to get "related" but slightly different variations
      const currentSeed = batchSeed + index;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: cleanBase64,
              },
            },
            { text: fullSystemPrompt },
          ],
        },
        config: {
          seed: currentSeed,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("No content generated.");

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data found in response.");
    } catch (error: any) {
      const errorMsg = error.message || JSON.stringify(error);
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
         throw new Error("Quota exceeded (429).");
      }
      throw error;
    }
  };

  const results: string[] = [];

  try {
    for (let i = 0; i < count; i++) {
      try {
        const result = await generateSingleImage(i);
        results.push(result);
        
        // Short delay to mitigate 429 while keeping batch feel
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (innerError: any) {
        console.warn(`Variation ${i + 1} generation failed:`, innerError);
        if (results.length === 0) throw innerError;
        break; 
      }
    }
    return results;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (results.length > 0) return results;
    throw new Error(error.message || "Failed to generate renderings.");
  }
};
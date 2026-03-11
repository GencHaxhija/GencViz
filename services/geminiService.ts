import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from "../constants";

export const editImage = async (
  base64Image: string,
  editPrompt: string,
  apiKey: string,
  referenceImageBase64?: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const parts: any[] = [
    {
      inlineData: {
        mimeType: "image/png",
        data: cleanBase64,
      },
    },
    { text: editPrompt },
  ];

  if (referenceImageBase64) {
    const cleanRef = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    // Add reference image as the first part context
    parts.unshift({
      inlineData: {
        mimeType: "image/png",
        data: cleanRef,
      },
    });
    // Append instruction to use the reference
    parts.push({ text: "IMPORTANT: Use the first image provided as a MATERIAL REFERENCE (texture, color, style) for the edited area." });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) throw new Error("No content generated.");

    for (const part of responseParts) {
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
  baseSeed?: number,
  referenceImageBase64?: string
): Promise<string[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  
  // If no seed provided, create a random one for this batch
  const batchSeed = baseSeed ?? Math.floor(Math.random() * 1000000);

  const generateSingleImage = async (index: number, retryCount = 0): Promise<string> => {
    try {
      // Use the batch seed plus index to get "related" but slightly different variations
      const currentSeed = batchSeed + index;

      const parts: any[] = [
        {
          inlineData: {
            mimeType: "image/png",
            data: cleanBase64,
          },
        },
        { text: fullSystemPrompt },
      ];

      if (referenceImageBase64) {
          const cleanRef = referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
          parts.unshift({
              inlineData: {
                  mimeType: "image/png",
                  data: cleanRef
              }
          });
          parts.push({ text: "IMPORTANT: Use the first image provided as a MATERIAL REFERENCE (texture, color, style) for the rendering." });
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: parts,
        },
        config: {
          seed: currentSeed,
        },
      });

      const responseParts = response.candidates?.[0]?.content?.parts;
      if (!responseParts) throw new Error("No content generated.");

      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data found in response.");
    } catch (error: any) {
      const errorMsg = error.message || JSON.stringify(error);
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("Quota exceeded");
      
      if (isQuotaError && retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
        console.warn(`Quota exceeded. Retrying in ${waitTime/1000}s... (Attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return generateSingleImage(index, retryCount + 1);
      }

      if (isQuotaError) {
         throw new Error("Das API-Limit wurde überschritten (429). Bitte warten Sie eine Minute oder reduzieren Sie die Anzahl der Varianten.");
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
        
        // Increased delay to mitigate 429 while keeping batch feel
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
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
    throw error;
  }
};
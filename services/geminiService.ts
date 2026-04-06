import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    identifiedName: { type: Type.STRING, description: "The name of the medicine identified from input" },
    isGeneric: { type: Type.BOOLEAN, description: "True if the input was a generic name, False if it was a brand name" },
    brandProfile: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The Brand Name (e.g., Tylenol)" },
        manufacturer: { type: Type.STRING, description: "Common manufacturer for the brand" },
        typicalPrice: { type: Type.STRING, description: "Estimated price range indicator (e.g., $$$ or specific amount)" },
        activeIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        dosage: { type: Type.STRING, description: "Common dosage strength detected or typical (e.g., 500mg)" },
        frequency: { type: Type.STRING, description: "Typical usage frequency (e.g., twice daily)" }
      }
    },
    genericProfile: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "The Generic Name (e.g., Acetaminophen)" },
        manufacturer: { type: Type.STRING, description: "Various/Multiple" },
        typicalPrice: { type: Type.STRING, description: "Estimated price range indicator (e.g., $ or specific amount)" },
        activeIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        dosage: { type: Type.STRING, description: "Common dosage strength detected or typical (e.g., 500mg)" },
        frequency: { type: Type.STRING, description: "Typical usage frequency (e.g., twice daily)" }
      }
    },
    janAushadhi: {
      type: Type.OBJECT,
      description: "Details about availability in Indian PMBJP (Jan Aushadhi) stores",
      properties: {
        available: { type: Type.BOOLEAN, description: "Is this generally available in Jan Aushadhi Kendras?" },
        name: { type: Type.STRING, description: "The specific generic name used in Jan Aushadhi list" },
        priceEstimate: { type: Type.STRING, description: "Estimated price in Jan Aushadhi (e.g., ₹15)" },
        savingsPercentage: { type: Type.STRING, description: "Estimated percentage savings vs top brand (e.g., '80%')" }
      }
    },
    primaryUses: { type: Type.ARRAY, items: { type: Type.STRING } },
    sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
    comparisonPoints: {
      type: Type.ARRAY,
      description: "Compare the Brand vs Generic on specific aspects",
      items: {
        type: Type.OBJECT,
        properties: {
          aspect: { type: Type.STRING, description: "e.g., Cost, Efficacy, Availability" },
          brandValue: { type: Type.STRING },
          genericValue: { type: Type.STRING },
          verdict: { type: Type.STRING, description: "Short conclusion on this aspect" }
        }
      }
    },
    clinicalSummary: { type: Type.STRING, description: "A summary paragraph explaining if they are interchangeable." }
  }
};

const SYSTEM_INSTRUCTION = `
You are a pharmaceutical expert assistant with knowledge of global and Indian medicine markets. 
Your goal is to identify a medicine from an image or a name.
Once identified:
1. Determine its Generic name and a common Brand name.
2. Identify the dosage strength (e.g., 500mg, 10ml) and typical frequency of use if visible or standard.
3. Check for its availability specifically under the "Pradhan Mantri Bhartiya Janaushadhi Pariyojana" (Jan Aushadhi) scheme in India.
4. Provide a strict comparison between the Brand version and the Generic version.
Focus on safety, active ingredients, dosage, and cost differences.
Disclaimer: Always provide accurate medical data but include a tone that suggests consulting a doctor.
`;

export const analyzeMedicineFromText = async (medicineName: string): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze the medicine named: "${medicineName}".
    1. Identify if this is a brand name or a generic name.
    2. Find its counterpart (if brand, find generic. if generic, find a popular brand).
    3. Identify standard DOSAGE and typical FREQUENCY.
    4. CHECK FOR JAN AUSHADHI: Look for the equivalent medicine in the Indian Jan Aushadhi (PMBJP) price list.
    5. Compare the Brand vs Standard Generic vs Jan Aushadhi.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Text Analysis Error:", error);
    throw new Error("Failed to analyze medicine name.");
  }
};

export const analyzeMedicineFromImage = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "Identify this medicine. Extract name. Identify dosage/strength and frequency. Find generic equivalent. CHECK FOR JAN AUSHADHI (PMBJP) equivalent in India. Compare Brand vs Generic."
          }
        ]
      }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Vision Analysis Error:", error);
    throw new Error("Failed to analyze medicine image. Please ensure the image is clear.");
  }
};

export const fetchLiveGenericPrice = async (genericName: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `Find the current average market price range for generic ${genericName} tablets/syrup in India. Return ONLY the price string (e.g., "approx. ₹20-40 per strip"). Keep it very short.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }] // Enable Google Search for live data
      }
    });

    // When using tools, response.text might contain the answer directly
    const text = response.text?.trim();
    if (!text) throw new Error("Could not find price info");
    return text;
  } catch (error) {
    console.error("Price fetch error:", error);
    throw new Error("Unavailable");
  }
};

import { GoogleGenAI, Type } from "@google/genai";
import { Insight } from "../types";

export const getAIInsights = async (data: any): Promise<Insight[]> => {
  try {
    // We create a fresh instance to ensure we use the latest linked project key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze these ICT Hub metrics and provide 3-4 actionable insights in JSON format.
      Keep it encouraging but data-driven.
      Metrics: ${JSON.stringify(data)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              summary: { type: Type.STRING },
              action: { type: Type.STRING },
              severity: { 
                type: Type.STRING,
                description: "low, medium, or high"
              },
            },
            required: ["category", "summary", "action", "severity"]
          }
        },
        systemInstruction: "You are the AI Orchestrator of the GRAPE ICT Hub. Your tone is futuristic, helpful, and technically precise."
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Node Offline:", error);
    
    // Detection of Billing/Quota issues
    const isQuotaError = error.message?.includes("429") || error.message?.includes("quota");
    const isBillingError = error.message?.includes("403") || error.message?.includes("billing");

    if (isQuotaError || isBillingError) {
      return [
        {
          category: "Ecosystem Limit",
          summary: "The Developer API has reached its free-tier capacity or requires a linked billing project.",
          action: "Note: Personal 'Gemini Advanced' subscriptions do not cover API usage. Go to Settings > Neural Link to sync a paid developer project.",
          severity: "high"
        }
      ];
    }
    
    return [
      {
        category: "Intelligence Node",
        summary: "Ecosystem AI is currently re-calibrating for the next cycle.",
        action: "Rely on local telemetry until the cloud link is restored.",
        severity: "low"
      }
    ];
  }
};

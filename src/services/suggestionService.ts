import { GoogleGenAI } from "@google/genai";
import { PLATFORM_WORKFLOWS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestWorkflows(botType: string, userGoal: string) {
  const platformData = PLATFORM_WORKFLOWS[botType];
  if (!platformData) return [];

  const prompt = `You are a business automation expert.
  Platform: ${botType}
  User Goal: ${userGoal}
  Allowed Triggers: ${platformData.triggers.join(", ")}
  Allowed Actions: ${platformData.actions.join(", ")}

  Suggest 3 highly effective automated workflows.
  Return ONLY a JSON array of objects with the following structure:
  [
    { "trigger": "trigger_name", "action": "action_name", "prompt": "short explanation of why this helps" }
  ]
  Ensure trigger and action names match the Allowed lists exactly.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        temperature: 0.7,
        responseMimeType: "application/json" 
      }
    });

    const parsed = JSON.parse(result.text || "[]");
    return parsed;
  } catch (e: any) {
    console.error("Suggestion error:", e.message || e);
    return [];
  }
}

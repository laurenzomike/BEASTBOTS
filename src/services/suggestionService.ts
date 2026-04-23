import { GoogleGenAI } from "@google/genai";
import { PLATFORM_WORKFLOWS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestWorkflows(botType: string, userGoal: string, currentWorkflows: any[] = []) {
  const platformData = PLATFORM_WORKFLOWS[botType];
  if (!platformData) return [];

  const existingWorkflowsStr = currentWorkflows.length > 0 
    ? `Existing Workflows to avoid duplicates: ${currentWorkflows.map(w => `${w.trigger} -> ${w.action}`).join(", ")}`
    : "No existing workflows.";

  const prompt = `You are a high-level business automation architect.
  Platform: ${botType}
  User's Current Strategic Goal: ${userGoal}
  ${existingWorkflowsStr}

  AVAILABLE SYSTEM TRIGGERS: ${platformData.triggers.join(", ")}
  AVAILABLE SYSTEM ACTIONS: ${platformData.actions.join(", ")}

  TASK:
  Suggest 3 innovative, high-impact automated workflows that align with the user's goal.
  Each suggestion should be a practical combination of a trigger and an action from the available lists.
  
  Format your response as a JSON array of objects:
  [
    { 
      "trigger": "EXACT_TRIGGER_NAME", 
      "action": "EXACT_ACTION_NAME", 
      "prompt": "Highly concise, technical instruction for the AI (max 15 words) describing the logic." 
    }
  ]

  Critical requirements:
  1. The "trigger" value MUST exactly match one of the AVAILABLE SYSTEM TRIGGERS.
  2. The "action" value MUST exactly match one of the AVAILABLE SYSTEM ACTIONS.
  3. Suggestions should be unique and non-redundant compared to existing ones.
  4. The goal is business growth and operational efficiency.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { 
        temperature: 0.8,
        responseMimeType: "application/json" 
      }
    });

    const parsed = JSON.parse(result.text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Suggestion error:", e);
    return [];
  }
}

import { PLATFORM_WORKFLOWS } from "../constants";
import { auth } from "../lib/firebase";

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
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ prompt, jsonResponse: true })
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.text || "[]");
  } catch (e) {
    console.error("Suggestion error:", e);
    return [];
  }
}

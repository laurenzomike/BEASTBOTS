import { PLATFORM_WORKFLOWS } from "../constants";


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
    // Mock suggestions to avoid API key crash on frontend
    const parsed = [
      { trigger: platformData.triggers[0], action: platformData.actions[0], prompt: "Mock AI suggestion for " + userGoal }
    ];
    return parsed;

  } catch (e) {
    console.error("Suggestion error:", e);
    return [];
  }
}

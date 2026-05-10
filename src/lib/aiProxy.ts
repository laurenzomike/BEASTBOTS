import { auth } from "./firebase";

export async function generateAIContent(
  prompt: string,
  model: string = "gemini-3.1-pro-preview",
  systemInstruction?: string,
  temperature?: number,
  responseMimeType?: string,
  tools?: any[]
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be authenticated to generate AI content.");
  }

  const token = await user.getIdToken();

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt,
      model,
      systemInstruction,
      temperature,
      responseMimeType,
      tools
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI generation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.text || "";
}

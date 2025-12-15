import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const refineDescription = async (rawDescription: string): Promise<string> => {
  if (!rawDescription.trim()) return '';

  try {
    const prompt = `
      Role: Creative Copywriter & Head Chef for 'SideDish'.
      Platform: 'SideDish' (A platform where developers serve their side projects like delicious dishes).
      Target Audience: Tech enthusiasts, developers, and potential users looking for "tasty" new apps.
      
      Task: Rewrite the following project description to be appetizing, engaging, and clear.
      
      Guidelines:
      1. **Hook**: Start with a sentence that makes the user's mouth water (metaphorically).
      2. **Structure**: Use short paragraphs.
      3. **Tone**: Fresh, crispy, and professional. Use cooking metaphors subtly if appropriate (e.g., "secret sauce", "freshly baked").
      4. **Language**: Korean (Natural, trendy).
      5. **Markdown**: Use bolding for emphasis.

      Input Draft: "${rawDescription}"
      
      Output: Only the refined description text in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI 요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }
};

export const generateProjectContent = async (draft: string): Promise<{ shortDescription: string, description: string, tags: string[] }> => {
  if (!draft.trim()) {
    throw new Error("설명 내용을 입력해주세요.");
  }

  try {
    const prompt = `
      Role: Executive Chef & Product Marketer for 'SideDish'.
      Platform: 'SideDish' (Intro My Side Project - Concept: Delicious Tech Menu).
      Language: Korean (Natural, engaging, professional).

      Input Draft: "${draft}"

      Task: Transform the draft into a high-converting "Menu Description".

      Instructions by Field:
      1. **shortDescription** (Max 80 chars): 
         - Create a "Tasting Spoon" hook. 
         - Focus on the flavor (value) and texture (experience).
         - Example: "개발자의 야근을 줄여주는 달콤한 자동화 툴" 

      2. **description**:
         - Structure as a "Chef's Recommendation" narrative using Markdown.
         - **The Craving (Problem)**: What hunger does this solve?
         - **The Dish (Solution)**: How is it served?
         - **The Ingredients (Tech)**: Briefly mention the special sauce (tech stack).
         - **Tone**: Passionate Chef vibe. Professional but inviting.
         - Use emojis (🍳, 🥗, 🚀, ✨) moderately.

      3. **tags**:
         - Extract 3-5 keywords (Main Ingredients).
         - Mix **Tech Ingredients** (React, AI) with **Flavor Profiles** (Productivity, Healing, Game).

      Output Format: JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortDescription: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["shortDescription", "description", "tags"]
        }
      }
    });

    if (!response.text) {
        throw new Error("AI returned empty response");
    }

    const result = JSON.parse(response.text);
    return result;

  } catch (error) {
    console.error("Gemini Generate Content Error:", error);
    throw new Error("AI 콘텐츠 생성에 실패했습니다.");
  }
};
# Gemini AI Integration Skill

## When to Use
Use this skill when working with AI features or the Gemini service.

## Service Location
`src/services/geminiService.ts`

## Existing Functions

### `generateProjectContent(draft: string)`
Generates complete project content from a draft.
- **Input**: Raw draft text
- **Output**: `{ shortDescription, description, tags }`
- **Uses**: JSON schema response for structured output

### `refineDescription(rawDescription: string)`
Polishes existing descriptions.
- **Input**: Raw description
- **Output**: Refined markdown text

## Adding New AI Functions

### Template
```tsx
'use server'

import { GoogleGenAI, Type } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

export const newAIFunction = async (input: string): Promise<OutputType> => {
  if (!input.trim()) {
    throw new Error("입력 내용을 확인해주세요.")
  }

  try {
    const prompt = `
      Role: [Chef/Marketer persona for SideDish]
      Language: Korean (Natural, engaging)

      Task: [Description of what to generate]

      Input: "${input}"

      Output: [Expected format]
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Define schema
          },
          required: ["field1", "field2"]
        }
      }
    })

    return JSON.parse(response.text || '{}')
  } catch (error) {
    console.error("Gemini API Error:", error)
    throw new Error("AI 처리에 실패했습니다. 잠시 후 다시 시도해주세요.")
  }
}
```

## Prompting Style
- **Role**: "Executive Chef & Product Marketer for SideDish"
- **Language**: Korean (자연스럽고, 전문적인)
- **Metaphors**: Cooking/culinary themed
  - "Tasting Spoon" = short hook
  - "Chef's Recommendation" = detailed description
  - "Ingredients" = tech stack/features
- **Emoji**: Use moderately (🍳, 🥗, 🚀, ✨)

## Calling from Components
```tsx
'use client'

import { generateProjectContent } from '@/services/geminiService'

const handleGenerate = async () => {
  setIsLoading(true)
  try {
    const result = await generateProjectContent(draft)
    // Use result
  } catch (error) {
    // Handle error - show Korean message
  } finally {
    setIsLoading(false)
  }
}
```

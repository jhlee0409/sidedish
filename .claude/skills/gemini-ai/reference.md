# Gemini AI Reference

## Service Location
`src/services/geminiService.ts`

## Existing Functions

### generateProjectContent(draft: string)
```typescript
// Input: Raw draft text
// Output: { shortDescription, description, tags }
// Uses JSON schema for structured output
```

### refineDescription(rawDescription: string)
```typescript
// Input: Raw description
// Output: Refined markdown with culinary metaphors
```

## Rate Limiting

### Client-side (`src/lib/aiLimitService.ts`)
```typescript
import { canGenerate, getRemainingGenerations, recordGeneration } from '@/lib/aiLimitService'

const canMakeRequest = canGenerate(draftId)
const remaining = getRemainingGenerations(draftId)
```

### Limits
- 3 generations per draft
- 10 generations per day per user
- 5-second cooldown

## Adding New AI Functions

```tsx
'use server'

import { GoogleGenAI, Type } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

export const newAIFunction = async (input: string): Promise<OutputType> => {
  if (!input.trim()) throw new Error("입력 내용을 확인해주세요.")

  const prompt = `
Role: SideDish 플랫폼의 전문 에디터
Language: Korean (자연스러운 해요체)

Task: [What you want]

Input: "${input}"

Requirements:
- Avoid clichés like "최고의", "혁신적인"
- Use subtle culinary metaphors
  `

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { field1: { type: Type.STRING } },
        required: ["field1"]
      }
    }
  })

  return JSON.parse(response.text || '{}')
}
```

## Prompting Style

### Role
- "SideDish 플랫폼의 수석 에디터"
- "메이커들의 사이드 프로젝트를 맛있게 소개하는 전문가"

### Language
- Korean (자연스럽고 친근한 해요체)
- Witty and engaging

### Culinary Metaphors (Subtle)
- Tasting Spoon = 한줄 소개
- Chef's Recommendation = 상세 설명
- Secret Ingredients = 기술 스택

### Banned Words
- "최고의", "혁신적인", "획기적인"
- "완벽한", "최신", "첨단"

## UI Components

### AI Generate Button
```tsx
import { Sparkles, Loader2 } from 'lucide-react'

<button
  onClick={handleGenerate}
  disabled={isLoading || !canGenerate(draftId)}
  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-4 py-2"
>
  {isLoading ? (
    <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중...</>
  ) : (
    <><Sparkles className="w-4 h-4" /> AI로 생성하기</>
  )}
</button>
```

### AI Candidate Selector
```tsx
import AiCandidateSelector from '@/components/AiCandidateSelector'

<AiCandidateSelector
  candidates={aiCandidates}
  selectedId={selectedCandidateId}
  onSelect={handleSelectCandidate}
/>
```

## Error Handling

```tsx
try {
  const result = await generateProjectContent(draft)
} catch (error) {
  if (error.message.includes('rate limit')) {
    toast.error('요청이 너무 많습니다.')
  } else {
    toast.error('AI 생성에 실패했습니다.')
  }
}
```

## Testing Mock

```tsx
vi.mock('@/services/geminiService', () => ({
  generateProjectContent: vi.fn().mockResolvedValue({
    shortDescription: '테스트 한줄 소개',
    description: '# 테스트\n\n내용입니다.',
    tags: ['테스트'],
  }),
}))
```

## Best Practices

1. Always validate input before AI call
2. Implement rate limiting (client + server)
3. Show loading states
4. Provide fallback options
5. Allow user to edit AI content
6. Store generation history

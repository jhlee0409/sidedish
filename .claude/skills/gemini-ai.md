---
name: integrating-gemini-ai
description: Integrates Gemini AI for content generation. Use when adding AI features, generating project descriptions, implementing rate limiting, or working with geminiService.ts. Includes prompting guidelines and error handling.
---

# Gemini AI Integration Skill

## When to Use
- Adding new AI-powered features
- Modifying content generation prompts
- Implementing AI rate limiting
- Handling AI errors gracefully
- Creating AI candidate selectors

## Service Location
`src/services/geminiService.ts`

## Existing Functions

### `generateProjectContent(draft: string)`
Generates complete project content from a draft.
- **Input**: Raw draft text (project description)
- **Output**: `{ shortDescription, description, tags }`
- **Uses**: JSON schema response for structured output

### `refineDescription(rawDescription: string)`
Polishes existing descriptions.
- **Input**: Raw description
- **Output**: Refined markdown text with culinary metaphors

## Rate Limiting

### Client-side (`src/lib/aiLimitService.ts`)
```typescript
// Check before making AI request
import { canGenerate, getRemainingGenerations } from '@/lib/aiLimitService'

const canMakeRequest = canGenerate(draftId)
const remaining = getRemainingGenerations(draftId)
```

### Server-side (`src/app/api/ai/generate/route.ts`)
- Validates in Firestore `ai_usage` collection
- Tracks per-draft and per-day usage

### Limits
- **3 generations per draft** - tracked by draftId
- **10 generations per day per user** - tracked by userId
- **5-second cooldown** between requests

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
Role: SideDish 플랫폼의 전문 에디터
Language: Korean (자연스러운 해요체)

Task: [What you want the AI to do]

Input:
"${input}"

Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- Avoid clichés like "최고의", "혁신적인"
- Use subtle culinary metaphors where appropriate
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            field1: { type: Type.STRING },
            field2: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
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

### Role
- "SideDish 플랫폼의 수석 에디터"
- "메이커들의 사이드 프로젝트를 맛있게 소개하는 전문가"

### Language
- Korean (자연스럽고 친근한 해요체)
- Professional yet approachable
- Witty and engaging

### Culinary Metaphors (Subtle)
- "Tasting Spoon" = 한줄 소개 (short hook)
- "Chef's Recommendation" = 상세 설명
- "Secret Ingredients" = 기술 스택
- Use sparingly, not forcefully

### Output Style
- Markdown format for descriptions
- Moderate emoji usage (1-3 per section)
- Clear structure with headings

### Banned Words/Phrases
- "최고의", "혁신적인", "획기적인"
- "완벽한", "최신", "첨단"
- Generic marketing speak

## Calling from Components

### In Client Component
```tsx
'use client'

import { generateProjectContent } from '@/services/geminiService'
import { canGenerate, recordGeneration } from '@/lib/aiLimitService'
import { toast } from 'sonner'

const handleGenerate = async () => {
  // Check rate limit
  if (!canGenerate(draftId)) {
    toast.error('AI 생성 횟수를 초과했습니다.')
    return
  }

  setIsLoading(true)
  try {
    const result = await generateProjectContent(draft)

    // Record successful generation
    recordGeneration(draftId)

    // Use result
    setShortDescription(result.shortDescription)
    setDescription(result.description)
    setTags(result.tags)

    toast.success('AI 생성이 완료되었습니다!')
  } catch (error) {
    toast.error('AI 생성에 실패했습니다.')
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}
```

### Via API Route
```tsx
// POST /api/ai/generate
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    draftId,
    description: rawDescription,
  }),
})

if (!response.ok) {
  const error = await response.json()
  throw new Error(error.error)
}

const result = await response.json()
```

## Error Handling

### Common Errors
```tsx
try {
  const result = await generateProjectContent(draft)
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
    } else if (error.message.includes('API key')) {
      toast.error('서버 설정 오류입니다. 관리자에게 문의해주세요.')
    } else {
      toast.error('AI 생성에 실패했습니다.')
    }
  }
}
```

## UI Components

### AI Generate Button
```tsx
import { Sparkles, Loader2 } from 'lucide-react'

<button
  onClick={handleGenerate}
  disabled={isLoading || !canGenerate(draftId)}
  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      생성 중...
    </>
  ) : (
    <>
      <Sparkles className="w-4 h-4" />
      AI로 생성하기
    </>
  )}
</button>
```

### AI Candidate Selector
For comparing multiple AI-generated options:
```tsx
import AiCandidateSelector from '@/components/AiCandidateSelector'

<AiCandidateSelector
  candidates={aiCandidates}
  selectedId={selectedCandidateId}
  onSelect={handleSelectCandidate}
/>
```

## Testing AI Features

### Mock for Tests
```tsx
vi.mock('@/services/geminiService', () => ({
  generateProjectContent: vi.fn().mockResolvedValue({
    shortDescription: '테스트 한줄 소개',
    description: '# 테스트 설명\n\n테스트 내용입니다.',
    tags: ['테스트', '목업'],
  }),
}))
```

## Environment Setup

Required in `.env.local`:
```bash
GEMINI_API_KEY=your_gemini_api_key
```

## Best Practices

1. **Always validate input** before sending to AI
2. **Implement rate limiting** on both client and server
3. **Show loading states** during generation
4. **Provide fallback options** if AI fails
5. **Allow user to edit** AI-generated content
6. **Store generation history** for rollback

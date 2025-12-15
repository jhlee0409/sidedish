'use server'

import { GoogleGenAI, Type } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

const MODEL = 'gemini-2.5-flash-lite'

export const refineDescription = async (rawDescription: string): Promise<string> => {
  if (!rawDescription.trim()) return ''

  try {
    const prompt = `
<role>
당신은 SideDish 플랫폼의 수석 카피라이터입니다.
SideDish는 개발자들이 사이드 프로젝트를 맛있는 요리처럼 선보이는 플랫폼입니다.
</role>

<task>
주어진 프로젝트 설명을 매력적이고 읽기 쉬운 마케팅 카피로 다듬어주세요.
</task>

<input>
${rawDescription}
</input>

<constraints>
- 언어: 한국어 (자연스럽고 트렌디한 톤)
- 분량: 2-3개의 짧은 문단
- 첫 문장은 후킹 문구로 시작
- 요리/음식 메타포를 자연스럽게 1-2개 사용 (예: "신선한", "비밀 레시피", "한 입 크기")
- 마크다운 볼드(**텍스트**)로 핵심 가치 강조
- 과장하지 말고 실제 기능에 집중
</constraints>

<output_format>
마크다운 형식의 정제된 설명문만 출력하세요. 다른 설명이나 메타 코멘트 없이 결과물만 반환하세요.
</output_format>
`

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    })

    return response.text?.trim() || ''
  } catch (error) {
    console.error("Gemini API Error:", error)
    throw new Error("AI 요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.")
  }
}

export const generateProjectContent = async (draft: string): Promise<{ shortDescription: string, description: string, tags: string[] }> => {
  if (!draft.trim()) {
    throw new Error("설명 내용을 입력해주세요.")
  }

  try {
    const prompt = `
<role>
당신은 SideDish 플랫폼의 수석 프로덕트 마케터입니다.
SideDish는 개발자들의 사이드 프로젝트를 맛있는 메뉴처럼 소개하는 플랫폼입니다.
</role>

<task>
사용자가 제공한 프로젝트 초안을 기반으로 3가지 마케팅 요소를 생성하세요.
</task>

<input>
${draft}
</input>

<output_spec>
1. shortDescription (한줄 소개)
   - 최대 80자
   - 프로젝트의 핵심 가치를 한 문장으로 압축
   - 호기심을 유발하는 후킹 문구
   - 예시: "개발자의 야근을 줄여주는 달콤한 자동화 도구"

2. description (상세 설명)
   - 마크다운 형식
   - 구조:
     • 🍽️ **한 줄 요약**: 프로젝트가 해결하는 문제
     • 🧑‍🍳 **주요 기능**: 핵심 기능 2-3개 (bullet points)
     • ✨ **특별한 점**: 차별화 포인트 1-2개
   - 톤: 친근하고 전문적, 과장 없이 솔직하게
   - 이모지는 섹션 제목에만 사용

3. tags (키워드 태그)
   - 3-5개의 태그
   - 기술 스택 태그 (React, Python 등)와 카테고리 태그 (생산성, 게임 등) 혼합
   - 검색과 필터링에 유용한 키워드 선정
</output_spec>

<constraints>
- 언어: 한국어
- 입력에 없는 기능을 추측하거나 과장하지 마세요
- 구체적이고 명확한 표현 사용
- JSON 형식으로만 응답
</constraints>
`

    const response = await ai.models.generateContent({
      model: MODEL,
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
    })

    if (!response.text) {
      throw new Error("AI returned empty response")
    }

    const result = JSON.parse(response.text)
    return result

  } catch (error) {
    console.error("Gemini Generate Content Error:", error)
    throw new Error("AI 콘텐츠 생성에 실패했습니다.")
  }
}

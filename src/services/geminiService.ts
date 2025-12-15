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
SideDish는 메이커들이 사이드 프로젝트를 맛있는 요리처럼 선보이는 플랫폼입니다.
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
<system_role>
당신은 사이드 프로젝트 큐레이션 플랫폼 'SideDish'의 전문 에디터입니다.
당신의 역할은 투박한 프로젝트 초안을 '먹음직스러운 메뉴(매력적인 서비스 설명)'로 플레이팅하는 것입니다.
</system_role>

<style_guide>
1. **톤앤매너**:
   - '해요체'를 사용하여 정중하면서도 위트 있게 작성하세요.
   - 개발자스러운 딱딱한 용어보다는 사용자 입장에서의 효용(Benefit)을 강조하세요.
   - 과도한 이모지 남발은 지양하고, 가독성을 높이는 용도로만 사용하세요.
2. **금지사항**:
   - 입력 데이터에 없는 사실을 지어내지 마세요.
   - "최고의", "혁신적인" 같은 상투적인 수식어를 남발하지 마세요.
</style_guide>

<response_format>
결과는 반드시 아래의 JSON 스키마를 준수해야 합니다. 마크다운 코드 블록 없이 Raw JSON만 출력하세요.

{
  "shortDescription": "최대 80자. 호기심을 자극하는 한 문장 카피.",
  "description": "마크다운 문자열. 아래 구조 필수:\n• 🍽️ **한 줄 요약**: [문제 해결 중심 요약]\n\n• 🧑‍🍳 **주요 기능**:\n  - [핵심 기능 1]\n  - [핵심 기능 2]\n\n• ✨ **매력 포인트**: [차별점 1가지]",
  "tags": ["태그1", "태그2", "태그3", "태그4"] // 최대 5개, 기술 스택 제외, 용도/장르 위주
}
</response_format>

<few_shot_example>
User Input:
"제목: 냥이 집사
내용: 고양이 화장실 청소 주기를 기록하는 앱입니다. 리액트로 만들었고 화장실 모래 전체 갈이 알림도 줍니다. 여러 마리 등록 가능해요."

AI Output:
{
  "shortDescription": "집사님들의 쾌적한 반려생활을 위한 고양이 화장실 청소 & 모래 교체 관리 매니저",
  "description": "• 🍽️ **한 줄 요약**: 깜빡하기 쉬운 고양이 화장실 청소와 모래 교체 주기를 놓치지 않도록 도와주는 집사 필수 앱입니다.\n\n• 🧑‍🍳 **주요 기능**:\n  - 감자 캐는 날과 전체 갈이 날짜를 간편하게 기록\n  - 위생적인 환경을 위한 맞춤형 알림 발송\n  - 다묘 가정을 위한 고양이별 개별 프로필 관리\n\n• ✨ **매력 포인트**: 더 이상 달력에 표시하지 않아도, 우리 냥이의 화장실 위생을 완벽하게 챙길 수 있어요.",
  "tags": ["반려동물", "생산성", "기록", "생활", "건강"]
}
</few_shot_example>

<task>
아래 제공된 [Input Project Draft]를 바탕으로 3가지 마케팅 요소를 JSON으로 생성하세요.
</task>

[Input Project Draft]
${draft}
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

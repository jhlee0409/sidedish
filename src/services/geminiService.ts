'use server'

import { GoogleGenAI, Type } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

const MODEL = 'gemini-2.5-flash-lite'

// Type for AI-generated project content
interface GeneratedProjectContent {
  shortDescription: string
  description: string
  tags: string[]
}

// Type for AI-generated weather digest content
export interface WeatherDigestInput {
  todayFeelsLike: number
  yesterdayFeelsLike: number | null
  tempDiff: number | null
  weatherMain: string
  precipitationProbability: number
  airQuality: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous'
  location: string
}

export interface GeneratedWeatherContent {
  temperatureMessage: string
  outfitTip: string
  precipitationTip: string | null
  airQualityTip: string | null
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
   - 전문 용어보다는 일반 사용자 입장에서의 효용(Benefit)을 강조하세요.
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

    const result: GeneratedProjectContent = JSON.parse(response.text)
    return result

  } catch (error) {
    console.error("Gemini Generate Content Error:", error)
    throw new Error("AI 콘텐츠 생성에 실패했습니다.")
  }
}

/**
 * 날씨 데이터를 기반으로 친근한 날씨 메시지 생성
 */
export const generateWeatherContent = async (input: WeatherDigestInput): Promise<GeneratedWeatherContent> => {
  const airQualityKorean: Record<string, string> = {
    good: '좋음',
    moderate: '보통',
    unhealthy_sensitive: '민감군 나쁨',
    unhealthy: '나쁨',
    very_unhealthy: '매우 나쁨',
    hazardous: '위험',
  }

  const prompt = `
<role>아침에 날씨 알려주는 친구</role>

<principles>
- Clear: 한 번에 이해되게
- Concise: 15자 이내로 짧게
- Casual: 친구한테 말하듯
</principles>

<rules>
- 이모지: 문장 끝에 딱 1개
- 금지: "꽁꽁", "완무장", "필수", "꼭요", 느낌표 남발
- 어미: "~해요", "~네요" (지시형 "~하세요" 자제)
</rules>

<data>
체감온도: ${input.todayFeelsLike}°C (어제: ${input.yesterdayFeelsLike !== null ? `${input.yesterdayFeelsLike}°C` : '없음'})
날씨: ${input.weatherMain}, 강수확률: ${input.precipitationProbability}%, 미세먼지: ${airQualityKorean[input.airQuality]}
</data>

<output>
1. temperatureMessage: 기온 변화 or 오늘 날씨 느낌
2. outfitTip: **체감온도 기준** 옷차림 (변화량 무시!)
3. precipitationTip: 30% 이상이면 비 팁, 아니면 null
4. airQualityTip: 보통 이상이면 미세먼지 팁, 아니면 null
</output>

<examples>
(-9°C, 어제 -6°C): {"temperatureMessage": "어제보다 3도 떨어졌어요 🥶", "outfitTip": "패딩에 목도리까지 🧣", "precipitationTip": null, "airQualityTip": null}
(15°C, 어제 8°C): {"temperatureMessage": "어제보다 7도 올랐어요 ☀️", "outfitTip": "가디건 하나면 돼요 👔", "precipitationTip": null, "airQualityTip": null}
(12°C, 비+미세먼지): {"temperatureMessage": "비 올 것 같아요 🌧️", "outfitTip": "가디건이랑 우산 챙겨요 🧥", "precipitationTip": "우산 챙겨요 ☔", "airQualityTip": "마스크도요 😷"}
(18°C): {"temperatureMessage": "나들이 가기 좋은 날 🌸", "outfitTip": "얇은 자켓이면 충분 👕", "precipitationTip": null, "airQualityTip": null}
(-5°C, 어제 없음): {"temperatureMessage": "영하권 추위네요 ❄️", "outfitTip": "패딩 입어요 🧥", "precipitationTip": null, "airQualityTip": null}
(2°C, 어제 -6°C): {"temperatureMessage": "어제보다 8도 올랐어요 ☀️", "outfitTip": "아직 쌀쌀해요, 코트 입어요 🧥", "precipitationTip": null, "airQualityTip": null}
</examples>
`

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temperatureMessage: { type: Type.STRING },
            outfitTip: { type: Type.STRING },
            precipitationTip: { type: Type.STRING, nullable: true },
            airQualityTip: { type: Type.STRING, nullable: true },
          },
          required: ["temperatureMessage", "outfitTip"]
        }
      }
    })

    if (!response.text) {
      throw new Error("AI returned empty response")
    }

    const result: GeneratedWeatherContent = JSON.parse(response.text)
    return result

  } catch (error) {
    console.error("Gemini Weather Content Error:", error)
    // AI 실패 시 기본 폴백 메시지 반환
    return generateFallbackWeatherContent(input)
  }
}

/**
 * AI 실패 시 폴백 메시지 생성
 */
function generateFallbackWeatherContent(input: WeatherDigestInput): GeneratedWeatherContent {
  const { todayFeelsLike, tempDiff, precipitationProbability, airQuality } = input

  // 기온 메시지 - 담백하게
  let temperatureMessage: string
  if (tempDiff !== null && Math.abs(tempDiff) >= 2) {
    const absDiff = Math.abs(tempDiff)
    if (tempDiff > 0) {
      temperatureMessage = `어제보다 ${absDiff}도 올랐어요 ☀️`
    } else {
      temperatureMessage = `어제보다 ${absDiff}도 떨어졌어요 🥶`
    }
  } else if (todayFeelsLike <= 0) {
    temperatureMessage = '영하권 추위예요 ❄️'
  } else if (todayFeelsLike <= 10) {
    temperatureMessage = '쌀쌀한 날씨예요 🧥'
  } else if (todayFeelsLike <= 20) {
    temperatureMessage = '선선한 날씨예요 🍃'
  } else {
    temperatureMessage = '따뜻한 날씨예요 ☀️'
  }

  // 옷차림 - 자연스럽게
  let outfitTip: string
  if (todayFeelsLike <= 0) outfitTip = '패딩에 목도리까지 챙기세요 🧣'
  else if (todayFeelsLike <= 10) outfitTip = '두꺼운 외투 챙기세요 🧥'
  else if (todayFeelsLike <= 20) outfitTip = '가디건 하나면 충분해요 👔'
  else outfitTip = '가볍게 입어도 괜찮아요 👕'

  // 강수
  const precipitationTip = precipitationProbability >= 30
    ? '비 소식 있어요, 우산 챙기세요 ☔'
    : null

  // 미세먼지
  const badAir = ['unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous']
  const airQualityTip = badAir.includes(airQuality)
    ? '미세먼지 있어요, 마스크 챙기세요 😷'
    : null

  return { temperatureMessage, outfitTip, precipitationTip, airQualityTip }
}

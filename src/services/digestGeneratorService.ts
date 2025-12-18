'use server'

import { GoogleGenAI, Type } from '@google/genai'
import {
  WeatherData,
  WeatherComparison,
  MultiCityWeatherData,
  generateWeatherRecommendations,
  weatherIconToEmoji,
} from './weatherService'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

const MODEL = 'gemini-2.5-flash-lite'

/** AI가 생성하는 날씨 다이제스트 구조 */
export interface WeatherDigestContent {
  greeting: string // 인사말
  summary: string // 전체 요약 (2-3문장)
  cityHighlights: Array<{
    city: string
    highlight: string // 도시별 핵심 한 줄
  }>
  outfit: string // 옷차림 조언
  tips: string[] // 오늘의 팁 (3개 이하)
  closing: string // 마무리 멘트
}

/** 날씨 다이제스트 이메일용 전체 데이터 */
export interface DigestEmailData {
  subject: string
  previewText: string
  content: WeatherDigestContent
  rawWeatherData: MultiCityWeatherData
  generatedAt: number
}

/** 날씨 데이터를 AI 프롬프트용 텍스트로 변환 */
function formatWeatherDataForPrompt(weatherData: MultiCityWeatherData): string {
  const lines: string[] = []

  for (const cityData of weatherData.cities) {
    const { today } = cityData
    const emoji = weatherIconToEmoji(today.current.weather.icon)
    const recommendations = generateWeatherRecommendations(today)

    lines.push(`## ${today.cityKo} (${today.city})`)
    lines.push(`- 현재 날씨: ${emoji} ${today.current.weather.description}`)
    lines.push(`- 기온: ${today.current.temp}°C (체감 ${today.current.feelsLike}°C)`)
    lines.push(`- 최저/최고: ${today.current.tempMin}°C ~ ${today.current.tempMax}°C`)
    lines.push(`- 습도: ${today.current.humidity}%`)
    lines.push(`- 바람: ${today.current.windSpeed}m/s`)
    lines.push(`- 가시거리: ${today.current.visibility}km`)

    // 강수 정보
    if (today.current.rain1h) {
      lines.push(`- 시간당 강수량: ${today.current.rain1h}mm`)
    }
    if (today.current.snow1h) {
      lines.push(`- 시간당 적설량: ${today.current.snow1h}mm`)
    }

    // 오늘 예보
    const maxPop = Math.max(...today.forecast.map(f => f.pop))
    if (maxPop > 0) {
      lines.push(`- 오늘 최대 강수 확률: ${maxPop}%`)
    }

    // 추천 정보
    lines.push(`- 우산 필요: ${recommendations.umbrella ? '예' : '아니오'}`)
    lines.push(`- 옷차림 기준: ${recommendations.outfit}`)

    lines.push('')
  }

  return lines.join('\n')
}

/** AI를 사용하여 날씨 다이제스트 생성 */
export async function generateWeatherDigest(
  weatherData: MultiCityWeatherData
): Promise<WeatherDigestContent> {
  const weatherText = formatWeatherDataForPrompt(weatherData)

  const today = new Date()
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dayStr = days[today.getDay()]

  const prompt = `
<system_role>
당신은 SideDish 플랫폼의 '오늘의 도시락' 날씨 큐레이터입니다.
매일 아침 구독자들에게 따뜻하고 유용한 날씨 브리핑을 전달합니다.
</system_role>

<style_guide>
1. **톤앤매너**:
   - 친근하고 따뜻한 '해요체' 사용
   - 마치 친한 친구가 알려주는 것처럼 자연스럽게
   - 날씨에 어울리는 이모지를 적절히 활용 (과하지 않게)
   - 유용한 정보를 재치있게 전달

2. **금지사항**:
   - 데이터에 없는 내용을 지어내지 마세요
   - 과도하게 긴 설명은 피하세요
   - 같은 표현을 반복하지 마세요
</style_guide>

<context>
오늘 날짜: ${dateStr} ${dayStr}요일
</context>

<weather_data>
${weatherText}
</weather_data>

<task>
위 날씨 데이터를 바탕으로 아래 JSON 형식의 날씨 다이제스트를 생성하세요.
모든 내용은 한국어로 작성합니다.
</task>
`

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greeting: {
              type: Type.STRING,
              description: '오늘 날씨에 맞는 친근한 인사말 (1문장, 날짜 포함)',
            },
            summary: {
              type: Type.STRING,
              description: '전국 날씨 전체 요약 (2-3문장)',
            },
            cityHighlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  city: { type: Type.STRING },
                  highlight: {
                    type: Type.STRING,
                    description: '해당 도시의 핵심 날씨 정보 한 줄',
                  },
                },
                required: ['city', 'highlight'],
              },
            },
            outfit: {
              type: Type.STRING,
              description: '오늘의 옷차림 조언 (1-2문장)',
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '오늘의 날씨 팁 3개 이하',
            },
            closing: {
              type: Type.STRING,
              description: '마무리 멘트 (1문장)',
            },
          },
          required: ['greeting', 'summary', 'cityHighlights', 'outfit', 'tips', 'closing'],
        },
      },
    })

    if (!response.text) {
      throw new Error('AI returned empty response')
    }

    const result: WeatherDigestContent = JSON.parse(response.text)
    return result
  } catch (error) {
    console.error('Weather digest generation error:', error)
    throw new Error('날씨 다이제스트 생성에 실패했습니다.')
  }
}

/** 이메일용 전체 다이제스트 데이터 생성 */
export async function generateDigestEmailData(
  weatherData: MultiCityWeatherData
): Promise<DigestEmailData> {
  const content = await generateWeatherDigest(weatherData)

  // 이메일 제목 생성 (첫 번째 도시 기준)
  const firstCity = weatherData.cities[0]
  const emoji = weatherIconToEmoji(firstCity.today.current.weather.icon)
  const temp = firstCity.today.current.temp

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}`

  return {
    subject: `${emoji} [${dateStr}] 오늘의 도시락 - ${firstCity.today.cityKo} ${temp}°C`,
    previewText: content.summary.slice(0, 100),
    content,
    rawWeatherData: weatherData,
    generatedAt: Date.now(),
  }
}

/** 다이제스트 미리보기용 간단 버전 생성 */
export async function generateDigestPreview(
  weatherData: WeatherData
): Promise<{
  summary: string
  outfit: string
  tips: string[]
}> {
  const recommendations = generateWeatherRecommendations(weatherData)
  const emoji = weatherIconToEmoji(weatherData.current.weather.icon)

  // 간단한 요약은 AI 없이 직접 생성
  const summary = `${weatherData.cityKo}의 오늘 날씨는 ${emoji} ${weatherData.current.weather.description}이에요. ` +
    `현재 기온은 ${weatherData.current.temp}°C, 체감 온도는 ${weatherData.current.feelsLike}°C예요.`

  return {
    summary,
    outfit: recommendations.outfit,
    tips: recommendations.activities,
  }
}

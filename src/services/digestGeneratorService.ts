import {
  CompactWeatherData,
  WeatherComparisonData,
  weatherIconToEmoji,
  needsUmbrella,
  needsMask,
  getOutfitRecommendation,
} from './weatherService'
import { AIR_QUALITY_NAMES, AirQualityLevel } from '@/lib/digest-types'
import { generateWeatherContent, GeneratedWeatherContent } from './geminiService'

/** 간소화된 날씨 다이제스트 콘텐츠 */
export interface CompactDigestContent {
  /** 위치 (예: "서울 강남구") */
  location: string
  /** 날씨 이모지 */
  weatherEmoji: string
  /** 체감온도 */
  feelsLike: number
  /** 어제 체감온도 (있는 경우) */
  yesterdayFeelsLike: number | null
  /** 어제 대비 체감온도 차이 (있는 경우) */
  feelsLikeDiff: number | null
  /** 어제 대비 체감온도 차이 텍스트 (있는 경우) */
  feelsLikeDiffText: string | null
  /** 어제 날씨 이모지 */
  yesterdayWeatherEmoji: string | null
  /** 강수 확률 */
  precipitationProbability: number
  /** 어제 강수 확률 */
  yesterdayPrecipitationProbability: number | null
  /** 우산 필요 여부 */
  needsUmbrella: boolean
  /** 미세먼지 등급 */
  airQuality: AirQualityLevel
  /** 미세먼지 등급 한글 */
  airQualityText: string
  /** 어제 미세먼지 등급 */
  yesterdayAirQuality: AirQualityLevel | null
  /** 마스크 필요 여부 */
  needsMask: boolean
  /** 옷차림 추천 */
  outfitRecommendation: string
  /** AI 생성 기온 메시지 */
  aiTemperatureMessage: string
  /** AI 생성 옷차림 팁 */
  aiOutfitTip: string
  /** AI 생성 강수 팁 */
  aiPrecipitationTip: string | null
  /** AI 생성 미세먼지 팁 */
  aiAirQualityTip: string | null
}

/** 이메일 데이터 */
export interface DigestEmailData {
  subject: string
  previewText: string
  content: CompactDigestContent
  /** HTML 이메일 본문 */
  htmlBody: string
  generatedAt: number
}

/**
 * 날씨 비교 데이터를 간소화된 다이제스트로 변환 (AI 콘텐츠 포함)
 */
export async function generateCompactDigest(comparison: WeatherComparisonData): Promise<CompactDigestContent> {
  const { today, yesterday, feelsLikeDiff, feelsLikeDiffText } = comparison

  // AI 콘텐츠 생성
  const aiContent = await generateWeatherContent({
    todayFeelsLike: today.feelsLike,
    yesterdayFeelsLike: yesterday?.feelsLike ?? null,
    tempDiff: feelsLikeDiff,
    weatherMain: today.weatherMain,
    precipitationProbability: today.precipitationProbability,
    airQuality: today.airQuality,
    location: today.location.address,
  })

  return {
    location: today.location.address,
    weatherEmoji: weatherIconToEmoji(today.weatherIcon),
    feelsLike: today.feelsLike,
    yesterdayFeelsLike: yesterday?.feelsLike ?? null,
    feelsLikeDiff,
    feelsLikeDiffText,
    yesterdayWeatherEmoji: yesterday ? weatherIconToEmoji(yesterday.weatherMain === 'Clear' ? '01d' :
      yesterday.weatherMain === 'Clouds' ? '03d' :
      yesterday.weatherMain === 'Rain' ? '10d' :
      yesterday.weatherMain === 'Snow' ? '13d' : '02d') : null,
    precipitationProbability: today.precipitationProbability,
    yesterdayPrecipitationProbability: yesterday?.precipitationProbability ?? null,
    needsUmbrella: needsUmbrella(today),
    airQuality: today.airQuality,
    airQualityText: AIR_QUALITY_NAMES[today.airQuality],
    yesterdayAirQuality: yesterday?.airQuality ?? null,
    needsMask: needsMask(today),
    outfitRecommendation: getOutfitRecommendation(today.feelsLike),
    // AI 생성 콘텐츠
    aiTemperatureMessage: aiContent.temperatureMessage,
    aiOutfitTip: aiContent.outfitTip,
    aiPrecipitationTip: aiContent.precipitationTip,
    aiAirQualityTip: aiContent.airQualityTip,
  }
}

/**
 * 아침 인사 메시지 생성 (시간/날씨 기반)
 */
function generateGreeting(feelsLike: number, weatherMain: string): string {
  const greetings = {
    cold: [
      '오늘은 좀 쌀쌀하네요, 따뜻하게 입고 나가세요!',
      '추운 아침이에요. 핫초코 한 잔 어때요? ☕',
      '오늘 꽤 춥네요. 목도리 챙기셨나요?',
    ],
    cool: [
      '선선한 아침이에요. 가벼운 겉옷 하나면 딱이에요!',
      '쌀쌀하지만 상쾌한 하루가 될 거예요 :)',
      '오늘 날씨 괜찮네요. 좋은 하루 보내세요!',
    ],
    warm: [
      '따뜻한 하루가 될 것 같아요!',
      '포근한 날씨예요. 산책하기 좋겠어요 🚶',
      '기분 좋은 날씨네요. 오늘도 파이팅!',
    ],
    hot: [
      '오늘 꽤 더워요. 시원하게 입으세요!',
      '더운 하루가 될 것 같아요. 물 많이 드세요 💧',
      '햇빛이 강해요. 자외선 차단 잊지 마세요!',
    ],
    rainy: [
      '비 소식이 있어요. 우산 꼭 챙기세요! ☔',
      '오늘은 우산이 친구예요. 잊지 마세요!',
      '비 오는 날엔 따뜻한 음료가 최고죠 ☕',
    ],
    snowy: [
      '눈 오는 날이에요! 미끄럼 조심하세요 ❄️',
      '오늘은 눈이 올 수도 있어요. 따뜻하게!',
      '겨울 왕국 같은 하루가 될지도? ⛄',
    ],
  }

  // 날씨 상태에 따른 분기
  if (['Rain', 'Drizzle', 'Thunderstorm'].includes(weatherMain)) {
    return greetings.rainy[Math.floor(Math.random() * greetings.rainy.length)]
  }
  if (['Snow'].includes(weatherMain)) {
    return greetings.snowy[Math.floor(Math.random() * greetings.snowy.length)]
  }

  // 체감온도에 따른 분기
  if (feelsLike <= 5) {
    return greetings.cold[Math.floor(Math.random() * greetings.cold.length)]
  }
  if (feelsLike <= 15) {
    return greetings.cool[Math.floor(Math.random() * greetings.cool.length)]
  }
  if (feelsLike <= 25) {
    return greetings.warm[Math.floor(Math.random() * greetings.warm.length)]
  }
  return greetings.hot[Math.floor(Math.random() * greetings.hot.length)]
}

/**
 * 어제 대비 변화 메인 메시지 생성
 */
function generateMainMessage(diff: number | null, feelsLike: number): string {
  if (diff === null) {
    // 어제 데이터가 없을 때
    if (feelsLike <= 5) return '오늘은 좀 추워요, 단단히 챙겨 입으세요!'
    if (feelsLike <= 15) return '오늘은 쌀쌀해요, 겉옷 하나 챙기세요!'
    if (feelsLike <= 25) return '오늘은 포근해요, 가볍게 입어도 괜찮아요!'
    return '오늘은 더워요, 시원하게 입으세요!'
  }

  const absDiff = Math.abs(diff)

  if (absDiff < 2) {
    return '오늘도 어제랑 비슷해요 ✨'
  }

  if (diff > 0) {
    // 더 따뜻해짐
    if (absDiff >= 8) return `어제보다 ${absDiff}도나 올랐어요! 🔥`
    if (absDiff >= 5) return `어제보다 ${absDiff}도 따뜻해요 ☀️`
    return `어제보다 ${absDiff}도 포근해요 🌤️`
  } else {
    // 더 추워짐 - 현재 체감온도에 따라 표현 다르게
    if (absDiff >= 8) return `어제보다 ${absDiff}도나 떨어졌어요! 🥶`
    if (absDiff >= 5) return `어제보다 ${absDiff}도 쌀쌀해요 ❄️`
    // 체감온도가 10도 이하면 "선선해요" 대신 "쌀쌀해요" 사용
    if (feelsLike <= 10) return `어제보다 ${absDiff}도 쌀쌀해요 🧣`
    return `어제보다 ${absDiff}도 선선해요 🍃`
  }
}

/**
 * 이메일용 HTML 본문 생성 (AI 콘텐츠 사용)
 */
function generateHtmlBody(content: CompactDigestContent, dateStr: string): string {
  // 어제 vs 오늘 비교 섹션 (어제 데이터가 있을 때만)
  // Gmail 호환: gap 대신 margin, flex: 1 대신 width 사용
  const comparisonSection = content.yesterdayFeelsLike !== null ? `
    <!-- 어제 vs 오늘 비교 -->
    <table style="width: 100%; margin-top: 16px; border-spacing: 8px 0;">
      <tr>
        <!-- 어제 -->
        <td style="width: 50%; background: #f1f5f9; border-radius: 12px; padding: 16px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; font-weight: 500;">어제</p>
          <span style="font-size: 24px;">${content.yesterdayWeatherEmoji || '🌤️'}</span>
          <p style="color: #475569; font-size: 20px; font-weight: 600; margin: 8px 0 0 0;">
            ${content.yesterdayFeelsLike}°
          </p>
        </td>
        <!-- 오늘 -->
        <td style="width: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 16px; text-align: center;">
          <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0 0 8px 0; font-weight: 500;">오늘</p>
          <span style="font-size: 24px;">${content.weatherEmoji}</span>
          <p style="color: white; font-size: 20px; font-weight: 600; margin: 8px 0 0 0;">
            ${content.feelsLike}°
          </p>
        </td>
      </tr>
    </table>
  ` : ''

  // 우산 섹션 - AI 생성 팁 사용
  // Gmail 호환: gap 대신 margin 사용
  const umbrellaSection = content.aiPrecipitationTip
    ? `
      <div style="margin-top: 16px; padding: 16px; background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-radius: 12px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 40px; vertical-align: top;">
              <span style="font-size: 28px;">☔</span>
            </td>
            <td>
              <p style="margin: 0; font-size: 15px; color: #0c4a6e; font-weight: 600;">
                강수확률 ${content.precipitationProbability}%
              </p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #0369a1;">${content.aiPrecipitationTip}</p>
            </td>
          </tr>
        </table>
      </div>
    `
    : ''

  // 미세먼지 섹션 - AI 생성 팁 사용
  // Gmail 호환: table 레이아웃 사용
  const airQualitySection = content.aiAirQualityTip
    ? `
      <div style="margin-top: 16px; padding: 16px; background: ${content.needsMask ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'}; border-radius: 12px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 40px; vertical-align: top;">
              <span style="font-size: 28px;">${content.needsMask ? '😷' : '🌫️'}</span>
            </td>
            <td>
              <p style="margin: 0; font-size: 15px; color: ${content.needsMask ? '#991b1b' : '#92400e'}; font-weight: 600;">
                미세먼지 ${content.airQualityText}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: ${content.needsMask ? '#b91c1c' : '#a16207'};">${content.aiAirQualityTip}</p>
            </td>
          </tr>
        </table>
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 480px) {
      .comparison-container { flex-direction: column !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh;">
  <div style="max-width: 420px; margin: 0 auto; padding: 24px 16px;">

    <!-- 헤더 -->
    <div style="text-align: center; margin-bottom: 20px;">
      <p style="color: #64748b; font-size: 13px; margin: 0; letter-spacing: 0.5px;">
        📍 ${content.location} · ${dateStr}
      </p>
    </div>

    <!-- 메인 카드 -->
    <div style="background: white; border-radius: 20px; padding: 28px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 16px;">

      <!-- 메인: 체감온도 먼저, 변화 메시지는 서브 -->
      <div style="text-align: center; padding: 20px 0;">
        <span style="font-size: 48px; display: block; margin-bottom: 12px;">${content.weatherEmoji}</span>
        <p style="font-size: 48px; font-weight: 800; margin: 0; color: #1e293b;">
          ${content.feelsLike}°C
        </p>
        <p style="font-size: 14px; color: #64748b; margin: 8px 0 0 0;">체감온도</p>
        <p style="font-size: 18px; font-weight: 600; margin: 16px 0 0 0; color: #4f46e5; line-height: 1.4;">
          ${content.aiTemperatureMessage}
        </p>
      </div>

      ${comparisonSection}

      <!-- 옷차림 추천: AI 생성 (Gmail 호환: table 레이아웃) -->
      <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 12px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 40px; vertical-align: top;">
              <span style="font-size: 24px;">👔</span>
            </td>
            <td>
              <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 500;">오늘의 옷차림</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; color: #334155; font-weight: 500;">
                ${content.aiOutfitTip}
              </p>
            </td>
          </tr>
        </table>
      </div>
    </div>

    ${umbrellaSection}
    ${airQualitySection}

    <!-- 푸터 -->
    <div style="text-align: center; margin-top: 28px; padding-top: 20px;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        오늘도 좋은 하루 보내세요! 🍱
      </p>
      <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">
        SideDish 날씨 도시락
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()
}

/**
 * 이메일 제목 생성 (어제 대비 변화 강조)
 */
function generateSubject(content: CompactDigestContent, dateStr: string): string {
  const { weatherEmoji, feelsLike, feelsLikeDiff, location } = content

  // 어제 대비 변화가 있으면 변화 중심, 없으면 체감온도 중심
  if (feelsLikeDiff !== null && Math.abs(feelsLikeDiff) >= 2) {
    const direction = feelsLikeDiff > 0 ? '↑' : '↓'
    const absDiff = Math.abs(feelsLikeDiff)
    return `${weatherEmoji} ${location} 어제보다 ${absDiff}도 ${direction} · 체감 ${feelsLike}°C`
  }

  return `${weatherEmoji} ${location} ${feelsLike}°C · ${dateStr}`
}

/**
 * 프리뷰 텍스트 생성 (AI 콘텐츠 기반)
 */
function generatePreviewText(content: CompactDigestContent): string {
  const parts: string[] = []

  // AI 생성 기온 메시지 사용 (이모지 제거)
  const tempMessage = content.aiTemperatureMessage.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()
  parts.push(tempMessage)

  // 핵심 알림만 추가
  if (content.aiPrecipitationTip) {
    parts.push('☔ 우산 챙기세요')
  }
  if (content.aiAirQualityTip) {
    parts.push('😷 마스크 챙기세요')
  }

  return parts.join(' · ')
}

/**
 * 이메일 데이터 생성 (AI 콘텐츠 포함)
 */
export async function generateDigestEmailData(comparison: WeatherComparisonData): Promise<DigestEmailData> {
  const content = await generateCompactDigest(comparison)

  // KST (UTC+9) 기준으로 날짜 계산
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const kstDate = new Date(now.getTime() + kstOffset)

  const month = kstDate.getUTCMonth() + 1
  const day = kstDate.getUTCDate()
  const dayOfWeek = kstDate.getUTCDay()

  const dateStr = `${month}월 ${day}일`
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const fullDateStr = `${dateStr} ${dayNames[dayOfWeek]}요일`

  return {
    subject: generateSubject(content, dateStr),
    previewText: generatePreviewText(content),
    content,
    htmlBody: generateHtmlBody(content, fullDateStr),
    generatedAt: Date.now(),
  }
}

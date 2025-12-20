import {
  CompactWeatherData,
  WeatherComparisonData,
  weatherIconToEmoji,
  needsUmbrella,
  needsMask,
  getOutfitRecommendation,
} from './weatherService'
import { AIR_QUALITY_NAMES, AirQualityLevel } from '@/lib/digest-types'

/** 간소화된 날씨 다이제스트 콘텐츠 */
export interface CompactDigestContent {
  /** 위치 (예: "서울 강남구") */
  location: string
  /** 날씨 이모지 */
  weatherEmoji: string
  /** 체감온도 */
  feelsLike: number
  /** 어제 대비 체감온도 차이 텍스트 (있는 경우) */
  feelsLikeDiffText: string | null
  /** 강수 확률 */
  precipitationProbability: number
  /** 우산 필요 여부 */
  needsUmbrella: boolean
  /** 미세먼지 등급 */
  airQuality: AirQualityLevel
  /** 미세먼지 등급 한글 */
  airQualityText: string
  /** 마스크 필요 여부 */
  needsMask: boolean
  /** 옷차림 추천 */
  outfitRecommendation: string
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
 * 날씨 비교 데이터를 간소화된 다이제스트로 변환
 */
export function generateCompactDigest(comparison: WeatherComparisonData): CompactDigestContent {
  const { today, feelsLikeDiffText } = comparison

  return {
    location: today.location.address,
    weatherEmoji: weatherIconToEmoji(today.weatherIcon),
    feelsLike: today.feelsLike,
    feelsLikeDiffText,
    precipitationProbability: today.precipitationProbability,
    needsUmbrella: needsUmbrella(today),
    airQuality: today.airQuality,
    airQualityText: AIR_QUALITY_NAMES[today.airQuality],
    needsMask: needsMask(today),
    outfitRecommendation: getOutfitRecommendation(today.feelsLike),
  }
}

/**
 * 이메일용 HTML 본문 생성
 */
function generateHtmlBody(content: CompactDigestContent, dateStr: string): string {
  // 체감온도 차이 표시
  const diffSection = content.feelsLikeDiffText
    ? `<p style="color: #6b7280; font-size: 14px; margin: 4px 0;">→ ${content.feelsLikeDiffText}</p>`
    : ''

  // 우산 섹션
  const umbrellaSection = content.precipitationProbability > 0 || content.needsUmbrella
    ? `
      <div style="margin: 16px 0; padding: 12px; background: #f0f9ff; border-radius: 8px;">
        <p style="margin: 0; font-size: 16px;">
          🌧️ <strong>강수확률 ${content.precipitationProbability}%</strong>
        </p>
        ${content.needsUmbrella ? '<p style="color: #0369a1; margin: 4px 0 0 24px; font-size: 14px;">→ 우산 꼭 챙기세요!</p>' : ''}
      </div>
    `
    : ''

  // 미세먼지 섹션 (보통 이상일 때만 표시)
  const showAirQuality = content.airQuality !== 'good'
  const airQualitySection = showAirQuality
    ? `
      <div style="margin: 16px 0; padding: 12px; background: ${content.needsMask ? '#fef2f2' : '#fefce8'}; border-radius: 8px;">
        <p style="margin: 0; font-size: 16px;">
          😷 <strong>미세먼지 ${content.airQualityText}</strong>
        </p>
        ${content.needsMask ? '<p style="color: #dc2626; margin: 4px 0 0 24px; font-size: 14px;">→ 외출 시 마스크 권장</p>' : ''}
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc;">
  <div style="max-width: 480px; margin: 0 auto; padding: 24px;">

    <!-- 헤더 -->
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">📍 ${content.location} | ${dateStr}</p>
    </div>

    <!-- 메인: 체감온도 -->
    <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px;">
      <div style="text-align: center;">
        <span style="font-size: 48px;">${content.weatherEmoji}</span>
        <p style="font-size: 36px; font-weight: bold; margin: 8px 0; color: #1f2937;">
          체감 ${content.feelsLike}°C
        </p>
        ${diffSection}
      </div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #4b5563; font-size: 14px;">
          👔 <strong>오늘의 옷차림</strong>
        </p>
        <p style="margin: 4px 0 0 24px; color: #6b7280; font-size: 14px;">
          ${content.outfitRecommendation}
        </p>
      </div>
    </div>

    ${umbrellaSection}
    ${airQualitySection}

    <!-- 푸터 -->
    <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        SideDish 날씨 도시락 🍱
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()
}

/**
 * 이메일 데이터 생성
 */
export function generateDigestEmailData(comparison: WeatherComparisonData): DigestEmailData {
  const content = generateCompactDigest(comparison)

  const now = new Date()
  const dateStr = `${now.getMonth() + 1}월 ${now.getDate()}일`
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const fullDateStr = `${dateStr} ${dayNames[now.getDay()]}요일`

  // 프리뷰 텍스트 생성
  let previewParts = [`체감 ${content.feelsLike}°C`]
  if (content.feelsLikeDiffText) {
    previewParts.push(content.feelsLikeDiffText)
  }
  if (content.needsUmbrella) {
    previewParts.push('우산 챙기세요')
  }
  if (content.needsMask) {
    previewParts.push('마스크 권장')
  }

  const subject = `${content.weatherEmoji} [${dateStr}] ${content.location} 체감 ${content.feelsLike}°C`

  return {
    subject,
    previewText: previewParts.join(' | '),
    content,
    htmlBody: generateHtmlBody(content, fullDateStr),
    generatedAt: Date.now(),
  }
}

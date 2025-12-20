/**
 * 날씨 서비스 - OpenWeatherMap API를 사용한 날씨 데이터 조회
 * 좌표 기반으로 동작하며, 체감온도/강수확률/미세먼지 중심으로 간소화
 */

import { UserLocation, AirQualityLevel } from '@/lib/digest-types'

const API_BASE = 'https://api.openweathermap.org/data/2.5'

function getApiKey(): string {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    throw new Error('OPENWEATHERMAP_API_KEY is not configured')
  }
  return apiKey
}

// ============================================
// API 응답 타입
// ============================================

interface OpenWeatherCurrentResponse {
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    humidity: number
  }
  wind: { speed: number }
  rain?: { '1h'?: number; '3h'?: number }
  snow?: { '1h'?: number; '3h'?: number }
  dt: number
}

interface OpenWeatherForecastItem {
  dt: number
  main: { temp: number; feels_like: number }
  weather: Array<{ main: string; icon: string }>
  pop: number // 강수 확률 (0-1)
  rain?: { '3h': number }
}

interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastItem[]
}

interface OpenWeatherAirPollutionResponse {
  list: Array<{
    main: { aqi: number } // 1-5 (Good to Very Poor)
    components: {
      pm2_5: number // 미세먼지 PM2.5
      pm10: number  // 미세먼지 PM10
    }
    dt: number
  }>
}

// ============================================
// 핵심 날씨 데이터 타입 (간소화)
// ============================================

/** 핵심 날씨 정보 - 이메일용 */
export interface CompactWeatherData {
  location: UserLocation
  /** 현재 체감온도 */
  feelsLike: number
  /** 현재 실제 기온 */
  temperature: number
  /** 최저/최고 기온 */
  tempMin: number
  tempMax: number
  /** 오늘 최대 강수확률 (%) */
  precipitationProbability: number
  /** 현재 또는 예상 강수량 (mm) */
  precipitation: number
  /** 미세먼지 등급 */
  airQuality: AirQualityLevel
  /** 미세먼지 PM2.5 수치 */
  pm25: number
  /** 날씨 상태 */
  weatherMain: string
  /** 날씨 아이콘 */
  weatherIcon: string
  /** 조회 시간 */
  timestamp: number
}

/** 어제와 오늘 비교 데이터 */
export interface WeatherComparisonData {
  today: CompactWeatherData
  yesterday?: {
    feelsLike: number
    temperature: number
    precipitation: number
    precipitationProbability: number
    airQuality: AirQualityLevel
    weatherMain: string
  }
  /** 체감온도 차이 */
  feelsLikeDiff: number | null
  /** 체감온도 차이 설명 */
  feelsLikeDiffText: string | null
}

// ============================================
// API 호출 함수
// ============================================

/** 현재 날씨 조회 (좌표 기반) */
async function fetchCurrentWeather(lat: number, lon: number): Promise<OpenWeatherCurrentResponse> {
  const apiKey = getApiKey()
  const url = `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`

  const response = await fetch(url, { next: { revalidate: 1800 } })
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`)
  }
  return response.json()
}

/** 5일 예보 조회 (3시간 간격) */
async function fetchForecast(lat: number, lon: number): Promise<OpenWeatherForecastResponse> {
  const apiKey = getApiKey()
  const url = `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`

  const response = await fetch(url, { next: { revalidate: 1800 } })
  if (!response.ok) {
    throw new Error(`Forecast API error: ${response.status}`)
  }
  return response.json()
}

/** 대기오염 정보 조회 */
async function fetchAirPollution(lat: number, lon: number): Promise<OpenWeatherAirPollutionResponse> {
  const apiKey = getApiKey()
  const url = `${API_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`

  const response = await fetch(url, { next: { revalidate: 1800 } })
  if (!response.ok) {
    throw new Error(`Air Pollution API error: ${response.status}`)
  }
  return response.json()
}

// ============================================
// 유틸리티 함수
// ============================================

/** OpenWeatherMap AQI를 등급으로 변환 */
function aqiToLevel(aqi: number): AirQualityLevel {
  // OpenWeatherMap AQI: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
  switch (aqi) {
    case 1: return 'good'
    case 2: return 'moderate'
    case 3: return 'unhealthy_sensitive'
    case 4: return 'unhealthy'
    case 5: return 'very_unhealthy'
    default: return 'moderate'
  }
}

/** 날씨 아이콘을 이모지로 변환 */
export function weatherIconToEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  }
  return iconMap[icon] || '🌤️'
}

/** 체감온도 차이 설명 생성 */
function generateFeelsLikeDiffText(diff: number): string {
  const absDiff = Math.abs(diff)

  if (absDiff < 2) {
    return '어제와 비슷해요'
  }

  const direction = diff > 0 ? '높아요' : '낮아요'
  const intensity = absDiff >= 8 ? '많이 ' : absDiff >= 5 ? '' : '조금 '

  return `어제보다 ${Math.round(absDiff)}도 ${intensity}${direction}`
}

// ============================================
// 메인 함수
// ============================================

/**
 * 좌표 기반 날씨 데이터 조회 (간소화 버전)
 */
export async function getCompactWeather(location: UserLocation): Promise<CompactWeatherData> {
  const [current, forecast, airPollution] = await Promise.all([
    fetchCurrentWeather(location.lat, location.lon),
    fetchForecast(location.lat, location.lon),
    fetchAirPollution(location.lat, location.lon),
  ])

  // 오늘 예보에서 최대 강수확률 계산 (첫 8개 = 24시간)
  const todayForecast = forecast.list.slice(0, 8)
  const maxPop = Math.max(...todayForecast.map(f => Math.round(f.pop * 100)))

  // 현재 또는 예상 강수량
  const precipitation = current.rain?.['1h'] || current.rain?.['3h'] ||
    todayForecast.find(f => f.rain?.['3h'])?.rain?.['3h'] || 0

  // 미세먼지 정보
  const airData = airPollution.list[0]
  const airQuality = aqiToLevel(airData.main.aqi)
  const pm25 = airData.components.pm2_5

  return {
    location,
    feelsLike: Math.round(current.main.feels_like),
    temperature: Math.round(current.main.temp),
    tempMin: Math.round(current.main.temp_min),
    tempMax: Math.round(current.main.temp_max),
    precipitationProbability: maxPop,
    precipitation: Math.round(precipitation * 10) / 10,
    airQuality,
    pm25: Math.round(pm25),
    weatherMain: current.weather[0].main,
    weatherIcon: current.weather[0].icon,
    timestamp: current.dt,
  }
}

/**
 * 오늘 날씨와 어제 날씨 비교
 */
export function compareWeather(
  today: CompactWeatherData,
  yesterday?: {
    feelsLike: number
    temperature: number
    precipitation: number
    precipitationProbability: number
    airQuality: AirQualityLevel
    weatherMain: string
  }
): WeatherComparisonData {
  if (!yesterday) {
    return {
      today,
      yesterday: undefined,
      feelsLikeDiff: null,
      feelsLikeDiffText: null,
    }
  }

  const feelsLikeDiff = today.feelsLike - yesterday.feelsLike

  return {
    today,
    yesterday,
    feelsLikeDiff,
    feelsLikeDiffText: generateFeelsLikeDiffText(feelsLikeDiff),
  }
}

/**
 * 우산 필요 여부 판단
 */
export function needsUmbrella(weather: CompactWeatherData): boolean {
  const rainyWeather = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow']
  return weather.precipitationProbability >= 60 || rainyWeather.includes(weather.weatherMain)
}

/**
 * 미세먼지 마스크 필요 여부
 */
export function needsMask(weather: CompactWeatherData): boolean {
  const badAirQualities: AirQualityLevel[] = ['unhealthy', 'very_unhealthy', 'hazardous']
  return badAirQualities.includes(weather.airQuality)
}

/**
 * 옷차림 추천 (체감온도 기반)
 */
export function getOutfitRecommendation(feelsLike: number): string {
  if (feelsLike <= -10) return '패딩, 롱패딩 필수! 최대한 따뜻하게'
  if (feelsLike <= 0) return '패딩, 두꺼운 코트, 목도리 필수'
  if (feelsLike <= 5) return '코트, 가죽 재킷, 히트텍'
  if (feelsLike <= 10) return '자켓, 트렌치코트, 니트'
  if (feelsLike <= 15) return '가디건, 얇은 자켓, 맨투맨'
  if (feelsLike <= 20) return '긴팔 셔츠, 얇은 가디건'
  if (feelsLike <= 25) return '반팔, 얇은 긴팔'
  if (feelsLike <= 30) return '반팔, 반바지, 린넨 옷'
  return '민소매, 반바지, 시원한 옷'
}

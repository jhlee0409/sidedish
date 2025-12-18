/**
 * 날씨 서비스 - OpenWeatherMap API를 사용한 날씨 데이터 조회
 * 도시락 시스템의 날씨 다이제스트에서 사용
 */

// 지원 도시 좌표 (OpenWeatherMap은 좌표 기반 조회 권장)
const CITY_COORDINATES: Record<string, { lat: number; lon: number; nameKo: string }> = {
  seoul: { lat: 37.5665, lon: 126.978, nameKo: '서울' },
  busan: { lat: 35.1796, lon: 129.0756, nameKo: '부산' },
  daegu: { lat: 35.8714, lon: 128.6014, nameKo: '대구' },
  incheon: { lat: 37.4563, lon: 126.7052, nameKo: '인천' },
  daejeon: { lat: 36.3504, lon: 127.3845, nameKo: '대전' },
  gwangju: { lat: 35.1595, lon: 126.8526, nameKo: '광주' },
}

export type SupportedCity = keyof typeof CITY_COORDINATES

/** OpenWeatherMap API 응답 타입 */
interface OpenWeatherCurrentResponse {
  coord: { lon: number; lat: number }
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
    pressure: number
    humidity: number
  }
  visibility: number
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  clouds: { all: number }
  rain?: { '1h'?: number; '3h'?: number }
  snow?: { '1h'?: number; '3h'?: number }
  dt: number
  sys: {
    sunrise: number
    sunset: number
    country: string
  }
  timezone: number
  name: string
}

interface OpenWeatherForecastItem {
  dt: number
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    humidity: number
  }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  wind: { speed: number; deg: number }
  pop: number // 강수 확률 (0-1)
  rain?: { '3h': number }
  snow?: { '3h': number }
}

interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastItem[]
  city: {
    name: string
    sunrise: number
    sunset: number
    timezone: number
  }
}

/** 정규화된 날씨 데이터 */
export interface WeatherData {
  city: string
  cityKo: string
  timestamp: number
  current: {
    temp: number
    feelsLike: number
    tempMin: number
    tempMax: number
    humidity: number
    windSpeed: number
    windDirection: number
    visibility: number
    clouds: number
    weather: {
      main: string
      description: string
      icon: string
    }
    rain1h?: number
    snow1h?: number
  }
  sun: {
    sunrise: number
    sunset: number
  }
  forecast: Array<{
    timestamp: number
    temp: number
    feelsLike: number
    humidity: number
    pop: number // 강수 확률 (%)
    weather: {
      main: string
      description: string
      icon: string
    }
  }>
}

/** 어제와 오늘 날씨 비교 데이터 */
export interface WeatherComparison {
  city: string
  cityKo: string
  today: WeatherData
  yesterday?: {
    tempMin: number
    tempMax: number
    humidity: number
    weather: string
  }
  comparison: {
    tempDiff: number // 오늘 vs 어제 평균 기온 차이
    tempDiffDescription: string // "3도 더 따뜻해요" 등
    humidityDiff: number
  } | null
}

/** 여러 도시의 날씨 데이터 */
export interface MultiCityWeatherData {
  generatedAt: number
  cities: WeatherComparison[]
}

const API_BASE = 'https://api.openweathermap.org/data/2.5'

function getApiKey(): string {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    throw new Error('OPENWEATHERMAP_API_KEY is not configured')
  }
  return apiKey
}

/** 날씨 설명을 한글로 변환 */
function translateWeatherMain(main: string): string {
  const translations: Record<string, string> = {
    Clear: '맑음',
    Clouds: '구름',
    Rain: '비',
    Drizzle: '이슬비',
    Thunderstorm: '천둥번개',
    Snow: '눈',
    Mist: '안개',
    Fog: '짙은 안개',
    Haze: '연무',
    Dust: '먼지',
    Sand: '모래바람',
    Smoke: '연기',
    Squall: '돌풍',
    Tornado: '토네이도',
  }
  return translations[main] || main
}

/** 날씨 아이콘을 이모지로 변환 */
export function weatherIconToEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️', // 맑음 (낮)
    '01n': '🌙', // 맑음 (밤)
    '02d': '⛅', // 약간 흐림 (낮)
    '02n': '☁️', // 약간 흐림 (밤)
    '03d': '☁️', // 흐림
    '03n': '☁️',
    '04d': '☁️', // 매우 흐림
    '04n': '☁️',
    '09d': '🌧️', // 소나기
    '09n': '🌧️',
    '10d': '🌦️', // 비 (낮)
    '10n': '🌧️', // 비 (밤)
    '11d': '⛈️', // 천둥번개
    '11n': '⛈️',
    '13d': '❄️', // 눈
    '13n': '❄️',
    '50d': '🌫️', // 안개
    '50n': '🌫️',
  }
  return iconMap[icon] || '🌤️'
}

/** 풍향을 텍스트로 변환 */
function windDegreeToDirection(deg: number): string {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
  const index = Math.round(deg / 45) % 8
  return directions[index]
}

/** 현재 날씨 조회 */
async function fetchCurrentWeather(city: SupportedCity): Promise<OpenWeatherCurrentResponse> {
  const apiKey = getApiKey()
  const coords = CITY_COORDINATES[city]

  const url = `${API_BASE}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=kr`

  const response = await fetch(url, { next: { revalidate: 1800 } }) // 30분 캐시

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/** 5일 예보 조회 (3시간 간격) */
async function fetchForecast(city: SupportedCity): Promise<OpenWeatherForecastResponse> {
  const apiKey = getApiKey()
  const coords = CITY_COORDINATES[city]

  const url = `${API_BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=kr`

  const response = await fetch(url, { next: { revalidate: 1800 } }) // 30분 캐시

  if (!response.ok) {
    throw new Error(`Forecast API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/** 단일 도시 날씨 데이터 조회 */
export async function getWeatherData(city: SupportedCity): Promise<WeatherData> {
  const [current, forecast] = await Promise.all([
    fetchCurrentWeather(city),
    fetchForecast(city),
  ])

  const coords = CITY_COORDINATES[city]

  // 오늘의 예보만 추출 (첫 8개 = 24시간)
  const todayForecast = forecast.list.slice(0, 8).map(item => ({
    timestamp: item.dt,
    temp: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    humidity: item.main.humidity,
    pop: Math.round(item.pop * 100),
    weather: {
      main: item.weather[0].main,
      description: translateWeatherMain(item.weather[0].main),
      icon: item.weather[0].icon,
    },
  }))

  return {
    city,
    cityKo: coords.nameKo,
    timestamp: current.dt,
    current: {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      tempMin: Math.round(current.main.temp_min),
      tempMax: Math.round(current.main.temp_max),
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed * 10) / 10,
      windDirection: current.wind.deg,
      visibility: Math.round(current.visibility / 1000), // km로 변환
      clouds: current.clouds.all,
      weather: {
        main: current.weather[0].main,
        description: translateWeatherMain(current.weather[0].main),
        icon: current.weather[0].icon,
      },
      rain1h: current.rain?.['1h'],
      snow1h: current.snow?.['1h'],
    },
    sun: {
      sunrise: current.sys.sunrise,
      sunset: current.sys.sunset,
    },
    forecast: todayForecast,
  }
}

/** 기온 차이 설명 생성 */
function generateTempDiffDescription(diff: number): string {
  const absDiff = Math.abs(diff)

  if (absDiff < 1) {
    return '어제와 비슷해요'
  }

  const direction = diff > 0 ? '더 따뜻해요' : '더 쌀쌀해요'

  if (absDiff >= 10) {
    return `${Math.round(absDiff)}도나 ${direction}! 옷차림에 주의하세요`
  } else if (absDiff >= 5) {
    return `${Math.round(absDiff)}도 ${direction}`
  } else {
    return `조금 ${direction} (${Math.round(absDiff)}도 차이)`
  }
}

/** 여러 도시의 날씨 데이터 조회 */
export async function getMultiCityWeather(cities: SupportedCity[]): Promise<MultiCityWeatherData> {
  const weatherPromises = cities.map(async (city) => {
    try {
      const today = await getWeatherData(city)

      // 어제 데이터는 별도 API 호출이 필요 (유료)
      // 무료 플랜에서는 현재 데이터만 사용
      const comparison: WeatherComparison = {
        city,
        cityKo: CITY_COORDINATES[city].nameKo,
        today,
        yesterday: undefined, // 유료 API 필요
        comparison: null,
      }

      return comparison
    } catch (error) {
      console.error(`Failed to fetch weather for ${city}:`, error)
      throw error
    }
  })

  const cities_data = await Promise.all(weatherPromises)

  return {
    generatedAt: Date.now(),
    cities: cities_data,
  }
}

/** 날씨 기반 추천 메시지 생성 */
export function generateWeatherRecommendations(weather: WeatherData): {
  outfit: string
  umbrella: boolean
  activities: string[]
} {
  const { current, forecast } = weather
  const temp = current.temp
  const feelsLike = current.feelsLike

  // 우산 필요 여부 (강수 확률 50% 이상 또는 현재 비/눈)
  const maxPop = Math.max(...forecast.map(f => f.pop))
  const isRaining = ['Rain', 'Drizzle', 'Thunderstorm'].includes(current.weather.main)
  const isSnowing = current.weather.main === 'Snow'
  const umbrella = maxPop >= 50 || isRaining || isSnowing

  // 옷차림 추천
  let outfit: string
  if (feelsLike <= 4) {
    outfit = '패딩, 두꺼운 코트가 필요해요. 목도리와 장갑도 챙기세요!'
  } else if (feelsLike <= 9) {
    outfit = '코트, 가죽 재킷이 좋아요. 니트나 기모 옷을 입으세요.'
  } else if (feelsLike <= 16) {
    outfit = '자켓, 가디건이 적당해요. 얇은 니트도 좋아요.'
  } else if (feelsLike <= 22) {
    outfit = '긴팔 셔츠, 얇은 가디건이 좋아요. 낮에는 덥기도 해요.'
  } else if (feelsLike <= 27) {
    outfit = '반팔, 얇은 셔츠가 편해요. 자외선 차단제 잊지 마세요!'
  } else {
    outfit = '민소매, 반팔, 린넨 소재가 좋아요. 시원하게 입으세요!'
  }

  // 활동 추천
  const activities: string[] = []

  if (current.weather.main === 'Clear' && temp >= 15 && temp <= 25) {
    activities.push('야외 활동하기 좋은 날씨예요 🏃‍♂️')
  }

  if (umbrella) {
    activities.push('우산 꼭 챙기세요! ☔')
  }

  if (current.humidity >= 70) {
    activities.push('습해서 빨래 건조가 어려울 수 있어요 👔')
  }

  if (current.visibility < 5) {
    activities.push('시야가 좋지 않으니 운전 조심하세요 🚗')
  }

  if (temp <= 0) {
    activities.push('빙판길 조심하세요! ⚠️')
  }

  if (current.windSpeed >= 10) {
    activities.push('바람이 강해요. 외출 시 주의하세요 💨')
  }

  if (activities.length === 0) {
    activities.push('오늘도 좋은 하루 되세요! 😊')
  }

  return { outfit, umbrella, activities }
}

/** 날씨 요약 텍스트 생성 */
export function generateWeatherSummary(weather: WeatherData): string {
  const { cityKo, current } = weather
  const emoji = weatherIconToEmoji(current.weather.icon)
  const windDir = windDegreeToDirection(current.windDirection)

  return `${cityKo} ${emoji} ${current.weather.description}, ${current.temp}°C (체감 ${current.feelsLike}°C)\n` +
    `습도 ${current.humidity}% | 바람 ${windDir}풍 ${current.windSpeed}m/s | 가시거리 ${current.visibility}km`
}

/** 지원 도시 목록 */
export function getSupportedCities(): Array<{ id: SupportedCity; name: string }> {
  return Object.entries(CITY_COORDINATES).map(([id, data]) => ({
    id: id as SupportedCity,
    name: data.nameKo,
  }))
}

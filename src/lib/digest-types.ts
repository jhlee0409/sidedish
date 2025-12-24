/**
 * @deprecated 도시락(Digest) 기능은 UI에서 제거되었습니다. 레거시 코드로 유지됩니다.
 *
 * 다이제스트 시스템 타입 정의
 * UI에서는 "도시락"으로 표시되지만, 코드에서는 "Digest"로 사용
 */

import { Timestamp } from 'firebase-admin/firestore'

// ============================================
// 상수 정의
// ============================================

/** 다이제스트 카테고리 */
export type DigestCategory = 'weather' | 'finance' | 'news' | 'lifestyle' | 'other'

/** 지원 도시 (관리자용 - 하위 호환성) */
export type SupportedCity = 'seoul' | 'busan' | 'daegu' | 'incheon' | 'daejeon' | 'gwangju'

/** 도시 한글명 매핑 (관리자용 - 하위 호환성) */
export const CITY_NAMES: Record<SupportedCity, string> = {
  seoul: '서울',
  busan: '부산',
  daegu: '대구',
  incheon: '인천',
  daejeon: '대전',
  gwangju: '광주',
}

/** 사용자 위치 정보 */
export interface UserLocation {
  lat: number
  lon: number
  /** 주소 (시/군/구 레벨) - 예: "서울 강남구" */
  address: string
}

/** 미세먼지 등급 */
export type AirQualityLevel = 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous'

/** 미세먼지 등급 한글명 */
export const AIR_QUALITY_NAMES: Record<AirQualityLevel, string> = {
  good: '좋음',
  moderate: '보통',
  unhealthy_sensitive: '민감군 주의',
  unhealthy: '나쁨',
  very_unhealthy: '매우 나쁨',
  hazardous: '위험',
}

/** 카테고리 한글명 매핑 */
export const CATEGORY_NAMES: Record<DigestCategory, string> = {
  weather: '날씨',
  finance: '금융',
  news: '뉴스',
  lifestyle: '라이프',
  other: '기타',
}

/** 최대 구독 수 */
export const MAX_SUBSCRIPTIONS = 5

// ============================================
// Firestore 문서 타입
// ============================================

/** 다이제스트 설정 타입 */
export interface DigestConfig {
  /** 날씨: 지원 도시 목록 */
  cities?: SupportedCity[]
  /** 배달 시간 (KST, "HH:mm" 형식) */
  deliveryTime: string
}

/** 다이제스트 Firestore 문서 */
export interface DigestDoc {
  id: string
  /** 표시 이름 (예: "날씨 도시락") */
  name: string
  /** URL용 슬러그 (예: "weather") */
  slug: string
  /** 설명 */
  description: string
  /** 아이콘 이모지 */
  icon: string
  /** 카테고리 */
  category: DigestCategory
  /** 활성화 여부 */
  isActive: boolean
  /** 유료 여부 */
  isPremium: boolean
  /** 다이제스트별 설정 */
  config: DigestConfig
  /** 생성일 */
  createdAt: Timestamp
  /** 수정일 */
  updatedAt: Timestamp
}

/** 구독 설정 타입 */
export interface SubscriptionSettings {
  /** 사용자 위치 정보 (위도/경도/주소) */
  location?: UserLocation
  /** @deprecated 도시 기반에서 위치 기반으로 마이그레이션 */
  city?: string
}

/** 구독 Firestore 문서 */
export interface DigestSubscriptionDoc {
  id: string
  /** 구독한 사용자 ID */
  userId: string
  /** 이메일 발송용 주소 */
  userEmail: string
  /** 구독한 다이제스트 ID */
  digestId: string
  /** 사용자별 설정 */
  settings: SubscriptionSettings
  /** 구독 활성 상태 */
  isActive: boolean
  /** 생성일 */
  createdAt: Timestamp
  /** 수정일 */
  updatedAt: Timestamp
}

/** 다이제스트 콘텐츠 (AI 생성 결과) */
export interface DigestContent {
  /** 한 줄 요약 (이메일용) */
  summary: string
  /** 상세 내용 (마크다운) */
  content: string
}

/** 배달 로그 Firestore 문서 */
export interface DigestLogDoc {
  id: string
  /** 다이제스트 ID */
  digestId: string
  /** 배달 실행 시간 */
  deliveredAt: Timestamp
  /** 총 구독자 수 */
  subscriberCount: number
  /** 성공 발송 수 */
  successCount: number
  /** 실패 발송 수 */
  failureCount: number
  /** AI 생성 결과 (도시별 캐시) */
  generatedContent: Record<string, DigestContent>
}

/** 날씨 로그 Firestore 문서 - 어제 날씨 비교용 */
export interface WeatherLogDoc {
  id: string
  /** 구독 ID (사용자별 위치별 고유) */
  subscriptionId: string
  /** 사용자 ID */
  userId: string
  /** 위치 정보 */
  location: UserLocation
  /** 기록 날짜 (YYYY-MM-DD 형식) */
  date: string
  /** 체감온도 */
  feelsLike: number
  /** 실제 기온 */
  temperature: number
  /** 강수량 (mm) */
  precipitation: number
  /** 강수 확률 (%) */
  precipitationProbability: number
  /** 미세먼지 등급 */
  airQuality: AirQualityLevel
  /** 날씨 상태 (Clear, Rain 등) */
  weatherMain: string
  /** 생성일 */
  createdAt: Timestamp
}

// ============================================
// API 응답 타입
// ============================================

/** 다이제스트 API 응답 */
export interface DigestResponse {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  category: DigestCategory
  isActive: boolean
  isPremium: boolean
  config: DigestConfig
  /** 구독자 수 (옵션) */
  subscriberCount?: number
  /** 현재 유저 구독 여부 (옵션) */
  isSubscribed?: boolean
  /** 현재 유저의 구독 ID (구독 중인 경우) */
  subscriptionId?: string
  createdAt: string
  updatedAt: string
}

/** 구독 API 응답 */
export interface DigestSubscriptionResponse {
  id: string
  /** 다이제스트 정보 */
  digest: DigestResponse
  /** 사용자별 설정 */
  settings: SubscriptionSettings
  /** 구독 활성 상태 */
  isActive: boolean
  createdAt: string
}

/** 날씨 데이터 (미리보기용 간소화된 버전) */
export interface WeatherPreviewData {
  city: string
  cityKo: string
  current: {
    temp: number
    feelsLike: number
    tempMin: number
    tempMax: number
    humidity: number
    windSpeed: number
    visibility: number
    weather: {
      main: string
      description: string
      icon: string
    }
  }
}

/** 날씨 추천 정보 */
export interface WeatherRecommendations {
  outfit: string
  umbrella: boolean
  activities: string[]
}

/** 다이제스트 미리보기 응답 */
export interface DigestPreviewResponse {
  digestId: string
  digestName: string
  /** 도시별 콘텐츠 */
  contents?: Record<string, DigestContent>
  /** 날씨 미리보기 데이터 */
  weather?: {
    cities: Array<{
      city: string
      today: WeatherPreviewData
    }>
  }
  /** 추천 정보 */
  recommendations?: WeatherRecommendations
  /** 생성 시간 */
  generatedAt: string
}

// ============================================
// API 요청 타입
// ============================================

/** 다이제스트 생성 요청 */
export interface CreateDigestRequest {
  name: string
  slug: string
  description: string
  icon: string
  category: DigestCategory
  isPremium?: boolean
  config: DigestConfig
}

/** 다이제스트 수정 요청 */
export interface UpdateDigestRequest {
  name?: string
  description?: string
  icon?: string
  category?: DigestCategory
  isActive?: boolean
  isPremium?: boolean
  config?: Partial<DigestConfig>
}

/** 구독 생성 요청 */
export interface CreateSubscriptionRequest {
  digestId: string
  settings?: SubscriptionSettings
}

/** 구독 수정 요청 */
export interface UpdateSubscriptionRequest {
  settings?: SubscriptionSettings
  isActive?: boolean
}

// ============================================
// 유틸리티 타입
// ============================================

/** Firestore Timestamp를 ISO 문자열로 변환 */
export function timestampToString(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString()
}

/** DigestDoc을 DigestResponse로 변환 */
export function toDigestResponse(
  doc: DigestDoc,
  options?: {
    subscriberCount?: number
    isSubscribed?: boolean
    subscriptionId?: string
  }
): DigestResponse {
  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    icon: doc.icon,
    category: doc.category,
    isActive: doc.isActive,
    isPremium: doc.isPremium,
    config: doc.config,
    subscriberCount: options?.subscriberCount,
    isSubscribed: options?.isSubscribed,
    subscriptionId: options?.subscriptionId,
    createdAt: timestampToString(doc.createdAt),
    updatedAt: timestampToString(doc.updatedAt),
  }
}

/** DigestSubscriptionDoc을 DigestSubscriptionResponse로 변환 */
export function toSubscriptionResponse(
  doc: DigestSubscriptionDoc,
  digest: DigestResponse
): DigestSubscriptionResponse {
  return {
    id: doc.id,
    digest,
    settings: doc.settings,
    isActive: doc.isActive,
    createdAt: timestampToString(doc.createdAt),
  }
}

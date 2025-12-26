/**
 * Google Analytics 4 (GA4) Analytics Utilities
 *
 * 2025 Best Practices:
 * - @next/third-parties/google 공식 패키지 사용
 * - 환경 변수로 Measurement ID 관리
 * - 개발 환경에서 추적 제외
 * - 타입 안전한 이벤트 추적
 * - Enhanced Measurement 자동 활성화
 */

import { sendGAEvent } from '@next/third-parties/google'

// GA4 Measurement ID
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// 프로덕션 환경에서만 추적 활성화
export const isAnalyticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  if (!GA_MEASUREMENT_ID) return false
  if (process.env.NODE_ENV !== 'production') return false

  // 개발자 도구나 테스트 환경 감지 (선택적)
  const isDevTools =
    typeof navigator !== 'undefined' && /HeadlessChrome/.test(navigator.userAgent)

  return !isDevTools
}

// ============================================
// GA4 이벤트 타입 정의
// ============================================

/**
 * GA4 권장 이벤트 - E-commerce 및 일반 이벤트
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */
export type GA4Event =
  // 참여 이벤트
  | 'page_view'
  | 'scroll'
  | 'search'
  | 'share'
  | 'sign_up'
  | 'login'
  // 프로젝트 관련 커스텀 이벤트
  | 'project_view'
  | 'project_create'
  | 'project_edit'
  | 'project_delete'
  | 'project_like'
  | 'project_unlike'
  | 'project_share'
  | 'project_reaction'
  | 'project_comment'
  // AI 기능 이벤트
  | 'ai_generate'
  | 'ai_candidate_select'
  // 사용자 이벤트
  | 'profile_view'
  | 'profile_edit'
  | 'user_logout'
  // 기타 상호작용
  | 'external_link_click'
  | 'store_badge_click'
  | 'whisper_send'
  | 'copy_link'

// ============================================
// 이벤트 파라미터 타입
// ============================================

interface BaseEventParams {
  [key: string]: string | number | boolean | undefined
}

interface ProjectEventParams extends BaseEventParams {
  project_id: string
  project_title?: string
  project_platform?: string
  author_id?: string
}

interface SearchEventParams extends BaseEventParams {
  search_term: string
  results_count?: number
}

interface ShareEventParams extends BaseEventParams {
  method: 'x' | 'facebook' | 'linkedin' | 'copy' | 'native'
  content_type: 'project' | 'profile'
  item_id: string
}

interface SignUpEventParams extends BaseEventParams {
  method: 'google' | 'github'
}

interface LoginEventParams extends BaseEventParams {
  method: 'google' | 'github'
}

interface AIEventParams extends BaseEventParams {
  draft_id: string
  generation_count?: number
  candidate_index?: number
}

interface ReactionEventParams extends BaseEventParams {
  project_id: string
  reaction_type: 'fire' | 'clap' | 'party' | 'idea' | 'love'
}

interface ExternalLinkEventParams extends BaseEventParams {
  link_url: string
  link_domain?: string
  store_type?: string
}

// ============================================
// 타입 안전한 이벤트 추적 함수
// ============================================

/**
 * GA4 이벤트 전송 (타입 안전)
 * 프로덕션 환경에서만 동작
 */
export function trackEvent(eventName: GA4Event, params?: BaseEventParams): void {
  if (!isAnalyticsEnabled()) {
    // 개발 환경에서 디버깅용 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA4 Debug]', eventName, params)
    }
    return
  }

  try {
    sendGAEvent('event', eventName, params ?? {})
  } catch (error) {
    // GA 오류가 사용자 경험에 영향을 주지 않도록 조용히 처리
    console.warn('[GA4] Event tracking failed:', error)
  }
}

// ============================================
// 프로젝트 관련 이벤트
// ============================================

export const trackProjectView = (params: ProjectEventParams): void => {
  trackEvent('project_view', params)
}

export const trackProjectCreate = (params: ProjectEventParams): void => {
  trackEvent('project_create', params)
}

export const trackProjectEdit = (params: ProjectEventParams): void => {
  trackEvent('project_edit', params)
}

export const trackProjectDelete = (params: ProjectEventParams): void => {
  trackEvent('project_delete', params)
}

export const trackProjectLike = (params: ProjectEventParams): void => {
  trackEvent('project_like', params)
}

export const trackProjectUnlike = (params: ProjectEventParams): void => {
  trackEvent('project_unlike', params)
}

export const trackProjectShare = (params: ShareEventParams): void => {
  trackEvent('project_share', params)
}

export const trackProjectReaction = (params: ReactionEventParams): void => {
  trackEvent('project_reaction', params)
}

export const trackProjectComment = (params: ProjectEventParams): void => {
  trackEvent('project_comment', params)
}

// ============================================
// AI 기능 이벤트
// ============================================

export const trackAIGenerate = (params: AIEventParams): void => {
  trackEvent('ai_generate', params)
}

export const trackAICandidateSelect = (params: AIEventParams): void => {
  trackEvent('ai_candidate_select', params)
}

// ============================================
// 사용자 인증 이벤트
// ============================================

export const trackSignUp = (params: SignUpEventParams): void => {
  trackEvent('sign_up', params)
}

export const trackLogin = (params: LoginEventParams): void => {
  trackEvent('login', params)
}

export const trackLogout = (): void => {
  trackEvent('user_logout')
}

// ============================================
// 검색 및 탐색 이벤트
// ============================================

export const trackSearch = (params: SearchEventParams): void => {
  trackEvent('search', params)
}

export const trackExternalLinkClick = (params: ExternalLinkEventParams): void => {
  trackEvent('external_link_click', params)
}

export const trackStoreBadgeClick = (params: ExternalLinkEventParams): void => {
  trackEvent('store_badge_click', params)
}

// ============================================
// 프로필 이벤트
// ============================================

export const trackProfileView = (params: { user_id: string; user_name?: string }): void => {
  trackEvent('profile_view', params)
}

export const trackProfileEdit = (): void => {
  trackEvent('profile_edit')
}

// ============================================
// 기타 이벤트
// ============================================

export const trackShare = (params: ShareEventParams): void => {
  trackEvent('share', params)
}

export const trackWhisperSend = (params: { project_id: string }): void => {
  trackEvent('whisper_send', params)
}

export const trackCopyLink = (params: { content_type: 'project' | 'profile'; item_id: string }): void => {
  trackEvent('copy_link', params)
}

// ============================================
// 디버깅 유틸리티
// ============================================

/**
 * GA4 디버그 모드 활성화 (개발용)
 * Chrome에서 Google Analytics Debugger 확장 프로그램과 함께 사용
 */
export const enableDebugMode = (): void => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as Record<string, unknown>).gtag as
      | ((...args: unknown[]) => void)
      | undefined
    gtag?.('config', GA_MEASUREMENT_ID, { debug_mode: true })
  }
}

/**
 * GA4 연결 상태 확인
 */
export const getAnalyticsStatus = (): {
  enabled: boolean
  measurementId: string | undefined
  environment: string
} => ({
  enabled: isAnalyticsEnabled(),
  measurementId: GA_MEASUREMENT_ID,
  environment: process.env.NODE_ENV ?? 'unknown',
})

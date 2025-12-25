/**
 * Site Configuration Constants
 *
 * 도메인 및 사이트 관련 상수를 중앙에서 관리합니다.
 * 도메인 변경 시 이 파일만 수정하면 됩니다.
 *
 * ⚠️ 주의: 도메인은 반드시 이 파일의 상수를 사용하세요.
 * 하드코딩된 도메인은 허용되지 않습니다.
 */

// 메인 도메인 (환경변수가 없을 때 기본값)
export const SITE_DOMAIN = 'sidedish.me'

// 전체 URL
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_DOMAIN}`

// 이메일 주소
export const CONTACT_EMAIL = `contact@${SITE_DOMAIN}`
export const NOREPLY_EMAIL = `noreply@${SITE_DOMAIN}`
export const LUNCHBOX_EMAIL = `lunchbox@${SITE_DOMAIN}`

// 소셜 핸들
export const TWITTER_HANDLE = '@sidedish_me'

/**
 * 이메일 발신자 주소 생성
 * @param name 발신자 이름
 * @param email 이메일 주소 (기본값: NOREPLY_EMAIL)
 */
export function getEmailFrom(name: string = 'SideDish', email: string = NOREPLY_EMAIL): string {
  return `${name} <${email}>`
}

/**
 * 페이지 URL 생성
 * @param path 경로 (예: '/menu/123')
 */
export function getPageUrl(path: string = ''): string {
  const baseUrl = SITE_URL.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

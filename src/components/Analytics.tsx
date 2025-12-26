/**
 * Google Analytics 4 (GA4) Component
 *
 * 2025 Best Practices:
 * - @next/third-parties/google 공식 패키지 사용
 * - 프로덕션 환경에서만 스크립트 로드
 * - Enhanced Measurement 자동 활성화
 * - 개발/스테이징 트래픽 자동 제외
 */

import { GoogleAnalytics } from '@next/third-parties/google'
import { GA_MEASUREMENT_ID } from '@/lib/analytics'

/**
 * GA4 Analytics Provider
 * 프로덕션 환경에서만 Google Analytics를 로드합니다.
 */
const Analytics: React.FC = () => {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
}

export default Analytics

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
 *
 * 프로덕션 환경에서만 Google Analytics를 로드합니다.
 * Next.js의 @next/third-parties를 사용하여 최적화된 방식으로 스크립트를 로드합니다.
 *
 * 특징:
 * - 하이드레이션 후 스크립트 로드 (성능 최적화)
 * - 클라이언트 사이드 네비게이션 자동 추적
 * - Enhanced Measurement 지원
 */
const Analytics: React.FC = () => {
  // 프로덕션 환경이 아니거나 Measurement ID가 없으면 렌더링하지 않음
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
}

export default Analytics

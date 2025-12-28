/**
 * Analytics Component
 *
 * 2025 Best Practices:
 * - @next/third-parties/google: GA4 공식 통합
 * - @vercel/analytics: Vercel 웹 분석 (Core Web Vitals, 페이지뷰)
 * - 프로덕션 환경에서만 스크립트 로드
 * - Enhanced Measurement 자동 활성화
 * - 개발/스테이징 트래픽 자동 제외
 */

import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics as VercelAnalytics } from '@vercel/analytics/next'
import { GA_MEASUREMENT_ID } from '@/lib/analytics'

/**
 * Combined Analytics Provider
 * 프로덕션 환경에서 GA4와 Vercel Analytics를 함께 로드합니다.
 */
const Analytics: React.FC = () => {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      <VercelAnalytics />
    </>
  )
}

export default Analytics

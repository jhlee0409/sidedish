/**
 * 공유하기 유틸리티
 *
 * 2025 Best Practices:
 * - Web Share API 우선 사용 (모바일 네이티브 경험)
 * - 데스크탑에서는 URL Intent 기반 공유
 * - 3rd party SDK 없이 프라이버시 보호
 *
 * @see https://web.dev/patterns/web-apps/share
 * @see https://css-tricks.com/ux-considerations-for-web-sharing/
 */

export interface ShareData {
  title: string
  text: string
  url: string
  imageUrl?: string
}

export type SharePlatform = 'x' | 'facebook' | 'linkedin' | 'copy'

interface SharePlatformConfig {
  name: string
  icon: string // Lucide icon name
  color: string
  bgColor: string
  getShareUrl: (data: ShareData) => string
}

/**
 * 플랫폼별 공유 설정
 * - 카카오톡 제외 (SDK 필요)
 * - Threads 제외 (웹 공유 미지원)
 */
export const SHARE_PLATFORMS: Record<SharePlatform, SharePlatformConfig> = {
  x: {
    name: 'X',
    icon: 'twitter', // Lucide에서는 아직 twitter 아이콘 사용
    color: '#000000',
    bgColor: 'bg-black hover:bg-gray-800',
    getShareUrl: ({ title, url }) => {
      const text = encodeURIComponent(title)
      const encodedUrl = encodeURIComponent(url)
      return `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`
    },
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    bgColor: 'bg-[#1877F2] hover:bg-[#166FE5]',
    getShareUrl: ({ url }) => {
      const encodedUrl = encodeURIComponent(url)
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    bgColor: 'bg-[#0A66C2] hover:bg-[#004182]',
    getShareUrl: ({ url }) => {
      const encodedUrl = encodeURIComponent(url)
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
  },
  copy: {
    name: '링크 복사',
    icon: 'link',
    color: '#6B7280',
    bgColor: 'bg-slate-600 hover:bg-slate-700',
    getShareUrl: ({ url }) => url,
  },
}

/**
 * Web Share API 지원 여부 확인
 */
export function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share
}

/**
 * Web Share API로 공유 (모바일 네이티브)
 */
export async function shareWithWebAPI(data: ShareData): Promise<boolean> {
  if (!canUseWebShare()) return false

  try {
    await navigator.share({
      title: data.title,
      text: data.text,
      url: data.url,
    })
    return true
  } catch (error) {
    // 사용자가 취소한 경우는 에러로 처리하지 않음
    if ((error as Error).name === 'AbortError') {
      return true
    }
    console.error('Web Share API error:', error)
    return false
  }
}

/**
 * 특정 플랫폼으로 공유
 */
export function shareToplatform(platform: SharePlatform, data: ShareData): void {
  if (platform === 'copy') {
    copyToClipboard(data.url)
    return
  }

  const config = SHARE_PLATFORMS[platform]
  const shareUrl = config.getShareUrl(data)

  // 새 창에서 열기 (팝업 차단 방지를 위해 적절한 크기로)
  const width = 600
  const height = 400
  const left = (window.innerWidth - width) / 2
  const top = (window.innerHeight - height) / 2

  window.open(
    shareUrl,
    `share-${platform}`,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
  )
}

/**
 * 클립보드에 URL 복사
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      return true
    } catch {
      console.error('Clipboard copy failed:', error)
      return false
    }
  }
}

/**
 * 모바일 기기 여부 확인
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * 공유 전략 결정
 * - 모바일 + Web Share API 지원 → 네이티브 공유
 * - 그 외 → 커스텀 공유 시트
 */
export function shouldUseNativeShare(): boolean {
  return isMobileDevice() && canUseWebShare()
}

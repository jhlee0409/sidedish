'use client'

import React, { useEffect, useCallback } from 'react'
import { X, Link, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  ShareData,
  SharePlatform,
  SHARE_PLATFORMS,
  shareToplatform,
  copyToClipboard,
  shareWithWebAPI,
  shouldUseNativeShare,
} from '@/lib/share-utils'

// 플랫폼별 아이콘 컴포넌트 (Lucide에 없는 것은 커스텀 SVG)
const PlatformIcons: Record<SharePlatform, React.FC<{ className?: string }>> = {
  x: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  facebook: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  linkedin: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  copy: ({ className }) => <Link className={className} />,
}

interface ShareSheetProps {
  isOpen: boolean
  onClose: () => void
  data: ShareData
}

/**
 * 공유 바텀시트/모달 컴포넌트
 *
 * 2025 UX Best Practices:
 * - 모바일: Web Share API 우선 사용
 * - 데스크탑: 커스텀 공유 시트
 * - 링크 복사 항상 제공
 */
export default function ShareSheet({ isOpen, onClose, data }: ShareSheetProps) {
  const [copied, setCopied] = React.useState(false)

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // 모바일에서 네이티브 공유 시트 사용
  useEffect(() => {
    if (isOpen && shouldUseNativeShare()) {
      shareWithWebAPI(data).then((success) => {
        if (success) onClose()
      })
    }
  }, [isOpen, data, onClose])

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      if (platform === 'copy') {
        const success = await copyToClipboard(data.url)
        if (success) {
          setCopied(true)
          toast.success('링크가 복사되었습니다!')
          setTimeout(() => {
            setCopied(false)
            onClose()
          }, 1000)
        } else {
          toast.error('복사에 실패했습니다.')
        }
      } else {
        shareToplatform(platform, data)
        onClose()
      }
    },
    [data, onClose]
  )

  // 모바일에서는 네이티브 공유 시트 사용하므로 렌더링하지 않음
  if (!isOpen || shouldUseNativeShare()) return null

  const platforms: SharePlatform[] = ['x', 'facebook', 'linkedin', 'copy']

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">공유하기</h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content Preview */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
            <p className="font-medium text-slate-900 text-sm line-clamp-1">{data.title}</p>
            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{data.text}</p>
          </div>

          {/* Share Options */}
          <div className="p-5">
            <div className="grid grid-cols-4 gap-3">
              {platforms.map((platform) => {
                const config = SHARE_PLATFORMS[platform]
                const Icon = PlatformIcons[platform]
                const isCopyButton = platform === 'copy'

                return (
                  <button
                    key={platform}
                    onClick={() => handleShare(platform)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-105 ${
                        isCopyButton && copied ? 'bg-green-500' : config.bgColor
                      }`}
                    >
                      {isCopyButton && copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {isCopyButton && copied ? '복사됨!' : config.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* URL Display */}
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
              <Link className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 truncate flex-1">{data.url}</span>
              <button
                onClick={() => handleShare('copy')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
              >
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </div>

          {/* Safe Area for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  )
}

/**
 * 간단한 공유 버튼 (트리거용)
 */
interface ShareButtonProps {
  data: ShareData
  className?: string
  children?: React.ReactNode
}

export function ShareButton({ data, className = '', children }: ShareButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleClick = async () => {
    // 모바일에서는 바로 네이티브 공유 시트 열기
    if (shouldUseNativeShare()) {
      await shareWithWebAPI(data)
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>
      <ShareSheet isOpen={isOpen} onClose={() => setIsOpen(false)} data={data} />
    </>
  )
}

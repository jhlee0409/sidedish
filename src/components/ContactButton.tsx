'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: Record<string, unknown>) => void
      closePopup: (formId: string) => void
    }
  }
}

const FORM_ID = 'RGdaZv'

export default function ContactButton() {
  const pathname = usePathname()

  // 메뉴 상세페이지에서는 모바일 하단 바 위로 올리기
  const isMenuDetailPage = pathname?.startsWith('/menu/') && !pathname?.includes('/register') && !pathname?.includes('/edit')

  useEffect(() => {
    // Tally 스크립트 동적 로드
    if (document.querySelector('script[src="https://tally.so/widgets/embed.js"]')) return

    const script = document.createElement('script')
    script.src = 'https://tally.so/widgets/embed.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  const handleClick = () => {
    if (window.Tally) {
      window.Tally.openPopup(FORM_ID, {
        layout: 'default',
        width: 320,
        autoClose: 3000,
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
        isMenuDetailPage
          ? 'bottom-24 lg:bottom-6' // 모바일에서 하단바 위로
          : 'bottom-6'
      }`}
      aria-label="문의하기"
    >
      <MessageCircle className="w-4 h-4" />
      문의
    </button>
  )
}

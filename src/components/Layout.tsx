'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import Button from './Button'
import UserMenu from './UserMenu'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'
import { CONTACT_EMAIL } from '@/lib/site'

interface LayoutProps {
  children: React.ReactNode
  isLanding?: boolean
}

const Layout: React.FC<LayoutProps> = ({ children, isLanding = false }) => {
  const [scrolled, setScrolled] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-slate-100' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href={isLanding ? '/dashboard' : '/'} className="flex items-center">
              <Image
                src="/sidedish_logo_wide.png"
                alt="SideDish"
                width={1200}
                height={670}
                className="h-7 sm:h-8 w-auto"
              />
            </Link>

            <div className="flex items-center gap-2">
              {isLanding ? (
                <>
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                        대시보드
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        로그인
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {isAuthenticated && (
                    <Link href="/menu/register">
                      <Button className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                        등록
                      </Button>
                    </Link>
                  )}
                  <UserMenu onLoginClick={() => setShowLoginModal(true)} />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-grow flex flex-col ${isLanding ? 'pt-14 sm:pt-16' : 'pt-14 sm:pt-16'}`}>
        {children}
      </main>

      <footer className="border-t border-slate-100 py-8 sm:py-10 mt-auto">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/sidedish_logo_with_text.png"
                alt="SideDish"
                width={32}
                height={32}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg opacity-60"
              />
              <span className="text-xs sm:text-sm text-slate-400">
                © 2025 SideDish
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-400">
              <Link href="/legal/terms" className="hover:text-slate-600 transition-colors">이용약관</Link>
              <Link href="/legal/privacy" className="hover:text-slate-600 transition-colors">개인정보처리방침</Link>
              <Link href="/legal/history" className="hover:text-slate-600 transition-colors">약관 히스토리</Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-600 transition-colors">문의</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}

export default Layout

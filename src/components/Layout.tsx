'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import Button from './Button'
import UserMenu from './UserMenu'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'

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
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between h-16">
            <Link href={isLanding ? '/dashboard' : '/'} className="flex items-center">
              <Image
                src="/sidedish_logo_wide.png"
                alt="SideDish"
                width={1200}
                height={670}
                className="h-8 w-auto"
              />
            </Link>

            <div className="flex items-center gap-2">
              {isLanding ? (
                <>
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button className="h-9 px-4 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                        대시보드
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button
                          variant="ghost"
                          className="h-9 px-4 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          로그인
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button className="h-9 px-4 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                          시작하기
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  {isAuthenticated && (
                    <Link href="/menu/register">
                      <Button className="h-9 px-4 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                        <Plus className="w-4 h-4 mr-1.5" />
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

      <main className={`flex-grow flex flex-col ${isLanding ? 'pt-16' : 'pt-16'}`}>
        {children}
      </main>

      <footer className="border-t border-slate-100 py-12 mt-auto">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/sidedish_logo_with_text.png"
                alt="SideDish"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg opacity-60"
              />
              <span className="text-sm text-slate-400">
                © 2025 SideDish
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-slate-600 transition-colors">이용약관</a>
              <a href="#" className="hover:text-slate-600 transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-slate-600 transition-colors">문의</a>
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

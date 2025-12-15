'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, ArrowRight } from 'lucide-react'
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
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Floating Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 ${scrolled || !isLanding ? 'pt-4' : 'pt-6'}`}>
        <div
          className={`
            w-full max-w-6xl rounded-full px-6 py-3 flex items-center justify-between transition-all duration-300
            ${scrolled || !isLanding
              ? 'bg-white/80 backdrop-blur-md border border-white/20 shadow-lg shadow-slate-200/50'
              : 'bg-transparent border-transparent'
            }
          `}
        >
          <Link
            href={isLanding ? '/dashboard' : '/'}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Image
              src="/sidedish_logo.png"
              alt="SideDish"
              width={36}
              height={36}
              className="h-9 w-9 group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          <div className="flex items-center gap-3">
            {isLanding ? (
              <>
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button
                      className="rounded-full px-6 py-2.5 text-sm font-bold shadow-xl shadow-orange-500/20 bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      메뉴판 입장하기
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        className={`rounded-full px-5 py-2 text-sm font-medium ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-800 hover:bg-white/20'}`}
                      >
                        로그인
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        className="rounded-full px-6 py-2.5 text-sm font-bold shadow-xl shadow-orange-500/20 bg-orange-500 text-white hover:bg-orange-600 hover:-translate-y-0.5 transition-all"
                      >
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
                    <Button
                      variant="primary"
                      className="rounded-full px-5 py-2 text-sm shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
                      icon={<Plus className="w-4 h-4" />}
                    >
                      메뉴 등록
                    </Button>
                  </Link>
                )}
                <UserMenu onLoginClick={() => setShowLoginModal(true)} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-grow flex flex-col ${isLanding ? 'pt-0' : 'pt-28'}`}>
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-16 mt-0 relative z-10">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <div className="mb-6 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <Image
              src="/sidedish_logo.png"
              alt="SideDish"
              width={48}
              height={48}
              className="h-12 w-12"
            />
          </div>
          <p className="text-slate-500 text-sm mb-8 text-center max-w-md leading-relaxed">
            세상의 모든 셰프(개발자)들이 만든 맛있는 사이드 프로젝트를 맛보고,<br />
            솔직한 미식평을 나누는 공간입니다.
          </p>
          <div className="flex gap-6 mb-8 text-slate-400 text-sm font-medium">
            <a href="#" className="hover:text-orange-600 transition-colors">이용약관</a>
            <a href="#" className="hover:text-orange-600 transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-orange-600 transition-colors">문의하기</a>
          </div>
          <div className="text-slate-300 text-xs font-medium">
            © 2025 SideDish. Serve your code like a main dish.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}

export default Layout

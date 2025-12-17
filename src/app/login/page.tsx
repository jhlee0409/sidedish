'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChefHat, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import SignupProfileForm from '@/components/SignupProfileForm'
import SocialLoginForm from '@/components/SocialLoginForm'

export default function LoginPage() {
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    needsProfileSetup,
    completeSignup,
    cancelSignup,
  } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && !needsProfileSetup) {
      router.push('/dashboard')
    }
  }, [authLoading, isAuthenticated, needsProfileSetup, router])

  const handleProfileSubmit = async (data: {
    name: string
    avatarUrl: string
    agreements: {
      termsOfService: boolean
      privacyPolicy: boolean
      marketing: boolean
    }
  }) => {
    try {
      setIsSubmitting(true)
      await completeSignup(data)
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    await cancelSignup()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    )
  }

  // 프로필 설정이 필요한 경우 (이전에 가입 중단 등)
  if (needsProfileSetup) {
    return (
      <SignupProfileForm
        onSubmit={handleProfileSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        provider={user?.provider}
        email={user?.email}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">홈으로</span>
            </Link>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-slate-900">로그인</span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 px-8 py-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10 text-center">
                <div className="inline-flex bg-white/20 p-4 rounded-2xl mb-4">
                  <ChefHat className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-2">SideDish 시작하기</h1>
                <p className="text-white/80">나만의 사이드 프로젝트를 세상에 공개하세요</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <SocialLoginForm showTermsLinks={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

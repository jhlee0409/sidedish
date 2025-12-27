'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isWebView, getWebViewName, WebViewBlockedError } from '@/lib/firebase'

interface SocialLoginFormProps {
  onSuccess?: () => void
  showTermsLinks?: boolean
}

export default function SocialLoginForm({ onSuccess, showTermsLinks = true }: SocialLoginFormProps) {
  const { signInWithGoogle, signInWithGithub } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [inWebView, setInWebView] = useState(false)
  const [webViewName, setWebViewName] = useState<string>('인앱 브라우저')

  useEffect(() => {
    // 클라이언트에서만 WebView 감지
    const webView = isWebView()
    setInWebView(webView)
    if (webView) {
      setWebViewName(getWebViewName() || '인앱 브라우저')
    }
  }, [])

  const handleOpenInBrowser = () => {
    // 현재 URL을 시스템 기본 브라우저로 열기 시도
    const currentUrl = window.location.href

    // Android intent 방식 시도
    if (/Android/i.test(navigator.userAgent)) {
      window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;end`
      return
    }

    // iOS Safari로 열기 시도 (대부분의 인앱 브라우저에서 동작)
    // window.open은 일부 WebView에서 외부 브라우저로 열림
    window.open(currentUrl, '_system')
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setError(null)
      // 임시로 성공 메시지 표시
      const originalError = error
      setError('URL이 복사되었습니다. 브라우저에 붙여넣기 해주세요.')
      setTimeout(() => setError(originalError), 3000)
    } catch {
      setError('URL 복사에 실패했습니다.')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      setIsLoading(true)
      await signInWithGoogle()
      onSuccess?.()
    } catch (err) {
      if (err instanceof WebViewBlockedError) {
        // WebView 차단 에러는 별도 처리 (이미 UI에서 안내 중)
        setError(err.message)
      } else {
        const message = err instanceof Error ? err.message : 'Google 로그인에 실패했습니다. 다시 시도해주세요.'
        setError(message)
      }
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    try {
      setError(null)
      setIsLoading(true)
      await signInWithGithub()
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GitHub 로그인에 실패했습니다. 다시 시도해주세요.'
      setError(message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* WebView 경고 메시지 */}
      {inWebView && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium">
                {webViewName}에서는 Google 로그인이 제한됩니다
              </p>
              <p className="text-amber-700">
                Google 보안 정책으로 인해 인앱 브라우저에서 Google 로그인을 사용할 수 없습니다.
                아래 방법 중 하나를 선택해주세요:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleOpenInBrowser}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-900 font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  외부 브라우저로 열기
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-900 font-medium transition-colors"
                >
                  URL 복사
                </button>
              </div>
              <p className="text-xs text-amber-600">
                또는 GitHub 계정으로 로그인하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !error.includes('URL이 복사되었습니다') && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {error?.includes('URL이 복사되었습니다') && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <p className="text-slate-600 text-center mb-6">
        소셜 계정으로 간편하게 시작하세요
      </p>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading || inWebView}
        className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          inWebView
            ? 'border-slate-200 text-slate-400 cursor-not-allowed'
            : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md'
        }`}
        title={inWebView ? '인앱 브라우저에서는 Google 로그인을 사용할 수 없습니다' : undefined}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Google로 계속하기
      </button>

      {/* GitHub Login Button */}
      <button
        onClick={handleGithubSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 rounded-xl font-medium text-white hover:bg-slate-800 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
        )}
        GitHub로 계속하기
      </button>

      <p className="text-xs text-slate-400 text-center mt-6">
        계속하면 SideDish의{' '}
        {showTermsLinks ? (
          <>
            <Link href="/legal/terms" className="underline hover:text-slate-600">이용약관</Link>과{' '}
            <Link href="/legal/privacy" className="underline hover:text-slate-600">개인정보처리방침</Link>
          </>
        ) : (
          '이용약관과 개인정보처리방침'
        )}
        에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Clock,
  Users,
  Check,
  Loader2,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDigest,
  getDigestPreview,
  subscribeToDigest,
  unsubscribeFromDigest,
} from '@/lib/api-client'
import { DigestResponse, DigestPreviewResponse } from '@/lib/digest-types'
import { LUNCHBOX_TEXT, formatDeliveryTime, formatTodayKorean } from '@/lib/lunchbox-text'
import { isAdmin } from '@/lib/admin-constants'
import LoginModal from '@/components/LoginModal'

export default function LunchboxDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { isAuthenticated, isLoading: authLoading, user, getIdToken } = useAuth()

  const [digest, setDigest] = useState<DigestResponse | null>(null)
  const [preview, setPreview] = useState<DigestPreviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 관리자 여부 체크
  const isUserAdmin = isAdmin(user?.role)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [digestData, previewData] = await Promise.all([
        getDigest(slug),
        getDigestPreview(slug).catch(() => null),
      ])
      setDigest(digestData)
      setPreview(previewData)
    } catch (error) {
      console.error('Failed to load digest:', error)
      toast.error('도시락을 불러오는데 실패했습니다.')
      router.push('/lunchbox')
    } finally {
      setIsLoading(false)
    }
  }, [slug, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (!digest) return

    setIsSubscribing(true)
    try {
      if (digest.isSubscribed && digest.subscriptionId) {
        await unsubscribeFromDigest(digest.subscriptionId)
        setDigest({ ...digest, isSubscribed: false, subscriptionId: undefined })
        toast.success(LUNCHBOX_TEXT.UNSUBSCRIBE_SUCCESS)
      } else {
        const subscription = await subscribeToDigest({ digestId: digest.id })
        setDigest({
          ...digest,
          isSubscribed: true,
          subscriptionId: subscription.id,
        })
        toast.success(LUNCHBOX_TEXT.SUBSCRIBE_SUCCESS)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error(digest.isSubscribed ? LUNCHBOX_TEXT.UNSUBSCRIBE_ERROR : LUNCHBOX_TEXT.SUBSCRIBE_ERROR)
    } finally {
      setIsSubscribing(false)
    }
  }

  // 테스트 이메일 즉시 발송 (관리자 전용)
  const handleTestSend = async () => {
    if (!digest || !user?.email) return

    setIsSendingTest(true)
    try {
      const token = await getIdToken()

      const response = await fetch('/api/digests/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          digestId: digest.id,
          email: user.email,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '발송 실패')
      }

      toast.success(`테스트 이메일이 발송되었습니다!\n제목: ${result.subject}`)
    } catch (error) {
      console.error('Test send error:', error)
      toast.error(error instanceof Error ? error.message : '테스트 발송에 실패했습니다.')
    } finally {
      setIsSendingTest(false)
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <div className="text-slate-400">도시락 정보를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!digest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍱</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            도시락을 찾을 수 없어요
          </h1>
          <p className="text-slate-500 mb-6">존재하지 않거나 삭제된 도시락입니다.</p>
          <Link href="/lunchbox">
            <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
              도시락 목록으로
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/lunchbox"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">도시락 목록</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{digest.icon}</span>
              <span className="font-bold text-slate-900">{digest.name}</span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-8 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="text-6xl mb-4">{digest.icon}</div>
              <h1 className="text-3xl font-bold mb-2">{digest.name}</h1>
              <p className="text-white/80 text-lg">{digest.description}</p>

              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDeliveryTime(digest.config.deliveryTime)} 배달</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>이메일로 받아보기</span>
                </div>
                {digest.subscriberCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{digest.subscriberCount.toLocaleString()}명 구독 중</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          <div className="p-6 border-t border-slate-100 space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                digest.isSubscribed
                  ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  처리 중...
                </>
              ) : digest.isSubscribed ? (
                <>
                  <Check className="w-5 h-5" />
                  {LUNCHBOX_TEXT.SUBSCRIBED}
                </>
              ) : (
                LUNCHBOX_TEXT.SUBSCRIBE
              )}
            </button>

            {/* 관리자: 테스트 발송 버튼 */}
            {isUserAdmin && (
              <button
                onClick={handleTestSend}
                disabled={isSendingTest}
                className="w-full py-3 px-6 rounded-xl font-medium text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    테스트 이메일 즉시 발송 (관리자)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {preview && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                {LUNCHBOX_TEXT.PREVIEW_TITLE}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{formatTodayKorean()}</p>
            </div>

            <div className="p-6">
              {/* Weather Summary */}
              {preview.weather && (
                <div className="space-y-6">
                  {/* City Weather Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {preview.weather.cities.map((city) => (
                      <div
                        key={city.city}
                        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-900">
                              {city.today.cityKo}
                            </span>
                          </div>
                          <span className="text-3xl">
                            {getWeatherEmoji(city.today.current.weather.icon)}
                          </span>
                        </div>

                        <div className="text-4xl font-bold text-slate-900 mb-2">
                          {city.today.current.temp}°C
                        </div>

                        <p className="text-slate-600 mb-3">
                          체감 {city.today.current.feelsLike}°C ·{' '}
                          {city.today.current.weather.description}
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Thermometer className="w-3 h-3" />
                            <span>
                              {city.today.current.tempMin}~{city.today.current.tempMax}°
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Droplets className="w-3 h-3" />
                            <span>{city.today.current.humidity}%</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Wind className="w-3 h-3" />
                            <span>{city.today.current.windSpeed}m/s</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {preview.recommendations && (
                    <div className="bg-amber-50 rounded-2xl p-5">
                      <h3 className="font-semibold text-amber-800 mb-2">
                        👔 오늘의 옷차림
                      </h3>
                      <p className="text-amber-700">{preview.recommendations.outfit}</p>

                      {preview.recommendations.umbrella && (
                        <div className="mt-3 flex items-center gap-2 text-amber-700">
                          <span>☔</span>
                          <span>우산을 챙기세요!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tips */}
                  {preview.recommendations?.activities &&
                    preview.recommendations.activities.length > 0 && (
                      <div className="bg-indigo-50 rounded-2xl p-5">
                        <h3 className="font-semibold text-indigo-800 mb-3">
                          💡 오늘의 팁
                        </h3>
                        <ul className="space-y-2">
                          {preview.recommendations.activities.map((tip, idx) => (
                            <li
                              key={idx}
                              className="text-indigo-700 flex items-start gap-2"
                            >
                              <span className="text-indigo-400">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {!preview.weather && (
                <div className="text-center py-12 text-slate-400">
                  미리보기 데이터를 불러오는 중...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">도시락 안내</h2>

            <div className="space-y-4 text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">배달 시간</h3>
                  <p>
                    매일 {formatDeliveryTime(digest.config.deliveryTime)}에 이메일로
                    배달됩니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">받는 방법</h3>
                  <p>
                    구독하시면 가입하신 이메일로 매일 도시락이 배달됩니다. 마이페이지에서
                    언제든지 구독을 해제할 수 있어요.
                  </p>
                </div>
              </div>

              {digest.isPremium && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">⭐</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">프리미엄 도시락</h3>
                    <p>이 도시락은 프리미엄 구독자를 위한 특별한 도시락입니다.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}

/** 날씨 아이콘을 이모지로 변환 */
function getWeatherEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️',
  }
  return iconMap[icon] || '🌤️'
}

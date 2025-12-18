'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import LunchboxCard from '@/components/lunchbox/LunchboxCard'
import LoginModal from '@/components/LoginModal'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDigests,
  subscribeToDigest,
  unsubscribeFromDigest,
} from '@/lib/api-client'
import { DigestResponse } from '@/lib/digest-types'
import { LUNCHBOX_TEXT } from '@/lib/lunchbox-text'
import { toast } from 'sonner'

export default function LunchboxPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [digests, setDigests] = useState<DigestResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 다이제스트 목록 로드
  useEffect(() => {
    const fetchDigests = async () => {
      try {
        const { data } = await getDigests()
        setDigests(data)
      } catch (error) {
        console.error('Failed to fetch digests:', error)
        toast.error('도시락 목록을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDigests()
  }, [isAuthenticated])

  // 구독하기
  const handleSubscribe = async (digestId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    setProcessingId(digestId)
    try {
      await subscribeToDigest({ digestId })

      // 목록 갱신
      setDigests((prev) =>
        prev.map((d) =>
          d.id === digestId ? { ...d, isSubscribed: true } : d
        )
      )

      toast.success(LUNCHBOX_TEXT.SUBSCRIBE_SUCCESS)
    } catch (error: unknown) {
      console.error('Failed to subscribe:', error)
      const errorMessage = error instanceof Error ? error.message : LUNCHBOX_TEXT.SUBSCRIBE_ERROR
      toast.error(errorMessage)
    } finally {
      setProcessingId(null)
    }
  }

  // 구독 해제
  const handleUnsubscribe = async (subscriptionId: string) => {
    setProcessingId(subscriptionId)
    try {
      await unsubscribeFromDigest(subscriptionId)

      // 목록 갱신
      setDigests((prev) =>
        prev.map((d) =>
          d.subscriptionId === subscriptionId
            ? { ...d, isSubscribed: false, subscriptionId: undefined }
            : d
        )
      )

      toast.success(LUNCHBOX_TEXT.UNSUBSCRIBE_SUCCESS)
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      toast.error(LUNCHBOX_TEXT.UNSUBSCRIBE_ERROR)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
            <div className="text-center">
              <span className="text-6xl mb-6 block">{LUNCHBOX_TEXT.LIST_ICON}</span>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                {LUNCHBOX_TEXT.LIST_TITLE}
              </h1>
              <p className="text-lg text-indigo-100 max-w-xl mx-auto">
                {LUNCHBOX_TEXT.LIST_DESCRIPTION}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {isLoading ? (
            // Loading State
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-md p-6 animate-pulse"
                >
                  <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-full mb-4" />
                  <div className="h-10 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : digests.length === 0 ? (
            // Empty State
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">🍱</span>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                준비 중인 도시락이에요
              </h2>
              <p className="text-slate-500">
                곧 맛있는 도시락이 준비될 예정이에요!
              </p>
            </div>
          ) : (
            // Digest Grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {digests.map((digest) => (
                <LunchboxCard
                  key={digest.id}
                  digest={digest}
                  onSubscribe={handleSubscribe}
                  onUnsubscribe={handleUnsubscribe}
                  isLoading={
                    processingId === digest.id ||
                    processingId === digest.subscriptionId
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </Layout>
  )
}

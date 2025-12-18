'use client'

import React from 'react'
import Link from 'next/link'
import { DigestResponse } from '@/lib/digest-types'
import { LUNCHBOX_TEXT, formatDeliveryTime } from '@/lib/lunchbox-text'

interface Props {
  digest: DigestResponse
  onSubscribe?: (digestId: string) => void
  onUnsubscribe?: (subscriptionId: string) => void
  isLoading?: boolean
}

const LunchboxCard: React.FC<Props> = ({
  digest,
  onSubscribe,
  onUnsubscribe,
  isLoading = false,
}) => {
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (digest.isSubscribed && digest.subscriptionId) {
      onUnsubscribe?.(digest.subscriptionId)
    } else {
      onSubscribe?.(digest.id)
    }
  }

  return (
    <Link
      href={`/lunchbox/${digest.slug}`}
      className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-4xl">{digest.icon}</span>
          {digest.isPremium && (
            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              {LUNCHBOX_TEXT.PREMIUM_BADGE}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
          {digest.name}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {digest.description}
        </p>

        {/* Delivery Time */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{formatDeliveryTime(digest.config.deliveryTime)} 배달</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button
          onClick={handleButtonClick}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            digest.isSubscribed
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              처리 중...
            </span>
          ) : digest.isSubscribed ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {LUNCHBOX_TEXT.SUBSCRIBED}
            </span>
          ) : (
            LUNCHBOX_TEXT.SUBSCRIBE
          )}
        </button>

        {/* Subscriber Count */}
        {digest.subscriberCount !== undefined && digest.subscriberCount > 0 && (
          <p className="text-center text-xs text-slate-400 mt-2">
            {digest.subscriberCount.toLocaleString()}명이 구독 중
          </p>
        )}
      </div>
    </Link>
  )
}

export default LunchboxCard
